from __future__ import annotations

import json
import math
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, Optional

from kane_map_processing.config import RAW_INPUT_DIR, PREPARED_DIR, REPORTS_DIR

RAW_ADDRESS_POINTS = RAW_INPUT_DIR / "kane-address-points.geojson"
PREPARED_ADDRESS_POINTS = PREPARED_DIR / "address_points.json"
REPORT_PATH = REPORTS_DIR / "address_points_preparation_report.json"
PREPARED_LAYER_VERSION = 2


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return " ".join(text.split())


def normalize_boolish(value: Any) -> str:
    return normalize_text(value)


def safe_float(value: Any) -> Optional[float]:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def round_coord(value: float, places: int) -> float:
    return round(float(value), places)


def find_features_array_start(text: str) -> int:
    key_index = text.find('"features"')
    if key_index < 0:
        raise ValueError("GeoJSON FeatureCollection has no features array")
    bracket_index = text.find("[", key_index)
    if bracket_index < 0:
        raise ValueError("GeoJSON features key has no array")
    return bracket_index + 1


def stream_geojson_features(path: Path, chunk_size: int = 1024 * 1024) -> Iterator[Dict[str, Any]]:
    """Yield GeoJSON features one at a time without loading the full file."""

    decoder = json.JSONDecoder()
    buffer = ""
    position = 0
    in_features = False
    done = False

    with path.open("r", encoding="utf-8") as handle:
        while not in_features:
            chunk = handle.read(chunk_size)
            if not chunk:
                raise ValueError("Could not find GeoJSON features array")
            buffer += chunk
            try:
                position = find_features_array_start(buffer)
                in_features = True
            except ValueError:
                if len(buffer) > 10 * chunk_size:
                    raise
                continue

        while not done:
            while True:
                while position < len(buffer) and buffer[position] in " \r\n\t,":
                    position += 1
                if position < len(buffer):
                    break
                chunk = handle.read(chunk_size)
                if not chunk:
                    return
                buffer = chunk
                position = 0

            if buffer[position] == "]":
                done = True
                break

            try:
                feature, end_position = decoder.raw_decode(buffer, position)
            except json.JSONDecodeError:
                chunk = handle.read(chunk_size)
                if not chunk:
                    raise
                buffer = buffer[position:] + chunk
                position = 0
                continue

            if isinstance(feature, dict):
                yield feature
            position = end_position

            if position > chunk_size:
                buffer = buffer[position:]
                position = 0


def address_feature_id(sequence: int, properties: Dict[str, Any]) -> str:
    addr_guid = normalize_text(properties.get("AddrGUID"))
    addr_id = normalize_text(properties.get("AddrID"))
    source_id = addr_guid or addr_id
    if source_id:
        return source_id
    return f"ADDR-{sequence:06d}"


def prepare_feature(feature: Dict[str, Any], sequence: int, places: int = 6) -> Optional[Dict[str, Any]]:
    geometry = feature.get("geometry") or {}
    if not isinstance(geometry, dict) or geometry.get("type") != "Point":
        return None

    coordinates = geometry.get("coordinates")
    if not isinstance(coordinates, list) or len(coordinates) < 2:
        return None

    x = safe_float(coordinates[0])
    y = safe_float(coordinates[1])
    if x is None or y is None:
        return None

    properties = feature.get("properties") or {}
    if not isinstance(properties, dict):
        properties = {}

    source_id = address_feature_id(sequence, properties)
    point = [round_coord(x, places), round_coord(y, places)]

    prepared_properties = {
        "id": f"KA-{sequence:06d}",
        "source_id": source_id,
        "source_sequence": sequence,
        "x": point[0],
        "y": point[1],
        "address": normalize_text(properties.get("Address")),
        "address_suffix": normalize_text(properties.get("AddressSuffix")),
        "common_name": normalize_text(properties.get("CommonName")),
        "addr_class": normalize_text(properties.get("AddrClass")),
        "addr_subclass": normalize_text(properties.get("AddrSubclass")),
        "condo": normalize_boolish(properties.get("Condo")),
        "complete_status": normalize_text(properties.get("CompleteStatus")),
        "fire_addr": normalize_text(properties.get("FireAddr")),
        "fire_grid": normalize_text(properties.get("FireGrid")),
        "source": "kane-address-points",
    }

    return {
        "type": "Feature",
        "properties": prepared_properties,
        "geometry": {
            "type": "Point",
            "coordinates": point,
        },
    }


