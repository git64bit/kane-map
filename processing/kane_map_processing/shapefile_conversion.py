"""ZIP shapefile to GeoJSON conversion helpers for Kane-Map."""

from __future__ import annotations

import datetime as dt
import json
import tempfile
import zipfile
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any

from .config import REPORTS_DIR
from .source_registry import load_source_registry, resolve_local_source_path

ROADS_SOURCE_ID = "kane-road-centerlines"
WATER_SOURCE_ID = "kane-water-polygons"
COUNTY_BOUNDARY_SOURCE_ID = "kane-county-boundary"

ROADS_CONVERSION_REPORT_PATH = REPORTS_DIR / "roads_conversion_report.json"
WATER_CONVERSION_REPORT_PATH = REPORTS_DIR / "water_conversion_report.json"
COUNTY_BOUNDARY_CONVERSION_REPORT_PATH = REPORTS_DIR / "county_boundary_conversion_report.json"


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


@dataclass(frozen=True)
class SourceConversionSpec:
    source_id: str
    report_path: Path
    collection_name: str
    allowed_geometry_types: frozenset[str]
    preferred_name_tokens: tuple[str, ...]
    temp_prefix: str
    batch_reason: str
    property_filter: dict[str, str] | None = None


ROADS_SPEC = SourceConversionSpec(
    source_id=ROADS_SOURCE_ID,
    report_path=ROADS_CONVERSION_REPORT_PATH,
    collection_name="kane-road-centerlines",
    allowed_geometry_types=frozenset({"LineString", "MultiLineString"}),
    preferred_name_tokens=("road",),
    temp_prefix="kane-map-roads-",
    batch_reason="ready to convert roads ZIP into raw GeoJSON",
)

WATER_SPEC = SourceConversionSpec(
    source_id=WATER_SOURCE_ID,
    report_path=WATER_CONVERSION_REPORT_PATH,
    collection_name="kane-water-polygons",
    allowed_geometry_types=frozenset({"Polygon", "MultiPolygon"}),
    preferred_name_tokens=("water", "areawater"),
    temp_prefix="kane-map-water-",
    batch_reason="ready to convert water ZIP into raw GeoJSON",
)

COUNTY_BOUNDARY_SPEC = SourceConversionSpec(
    source_id=COUNTY_BOUNDARY_SOURCE_ID,
    report_path=COUNTY_BOUNDARY_CONVERSION_REPORT_PATH,
    collection_name="kane-county-boundary",
    allowed_geometry_types=frozenset({"Polygon", "MultiPolygon"}),
    preferred_name_tokens=("county",),
    temp_prefix="kane-map-county-boundary-",
    batch_reason="ready to convert county boundary ZIP into raw GeoJSON",
    property_filter={"STATEFP": "17", "COUNTYFP": "089"},
)


def find_source(registry: dict[str, Any], source_id: str) -> dict[str, Any]:
    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        raise ValueError("source registry sources must be a list")

    for source in sources:
        if isinstance(source, dict) and source.get("source_id") == source_id:
            return source

    raise ValueError(f"source not found: {source_id}")


def build_conversion_plan(spec: SourceConversionSpec) -> ConversionPlan:
    registry = load_source_registry()
    source = find_source(registry, spec.source_id)

    download_path_value = source.get("download_path")
    raw_path_value = source.get("local_path")
    layer = str(source.get("layer") or "unknown")

    if not isinstance(download_path_value, str) or not download_path_value.strip():
        raise ValueError(f"source {spec.source_id} does not have a download_path")
    if not isinstance(raw_path_value, str) or not raw_path_value.strip():
        raise ValueError(f"source {spec.source_id} does not have a local_path")

    download_path = resolve_local_source_path(download_path_value)
    raw_path = resolve_local_source_path(raw_path_value)

    exists_download = download_path.exists()
    exists_raw = raw_path.exists()

    if not exists_download:
        action = "missing_download"
        reason = "download ZIP is missing"
    elif download_path.suffix.lower() != ".zip":
        action = "unsupported"
        reason = "source is expected to be a ZIP shapefile"
    else:
        action = "convert_zip_shapefile"
        reason = spec.batch_reason

    return ConversionPlan(
        source_id=spec.source_id,
        layer=layer,
        download_path=download_path,
        raw_path=raw_path,
        exists_download=exists_download,
        exists_raw=exists_raw,
        action=action,
        reason=reason,
    )


def build_roads_conversion_plan(source_id: str = ROADS_SOURCE_ID) -> ConversionPlan:
    if source_id != ROADS_SOURCE_ID:
        raise ValueError("this helper only builds the roads conversion plan")
    return build_conversion_plan(ROADS_SPEC)


def build_water_conversion_plan(source_id: str = WATER_SOURCE_ID) -> ConversionPlan:
    if source_id != WATER_SOURCE_ID:
        raise ValueError("this helper only builds the water conversion plan")
    return build_conversion_plan(WATER_SPEC)


