"""Inspect staged raw source files for Kane-Map processing."""

from __future__ import annotations

from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

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


def inspect_geojson_file(path: Path, sample_limit: int) -> tuple[int, dict[str, int], dict[str, int], list[dict[str, Any]]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("GeoJSON root is not an object")
    if data.get("type") != "FeatureCollection":
        raise ValueError("GeoJSON root is not a FeatureCollection")

    features = data.get("features")
    if not isinstance(features, list):
        raise ValueError("GeoJSON features is not a list")

    geometry_types: Counter[str] = Counter()
    property_fields: Counter[str] = Counter()
    sample_properties: list[dict[str, Any]] = []

    for feature in features:
        if not isinstance(feature, dict):
            geometry_types["invalid_feature"] += 1
            continue

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
        len(features),
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
