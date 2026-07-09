"""Chunk the prepared buildings layer into browser-loadable static files.

This module intentionally avoids loading the full buildings layer into memory.
It streams features from processing/output/prepared/buildings.json and writes
smaller FeatureCollection chunks under processing/output/chunks/prepared-layers.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from json import JSONDecodeError
from pathlib import Path
from typing import Any, Iterable

from kane_map_processing.config import OUTPUT_DIR, PREPARED_DIR, REPORTS_DIR

DEFAULT_MAX_FEATURES = 5000
LAYER_NAME = "buildings"
SOURCE_FILE = PREPARED_DIR / "buildings.json"
CHUNK_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
LAYER_CHUNK_DIR = CHUNK_ROOT / LAYER_NAME
CHUNK_MANIFEST_PATH = CHUNK_ROOT / "chunk_manifest.json"
REPORT_PATH = REPORTS_DIR / "building_chunking_report.json"


@dataclass
class ChunkInfo:
    index: int
    file: str
    features: int
    bytes: int


@dataclass
class ChunkResult:
    status: str
    message: str
    source: str
    output_dir: str
    max_features: int
    source_features: int
    chunks: list[ChunkInfo]
    total_bytes: int


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _read_until_features_array(handle: Any, chunk_size: int = 65536) -> str:
    buffer = ""
    while True:
        more = handle.read(chunk_size)
        if not more:
            raise ValueError("GeoJSON features array not found")
        buffer += more
        features_index = buffer.find('"features"')
        if features_index < 0:
            if len(buffer) > chunk_size * 4:
                buffer = buffer[-chunk_size:]
            continue
        array_index = buffer.find("[", features_index)
        if array_index < 0:
            continue
        return buffer[array_index + 1 :]


def iter_geojson_features(path: Path, chunk_size: int = 65536) -> Iterable[dict[str, Any]]:
    """Yield GeoJSON features from a FeatureCollection without json.load()."""
    decoder = json.JSONDecoder()
    with path.open("r", encoding="utf-8") as handle:
        buffer = _read_until_features_array(handle, chunk_size)
        while True:
            buffer = buffer.lstrip()
            if buffer.startswith("]"):
                return
            if buffer.startswith(","):
                buffer = buffer[1:].lstrip()
            while True:
                try:
                    feature, end = decoder.raw_decode(buffer)
                    if isinstance(feature, dict):
                        yield feature
                    buffer = buffer[end:]
                    break
                except JSONDecodeError:
                    more = handle.read(chunk_size)
                    if not more:
                        raise ValueError("Unexpected end of GeoJSON while reading features")
                    buffer += more


def feature_count(path: Path) -> int:
    return sum(1 for _ in iter_geojson_features(path))


def make_chunk_collection(chunk_index: int, features: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "meta": {
            "layer": LAYER_NAME,
            "version": "chunk-v1",
            "chunk_index": chunk_index,
            "feature_count": len(features),
            "generated_at": utc_now(),
        },
        "features": features,
    }


def chunk_file_name(index: int) -> str:
    return f"buildings_{index:06d}.json"


def write_chunk(index: int, features: list[dict[str, Any]]) -> ChunkInfo:
    LAYER_CHUNK_DIR.mkdir(parents=True, exist_ok=True)
    name = chunk_file_name(index)
    path = LAYER_CHUNK_DIR / name
    collection = make_chunk_collection(index, features)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(collection, handle, ensure_ascii=False, separators=(",", ":"))
    return ChunkInfo(
        index=index,
        file=f"{LAYER_NAME}/{name}",
        features=len(features),
        bytes=path.stat().st_size,
    )


def remove_old_building_chunks() -> None:
    if not LAYER_CHUNK_DIR.exists():
        return
    for path in LAYER_CHUNK_DIR.glob("buildings_*.json"):
        path.unlink()


def load_manifest() -> dict[str, Any]:
    if not CHUNK_MANIFEST_PATH.exists():
        return {
            "type": "kane-map-prepared-chunk-manifest",
            "version": 1,
            "generated_at": utc_now(),
            "layers": {},
        }
    with CHUNK_MANIFEST_PATH.open("r", encoding="utf-8") as handle:
        manifest = json.load(handle)
    if not isinstance(manifest, dict):
        manifest = {}
    manifest.setdefault("type", "kane-map-prepared-chunk-manifest")
    manifest.setdefault("version", 1)
    manifest.setdefault("layers", {})
    return manifest


def update_manifest(chunks: list[ChunkInfo], max_features: int, source_features: int) -> None:
    CHUNK_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()
    layers = manifest.get("layers")

    layer_entry = {
        "layer": LAYER_NAME,
        "source": "prepared/buildings.json",
        "chunk_dir": LAYER_NAME,
        "max_features_per_chunk": max_features,
        "features": source_features,
        "chunks": [chunk.__dict__ for chunk in chunks],
        "chunk_count": len(chunks),
        "bytes": sum(chunk.bytes for chunk in chunks),
        "generated_at": utc_now(),
    }

    if isinstance(layers, list):
        manifest["layers"] = [layer for layer in layers if layer.get("layer") != LAYER_NAME]
        manifest["layers"].append(layer_entry)
    elif isinstance(layers, dict):
        layers[LAYER_NAME] = layer_entry
    else:
        manifest["layers"] = {LAYER_NAME: layer_entry}

    manifest["generated_at"] = utc_now()
    with CHUNK_MANIFEST_PATH.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)


def write_report(result: ChunkResult, execute: bool) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "generated_at": utc_now(),
        "execute": execute,
        "status": result.status,
        "message": result.message,
        "source": result.source,
        "output_dir": result.output_dir,
        "max_features": result.max_features,
        "source_features": result.source_features,
        "chunk_count": len(result.chunks),
        "total_bytes": result.total_bytes,
        "chunks": [chunk.__dict__ for chunk in result.chunks],
    }
    with REPORT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)


def chunk_buildings(max_features: int, execute: bool) -> ChunkResult:
    if max_features <= 0:
        raise ValueError("max_features must be greater than zero")
    if not SOURCE_FILE.exists():
        return ChunkResult(
            status="missing_source",
            message="prepared buildings layer not found",
            source=str(SOURCE_FILE),
            output_dir=str(LAYER_CHUNK_DIR),
            max_features=max_features,
            source_features=0,
            chunks=[],
            total_bytes=0,
        )

    if not execute:
        count = feature_count(SOURCE_FILE)
        chunk_count = (count + max_features - 1) // max_features
        chunks = [
            ChunkInfo(index=i, file=f"{LAYER_NAME}/{chunk_file_name(i)}", features=0, bytes=0)
            for i in range(1, chunk_count + 1)
        ]
        return ChunkResult(
            status="dry_run",
            message="ready; no chunks written",
            source=str(SOURCE_FILE),
            output_dir=str(LAYER_CHUNK_DIR),
            max_features=max_features,
            source_features=count,
            chunks=chunks,
            total_bytes=0,
        )

    remove_old_building_chunks()
    chunks: list[ChunkInfo] = []
    pending: list[dict[str, Any]] = []
    source_count = 0
    chunk_index = 1

    for feature in iter_geojson_features(SOURCE_FILE):
        source_count += 1
        pending.append(feature)
        if len(pending) >= max_features:
            chunks.append(write_chunk(chunk_index, pending))
            pending = []
            chunk_index += 1

    if pending:
        chunks.append(write_chunk(chunk_index, pending))

    update_manifest(chunks, max_features=max_features, source_features=source_count)
    return ChunkResult(
        status="chunked",
        message="building chunks written",
        source=str(SOURCE_FILE),
        output_dir=str(LAYER_CHUNK_DIR),
        max_features=max_features,
        source_features=source_count,
        chunks=chunks,
        total_bytes=sum(chunk.bytes for chunk in chunks),
    )


def print_result(result: ChunkResult, execute: bool) -> None:
    mode = "EXECUTE" if execute else "DRY_RUN"
    print("Kane-Map building layer chunking")
    print(f"Mode: {mode}")
    print(f"Status: {result.status}")
    print(f"Message: {result.message}")
    print(f"Source: {result.source}")
    print(f"Output dir: {result.output_dir}")
    print(f"Source features: {result.source_features}")
    print(f"Max features/chunk: {result.max_features}")
    print(f"Chunks: {len(result.chunks)}")
    print(f"Bytes: {result.total_bytes}")
    print(f"Wrote {REPORT_PATH}")
    if not execute:
        print("Dry run only. Use --execute to write building chunks.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Chunk prepared building footprints.")
    parser.add_argument("--execute", action="store_true", help="Write building chunk files.")
    parser.add_argument("--max-features", type=int, default=DEFAULT_MAX_FEATURES)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = chunk_buildings(max_features=args.max_features, execute=args.execute)
    write_report(result, execute=args.execute)
    print_result(result, execute=args.execute)
    return 0 if result.status in {"dry_run", "chunked"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
