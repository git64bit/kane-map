"""Chunk prepared building footprints into browser-loadable files."""

from __future__ import annotations

import argparse
import json
import math
import shutil
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Tuple

from kane_map_processing.config import OUTPUT_DIR, PREPARED_DIR, REPORTS_DIR

LAYER_NAME = "buildings"
DEFAULT_MAX_FEATURES = 5000
PREPARED_PATH = PREPARED_DIR / "buildings.json"
CHUNK_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
BUILDING_CHUNK_DIR = CHUNK_ROOT / "buildings"
ROOT_CHUNK_MANIFEST_PATH = CHUNK_ROOT / "chunk_manifest.json"
BUILDING_CHUNK_MANIFEST_PATH = BUILDING_CHUNK_DIR / "buildings_chunk_manifest.json"
REPORT_PATH = REPORTS_DIR / "buildings_chunking_report.json"


@dataclass
class ChunkRecord:
    file: str
    features: int
    bytes: int


@dataclass
class ChunkResult:
    mode: str
    status: str
    message: str
    source: str
    output_dir: str
    max_features_per_chunk: int
    source_features: int
    chunks: int
    bytes_written: int
    report: str
    manifest: str


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure_dirs() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    BUILDING_CHUNK_DIR.mkdir(parents=True, exist_ok=True)


def _read_more(handle, buffer: str, size: int = 65536) -> str:
    chunk = handle.read(size)
    if not chunk:
        return buffer
    return buffer + chunk


def iter_geojson_features(path: Path) -> Iterator[Dict[str, Any]]:
    """Yield features from a GeoJSON FeatureCollection without loading the full file."""
    decoder = json.JSONDecoder()
    buffer = ""

    with path.open("r", encoding="utf-8") as handle:
        while '"features"' not in buffer:
            next_chunk = handle.read(65536)
            if not next_chunk:
                raise ValueError(f"No features array found in {path}")
            buffer += next_chunk

        feature_key_index = buffer.index('"features"')
        buffer = buffer[feature_key_index + len('"features"'):]

        while "[" not in buffer:
            next_chunk = handle.read(65536)
            if not next_chunk:
                raise ValueError(f"No features array opening bracket found in {path}")
            buffer += next_chunk

        array_start = buffer.index("[")
        buffer = buffer[array_start + 1:]

        while True:
            buffer = buffer.lstrip()
            if not buffer:
                new_buffer = _read_more(handle, buffer)
                if new_buffer == buffer:
                    break
                buffer = new_buffer
                continue

            if buffer.startswith("]"):
                break

            if buffer.startswith(","):
                buffer = buffer[1:]
                continue

            while True:
                try:
                    feature, end_index = decoder.raw_decode(buffer)
                    if not isinstance(feature, dict):
                        raise ValueError("GeoJSON feature was not an object")
                    yield feature
                    buffer = buffer[end_index:]
                    break
                except json.JSONDecodeError:
                    new_buffer = _read_more(handle, buffer)
                    if new_buffer == buffer:
                        raise
                    buffer = new_buffer


def count_features(path: Path) -> int:
    return sum(1 for _ in iter_geojson_features(path))


def _chunk_file_name(index: int) -> str:
    return f"buildings_{index:06d}.json"


