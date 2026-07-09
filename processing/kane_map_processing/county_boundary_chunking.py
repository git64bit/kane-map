"""Chunk the county boundary layer and normalize the prepared chunk manifest.

The county boundary is a single small polygon. This module adds it to the
chunked prepared-layer output and rewrites chunk_manifest.json with consistent
per-layer feature_count, chunk_count, bytes, and global totals.
"""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from kane_map_processing.config import OUTPUT_DIR, PREPARED_DIR, REPORTS_DIR

LAYER_NAME = "county_boundary"
SOURCE_FILE = PREPARED_DIR / "county_boundary.json"
OUTPUT_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
LAYER_OUTPUT_DIR = OUTPUT_ROOT / LAYER_NAME
MANIFEST_PATH = OUTPUT_ROOT / "chunk_manifest.json"
REPORT_PATH = REPORTS_DIR / "county_boundary_chunking_report.json"
CHUNK_INDEX = 1

JsonDict = Dict[str, Any]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_source() -> None:
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Missing prepared layer: {SOURCE_FILE}")


def load_json(path: Path) -> JsonDict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: JsonDict, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(payload, separators=(",", ":"))
    else:
        text = json.dumps(payload, indent=2)
    path.write_text(text, encoding="utf-8")


def load_source_features() -> List[JsonDict]:
    ensure_source()
    payload = load_json(SOURCE_FILE)
    if payload.get("type") != "FeatureCollection":
        raise ValueError(f"Expected FeatureCollection in {SOURCE_FILE}")
    features = payload.get("features")
    if not isinstance(features, list):
        raise ValueError(f"Missing features array in {SOURCE_FILE}")
    return [feature for feature in features if isinstance(feature, dict)]


def iter_coords(value: Any) -> Iterable[tuple[float, float]]:
    if isinstance(value, list):
        if len(value) >= 2 and isinstance(value[0], (int, float)) and isinstance(value[1], (int, float)):
            yield (float(value[0]), float(value[1]))
        else:
            for item in value:
                yield from iter_coords(item)


def bbox_for_features(features: Iterable[JsonDict]) -> Optional[List[float]]:
    min_x: Optional[float] = None
    min_y: Optional[float] = None
    max_x: Optional[float] = None
    max_y: Optional[float] = None

    for feature in features:
        geometry = feature.get("geometry") or {}
        for x, y in iter_coords(geometry.get("coordinates")):
            min_x = x if min_x is None else min(min_x, x)
            min_y = y if min_y is None else min(min_y, y)
            max_x = x if max_x is None else max(max_x, x)
            max_y = y if max_y is None else max(max_y, y)

    if min_x is None or min_y is None or max_x is None or max_y is None:
        return None
    return [min_x, min_y, max_x, max_y]


def chunk_filename() -> str:
    return f"{LAYER_NAME}_{CHUNK_INDEX:06d}.json"


def clean_output_dir() -> None:
    if LAYER_OUTPUT_DIR.exists():
        shutil.rmtree(LAYER_OUTPUT_DIR)
    LAYER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def write_county_boundary_chunk(features: List[JsonDict]) -> JsonDict:
    clean_output_dir()
    bbox = bbox_for_features(features)
    path = LAYER_OUTPUT_DIR / chunk_filename()
    payload = {
        "type": "FeatureCollection",
        "metadata": {
            "layer": LAYER_NAME,
            "chunk_index": CHUNK_INDEX,
            "feature_count": len(features),
            "source_file": str(SOURCE_FILE),
            "generated_at": utc_now(),
            "bbox": bbox,
        },
        "features": features,
    }
    write_json(path, payload, compact=True)
    return {
        "layer": LAYER_NAME,
        "chunk_index": CHUNK_INDEX,
        "path": str(path),
        "feature_count": len(features),
        "bytes": path.stat().st_size,
        "bbox": bbox,
    }


def load_manifest() -> JsonDict:
    if not MANIFEST_PATH.exists():
        return {"generated_at": utc_now(), "layers": []}
    return load_json(MANIFEST_PATH)


