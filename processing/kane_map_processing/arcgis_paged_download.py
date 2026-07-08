"""Paged ArcGIS FeatureServer downloader for Kane-Map source intake."""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PagedDownloadConfig:
    endpoint: str
    output_path: Path
    report_path: Path
    page_size: int = 2000
    timeout_seconds: int = 120
    pause_seconds: float = 0.1


def _request_json(url: str, timeout_seconds: int) -> dict[str, Any]:
    with urllib.request.urlopen(url, timeout=timeout_seconds) as response:
        payload = response.read().decode("utf-8")
    data = json.loads(payload)
    if isinstance(data, dict) and "error" in data:
        raise RuntimeError(f"ArcGIS error: {data['error']}")
    if not isinstance(data, dict):
        raise RuntimeError("ArcGIS response was not a JSON object")
    return data


def _build_query_url(endpoint: str, params: dict[str, Any]) -> str:
    return f"{endpoint.rstrip('/')}/query?{urllib.parse.urlencode(params)}"


def get_feature_count(endpoint: str, timeout_seconds: int = 120) -> int:
    url = _build_query_url(
        endpoint,
        {
            "where": "1=1",
            "returnCountOnly": "true",
            "f": "json",
        },
    )
    data = _request_json(url, timeout_seconds)
    count = data.get("count")
    if not isinstance(count, int):
        raise RuntimeError(f"Count response did not include integer count: {data}")
    return count


def fetch_page(config: PagedDownloadConfig, offset: int) -> dict[str, Any]:
    url = _build_query_url(
        config.endpoint,
        {
            "where": "1=1",
            "outFields": "*",
            "returnGeometry": "true",
            "f": "geojson",
            "resultOffset": offset,
            "resultRecordCount": config.page_size,
        },
    )
    return _request_json(url, config.timeout_seconds)


def download_paged_geojson(config: PagedDownloadConfig, *, execute: bool, force: bool = False) -> dict[str, Any]:
    config.output_path.parent.mkdir(parents=True, exist_ok=True)
    config.report_path.parent.mkdir(parents=True, exist_ok=True)

    if config.output_path.exists() and not force and execute:
        raise FileExistsError(f"Output exists; use --force to overwrite: {config.output_path}")

    count = get_feature_count(config.endpoint, config.timeout_seconds)
    page_offsets = list(range(0, count, config.page_size)) if count else []

    report: dict[str, Any] = {
        "source_id": "kane-address-points",
        "endpoint": config.endpoint,
        "output_path": str(config.output_path),
        "mode": "execute" if execute else "dry_run",
        "page_size": config.page_size,
        "expected_count": count,
        "pages_expected": len(page_offsets),
        "pages": [],
    }

    if not execute:
        report["status"] = "dry_run"
        report["features_written"] = 0
        config.report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report

    all_features: list[dict[str, Any]] = []
    crs_or_name: Any = None

    for offset in page_offsets:
        page = fetch_page(config, offset)
        features = page.get("features")
        if not isinstance(features, list):
            raise RuntimeError(f"Page at offset {offset} did not contain a feature list")
        if crs_or_name is None:
            crs_or_name = page.get("crs")
        all_features.extend(features)
        report["pages"].append({"offset": offset, "features": len(features)})
        time.sleep(config.pause_seconds)

    feature_collection: dict[str, Any] = {
        "type": "FeatureCollection",
        "features": all_features,
    }
    if crs_or_name is not None:
        feature_collection["crs"] = crs_or_name

    config.output_path.write_text(json.dumps(feature_collection, separators=(",", ":")), encoding="utf-8")

    report["status"] = "downloaded"
    report["features_written"] = len(all_features)
    report["bytes_written"] = config.output_path.stat().st_size
    report["count_matches"] = len(all_features) == count
    config.report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report
