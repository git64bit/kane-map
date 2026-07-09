"""Chunk prepared Kane-Map layers into smaller local files."""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Iterator, Any

from .config import PREPARED_DIR, OUTPUT_DIR, REPORTS_DIR

DEFAULT_CHUNK_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
DEFAULT_REPORT_PATH = REPORTS_DIR / "prepared_chunking_report.json"
DEFAULT_LAYERS = ("roads", "water")
DEFAULT_MAX_FEATURES = {
    "roads": 2000,
    "water": 500,
}


@dataclass(frozen=True)
class ChunkRecord:
    layer: str
    chunk_index: int
    path: str
    feature_count: int
    bytes: int


@dataclass(frozen=True)
class LayerChunkSummary:
    layer: str
    status: str
    source_path: str
    source_exists: bool
    source_features: int
    max_features_per_chunk: int
    chunks: list[ChunkRecord]
    message: str


@dataclass(frozen=True)
class ChunkingResult:
    mode: str
    status: str
    generated_at: str
    output_root: str
    layers: list[LayerChunkSummary]
    total_chunks: int
    total_features: int
    total_bytes: int
    report_path: str
    manifest_path: str


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_feature_collection(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"{path} is not a JSON object")
    if data.get("type") != "FeatureCollection":
        raise ValueError(f"{path} is not a FeatureCollection")
    features = data.get("features")
    if not isinstance(features, list):
        raise ValueError(f"{path} has no features list")
    return data


def chunk_list(items: list[Any], size: int) -> Iterator[list[Any]]:
    if size <= 0:
        raise ValueError("chunk size must be positive")
    for index in range(0, len(items), size):
        yield items[index:index + size]


def layer_source_path(layer: str) -> Path:
    return PREPARED_DIR / f"{layer}.json"


def write_json(path: Path, data: dict[str, Any]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    return path.stat().st_size


def make_chunk_collection(layer: str, chunk_index: int, chunk_features: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "metadata": {
            "format": "kane-map-prepared-chunk",
            "version": 1,
            "layer": layer,
            "chunk_index": chunk_index,
            "feature_count": len(chunk_features),
        },
        "features": chunk_features,
    }


def chunk_layer(layer: str, *, execute: bool, output_root: Path, max_features: int) -> LayerChunkSummary:
    source_path = layer_source_path(layer)
    if not source_path.exists():
        return LayerChunkSummary(
            layer=layer,
            status="missing",
            source_path=str(source_path),
            source_exists=False,
            source_features=0,
            max_features_per_chunk=max_features,
            chunks=[],
            message="prepared source file not found",
        )

    data = load_feature_collection(source_path)
    features = data["features"]
    source_features = len(features)
    expected_chunks = max(1, math.ceil(source_features / max_features)) if source_features else 0

    if not execute:
        dry_chunks = [
            ChunkRecord(
                layer=layer,
                chunk_index=index,
                path=str(output_root / layer / f"{layer}_{index:06d}.json"),
                feature_count=min(max_features, max(0, source_features - ((index - 1) * max_features))),
                bytes=0,
            )
            for index in range(1, expected_chunks + 1)
        ]
        return LayerChunkSummary(
            layer=layer,
            status="dry_run",
            source_path=str(source_path),
            source_exists=True,
            source_features=source_features,
            max_features_per_chunk=max_features,
            chunks=dry_chunks,
            message="ready; no chunks written",
        )

    layer_dir = output_root / layer
    layer_dir.mkdir(parents=True, exist_ok=True)

    # Remove old chunks for this layer only.
    for old_file in layer_dir.glob(f"{layer}_*.json"):
        old_file.unlink()

    chunk_records: list[ChunkRecord] = []
    for index, chunk_features in enumerate(chunk_list(features, max_features), start=1):
        chunk_path = layer_dir / f"{layer}_{index:06d}.json"
        chunk_data = make_chunk_collection(layer, index, chunk_features)
        byte_count = write_json(chunk_path, chunk_data)
        chunk_records.append(
            ChunkRecord(
                layer=layer,
                chunk_index=index,
                path=str(chunk_path),
                feature_count=len(chunk_features),
                bytes=byte_count,
            )
        )

    return LayerChunkSummary(
        layer=layer,
        status="chunked",
        source_path=str(source_path),
        source_exists=True,
        source_features=source_features,
        max_features_per_chunk=max_features,
        chunks=chunk_records,
        message="chunks written",
    )


def build_chunk_manifest(result: ChunkingResult) -> dict[str, Any]:
    return {
        "format": "kane-map-prepared-chunk-manifest",
        "version": 1,
        "generated_at": result.generated_at,
        "output_root": result.output_root,
        "total_chunks": result.total_chunks,
        "total_features": result.total_features,
        "total_bytes": result.total_bytes,
        "layers": [
            {
                "layer": layer.layer,
                "status": layer.status,
                "source_path": layer.source_path,
                "source_features": layer.source_features,
                "max_features_per_chunk": layer.max_features_per_chunk,
                "chunk_count": len(layer.chunks),
                "chunks": [asdict(chunk) for chunk in layer.chunks],
            }
            for layer in result.layers
        ],
    }


def chunk_prepared_layers(
    *,
    layers: Iterable[str] = DEFAULT_LAYERS,
    execute: bool = False,
    output_root: Path = DEFAULT_CHUNK_ROOT,
    report_path: Path = DEFAULT_REPORT_PATH,
    max_features: int | None = None,
) -> ChunkingResult:
    output_root = output_root.resolve()
    report_path = report_path.resolve()
    generated_at = utc_now_iso()

    summaries: list[LayerChunkSummary] = []
    for layer in layers:
        limit = max_features if max_features is not None else DEFAULT_MAX_FEATURES.get(layer, 1000)
        summaries.append(chunk_layer(layer, execute=execute, output_root=output_root, max_features=limit))

    total_chunks = sum(len(layer.chunks) for layer in summaries if layer.status in {"dry_run", "chunked"})
    total_features = sum(chunk.feature_count for layer in summaries for chunk in layer.chunks)
    total_bytes = sum(chunk.bytes for layer in summaries for chunk in layer.chunks)
    status = "chunked" if execute and all(layer.status == "chunked" for layer in summaries) else "dry_run"
    if any(layer.status == "missing" for layer in summaries):
        status = "partial" if execute else "dry_run_partial"

    manifest_path = output_root / "chunk_manifest.json"
    result = ChunkingResult(
        mode="EXECUTE" if execute else "DRY_RUN",
        status=status,
        generated_at=generated_at,
        output_root=str(output_root),
        layers=summaries,
        total_chunks=total_chunks,
        total_features=total_features,
        total_bytes=total_bytes,
        report_path=str(report_path),
        manifest_path=str(manifest_path),
    )

    report_data = asdict(result)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report_data, indent=2), encoding="utf-8")

    if execute:
        manifest_data = build_chunk_manifest(result)
        write_json(manifest_path, manifest_data)

    return result