def prepare_address_points_layer(*, execute: bool = False, force: bool = False, limit: Optional[int] = None) -> Dict[str, Any]:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    PREPARED_DIR.mkdir(parents=True, exist_ok=True)

    report: Dict[str, Any] = {
        "ok": False,
        "status": "not_started",
        "message": "",
        "created_at": utc_now(),
        "raw_path": str(RAW_ADDRESS_POINTS),
        "output_path": str(PREPARED_ADDRESS_POINTS),
        "report_path": str(REPORT_PATH),
        "raw_features_scanned": 0,
        "prepared_features": 0,
        "skipped_features": 0,
        "bytes_written": None,
        "limit": limit,
        "prepared_layer_version": PREPARED_LAYER_VERSION,
    }

    if not RAW_ADDRESS_POINTS.exists():
        report.update(status="missing_raw", message="raw address-points GeoJSON not found")
        write_json(REPORT_PATH, report)
        return report

    if PREPARED_ADDRESS_POINTS.exists() and execute and not force:
        report.update(status="output_exists", message="output exists; use --force to overwrite")
        write_json(REPORT_PATH, report)
        return report

    if not execute:
        for index, feature in enumerate(stream_geojson_features(RAW_ADDRESS_POINTS), start=1):
            report["raw_features_scanned"] += 1
            if prepare_feature(feature, index) is None:
                report["skipped_features"] += 1
            else:
                report["prepared_features"] += 1
            if limit is not None and report["raw_features_scanned"] >= limit:
                break
        report.update(ok=True, status="dry_run", message="ready; no file written")
        write_json(REPORT_PATH, report)
        return report

    tmp_fd, tmp_name = tempfile.mkstemp(prefix="address_points.", suffix=".json", dir=str(PREPARED_DIR))
    os.close(tmp_fd)
    tmp_path = Path(tmp_name)

    generated_at = utc_now()

    try:
        with tmp_path.open("w", encoding="utf-8") as out:
            out.write("{\n")
            out.write('  "type": "FeatureCollection",\n')
            out.write('  "kane_map_layer": {\n')
            out.write('    "layer": "address_points",\n')
            out.write(f'    "version": {PREPARED_LAYER_VERSION},\n')
            out.write(f'    "generated_at_utc": {json.dumps(generated_at)},\n')
            out.write('    "source_file": "input/raw/kane-address-points.geojson",\n')
            out.write('    "coordinate_precision": 6\n')
            out.write("  },\n")
            out.write('  "features": [\n')

            first = True
            for index, feature in enumerate(stream_geojson_features(RAW_ADDRESS_POINTS), start=1):
                report["raw_features_scanned"] += 1
                prepared = prepare_feature(feature, index)
                if prepared is None:
                    report["skipped_features"] += 1
                else:
                    if not first:
                        out.write(",\n")
                    out.write("    ")
                    out.write(json.dumps(prepared, ensure_ascii=False, separators=(",", ":")))
                    first = False
                    report["prepared_features"] += 1
                if limit is not None and report["raw_features_scanned"] >= limit:
                    break

            out.write("\n  ]\n")
            out.write("}\n")

        tmp_path.replace(PREPARED_ADDRESS_POINTS)
        report["bytes_written"] = PREPARED_ADDRESS_POINTS.stat().st_size
        report.update(ok=True, status="prepared", message="prepared address-points layer written with Point geometry")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

    write_json(REPORT_PATH, report)
    return report