def normalize_layers(manifest: JsonDict) -> List[JsonDict]:
    layers = manifest.get("layers")
    if isinstance(layers, list):
        return [layer for layer in layers if isinstance(layer, dict)]
    if isinstance(layers, dict):
        normalized: List[JsonDict] = []
        for name, value in layers.items():
            if isinstance(value, dict):
                entry = dict(value)
                entry.setdefault("layer", name)
                normalized.append(entry)
        return normalized
    return []


def chunk_feature_count(chunk: JsonDict) -> int:
    for key in ("feature_count", "features", "total_features"):
        value = chunk.get(key)
        if isinstance(value, int):
            return value
    return 0


def chunk_bytes(chunk: JsonDict) -> int:
    value = chunk.get("bytes")
    if isinstance(value, int):
        return value
    return 0


def layer_feature_count(layer: JsonDict) -> int:
    for key in ("feature_count", "features", "total_features"):
        value = layer.get(key)
        if isinstance(value, int):
            return value
    chunks = layer.get("chunks")
    if isinstance(chunks, list):
        return sum(chunk_feature_count(chunk) for chunk in chunks if isinstance(chunk, dict))
    return 0


def layer_chunk_count(layer: JsonDict) -> int:
    value = layer.get("chunk_count")
    if isinstance(value, int):
        return value
    chunks = layer.get("chunks")
    if isinstance(chunks, list):
        return len(chunks)
    if isinstance(chunks, int):
        return chunks
    return 0


def layer_bytes(layer: JsonDict) -> int:
    value = layer.get("bytes")
    if isinstance(value, int):
        return value
    chunks = layer.get("chunks")
    if isinstance(chunks, list):
        return sum(chunk_bytes(chunk) for chunk in chunks if isinstance(chunk, dict))
    return 0


def normalize_layer_entry(layer: JsonDict) -> JsonDict:
    entry = dict(layer)
    entry.setdefault("layer", "unknown")
    entry["feature_count"] = layer_feature_count(entry)
    entry["chunk_count"] = layer_chunk_count(entry)
    entry["bytes"] = layer_bytes(entry)
    if not isinstance(entry.get("chunks"), list):
        entry["chunks"] = []
    return entry


def summarize_layers(layers: List[JsonDict]) -> List[JsonDict]:
    return [
        {
            "layer": layer.get("layer"),
            "feature_count": layer_feature_count(layer),
            "chunk_count": layer_chunk_count(layer),
            "bytes": layer_bytes(layer),
        }
        for layer in layers
    ]


def manifest_totals(layers: List[JsonDict]) -> JsonDict:
    return {
        "total_layers": len(layers),
        "total_chunks": sum(layer_chunk_count(layer) for layer in layers),
        "total_features": sum(layer_feature_count(layer) for layer in layers),
        "total_bytes": sum(layer_bytes(layer) for layer in layers),
    }


def normalized_manifest_with_county(county_chunk: JsonDict, county_features: int) -> JsonDict:
    manifest = load_manifest()
    layers = [
        normalize_layer_entry(layer)
        for layer in normalize_layers(manifest)
        if layer.get("layer") != LAYER_NAME
    ]
    layers.append(
        {
            "layer": LAYER_NAME,
            "feature_count": county_features,
            "chunk_count": 1,
            "bytes": int(county_chunk.get("bytes", 0)),
            "chunks": [county_chunk],
        }
    )
    layers.sort(key=lambda layer: str(layer.get("layer")))

    totals = manifest_totals(layers)
    return {
        "generated_at": utc_now(),
        "layers": layers,
        **totals,
    }


def validate_manifest(manifest: JsonDict) -> JsonDict:
    layers = normalize_layers(manifest)
    totals = manifest_totals(layers)
    required = {"county_boundary", "roads", "water", "buildings", "address_points"}
    present = {str(layer.get("layer")) for layer in layers}
    missing = sorted(required - present)

    errors: List[str] = []
    if missing:
        errors.append("missing layers: " + ", ".join(missing))
    for key, computed in totals.items():
        recorded = manifest.get(key)
        if recorded != computed:
            errors.append(f"{key} recorded={recorded!r} computed={computed!r}")

    return {
        "valid": not errors,
        "errors": errors,
        "totals": totals,
        "layers": summarize_layers(layers),
    }


