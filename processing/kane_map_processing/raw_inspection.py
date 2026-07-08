"""Inspect staged raw source files for Kane-Map processing.

This module intentionally uses streaming GeoJSON inspection instead of
``json.load`` for full files. The address-points source can be hundreds of MB;
loading the whole FeatureCollection into memory can fail on small Debian nodes.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Iterator

from .config import REPORTS_DIR
from .source_registry import resolve_local_source_path

RAW_SOURCE_INSPECTION_REPORT_PATH = REPORTS_DIR / "raw_source_inspection_report.json"


@dataclass(frozen=True)
class RawSourceInspection:
    source_id: str
    label: str
    layer: str
    local_path: str
    absolute_path: str
    exists: bool
    status: str
    bytes: int
    feature_count: int
    geometry_types: dict[str, int]
    property_fields: dict[str, int]
    sample_properties: list[dict[str, Any]]
    error: str | None = None


def _read_more(handle: Any, buffer: str, chunk_size: int) -> tuple[str, bool]:
    chunk = handle.read(chunk_size)
    if chunk == "":
        return buffer, True
    return buffer + chunk, False


def iter_geojson_features(path: Path, chunk_size: int = 1024 * 1024) -> Iterator[dict[str, Any]]:
    """Yield GeoJSON features one at a time from a FeatureCollection.

    This is a small purpose-built parser for the project pipeline. It scans to
    the top-level ``features`` array, then decodes one feature object at a time
    with ``json.JSONDecoder.raw_decode``.
    """

    decoder = json.JSONDecoder()
    buffer = ""
    eof = False
    found_features = False

    with path.open("r", encoding="utf-8") as handle:
        while not found_features:
            buffer, eof = _read_more(handle, buffer, chunk_size)
            feature_key_index = buffer.find('"features"')
            if feature_key_index >= 0:
                array_index = buffer.find("[", feature_key_index)
                if array_index >= 0:
                    buffer = buffer[array_index + 1 :]
                    found_features = True
                    break
            if eof:
                raise ValueError("GeoJSON features array was not found")
            if len(buffer) > 256:
                buffer = buffer[-256:]

        while True:
            buffer = buffer.lstrip()
            if buffer.startswith(","):
                buffer = buffer[1:].lstrip()
            if buffer.startswith("]"):
                return

            while buffer == "" or (not buffer.startswith("{") and not buffer.startswith("]")):
                if eof:
                    raise ValueError("Unexpected end of file before next feature")
                buffer, eof = _read_more(handle, buffer, chunk_size)
                buffer = buffer.lstrip()
                if buffer.startswith(","):
                    buffer = buffer[1:].lstrip()
                if buffer.startswith("]"):
                    return

            while True:
                try:
                    feature, end_index = decoder.raw_decode(buffer)
                    break
                except json.JSONDecodeError:
                    if eof:
                        raise
                    buffer, eof = _read_more(handle, buffer, chunk_size)

            if not isinstance(feature, dict):
                yield {"type": "invalid_feature", "properties": {}, "geometry": None}
            else:
                yield feature
            buffer = buffer[end_index:]


def inspect_geojson_file(path: Path, sample_limit: int) -> tuple[int, dict[str, int], dict[str, int], list[dict[str, Any]]]:
    geometry_types: Counter[str] = Counter()
    property_fields: Counter[str] = Counter()
    sample_properties: list[dict[str, Any]] = []
    feature_count = 0

    for feature in iter_geojson_features(path):
        feature_count += 1

        geometry = feature.get("geometry")
        if isinstance(geometry, dict):
            geometry_type = geometry.get("type")
            geometry_types[str(geometry_type or "missing_type")] += 1
        elif geometry is None:
            geometry_types["null"] += 1
        else:
            geometry_types["invalid_geometry"] += 1

        properties = feature.get("properties")
        if isinstance(properties, dict):
            property_fields.update(str(key) for key in properties.keys())
            if len(sample_properties) < sample_limit:
                sample_properties.append(properties)
        else:
            property_fields["invalid_properties"] += 1

    return (
        feature_count,
        dict(sorted(geometry_types.items())),
        dict(sorted(property_fields.items())),
        sample_properties,
    )


def inspect_raw_source(source: dict[str, Any], sample_limit: int) -> RawSourceInspection:
    source_id = str(source.get("source_id") or "unknown")
    label = str(source.get("label") or "")
    layer = str(source.get("layer") or "")
    local_path = str(source.get("local_path") or "")

    try:
        path = resolve_local_source_path(local_path)
    except ValueError as exc:
        return RawSourceInspection(
            source_id=source_id,
            label=label,
            layer=layer,
            local_path=local_path,
            absolute_path="",
            exists=False,
            status="error",
            bytes=0,
            feature_count=0,
            geometry_types={},
            property_fields={},
            sample_properties=[],
            error=str(exc),
        )

    if not path.exists():
        return RawSourceInspection(
            source_id=source_id,
            label=label,
            layer=layer,
            local_path=local_path,
            absolute_path=str(path),
            exists=False,
            status="missing",
            bytes=0,
            feature_count=0,
            geometry_types={},
            property_fields={},
            sample_properties=[],
        )

    if path.suffix.lower() not in {".geojson", ".json"}:
        return RawSourceInspection(
            source_id=source_id,
            label=label,
            layer=layer,
            local_path=local_path,
            absolute_path=str(path),
            exists=True,
            status="unsupported",
            bytes=path.stat().st_size,
            feature_count=0,
            geometry_types={},
            property_fields={},
            sample_properties=[],
            error="raw inspection currently supports GeoJSON/JSON only",
        )

    try:
        feature_count, geometry_types, property_fields, sample_properties = inspect_geojson_file(path, sample_limit)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return RawSourceInspection(
            source_id=source_id,
            label=label,
            layer=layer,
            local_path=local_path,
            absolute_path=str(path),
            exists=True,
            status="error",
            bytes=path.stat().st_size,
            feature_count=0,
            geometry_types={},
            property_fields={},
            sample_properties=[],
            error=str(exc),
        )

    return RawSourceInspection(
        source_id=source_id,
        label=label,
        layer=layer,
        local_path=local_path,
        absolute_path=str(path),
        exists=True,
        status="ok",
        bytes=path.stat().st_size,
        feature_count=feature_count,
        geometry_types=geometry_types,
        property_fields=property_fields,
        sample_properties=sample_properties,
    )


def inspect_raw_sources(
    registry: dict[str, Any],
    selected_source_ids: set[str] | None = None,
    sample_limit: int = 3,
) -> list[RawSourceInspection]:
    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        raise ValueError("source registry sources must be a list")

    selected = selected_source_ids or set()
    results: list[RawSourceInspection] = []
    for source in sources:
        if not isinstance(source, dict):
            continue
        source_id = str(source.get("source_id") or "")
        if selected and source_id not in selected:
            continue
        results.append(inspect_raw_source(source, sample_limit=sample_limit))
    return results


def write_raw_source_inspection_report(
    inspections: list[RawSourceInspection],
    report_path: Path = RAW_SOURCE_INSPECTION_REPORT_PATH,
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "report_type": "raw_source_inspection",
        "inspection_mode": "streaming_geojson",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "sources": len(inspections),
            "present": sum(1 for item in inspections if item.exists),
            "missing": sum(1 for item in inspections if item.status == "missing"),
            "ok": sum(1 for item in inspections if item.status == "ok"),
            "errors": sum(1 for item in inspections if item.status == "error"),
        },
        "sources": [asdict(item) for item in inspections],
    }
    report_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