def _write_chunk_header(handle, chunk_index: int, source_path: Path, max_features: int) -> None:
    header = {
        "type": "FeatureCollection",
        "meta": {
            "layer": LAYER_NAME,
            "version": 1,
            "chunk_index": chunk_index,
            "max_features_per_chunk": max_features,
            "source": str(source_path),
            "generated_at": utc_now(),
        },
        "features": [
    }
    text = json.dumps(header, separators=(",", ":"))
    handle.write(text[:-1])


def _write_chunk_footer(handle) -> None:
    handle.write("]}")


def _clear_existing_chunks() -> None:
    if BUILDING_CHUNK_DIR.exists():
        for path in BUILDING_CHUNK_DIR.glob("buildings_*.json"):
            path.unlink()
        for path in [BUILDING_CHUNK_MANIFEST_PATH]:
            if path.exists():
                path.unlink()


def write_chunks(source_path: Path, max_features: int, force: bool) -> Tuple[List[ChunkRecord], int]:
    ensure_dirs()

    existing = list(BUILDING_CHUNK_DIR.glob("buildings_*.json"))
    if existing and not force:
        raise FileExistsError("building chunks already exist; use --force to replace them")
    if existing and force:
        _clear_existing_chunks()

    chunks: List[ChunkRecord] = []
    current_handle = None
    current_path: Optional[Path] = None
    current_count = 0
    chunk_index = 0
    total_features = 0
    first_in_chunk = True

    try:
        for feature in iter_geojson_features(source_path):
            if current_handle is None or current_count >= max_features:
                if current_handle is not None and current_path is not None:
                    _write_chunk_footer(current_handle)
                    current_handle.close()
                    chunks.append(
                        ChunkRecord(
                            file=str(current_path.relative_to(CHUNK_ROOT)),
                            features=current_count,
                            bytes=current_path.stat().st_size,
                        )
                    )

                chunk_index += 1
                current_count = 0
                first_in_chunk = True
                current_path = BUILDING_CHUNK_DIR / _chunk_file_name(chunk_index)
                current_handle = current_path.open("w", encoding="utf-8")
                _write_chunk_header(current_handle, chunk_index, source_path, max_features)

            if not first_in_chunk:
                current_handle.write(",")
            json.dump(feature, current_handle, separators=(",", ":"))
            first_in_chunk = False
            current_count += 1
            total_features += 1

        if current_handle is not None and current_path is not None:
            _write_chunk_footer(current_handle)
            current_handle.close()
            chunks.append(
                ChunkRecord(
                    file=str(current_path.relative_to(CHUNK_ROOT)),
                    features=current_count,
                    bytes=current_path.stat().st_size,
                )
            )
    finally:
        if current_handle is not None and not current_handle.closed:
            current_handle.close()

    return chunks, total_features


def write_building_chunk_manifest(chunks: List[ChunkRecord], total_features: int, max_features: int) -> None:
    manifest = {
        "schema": "kane-map-building-chunk-manifest-v1",
        "generated_at": utc_now(),
        "layer": LAYER_NAME,
        "source": str(PREPARED_PATH),
        "output_root": str(CHUNK_ROOT),
        "max_features_per_chunk": max_features,
        "chunks": [asdict(chunk) for chunk in chunks],
        "total_chunks": len(chunks),
        "total_features": total_features,
        "total_bytes": sum(chunk.bytes for chunk in chunks),
    }
    BUILDING_CHUNK_MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def update_root_chunk_manifest(chunks: List[ChunkRecord], total_features: int, max_features: int) -> None:
    CHUNK_ROOT.mkdir(parents=True, exist_ok=True)
    if ROOT_CHUNK_MANIFEST_PATH.exists():
        try:
            root = json.loads(ROOT_CHUNK_MANIFEST_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            root = {"schema": "kane-map-chunk-manifest-v1", "layers": {}}
    else:
        root = {"schema": "kane-map-chunk-manifest-v1", "layers": {}}

    entry = {
        "layer": LAYER_NAME,
        "generated_at": utc_now(),
        "max_features_per_chunk": max_features,
        "total_chunks": len(chunks),
        "total_features": total_features,
        "total_bytes": sum(chunk.bytes for chunk in chunks),
        "manifest": str(BUILDING_CHUNK_MANIFEST_PATH.relative_to(CHUNK_ROOT)),
        "chunks": [asdict(chunk) for chunk in chunks],
    }

    layers = root.get("layers")
    if isinstance(layers, dict):
        layers[LAYER_NAME] = entry
    elif isinstance(layers, list):
        new_layers = []
        for item in layers:
            if isinstance(item, dict) and item.get("layer") == LAYER_NAME:
                continue
            if isinstance(item, dict) and item.get("name") == LAYER_NAME:
                continue
            new_layers.append(item)
        new_layers.append(entry)
        root["layers"] = new_layers
    else:
        root["layers"] = {LAYER_NAME: entry}

    root["updated_at"] = utc_now()
    ROOT_CHUNK_MANIFEST_PATH.write_text(json.dumps(root, indent=2), encoding="utf-8")


def write_report(result: ChunkResult) -> None:
    ensure_dirs()
    REPORT_PATH.write_text(json.dumps(asdict(result), indent=2), encoding="utf-8")


def run(execute: bool, max_features: int, force: bool) -> ChunkResult:
    ensure_dirs()
    mode = "EXECUTE" if execute else "DRY_RUN"

    if not PREPARED_PATH.exists():
        result = ChunkResult(
            mode=mode,
            status="missing_source",
            message="prepared buildings.json does not exist",
            source=str(PREPARED_PATH),
            output_dir=str(BUILDING_CHUNK_DIR),
            max_features_per_chunk=max_features,
            source_features=0,
            chunks=0,
            bytes_written=0,
            report=str(REPORT_PATH),
            manifest=str(BUILDING_CHUNK_MANIFEST_PATH),
        )
        write_report(result)
        return result

    source_features = count_features(PREPARED_PATH)
    estimated_chunks = math.ceil(source_features / max_features) if max_features else 0

    if not execute:
        result = ChunkResult(
            mode=mode,
            status="dry_run",
            message="ready; no chunks written",
            source=str(PREPARED_PATH),
            output_dir=str(BUILDING_CHUNK_DIR),
            max_features_per_chunk=max_features,
            source_features=source_features,
            chunks=estimated_chunks,
            bytes_written=0,
            report=str(REPORT_PATH),
            manifest=str(BUILDING_CHUNK_MANIFEST_PATH),
        )
        write_report(result)
        return result

    chunks, total_features = write_chunks(PREPARED_PATH, max_features, force=force)
    write_building_chunk_manifest(chunks, total_features, max_features)
    update_root_chunk_manifest(chunks, total_features, max_features)

    result = ChunkResult(
        mode=mode,
        status="chunked",
        message="building chunks written",
        source=str(PREPARED_PATH),
        output_dir=str(BUILDING_CHUNK_DIR),
        max_features_per_chunk=max_features,
        source_features=total_features,
        chunks=len(chunks),
        bytes_written=sum(chunk.bytes for chunk in chunks),
        report=str(REPORT_PATH),
        manifest=str(BUILDING_CHUNK_MANIFEST_PATH),
    )
    write_report(result)
    return result


def print_result(result: ChunkResult) -> None:
    print("Kane-Map building chunking")
    print(f"Mode: {result.mode}")
    print(f"Status: {result.status}")
    print(f"Message: {result.message}")
    print(f"Source: {result.source}")
    print(f"Output dir: {result.output_dir}")
    print(f"Max features/chunk: {result.max_features_per_chunk}")
    print(f"Source features: {result.source_features}")
    print(f"Chunks: {result.chunks}")
    print(f"Bytes written: {result.bytes_written}")
    print(f"Wrote {result.report}")
    if result.status == "dry_run":
        print("Dry run only. Use --execute to write building chunks.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Chunk prepared building footprints.")
    parser.add_argument("--execute", action="store_true", help="Write chunk files.")
    parser.add_argument("--force", action="store_true", help="Replace existing building chunks.")
    parser.add_argument(
        "--max-features",
        type=int,
        default=DEFAULT_MAX_FEATURES,
        help=f"Maximum features per chunk. Default: {DEFAULT_MAX_FEATURES}",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.max_features <= 0:
        raise SystemExit("--max-features must be greater than zero")
    result = run(execute=args.execute, max_features=args.max_features, force=args.force)
    print_result(result)


if __name__ == "__main__":
    main()
