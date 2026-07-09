"""Chunk the prepared buildings layer into smaller browser-loadable files."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from kane_map_processing.config import OUTPUT_DIR, PREPARED_DIR, REPORTS_DIR

SOURCE_FILE = PREPARED_DIR / "buildings.json"
OUTPUT_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
BUILDING_CHUNK_DIR = OUTPUT_ROOT / "buildings"
CHUNK_MANIFEST_PATH = OUTPUT_ROOT / "chunk_manifest.json"
REPORT_PATH = REPORTS_DIR / "building_chunking_report.json"
DEFAULT_MAX_FEATURES = 5000


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected object in {path}")
    return data


def write_json(path: Path, data: dict[str, Any]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    return path.stat().st_size


def chunk_list(items: list[Any], size: int) -> list[list[Any]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def chunk_file_name(index: int) -> str:
    return f"buildings_{index:06d}.json"


def load_existing_manifest() -> dict[str, Any]:
    if CHUNK_MANIFEST_PATH.exists():
        try:
            data = load_json(CHUNK_MANIFEST_PATH)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return {
        "format": "kane-map-prepared-chunk-manifest",
        "version": 1,
        "generated_at": utc_now(),
        "output_root": str(OUTPUT_ROOT),
        "total_chunks": 0,
        "total_features": 0,
        "total_bytes": 0,
        "layers": [],
    }


def normalize_manifest_layers(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    existing = manifest.get("layers")
    if isinstance(existing, list):
        return [item for item in existing if isinstance(item, dict)]
    if isinstance(existing, dict):
        layers: list[dict[str, Any]] = []
        for layer_name, layer_data in existing.items():
            if isinstance(layer_data, dict):
                entry = dict(layer_data)
                entry.setdefault("layer", str(layer_name))
                layers.append(entry)
        return layers
    return []


def layer_feature_total(layer: dict[str, Any]) -> int:
    value = layer.get("source_features", layer.get("feature_count"))
    if isinstance(value, int):
        return value
    chunks = layer.get("chunks")
    if isinstance(chunks, list):
        return sum(int(chunk.get("feature_count", 0)) for chunk in chunks if isinstance(chunk, dict))
    return 0


def layer_byte_total(layer: dict[str, Any]) -> int:
    value = layer.get("byte_count")
    if isinstance(value, int):
        return value
    chunks = layer.get("chunks")
    if isinstance(chunks, list):
        total = 0
        for chunk in chunks:
            if not isinstance(chunk, dict):
                continue
            total += int(chunk.get("bytes", chunk.get("byte_count", 0)))
        return total
    return 0


def update_manifest(layer_entries: list[dict[str, Any]], total_features: int, total_bytes: int) -> None:
    manifest = load_existing_manifest()
    existing_layers = normalize_manifest_layers(manifest)
    existing_layers = [layer for layer in existing_layers if layer.get("layer") != "buildings"]

    building_layer = {
        "layer": "buildings",
        "status": "chunked",
        "source_path": str(SOURCE_FILE),
        "source_features": total_features,
        "max_features_per_chunk": DEFAULT_MAX_FEATURES,
        "chunk_count": len(layer_entries),
        "chunks": layer_entries,
    }
    existing_layers.append(building_layer)

    manifest["format"] = manifest.get("format", "kane-map-prepared-chunk-manifest")
    manifest["version"] = manifest.get("version", 1)
    manifest["generated_at"] = utc_now()
    manifest["output_root"] = str(OUTPUT_ROOT)
    manifest["layers"] = existing_layers
    manifest["total_chunks"] = sum(int(layer.get("chunk_count", len(layer.get("chunks", [])))) for layer in existing_layers)
    manifest["total_features"] = sum(layer_feature_total(layer) for layer in existing_layers)
    manifest["total_bytes"] = sum(layer_byte_total(layer) for layer in existing_layers)
    write_json(CHUNK_MANIFEST_PATH, manifest)

def remove_old_building_chunks() -> None:
    if not BUILDING_CHUNK_DIR.exists():
        return
    for path in BUILDING_CHUNK_DIR.glob("buildings_*.json"):
        path.unlink()


def build_chunk_feature_collection(source_data: dict[str, Any], features: list[dict[str, Any]], index: int, total_chunks: int) -> dict[str, Any]:
    metadata = dict(source_data.get("metadata") or {})
    metadata.update(
        {
            "chunk_layer": "buildings",
            "chunk_index": index,
            "chunk_count": total_chunks,
            "feature_count": len(features),
            "generated_at": utc_now(),
        }
    )
    return {
        "type": "FeatureCollection",
        "metadata": metadata,
        "features": features,
    }


def chunk_buildings(max_features: int = DEFAULT_MAX_FEATURES, execute: bool = False) -> dict[str, Any]:
    if max_features <= 0:
        raise ValueError("max_features must be greater than zero")
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Missing prepared buildings file: {SOURCE_FILE}")

    source_data = load_json(SOURCE_FILE)
    features = source_data.get("features")
    if not isinstance(features, list):
        raise ValueError("Prepared buildings file does not contain a features list")

    chunks = chunk_list(features, max_features)
    result: dict[str, Any] = {
        "status": "dry_run" if not execute else "chunked",
        "mode": "EXECUTE" if execute else "DRY_RUN",
        "source": str(SOURCE_FILE),
        "output_root": str(OUTPUT_ROOT),
        "layer": "buildings",
        "max_features_per_chunk": max_features,
        "source_features": len(features),
        "chunk_count": len(chunks),
        "bytes_written": 0,
        "chunks": [],
        "message": "ready; no chunks written" if not execute else "building chunks written",
    }

    if execute:
        remove_old_building_chunks()
        BUILDING_CHUNK_DIR.mkdir(parents=True, exist_ok=True)

    chunk_entries: list[dict[str, Any]] = []
    for position, chunk_features in enumerate(chunks, start=1):
        name = chunk_file_name(position)
        rel_path = f"buildings/{name}"
        output_path = BUILDING_CHUNK_DIR / name
        byte_count = 0
        if execute:
            collection = build_chunk_feature_collection(source_data, chunk_features, position, len(chunks))
            byte_count = write_json(output_path, collection)
        entry = {
            "layer": "buildings",
            "chunk_index": position,
            "path": str(output_path),
            "feature_count": len(chunk_features),
            "bytes": byte_count,
        }
        chunk_entries.append(entry)
        result["chunks"].append(entry)
        result["bytes_written"] += byte_count

    if execute:
        update_manifest(chunk_entries, len(features), result["bytes_written"])

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(REPORT_PATH, result)
    return result


def print_result(result: dict[str, Any]) -> None:
    print("Kane-Map building chunking")
    print(f"Mode: {result['mode']}")
    print(f"Status: {result['status']}")
    print(f"Source features: {result['source_features']}")
    print(f"Chunks: {result['chunk_count']}")
    print(f"Max features/chunk: {result['max_features_per_chunk']}")
    print(f"Bytes written: {result['bytes_written']}")
    print(f"Output root: {result['output_root']}")
    print(f"Wrote {REPORT_PATH}")
    if result["mode"] != "EXECUTE":
        print("Dry run only. Use --execute to write building chunks.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk prepared buildings layer.")
    parser.add_argument("--execute", action="store_true", help="Write building chunks.")
    parser.add_argument("--max-features", type=int, default=DEFAULT_MAX_FEATURES, help="Maximum features per chunk.")
    args = parser.parse_args()
    result = chunk_buildings(max_features=args.max_features, execute=args.execute)
    print_result(result)


if __name__ == "__main__":
    main()