def build_county_boundary_conversion_plan(source_id: str = COUNTY_BOUNDARY_SOURCE_ID) -> ConversionPlan:
    if source_id != COUNTY_BOUNDARY_SOURCE_ID:
        raise ValueError("this helper only builds the county boundary conversion plan")
    return build_conversion_plan(COUNTY_BOUNDARY_SPEC)


def write_json_report(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def find_shapefile_in_zip(extract_dir: Path, preferred_name_tokens: tuple[str, ...]) -> Path:
    shapefiles = sorted(extract_dir.rglob("*.shp"))
    if not shapefiles:
        raise ValueError("ZIP did not contain a .shp file")
    if len(shapefiles) > 1:
        lowered_tokens = tuple(token.lower() for token in preferred_name_tokens)
        preferred = [
            path
            for path in shapefiles
            if any(token in path.name.lower() for token in lowered_tokens)
        ]
        if preferred:
            return preferred[0]
    return shapefiles[0]


def geometry_from_shape(shape: Any, allowed_geometry_types: frozenset[str]) -> dict[str, Any] | None:
    geo = getattr(shape, "__geo_interface__", None)
    if not isinstance(geo, dict):
        return None
    if geo.get("type") in allowed_geometry_types:
        return geo
    return None


def json_safe_value(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()
    return str(value)


def properties_from_record(field_names: list[str], record: Any) -> dict[str, Any]:
    values = list(record)
    return {
        field_names[index]: json_safe_value(values[index])
        for index in range(min(len(field_names), len(values)))
    }


def record_matches_filter(properties: dict[str, Any], property_filter: dict[str, str] | None) -> bool:
    if not property_filter:
        return True
    for key, expected in property_filter.items():
        if str(properties.get(key, "")) != expected:
            return False
    return True


def convert_shapefile_zip_to_geojson(zip_path: Path, output_path: Path, spec: SourceConversionSpec) -> dict[str, Any]:
    try:
        import shapefile  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError("missing dependency: run `pip install -r requirements.txt`") from exc

    features: list[dict[str, Any]] = []
    skipped = 0
    shp_path_text = ""

    with tempfile.TemporaryDirectory(prefix=spec.temp_prefix) as tmp_name:
        tmp_dir = Path(tmp_name)
        with zipfile.ZipFile(zip_path) as archive:
            archive.extractall(tmp_dir)

        shp_path = find_shapefile_in_zip(tmp_dir, spec.preferred_name_tokens)
        shp_path_text = shp_path.name
        reader = shapefile.Reader(str(shp_path), encoding="latin1")
        field_names = [field[0] for field in reader.fields[1:]]

        for item in reader.iterShapeRecords():
            properties = properties_from_record(field_names, item.record)
            if not record_matches_filter(properties, spec.property_filter):
                skipped += 1
                continue

            geometry = geometry_from_shape(item.shape, spec.allowed_geometry_types)
            if geometry is None:
                skipped += 1
                continue

            features.append(
                {
                    "type": "Feature",
                    "properties": properties,
                    "geometry": geometry,
                }
            )

    output = {
        "type": "FeatureCollection",
        "name": spec.collection_name,
        "features": features,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, separators=(",", ":")) + "\n", encoding="utf-8")

    return {
        "feature_count": len(features),
        "skipped_shapes": skipped,
        "output_bytes": output_path.stat().st_size,
        "shapefile_name": shp_path_text,
    }


def convert_zip_source(spec: SourceConversionSpec, *, execute: bool, force: bool) -> ConversionResult:
    plan = build_conversion_plan(spec)
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
        write_json_report(spec.report_path, report)
        return ConversionResult(False, plan.source_id, plan.action, plan.reason, report)

    if plan.exists_raw and not force:
        report["action"] = "skip_existing_raw"
        report["reason"] = "raw GeoJSON already exists; use --force to overwrite"
        write_json_report(spec.report_path, report)
        return ConversionResult(False, plan.source_id, "skip_existing_raw", report["reason"], report)

    if not execute:
        write_json_report(spec.report_path, report)
        return ConversionResult(True, plan.source_id, "dry_run", "ready; no file written", report)

    stats = convert_shapefile_zip_to_geojson(plan.download_path, plan.raw_path, spec)
    report.update(stats)
    report["action"] = "converted"
    report["reason"] = f"{spec.collection_name} ZIP converted into raw GeoJSON"
    write_json_report(spec.report_path, report)
    return ConversionResult(True, plan.source_id, "converted", report["reason"], report)


def convert_roads_zip(*, execute: bool, force: bool) -> ConversionResult:
    return convert_zip_source(ROADS_SPEC, execute=execute, force=force)


def convert_water_zip(*, execute: bool, force: bool) -> ConversionResult:
    return convert_zip_source(WATER_SPEC, execute=execute, force=force)


def convert_county_boundary_zip(*, execute: bool, force: bool) -> ConversionResult:
    return convert_zip_source(COUNTY_BOUNDARY_SPEC, execute=execute, force=force)
