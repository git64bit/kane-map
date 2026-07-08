"""ZIP shapefile to GeoJSON conversion helpers for Kane-Map."""

from __future__ import annotations

import json
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import REPORTS_DIR
from .source_registry import load_source_registry, resolve_local_source_path

ROADS_SOURCE_ID = "kane-road-centerlines"
ROADS_CONVERSION_REPORT_PATH = REPORTS_DIR / "roads_conversion_report.json"


@dataclass(frozen=True)
class ConversionPlan:
    source_id: str
    layer: str
    download_path: Path
    raw_path: Path
    exists_download: bool
    exists_raw: bool
    action: str
    reason: str


@dataclass(frozen=True)
class ConversionResult:
    ok: bool
    source_id: str
    action: str
    message: str
    report: dict[str, Any]


def find_source(registry: dict[str, Any], source_id: str) -> dict[str, Any]:
    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        raise ValueError("source registry sources must be a list")

    for source in sources:
        if isinstance(source, dict) and source.get("source_id") == source_id:
            return source

    raise ValueError(f"source not found: {source_id}")


def build_roads_conversion_plan(source_id: str = ROADS_SOURCE_ID) -> ConversionPlan:
    registry = load_source_registry()
    source = find_source(registry, source_id)

    download_path_value = source.get("download_path")
    raw_path_value = source.get("local_path")
    layer = str(source.get("layer") or "unknown")

    if not isinstance(download_path_value, str) or not download_path_value.strip():
        raise ValueError(f"source {source_id} does not have a download_path")
    if not isinstance(raw_path_value, str) or not raw_path_value.strip():
        raise ValueError(f"source {source_id} does not have a local_path")

    download_path = resolve_local_source_path(download_path_value)
    raw_path = resolve_local_source_path(raw_path_value)

    exists_download = download_path.exists()
    exists_raw = raw_path.exists()

    if source_id != ROADS_SOURCE_ID:
        action = "skip"
        reason = "this batch only converts road centerlines"
    elif not exists_download:
        action = "missing_download"
        reason = "download ZIP is missing"
    elif download_path.suffix.lower() != ".zip":
        action = "unsupported"
        reason = "roads source is expected to be a ZIP shapefile"
    else:
        action = "convert_zip_shapefile"
        reason = "ready to convert roads ZIP into raw GeoJSON"

    return ConversionPlan(
        source_id=source_id,
        layer=layer,
        download_path=download_path,
        raw_path=raw_path,
        exists_download=exists_download,
        exists_raw=exists_raw,
        action=action,
        reason=reason,
    )


def write_json_report(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def find_shapefile_in_zip(extract_dir: Path) -> Path:
    shapefiles = sorted(extract_dir.rglob("*.shp"))
    if not shapefiles:
        raise ValueError("ZIP did not contain a .shp file")
    if len(shapefiles) > 1:
        preferred = [path for path in shapefiles if "road" in path.name.lower()]
        if preferred:
            return preferred[0]
    return shapefiles[0]


def geometry_from_shape(shape: Any) -> dict[str, Any] | None:
    geo = getattr(shape, "__geo_interface__", None)
    if not isinstance(geo, dict):
        return None
    if geo.get("type") in {"LineString", "MultiLineString"}:
        return geo
    return None


def convert_shapefile_zip_to_geojson(zip_path: Path, output_path: Path) -> dict[str, Any]:
    try:
        import shapefile  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError("missing dependency: run `pip install -r requirements.txt`") from exc

    features: list[dict[str, Any]] = []
    skipped = 0

    with tempfile.TemporaryDirectory(prefix="kane-map-roads-") as tmp_name:
        tmp_dir = Path(tmp_name)
        with zipfile.ZipFile(zip_path) as archive:
            archive.extractall(tmp_dir)

        shp_path = find_shapefile_in_zip(tmp_dir)
        reader = shapefile.Reader(str(shp_path), encoding="latin1")
        field_names = [field[0] for field in reader.fields[1:]]

        for item in reader.iterShapeRecords():
            geometry = geometry_from_shape(item.shape)
            if geometry is None:
                skipped += 1
                continue

            values = list(item.record)
            properties = {field_names[index]: values[index] for index in range(len(field_names))}
            features.append(
                {
                    "type": "Feature",
                    "properties": properties,
                    "geometry": geometry,
                }
            )

    output = {
        "type": "FeatureCollection",
        "name": "kane-road-centerlines",
        "features": features,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, separators=(",", ":")) + "\n", encoding="utf-8")

    return {
        "feature_count": len(features),
        "skipped_shapes": skipped,
        "output_bytes": output_path.stat().st_size,
    }


def convert_roads_zip(*, execute: bool, force: bool) -> ConversionResult:
    plan = build_roads_conversion_plan()
    report: dict[str, Any] = {
        "source_id": plan.source_id,
        "layer": plan.layer,
        "download_path": str(plan.download_path),
        "raw_path": str(plan.raw_path),
        "exists_download": plan.exists_download,
        "exists_raw": plan.exists_raw,
        "action": plan.action,
        "reason": plan.reason,
        "execute": execute,
        "force": force,
    }

    if plan.action != "convert_zip_shapefile":
        write_json_report(ROADS_CONVERSION_REPORT_PATH, report)
        return ConversionResult(False, plan.source_id, plan.action, plan.reason, report)

    if plan.exists_raw and not force:
        report["action"] = "skip_existing_raw"
        report["reason"] = "raw GeoJSON already exists; use --force to overwrite"
        write_json_report(ROADS_CONVERSION_REPORT_PATH, report)
        return ConversionResult(False, plan.source_id, "skip_existing_raw", report["reason"], report)

    if not execute:
        write_json_report(ROADS_CONVERSION_REPORT_PATH, report)
        return ConversionResult(True, plan.source_id, "dry_run", "ready; no file written", report)

    stats = convert_shapefile_zip_to_geojson(plan.download_path, plan.raw_path)
    report.update(stats)
    report["action"] = "converted"
    report["reason"] = "roads ZIP converted into raw GeoJSON"
    write_json_report(ROADS_CONVERSION_REPORT_PATH, report)
    return ConversionResult(True, plan.source_id, "converted", report["reason"], report)