def chunk_county_boundary(execute: bool = False) -> JsonDict:
    features = load_source_features()
    existing_manifest = load_manifest()
    existing_layers = [normalize_layer_entry(layer) for layer in normalize_layers(existing_manifest)]
    existing_totals = manifest_totals(existing_layers)

    projected_layers = [layer for layer in existing_layers if layer.get("layer") != LAYER_NAME]
    projected_layers.append(
        {
            "layer": LAYER_NAME,
            "feature_count": len(features),
            "chunk_count": 1,
            "bytes": 0,
            "chunks": [],
        }
    )
    projected_totals = manifest_totals(projected_layers)

    if not execute:
        return {
            "status": "dry_run",
            "source": str(SOURCE_FILE),
            "source_features": len(features),
            "output_root": str(OUTPUT_ROOT),
            "existing_totals": existing_totals,
            "projected_totals": projected_totals,
            "validation": validate_manifest(existing_manifest),
            "message": "ready; no county boundary chunk written",
        }

    county_chunk = write_county_boundary_chunk(features)
    manifest = normalized_manifest_with_county(county_chunk, len(features))
    validation = validate_manifest(manifest)
    if not validation["valid"]:
        raise ValueError("Normalized manifest did not validate: " + "; ".join(validation["errors"]))

    write_json(MANIFEST_PATH, manifest)
    return {
        "status": "validated",
        "source": str(SOURCE_FILE),
        "source_features": len(features),
        "output_root": str(OUTPUT_ROOT),
        "chunk": county_chunk,
        "manifest": str(MANIFEST_PATH),
        "validation": validation,
        "message": "county boundary chunk written and manifest validated",
    }


def write_report(result: JsonDict) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(REPORT_PATH, result)


def print_layer_summary(layers: List[JsonDict]) -> None:
    for layer in layers:
        print(
            f"  {layer.get('layer')}: "
            f"{layer.get('chunk_count')} chunks, "
            f"{layer.get('feature_count')} features"
        )


def print_result(result: JsonDict, execute: bool) -> None:
    validation = result.get("validation", {})
    totals = validation.get("totals") or result.get("projected_totals") or {}
    layers = validation.get("layers") or []

    print("Kane-Map county boundary chunking and manifest validation")
    print(f"Mode: {'EXECUTE' if execute else 'DRY_RUN'}")
    print(f"Status: {result['status']}")
    print(f"County boundary source features: {result['source_features']}")
    if not execute:
        existing = result.get("existing_totals", {})
        projected = result.get("projected_totals", {})
        print(f"Existing manifest features: {existing.get('total_features')}")
        print(f"Projected manifest features: {projected.get('total_features')}")
        print(f"Projected chunks: {projected.get('total_chunks')}")
    else:
        print(f"Total layers: {totals.get('total_layers')}")
        print(f"Total chunks: {totals.get('total_chunks')}")
        print(f"Total features: {totals.get('total_features')}")
        print("Layer summary:")
        print_layer_summary(layers)
    print(f"Output root: {result['output_root']}")
    print(f"Wrote {REPORT_PATH}")
    if result.get("manifest"):
        print(f"Wrote {result['manifest']}")
    if validation.get("valid") is False:
        print("Validation warnings:")
        for error in validation.get("errors", []):
            print(f"  {error}")
    if not execute:
        print("Dry run only. Use --execute to write the county boundary chunk and manifest.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Chunk the prepared county boundary and normalize the prepared chunk manifest."
    )
    parser.add_argument("--execute", action="store_true", help="Write chunk and manifest instead of dry-run reporting.")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = chunk_county_boundary(execute=args.execute)
    write_report(result)
    print_result(result, execute=args.execute)


if __name__ == "__main__":
    main()
