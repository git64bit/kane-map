"""Merge paged ArcGIS address-point downloads into one raw GeoJSON file."""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from kane_map_processing.config import DOWNLOAD_DIR, RAW_INPUT_DIR, REPORTS_DIR

ADDRESS_PAGES_DIR = DOWNLOAD_DIR / "address_pages"
ADDRESS_RAW_PATH = RAW_INPUT_DIR / "kane-address-points.geojson"
ADDRESS_MERGE_REPORT_PATH = REPORTS_DIR / "address_pages_merge_report.json"
DEFAULT_EXPECTED_FEATURES = 219_626


@dataclass(frozen=True)
class MergePlan:
    pages_dir: Path
    output_path: Path
    report_path: Path
    page_paths: list[Path]
    existing_output: bool
    expected_features: int | None


def make_merge_plan(expected_features: int | None = DEFAULT_EXPECTED_FEATURES) -> MergePlan:
    page_paths = sorted(ADDRESS_PAGES_DIR.glob("address_points_*.geojson"))
    return MergePlan(
        pages_dir=ADDRESS_PAGES_DIR,
        output_path=ADDRESS_RAW_PATH,
        report_path=ADDRESS_MERGE_REPORT_PATH,
        page_paths=page_paths,
        existing_output=ADDRESS_RAW_PATH.exists(),
        expected_features=expected_features,
    )


def _load_page(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if data.get("type") != "FeatureCollection":
        raise ValueError(f"{path} is not a GeoJSON FeatureCollection")
    features = data.get("features")
    if not isinstance(features, list):
        raise ValueError(f"{path} does not contain a features list")
    return data


def _feature_count(path: Path) -> int:
    data = _load_page(path)
    return len(data.get("features", []))


def inspect_pages(plan: MergePlan) -> dict[str, Any]:
    page_counts: list[dict[str, Any]] = []
    total_features = 0
    errors: list[str] = []

    for path in plan.page_paths:
        try:
            count = _feature_count(path)
            total_features += count
            page_counts.append({
                "path": str(path),
                "name": path.name,
                "features": count,
                "bytes": path.stat().st_size,
            })
        except Exception as exc:  # noqa: BLE001 - report validation errors clearly
            errors.append(f"{path}: {exc}")

    expected_ok = None
    if plan.expected_features is not None:
        expected_ok = total_features == plan.expected_features

    return {
        "pages_dir": str(plan.pages_dir),
        "output_path": str(plan.output_path),
        "page_count": len(plan.page_paths),
        "total_features": total_features,
        "expected_features": plan.expected_features,
        "expected_ok": expected_ok,
        "existing_output": plan.existing_output,
        "errors": errors,
        "page_counts": page_counts,
    }


def merge_pages(plan: MergePlan, *, force: bool = False) -> dict[str, Any]:
    if not plan.page_paths:
        raise FileNotFoundError(f"No address page files found in {plan.pages_dir}")
    if plan.output_path.exists() and not force:
        raise FileExistsError(f"Output already exists: {plan.output_path}. Use --force to replace it.")

    plan.output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = plan.output_path.with_suffix(plan.output_path.suffix + ".tmp")
    backup_path: Path | None = None

    if plan.output_path.exists() and force:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup_path = plan.output_path.with_suffix(plan.output_path.suffix + f".bak-{timestamp}")
        shutil.copy2(plan.output_path, backup_path)

    total_features = 0
    geometry_counts: dict[str, int] = {}
    first = True

    try:
        with tmp_path.open("w", encoding="utf-8") as out:
            out.write('{"type":"FeatureCollection","features":[\n')

            for page_path in plan.page_paths:
                data = _load_page(page_path)
                for feature in data.get("features", []):
                    if not first:
                        out.write(",\n")
                    json.dump(feature, out, ensure_ascii=False, separators=(",", ":"))
                    first = False
                    total_features += 1

                    geometry = feature.get("geometry") or {}
                    geom_type = geometry.get("type") or "None"
                    geometry_counts[geom_type] = geometry_counts.get(geom_type, 0) + 1

            out.write('\n]}\n')

        tmp_path.replace(plan.output_path)
    except Exception:
        if tmp_path.exists():
            tmp_path.unlink()
        raise

    expected_ok = None
    if plan.expected_features is not None:
        expected_ok = total_features == plan.expected_features

    return {
        "output_path": str(plan.output_path),
        "backup_path": str(backup_path) if backup_path else None,
        "page_count": len(plan.page_paths),
        "total_features": total_features,
        "expected_features": plan.expected_features,
        "expected_ok": expected_ok,
        "geometry_counts": geometry_counts,
        "bytes": plan.output_path.stat().st_size,
    }


def write_report(report: dict[str, Any], report_path: Path = ADDRESS_MERGE_REPORT_PATH) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, sort_keys=True)
        handle.write("\n")
