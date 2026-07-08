"""Prepare Kane-Map building-footprint layer from staged raw GeoJSON.

This module is intentionally conservative:
- reads the raw GeoJSON feature-by-feature
- writes prepared output incrementally
- does not require a server or database
- does not require loading the full building file into memory
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from json import JSONDecoder, JSONDecodeError
from pathlib import Path
from typing import Any, Dict, Generator, Iterable, List, Optional, Tuple

from kane_map_processing.config import RAW_INPUT_DIR, PREPARED_DIR, REPORTS_DIR

RAW_SOURCE_ID = "kane-building-footprints"
RAW_FILENAME = "kane-building-footprints.geojson"
PREPARED_FILENAME = "buildings.json"
REPORT_FILENAME = "building_footprints_preparation_report.json"

ALLOWED_GEOMETRY_TYPES = {"Polygon", "MultiPolygon"}
COORDINATE_PRECISION = 7


@dataclass
class BuildingPreparationReport:
    source_id: str
    mode: str
    status: str
    message: str
    raw_path: str
    output_path: str
    raw_features: int
    prepared_features: int
    skipped_features: int
    geometry_types: Dict[str, int]
    bytes_written: int
    report_path: str
    generated_at: str


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_chunk(handle, size: int = 1024 * 1024) -> str:
    return handle.read(size)


def iter_geojson_features(path: Path) -> Generator[Dict[str, Any], None, None]:
    """Yield features from a FeatureCollection without json.load()."""
    decoder = JSONDecoder()
    with path.open("r", encoding="utf-8") as handle:
        buffer = ""
        in_features = False

        while not in_features:
            chunk = read_chunk(handle)
            if not chunk:
                return
            buffer += chunk
            key_index = buffer.find('"features"')
            if key_index == -1:
                buffer = buffer[-32:]
                continue
            bracket_index = buffer.find("[", key_index)
            if bracket_index == -1:
                buffer = buffer[key_index:]
                continue
            buffer = buffer[bracket_index + 1 :]
            in_features = True

        index = 0
        while True:
            while True:
                if index >= len(buffer):
                    chunk = read_chunk(handle)
                    if not chunk:
                        return
                    buffer = ""
                    index = 0
                    buffer += chunk

                while index < len(buffer) and buffer[index] in " \r\n\t,":
                    index += 1

                if index < len(buffer):
                    break

            if buffer[index] == "]":
                return

            while True:
                try:
                    feature, end = decoder.raw_decode(buffer, index)
                    yield feature
                    buffer = buffer[end:]
                    index = 0
                    break
                except JSONDecodeError:
                    chunk = read_chunk(handle)
                    if not chunk:
                        raise
                    # Drop consumed prefix when possible.
                    if index:
                        buffer = buffer[index:]
                        index = 0
                    buffer += chunk


def safe_number(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(Decimal(str(value)))
    except (InvalidOperation, ValueError):
        return None


def round_coordinates(value: Any, precision: int = COORDINATE_PRECISION) -> Any:
    if isinstance(value, list):
        return [round_coordinates(item, precision) for item in value]
    if isinstance(value, tuple):
        return [round_coordinates(item, precision) for item in value]
    if isinstance(value, float):
        return round(value, precision)
    if isinstance(value, int):
        return value
    return value


def normalize_geometry(geometry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(geometry, dict):
        return None
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geometry_type not in ALLOWED_GEOMETRY_TYPES:
        return None
    if coordinates is None:
        return None
    return {
        "type": geometry_type,
        "coordinates": round_coordinates(coordinates),
    }


def prepare_building_feature(feature: Dict[str, Any], sequence: int) -> Optional[Dict[str, Any]]:
    geometry = normalize_geometry(feature.get("geometry") or {})
    if geometry is None:
        return None

    raw_properties = feature.get("properties") or {}
    shape_area = safe_number(raw_properties.get("Shape_Area"))
    shape_length = safe_number(raw_properties.get("Shape_Leng"))

    building_id = f"KB-{sequence:06d}"

    properties: Dict[str, Any] = {
        "id": building_id,
        "source_id": RAW_SOURCE_ID,
        "source_sequence": sequence,
        "story_estimate": 1,
        "residential_candidate": True,
    }

    if shape_area is not None:
        properties["source_area"] = round(shape_area, 3)
    if shape_length is not None:
        properties["source_length"] = round(shape_length, 3)
    if raw_properties.get("capture_da"):
        properties["capture_date"] = raw_properties.get("capture_da")
    if raw_properties.get("release"):
        properties["release"] = raw_properties.get("release")

    return {
        "type": "Feature",
        "id": building_id,
        "properties": properties,
        "geometry": geometry,
    }


def write_report(report: BuildingPreparationReport) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    path = Path(report.report_path)
    path.write_text(json.dumps(asdict(report), indent=2) + "\n", encoding="utf-8")


def prepare_buildings(*, execute: bool = False, force: bool = False) -> BuildingPreparationReport:
    raw_path = RAW_INPUT_DIR / RAW_FILENAME
    output_path = PREPARED_DIR / PREPARED_FILENAME
    report_path = REPORTS_DIR / REPORT_FILENAME

    if not raw_path.exists():
        report = BuildingPreparationReport(
            source_id=RAW_SOURCE_ID,
            mode="execute" if execute else "dry_run",
            status="error",
            message="raw building-footprints GeoJSON is missing",
            raw_path=str(raw_path),
            output_path=str(output_path),
            raw_features=0,
            prepared_features=0,
            skipped_features=0,
            geometry_types={},
            bytes_written=0,
            report_path=str(report_path),
            generated_at=utc_now(),
        )
        write_report(report)
        return report

    if execute and output_path.exists() and not force:
        report = BuildingPreparationReport(
            source_id=RAW_SOURCE_ID,
            mode="execute",
            status="error",
            message="prepared buildings output already exists; use --force to replace it",
            raw_path=str(raw_path),
            output_path=str(output_path),
            raw_features=0,
            prepared_features=0,
            skipped_features=0,
            geometry_types={},
            bytes_written=0,
            report_path=str(report_path),
            generated_at=utc_now(),
        )
        write_report(report)
        return report

    raw_features = 0
    prepared_features = 0
    skipped_features = 0
    geometry_types: Counter[str] = Counter()
    bytes_written = 0

    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = output_path.with_suffix(output_path.suffix + ".tmp")

    output_handle = None
    try:
        if execute:
            output_handle = temp_path.open("w", encoding="utf-8")
            output_handle.write('{"type":"FeatureCollection","metadata":')
            metadata = {
                "layer": "buildings",
                "source_id": RAW_SOURCE_ID,
                "generated_at": utc_now(),
                "coordinate_precision": COORDINATE_PRECISION,
                "notes": "Prepared from staged building footprint polygons; residential status is not yet classified.",
            }
            output_handle.write(json.dumps(metadata, separators=(",", ":")))
            output_handle.write(',"features":[')

        first = True
        for raw_features, feature in enumerate(iter_geojson_features(raw_path), start=1):
            geometry_type = ((feature.get("geometry") or {}).get("type")) or "None"
            geometry_types[geometry_type] += 1

            prepared = prepare_building_feature(feature, raw_features)
            if prepared is None:
                skipped_features += 1
                continue

            prepared_features += 1
            if execute and output_handle is not None:
                if not first:
                    output_handle.write(",")
                output_handle.write(json.dumps(prepared, separators=(",", ":")))
                first = False

        if execute and output_handle is not None:
            output_handle.write("]}\n")
            output_handle.close()
            output_handle = None
            temp_path.replace(output_path)
            bytes_written = output_path.stat().st_size

        status = "prepared" if execute else "dry_run"
        message = "prepared building footprints layer written" if execute else "ready; no file written"

    except Exception as exc:  # noqa: BLE001 - report failures for operator workflow.
        if output_handle is not None:
            output_handle.close()
        if temp_path.exists():
            temp_path.unlink()
        report = BuildingPreparationReport(
            source_id=RAW_SOURCE_ID,
            mode="execute" if execute else "dry_run",
            status="error",
            message=str(exc),
            raw_path=str(raw_path),
            output_path=str(output_path),
            raw_features=raw_features,
            prepared_features=prepared_features,
            skipped_features=skipped_features,
            geometry_types=dict(geometry_types),
            bytes_written=0,
            report_path=str(report_path),
            generated_at=utc_now(),
        )
        write_report(report)
        return report

    report = BuildingPreparationReport(
        source_id=RAW_SOURCE_ID,
        mode="execute" if execute else "dry_run",
        status=status,
        message=message,
        raw_path=str(raw_path),
        output_path=str(output_path),
        raw_features=raw_features,
        prepared_features=prepared_features,
        skipped_features=skipped_features,
        geometry_types=dict(geometry_types),
        bytes_written=bytes_written,
        report_path=str(report_path),
        generated_at=utc_now(),
    )
    write_report(report)
    return report


def add_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--execute", action="store_true", help="write prepared buildings output")
    parser.add_argument("--force", action="store_true", help="replace existing prepared buildings output")


def print_report(report: BuildingPreparationReport) -> None:
    print("Kane-Map building footprints preparation")
    print(f"Mode: {report.mode.upper()}")
    print(f"Status: {report.status}")
    print(f"Message: {report.message}")
    print(f"Raw: {report.raw_path}")
    print(f"Output: {report.output_path}")
    print(f"Raw features: {report.raw_features}")
    print(f"Prepared features: {report.prepared_features}")
    print(f"Skipped features: {report.skipped_features}")
    print(f"Geometry: {report.geometry_types}")
    if report.bytes_written:
        print(f"Bytes written: {report.bytes_written}")
    print(f"Wrote {report.report_path}")
    if report.mode == "dry_run" and report.status == "dry_run":
        print("Dry run only. Use --execute to write prepared buildings.")
    if report.mode == "execute" and report.status == "error" and "already exists" in report.message:
        print("Use --force to replace the existing prepared buildings output.")
