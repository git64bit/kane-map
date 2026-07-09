"""Package chunked prepared layer files into a browser-ready bundle."""

from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from kane_map_processing.config import OUTPUT_DIR, REPORTS_DIR
except ImportError:  # pragma: no cover
    OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output"
    REPORTS_DIR = OUTPUT_DIR / "reports"

SOURCE_ROOT = OUTPUT_DIR / "chunks" / "prepared-layers"
BUNDLES_ROOT = OUTPUT_DIR / "bundles"
REPORT_PATH = REPORTS_DIR / "chunked_package_report.json"
MANIFEST_NAME = "chunk_manifest.json"
EXPECTED_LAYERS = {
    "address_points",
    "buildings",
    "county_boundary",
    "roads",
    "water",
}


@dataclass
class ChunkRecord:
    layer: str
    chunk_index: int
    source_path: Path
    relative_path: str
    feature_count: int
    bytes: int


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def layer_name(entry: dict[str, Any]) -> str:
    value = entry.get("layer") or entry.get("name") or entry.get("id")
    if not value:
        raise ValueError(f"Layer entry has no layer/name/id: {entry!r}")
    return str(value)


def layer_chunks(entry: dict[str, Any]) -> list[dict[str, Any]]:
    chunks = entry.get("chunks")
    if isinstance(chunks, list):
        return [c for c in chunks if isinstance(c, dict)]
    return []