def print_result(result: ChunkingResult) -> None:
    print("Kane-Map prepared layer chunking")
    print(f"Mode: {result.mode}")
    print(f"Status: {result.status}")
    print(f"Output root: {result.output_root}")
    print(f"Total chunks: {result.total_chunks}")
    print(f"Total features: {result.total_features}")
    print(f"Total bytes: {result.total_bytes}")
    print("")

    for layer in result.layers:
        print(f"{layer.status.upper()}: {layer.layer}")
        print(f"  source: {layer.source_path}")
        print(f"  source features: {layer.source_features}")
        print(f"  max features/chunk: {layer.max_features_per_chunk}")
        print(f"  chunks: {len(layer.chunks)}")
        print(f"  message: {layer.message}")

    print(f"\nWrote {result.report_path}")
    if result.mode == "EXECUTE":
        print(f"Wrote {result.manifest_path}")
    else:
        print("Dry run only. Use --execute to write chunks.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Chunk prepared Kane-Map layers.")
    parser.add_argument("--execute", action="store_true", help="write chunk files")
    parser.add_argument(
        "--layer",
        action="append",
        dest="layers",
        help="layer to chunk; may be used more than once; default roads and water",
    )
    parser.add_argument(
        "--max-features",
        type=int,
        default=None,
        help="override maximum features per chunk for all selected layers",
    )
    parser.add_argument(
        "--output-root",
        default=str(DEFAULT_CHUNK_ROOT),
        help="chunk output root",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = chunk_prepared_layers(
        layers=args.layers or DEFAULT_LAYERS,
        execute=args.execute,
        output_root=Path(args.output_root),
        max_features=args.max_features,
    )
    print_result(result)
    return 0 if not result.status.endswith("partial") else 1


if __name__ == "__main__":
    raise SystemExit(main())
