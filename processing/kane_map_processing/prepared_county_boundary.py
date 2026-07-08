"""Prepare raw Kane County boundary polygon for browser consumption."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import PREPARED_DIR, RAW_INPUT_DIR, REPORTS_DIR

RAW_COUNTY_BOUNDARY_PATH = RAW_INPUT_DIR / "kane-county-boundary.geojson"
PREPARED_COUNTY_BOUNDARY_PATH = PREPARED_DIR / "county_boundary.json"
COUNTY_BOUNDARY_REPORT_PATH = REPORTS_DIR / "county_boundary_preparation_report.json"
PREPARED_LAYER_VERSION = 1


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_geojson(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def round_coord(value: float, places: int) -> float:
    return round(float(value), places)


def round_point(point: list[Any] | tuple[Any, ...], places: int) -> list[float]:
    return [round_coord(point[0], places), round_coord(point[1], places)]


def same_point(a: list[float], b: list[float]) -> bool:
    return a[0] == b[0] and a[1] == b[1]


def close_ring(ring: list[list[float]]) -> list[list[float]]:
    if not ring:
        return ring
    if not same_point(ring[0], ring[-1]):
        ring.append([ring[0][0], ring[0][1]])
    return ring


def prepare_ring(coordinates: list[Any], places: int) -> list[list[float]]:
    prepared: list[list[float]] = []
    for point in coordinates:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            continue
        next_point = round_point(point, places)
        if prepared and same_point(prepared[-1], next_point):
            continue
        prepared.append(next_point)
    prepared = close_ring(prepared)
    if len(prepared) < 4:
        return []
    return prepared


def prepare_polygon(coordinates: list[Any], places: int) -> list[list[list[float]]]:
    rings = [prepare_ring(ring, places) for ring in coordinates if isinstance(ring, list)]
    return [ring for ring in rings if len(ring) >= 4]


def prepare_geometry(geometry: dict[str, Any], places: int) -> dict[str, Any] | None:
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates")

    if geom_type == "Polygon" and isinstance(coordinates, list):
        polygon = prepare_polygon(coordinates, places)
        if not polygon:
            return None
        return {"type": "Polygon", "coordinates": polygon}

    if geom_type == "MultiPolygon" and isinstance(coordinates, list):
        polygons = [prepare_polygon(polygon, places) for polygon in coordinates if isinstance(polygon, list)]
        polygons = [polygon for polygon in polygons if polygon]
        if not polygons:
            return None
        return {"type": "MultiPolygon", "coordinates": polygons}

    return None


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def clean_number(value: Any) -> int | float | None:
    if value is None or value == "":
        return None
    try:
        as_float = float(value)
    except (TypeError, ValueError):
        return None
    if as_float.is_integer():
        return int(as_float)
    return as_float


def county_feature_id(index: int, properties: dict[str, Any]) -> str:
    geoid = clean_text(properties.get("GEOID"))
    if geoid:
        return geoid
    return f"COUNTY-{index:06d}"


def prepare_county_feature(feature: dict[str, Any], index: int, places: int) -> dict[str, Any] | None:
    geometry = feature.get("geometry")
    if not isinstance(geometry, dict):
        return None

    prepared_geometry = prepare_geometry(geometry, places)
    if prepared_geometry is None:
        return None

    source_properties = feature.get("properties")
    if not isinstance(source_properties, dict):
        source_properties = {}

    properties = {
        "id": county_feature_id(index, source_properties),
        "name": clean_text(source_properties.get("NAME")),
        "label": clean_text(source_properties.get("NAMELSAD")),
        "statefp": clean_text(source_properties.get("STATEFP")),
        "countyfp": clean_text(source_properties.get("COUNTYFP")),
        "geoid": clean_text(source_properties.get("GEOID")),
        "aland": clean_number(source_properties.get("ALAND")),
        "awater": clean_number(source_properties.get("AWATER")),
        "source_index": index,
    }

    return {
        "type": "Feature",
        "properties": properties,
        "geometry": prepared_geometry,
    }


def build_prepared_county_boundary(
    raw_path: Path = RAW_COUNTY_BOUNDARY_PATH,
    places: int = 6,
) -> dict[str, Any]:
    raw = load_geojson(raw_path)
    raw_features = raw.get("features", [])
    if not isinstance(raw_features, list):
        raise ValueError("Raw county boundary GeoJSON does not contain a features list")

    features: list[dict[str, Any]] = []
    skipped = 0
    for index, feature in enumerate(raw_features, start=1):
        if not isinstance(feature, dict):
            skipped += 1
            continue
        prepared = prepare_county_feature(feature, index, places)
        if prepared is None:
            skipped += 1
            continue
        features.append(prepared)

    return {
        "type": "FeatureCollection",
        "kane_map_layer": {
            "layer": "county_boundary",
            "version": PREPARED_LAYER_VERSION,
            "generated_at_utc": now_utc(),
            "source_file": raw_path.relative_to(raw_path.parents[1]).as_posix(),
            "coordinate_precision": places,
            "raw_feature_count": len(raw_features),
            "prepared_feature_count": len(features),
            "skipped_feature_count": skipped,
        },
        "features": features,
    }


def write_json(path: Path, data: dict[str, Any]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def build_report(
    *,
    raw_path: Path,
    output_path: Path,
    mode: str,
    status: str,
    message: str,
    raw_features: int | None = None,
    prepared_features: int | None = None,
    skipped_features: int | None = None,
    bytes_written: int | None = None,
) -> dict[str, Any]:
    return {
        "generated_at_utc": now_utc(),
        "mode": mode,
        "status": status,
        "message": message,
        "raw_path": raw_path.as_posix(),
        "output_path": output_path.as_posix(),
        "raw_exists": raw_path.exists(),
        "output_exists": output_path.exists(),
        "raw_features": raw_features,
        "prepared_features": prepared_features,
        "skipped_features": skipped_features,
        "bytes_written": bytes_written,
    }


def write_report(report: dict[str, Any], report_path: Path = COUNTY_BOUNDARY_REPORT_PATH) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def prepare_county_boundary(
    *,
    execute: bool = False,
    force: bool = False,
    places: int = 6,
    raw_path: Path = RAW_COUNTY_BOUNDARY_PATH,
    output_path: Path = PREPARED_COUNTY_BOUNDARY_PATH,
) -> dict[str, Any]:
    mode = "EXECUTE" if execute else "DRY RUN"

    if not raw_path.exists():
        report = build_report(
            raw_path=raw_path,
            output_path=output_path,
            mode=mode,
            status="error",
            message="raw county boundary file is missing",
        )
        write_report(report)
        return report

    prepared = build_prepared_county_boundary(raw_path=raw_path, places=places)
    meta = prepared["kane_map_layer"]

    if output_path.exists() and execute and not force:
        report = build_report(
            raw_path=raw_path,
            output_path=output_path,
            mode=mode,
            status="blocked",
            message="prepared county boundary output already exists; use --force to replace",
            raw_features=meta["raw_feature_count"],
            prepared_features=meta["prepared_feature_count"],
            skipped_features=meta["skipped_feature_count"],
        )
        write_report(report)
        return report

    bytes_written = None
    message = "ready; no file written"
    status = "dry_run"
    if execute:
        bytes_written = write_json(output_path, prepared)
        message = "prepared county boundary layer written"
        status = "prepared"

    report = build_report(
        raw_path=raw_path,
        output_path=output_path,
        mode=mode,
        status=status,
        message=message,
        raw_features=meta["raw_feature_count"],
        prepared_features=meta["prepared_feature_count"],
        skipped_features=meta["skipped_feature_count"],
        bytes_written=bytes_written,
    )
    write_report(report)
    return report