def manifest_layers(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    layers = manifest.get("layers")
    if isinstance(layers, list):
        return [l for l in layers if isinstance(l, dict)]
    if isinstance(layers, dict):
        output = []
        for name, value in layers.items():
            if isinstance(value, dict):
                item = dict(value)
                item.setdefault("layer", name)
                output.append(item)
        return output
    raise ValueError("chunk_manifest.json has no usable layers collection")


def source_path_from_chunk(source_root: Path, layer: str, chunk: dict[str, Any]) -> Path:
    candidate = chunk.get("path") or chunk.get("relative_path")
    if not candidate:
        filename = f"{layer}_{int(chunk.get('chunk_index', 1)):06d}.json"
        return source_root / layer / filename

    path = Path(str(candidate))
    if path.is_absolute():
        return path

    if path.parts and path.parts[0] == "layers":
        return source_root / layer / path.name

    if len(path.parts) >= 2 and path.parts[0] == layer:
        return source_root / path

    return source_root / layer / path.name


def chunk_index(chunk: dict[str, Any], default: int) -> int:
    for key in ("chunk_index", "index"):
        value = chunk.get(key)
        if value is not None:
            return int(value)
    return default


def chunk_feature_count(chunk: dict[str, Any]) -> int:
    for key in ("feature_count", "features", "count"):
        value = chunk.get(key)
        if value is not None:
            return int(value)
    return 0


def collect_chunks(manifest: dict[str, Any], source_root: Path) -> tuple[list[dict[str, Any]], list[ChunkRecord]]:
    layers = manifest_layers(manifest)
    records: list[ChunkRecord] = []
    normalized_layers: list[dict[str, Any]] = []

    for entry in sorted(layers, key=layer_name):
        name = layer_name(entry)
        chunks = layer_chunks(entry)
        normalized_chunks: list[dict[str, Any]] = []
        layer_features = 0
        layer_bytes = 0

        if not chunks:
            raise ValueError(f"Layer has no chunks: {name}")

        for position, chunk in enumerate(chunks, start=1):
            index = chunk_index(chunk, position)
            source_path = source_path_from_chunk(source_root, name, chunk)
            feature_count = chunk_feature_count(chunk)
            byte_count = int(chunk.get("bytes") or (source_path.stat().st_size if source_path.exists() else 0))
            relative_path = f"layers/{name}/{source_path.name}"

            records.append(
                ChunkRecord(
                    layer=name,
                    chunk_index=index,
                    source_path=source_path,
                    relative_path=relative_path,
                    feature_count=feature_count,
                    bytes=byte_count,
                )
            )
            layer_features += feature_count
            layer_bytes += byte_count
            normalized_chunks.append(
                {
                    "layer": name,
                    "chunk_index": index,
                    "path": relative_path,
                    "feature_count": feature_count,
                    "bytes": byte_count,
                }
            )

        normalized_layers.append(
            {
                "layer": name,
                "chunk_count": len(normalized_chunks),
                "feature_count": layer_features,
                "bytes": layer_bytes,
                "chunks": normalized_chunks,
            }
        )

    return normalized_layers, records


def build_packaged_manifest(original: dict[str, Any], layers: list[dict[str, Any]]) -> dict[str, Any]:
    total_chunks = sum(int(layer["chunk_count"]) for layer in layers)
    total_features = sum(int(layer["feature_count"]) for layer in layers)
    total_bytes = sum(int(layer["bytes"]) for layer in layers)

    packaged = {
        "type": "kane-map-chunked-prepared-bundle",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_manifest_type": original.get("type"),
        "total_layers": len(layers),
        "total_chunks": total_chunks,
        "total_features": total_features,
        "total_bytes": total_bytes,
        "layers": layers,
    }

    for key in ("coordinate_precision", "schema", "notes"):
        if key in original:
            packaged[key] = original[key]

    return packaged


def validate_records(records: list[ChunkRecord]) -> list[str]:
    warnings: list[str] = []
    if not records:
        warnings.append("no chunk records found")

    present_layers = {record.layer for record in records}
    missing_layers = sorted(EXPECTED_LAYERS - present_layers)
    if missing_layers:
        warnings.append("missing expected layers: " + ", ".join(missing_layers))

    for record in records:
        if not record.source_path.exists():
            warnings.append(f"missing chunk file: {record.source_path}")
        if Path(record.relative_path).is_absolute():
            warnings.append(f"relative path is absolute: {record.relative_path}")

    return warnings


def remove_existing_bundle(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def copy_records(records: list[ChunkRecord], bundle_root: Path) -> int:
    bytes_written = 0
    for record in records:
        destination = bundle_root / record.relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(record.source_path, destination)
        bytes_written += destination.stat().st_size
    return bytes_written


def write_readme(bundle_root: Path, manifest: dict[str, Any]) -> None:
    readme = f"""Kane-Map chunked prepared data bundle

Generated: {manifest.get('generated_at')}
Layers: {manifest.get('total_layers')}
Chunks: {manifest.get('total_chunks')}
Features: {manifest.get('total_features')}
Bytes: {manifest.get('total_bytes')}

Open chunk_manifest.json first. Use each chunk entry path relative to this bundle root.

This is generated local data. Do not commit this bundle to GitHub.
"""
    (bundle_root / "README.txt").write_text(readme, encoding="utf-8")


def package_chunked_data(
    source_root: Path = SOURCE_ROOT,
    bundles_root: Path = BUNDLES_ROOT,
    output_name: str | None = None,
    execute: bool = False,
    force: bool = False,
) -> dict[str, Any]:
    manifest_path = source_root / MANIFEST_NAME
    if not manifest_path.exists():
        raise FileNotFoundError(f"Missing chunk manifest: {manifest_path}")

    original = load_json(manifest_path)
    layers, records = collect_chunks(original, source_root)
    packaged_manifest = build_packaged_manifest(original, layers)
    warnings = validate_records(records)

    bundle_name = output_name or f"kane-map-chunked-prepared-{utc_stamp()}"
    bundle_root = bundles_root / bundle_name

    result: dict[str, Any] = {
        "mode": "EXECUTE" if execute else "DRY_RUN",
        "status": "packaged" if execute and not warnings else "dry_run" if not execute else "warning",
        "source_root": str(source_root),
        "bundle_root": str(bundle_root),
        "manifest_path": str(manifest_path),
        "total_layers": packaged_manifest["total_layers"],
        "total_chunks": packaged_manifest["total_chunks"],
        "total_features": packaged_manifest["total_features"],
        "total_bytes": packaged_manifest["total_bytes"],
        "warnings": warnings,
        "bytes_written": 0,
    }

    if execute:
        if warnings:
            result["message"] = "warnings present; package not written"
        else:
            if bundle_root.exists() and not force:
                raise FileExistsError(f"Bundle already exists; use --force: {bundle_root}")
            if force:
                remove_existing_bundle(bundle_root)
            bundle_root.mkdir(parents=True, exist_ok=True)
            bytes_written = copy_records(records, bundle_root)
            write_json(bundle_root / MANIFEST_NAME, packaged_manifest)
            write_readme(bundle_root, packaged_manifest)
            result["bytes_written"] = bytes_written + (bundle_root / MANIFEST_NAME).stat().st_size
            result["message"] = "bundle written"
    else:
        result["message"] = "ready; no files copied"

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(REPORT_PATH, result)
    return result


def print_result(result: dict[str, Any]) -> None:
    print("Kane-Map chunked bundle packaging")
    print(f"Mode: {result['mode']}")
    print(f"Status: {result['status']}")
    print(f"Source root: {result['source_root']}")
    print(f"Bundle root: {result['bundle_root']}")
    print(f"Total layers: {result['total_layers']}")
    print(f"Total chunks: {result['total_chunks']}")
    print(f"Total features: {result['total_features']}")
    print(f"Total bytes: {result['total_bytes']}")
    print(f"Bytes written: {result['bytes_written']}")

    warnings = result.get("warnings") or []
    if warnings:
        print("Validation warnings:")
        for warning in warnings:
            print(f"  {warning}")

    print(f"Wrote {REPORT_PATH}")
    if result["mode"] == "DRY_RUN":
        print("Dry run only. Use --execute to write the packaged chunk bundle.")
    else:
        print(result.get("message", ""))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true", help="write packaged bundle")
    parser.add_argument("--force", action="store_true", help="replace output bundle if it already exists")
    parser.add_argument("--source-root", type=Path, default=SOURCE_ROOT)
    parser.add_argument("--bundles-root", type=Path, default=BUNDLES_ROOT)
    parser.add_argument("--output-name", default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = package_chunked_data(
        source_root=args.source_root,
        bundles_root=args.bundles_root,
        output_name=args.output_name,
        execute=args.execute,
        force=args.force,
    )
    print_result(result)


if __name__ == "__main__":
    main()
