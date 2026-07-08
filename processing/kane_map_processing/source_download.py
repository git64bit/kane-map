"""Controlled source downloader for Kane-Map processing.

The downloader is dry-run by default. It only writes files when called with
``execute=True`` and only downloads sources marked as enabled in the registry.
"""

from __future__ import annotations

import json
import shutil
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import DOWNLOAD_DIR, SOURCE_DOWNLOAD_REPORT_PATH
from .source_registry import is_safe_relative_path


@dataclass(frozen=True)
class DownloadPlanItem:
    source_id: str
    label: str
    layer: str
    status: str
    enabled: bool
    mode: str
    url: str
    output_path: str
    reason: str


@dataclass(frozen=True)
class DownloadResult:
    source_id: str
    action: str
    ok: bool
    path: str
    bytes_written: int
    message: str


def _source_download_path(source: dict[str, Any]) -> str:
    value = str(source.get("download_path") or "")
    if value:
        return value

    source_id = str(source.get("source_id", "source"))
    source_format = str(source.get("source_format", ""))
    if source_format == "zip_shapefile":
        return f"downloads/{source_id}.zip"
    if source_format == "arcgis_feature_service":
        return f"downloads/{source_id}.geojson"
    return ""


def _source_download_url(source: dict[str, Any]) -> str:
    value = str(source.get("download_url") or "")
    if value:
        return value

    source_format = str(source.get("source_format", ""))
    if source_format == "arcgis_feature_service":
        return str(source.get("candidate_query") or "")
    return str(source.get("source_url") or "")


def build_download_plan(
    registry: dict[str, Any],
    selected_source_ids: set[str] | None = None,
) -> list[DownloadPlanItem]:
    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        return []

    plan: list[DownloadPlanItem] = []
    selected = selected_source_ids or set()

    for source in sources:
        if not isinstance(source, dict):
            continue

        source_id = str(source.get("source_id") or "")
        if selected and source_id not in selected:
            continue

        status = str(source.get("status") or "")
        mode = str(source.get("acquisition_mode") or "")
        enabled = bool(source.get("download_enabled", False))
        url = _source_download_url(source)
        output_path = _source_download_path(source)

        reason = "ready"
        if not source_id:
            enabled = False
            reason = "missing source_id"
        elif status == "deferred" or mode == "deferred":
            enabled = False
            reason = "deferred source"
        elif not url:
            enabled = False
            reason = "missing download URL"
        elif not output_path:
            enabled = False
            reason = "missing download path"
        elif not is_safe_relative_path(output_path):
            enabled = False
            reason = "unsafe download path"
        elif not output_path.startswith("downloads/"):
            enabled = False
            reason = "download path must be inside downloads/"

        plan.append(
            DownloadPlanItem(
                source_id=source_id,
                label=str(source.get("label") or ""),
                layer=str(source.get("layer") or ""),
                status=status,
                enabled=enabled,
                mode=mode,
                url=url,
                output_path=output_path,
                reason=reason,
            )
        )

    return plan


def download_plan_item(
    item: DownloadPlanItem,
    input_dir: Path,
    force: bool = False,
    timeout: int = 120,
) -> DownloadResult:
    if not item.enabled:
        return DownloadResult(item.source_id, "skip", True, item.output_path, 0, item.reason)

    output_path = input_dir / item.output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists() and not force:
        return DownloadResult(
            item.source_id,
            "exists",
            True,
            str(output_path),
            output_path.stat().st_size,
            "existing file kept; use --force to overwrite",
        )

    temp_path = output_path.with_suffix(output_path.suffix + ".part")
    request = urllib.request.Request(
        item.url,
        headers={
            "User-Agent": "kane-map-processing/0.29 (+https://github.com/git64bit/kane-map)",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response, temp_path.open("wb") as fh:
            shutil.copyfileobj(response, fh)
        temp_path.replace(output_path)
        return DownloadResult(
            item.source_id,
            "downloaded",
            True,
            str(output_path),
            output_path.stat().st_size,
            "download complete",
        )
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        if temp_path.exists():
            temp_path.unlink()
        return DownloadResult(item.source_id, "error", False, str(output_path), 0, str(exc))


def write_download_report(
    plan: list[DownloadPlanItem],
    results: list[DownloadResult],
    report_path: Path = SOURCE_DOWNLOAD_REPORT_PATH,
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "report_type": "source_download",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "plan": [asdict(item) for item in plan],
        "results": [asdict(result) for result in results],
        "counts": {
            "planned": len(plan),
            "enabled": sum(1 for item in plan if item.enabled),
            "downloaded": sum(1 for result in results if result.action == "downloaded"),
            "existing": sum(1 for result in results if result.action == "exists"),
            "skipped": sum(1 for result in results if result.action == "skip"),
            "errors": sum(1 for result in results if not result.ok),
        },
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
