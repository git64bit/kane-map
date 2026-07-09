"""Chunk the prepared Kane County address point layer.

This module avoids loading the full address_points.json file into memory. It
streams feature objects out of the GeoJSON features array and writes smaller
FeatureCollection chunk files for browser-side loading.
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional

from kane_map_processing.config import OUTPUT_DIR, PREPARED_DIR, REPORTS_DIR

LAYER_NAME = "address_points"
SOURCE_FILE = PREPARED_DIR / "address_points.json"
OUTPUT_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
LAYER_OUTPUT_DIR = OUTPUT_ROOT / LAYER_NAME
MANIFEST_PATH = OUTPUT_ROOT / "chunk_manifest.json"
REPORT_PATH = REPORTS_DIR / "address_point_chunking_report.json"
DEFAULT_MAX_FEATURES = 5000
READ_SIZE = 1024 * 1024

JsonDict = Dict[str, Any]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_source() -> None:
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Missing prepared layer: {SOURCE_FILE}")


def find_features_array_start(text: str) -> Optional[int]:
    key = '"features"'
    key_index = text.find(key)
    if key_index == -1:
        return None
    bracket_index = text.find("[", key_index + len(key))
    if bracket_index == -1:
        return None
    return bracket_index + 1


def iter_geojson_features(path: Path) -> Iterator[JsonDict]:
    """Yield features from a prepared GeoJSON FeatureCollection.

    The prepared files are compact GeoJSON. This reader searches for the
    top-level features array, then repeatedly decodes one JSON object at a time
    from the array. It only keeps a small buffer plus the current feature.
    """

    decoder = json.JSONDecoder()
    buffer = ""
    found_features = False

    with path.open("r", encoding="utf-8") as handle:
        while not found_features:
            chunk = handle.read(READ_SIZE)
            if not chunk:
                raise ValueError(f"Could not find features array in {path}")
            buffer += chunk
            start = find_features_array_start(buffer)
            if start is None:
                buffer = buffer[-64:]
                continue
            buffer = buffer[start:]
            found_features = True

        while True:
            buffer = buffer.lstrip()
            while buffer.startswith(","):
                buffer = buffer[1:].lstrip()

            if buffer.startswith("]"):
                return

            try:
                feature, end = decoder.raw_decode(buffer)
            except json.JSONDecodeError:
                chunk = handle.read(READ_SIZE)
                if not chunk:
                    raise ValueError("Unexpected end of GeoJSON while reading features")
                buffer += chunk
                continue

            if isinstance(feature, dict):
                yield feature
            else:
                raise ValueError("Decoded non-object item from GeoJSON features array")

            buffer = buffer[end:]


def feature_count(path: Path) -> int:
    return sum(1 for _ in iter_geojson_features(path))


def iter_coords(value: Any) -> Iterator[tuple[float, float]]:
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


def chunk_filename(index: int) -> str:
    return f"{LAYER_NAME}_{index:06d}.json"


def write_chunk(index: int, features: List[JsonDict]) -> JsonDict:
    LAYER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = LAYER_OUTPUT_DIR / chunk_filename(index)
    bbox = bbox_for_features(features)
    payload = {
        "type": "FeatureCollection",
        "metadata": {
            "layer": LAYER_NAME,
            "chunk_index": index,
            "feature_count": len(features),
            "source_file": str(SOURCE_FILE),
            "generated_at": utc_now(),
            "bbox": bbox,
        },
        "features": features,
    }
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    return {
        "layer": LAYER_NAME,
        "chunk_index": index,
        "path": str(path),
        "feature_count": len(features),
        "bytes": path.stat().st_size,
        "bbox": bbox,
    }


def load_manifest() -> JsonDict:
    if not MANIFEST_PATH.exists():
        return {"generated_at": utc_now(), "layers": []}
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def layer_feature_count(layer_entry: JsonDict) -> int:
    for key in ("feature_count", "features", "total_features"):
        value = layer_entry.get(key)
        if isinstance(value, int):
            return value
    chunks = layer_entry.get("chunks")
    if isinstance(chunks, list):
        return sum(int(chunk.get("feature_count", 0)) for chunk in chunks if isinstance(chunk, dict))
    return 0


def layer_chunk_count(layer_entry: JsonDict) -> int:
    value = layer_entry.get("chunk_count")
    if isinstance(value, int):
        return value
    chunks = layer_entry.get("chunks")
    if isinstance(chunks, list):
        return len(chunks)
    if isinstance(chunks, int):
        return chunks
    return 0


def normalize_layers(manifest: JsonDict) -> List[JsonDict]:
    layers = manifest.get("layers")
    if isinstance(layers, list):
        return [layer for layer in layers if isinstance(layer, dict)]
    if isinstance(layers, dict):
        normalized = []
        for name, value in layers.items():
            if isinstance(value, dict):
                entry = dict(value)
                entry.setdefault("layer", name)
                normalized.append(entry)
        return normalized
    return []


def update_manifest(chunk_entries: List[JsonDict], total_features: int, total_bytes: int) -> None:
    manifest = load_manifest()
    layers = [layer for layer in normalize_layers(manifest) if layer.get("layer") != LAYER_NAME]
    layers.append(
        {
            "layer": LAYER_NAME,
            "feature_count": total_features,
            "chunk_count": len(chunk_entries),
            "bytes": total_bytes,
            "chunks": chunk_entries,
        }
    )
    manifest["generated_at"] = utc_now()
    manifest["layers"] = layers
    manifest["total_chunks"] = sum(layer_chunk_count(layer) for layer in layers)
    manifest["total_features"] = sum(layer_feature_count(layer) for layer in layers)
    manifest["total_bytes"] = sum(int(layer.get("bytes", 0)) for layer in layers)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def clean_output_dir() -> None:
    if LAYER_OUTPUT_DIR.exists():
        shutil.rmtree(LAYER_OUTPUT_DIR)
    LAYER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def chunk_address_points(max_features: int = DEFAULT_MAX_FEATURES, execute: bool = False) -> JsonDict:
    ensure_source()
    if max_features <= 0:
        raise ValueError("--max-features must be greater than zero")

    if not execute:
        count = feature_count(SOURCE_FILE)
        chunks = math.ceil(count / max_features) if count else 0
        return {
            "status": "dry_run",
            "layer": LAYER_NAME,
            "source": str(SOURCE_FILE),
            "source_features": count,
            "max_features": max_features,
            "chunks": chunks,
            "bytes_written": 0,
            "output_root": str(OUTPUT_ROOT),
            "message": "ready; no chunks written",
        }

    clean_output_dir()
    chunk_entries: List[JsonDict] = []
    pending: List[JsonDict] = []
    total_features = 0
    total_bytes = 0
    chunk_index = 1

    for feature in iter_geojson_features(SOURCE_FILE):
        pending.append(feature)
        total_features += 1
        if len(pending) >= max_features:
            entry = write_chunk(chunk_index, pending)
            chunk_entries.append(entry)
            total_bytes += int(entry["bytes"])
            pending = []
            chunk_index += 1

    if pending:
        entry = write_chunk(chunk_index, pending)
        chunk_entries.append(entry)
        total_bytes += int(entry["bytes"])

    update_manifest(chunk_entries, total_features, total_bytes)

    return {
        "status": "chunked",
        "layer": LAYER_NAME,
        "source": str(SOURCE_FILE),
        "source_features": total_features,
        "max_features": max_features,
        "chunks": len(chunk_entries),
        "bytes_written": total_bytes,
        "output_root": str(OUTPUT_ROOT),
        "manifest": str(MANIFEST_PATH),
        "message": "chunks written",
    }


def write_report(result: JsonDict) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(result, indent=2), encoding="utf-8")


def print_result(result: JsonDict, execute: bool) -> None:
    print("Kane-Map address point chunking")
    print(f"Mode: {'EXECUTE' if execute else 'DRY_RUN'}")
    print(f"Status: {result['status']}")
    print(f"Source features: {result['source_features']}")
    print(f"Chunks: {result['chunks']}")
    print(f"Max features/chunk: {result['max_features']}")
    print(f"Bytes written: {result['bytes_written']}")
    print(f"Output root: {result['output_root']}")
    print(f"Wrote {REPORT_PATH}")
    if result.get("manifest"):
        print(f"Wrote {result['manifest']}")
    if not execute:
        print("Dry run only. Use --execute to write address point chunks.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Chunk prepared Kane County address points.")
    parser.add_argument("--execute", action="store_true", help="Write chunks instead of dry-run reporting.")
    parser.add_argument(
        "--max-features",
        type=int,
        default=DEFAULT_MAX_FEATURES,
        help=f"Maximum features per chunk. Default: {DEFAULT_MAX_FEATURES}",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = chunk_address_points(max_features=args.max_features, execute=args.execute)
    write_report(result)
    print_result(result, execute=args.execute)


if __name__ == "__main__":
    main()
