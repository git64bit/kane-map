"""Verify a packaged Kane-Map portable county application.

This verifier inspects the app folder produced by package_portable_county_app.py.
It does not modify the app bundle. It checks that the browser files, portable
manifest, chunk manifest, and county data files are present and internally
consistent.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

PROCESSING_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PROCESSING_ROOT.parent
DEFAULT_APPS_ROOT = PROCESSING_ROOT / "output" / "apps"
REPORTS_ROOT = PROCESSING_ROOT / "output" / "reports"
REPORT_PATH = REPORTS_ROOT / "portable_app_verification_report.json"

EXPECTED_APP_FILES = [
    "index.html",
    "APP_README.txt",
    "portable_manifest.json",
    "src/app.js",
]

EXPECTED_APP_DIRS = [
    "src",
    "styles",
    "data/kane-county",
]

EXPECTED_LAYERS = {
    "address_points": 219626,
    "buildings": 166766,
    "county_boundary": 1,
    "roads": 9326,
    "water": 286,
}

EXPECTED_TOTAL_FEATURES = sum(EXPECTED_LAYERS.values())
EXPECTED_TOTAL_CHUNKS = 85
EXPECTED_DATA_FILES = 87


@dataclass
class CheckResult:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    @property
    def status(self) -> str:
        if self.errors:
            return "error"
        if self.warnings:
            return "warning"
        return "ok"


def read_json(path: Path, result: CheckResult) -> dict[str, Any]:
    if not path.exists():
        result.error(f"missing JSON file: {path}")
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        result.error(f"invalid JSON file: {path}: {exc}")
        return {}


def latest_app_root(apps_root: Path) -> Path | None:
    if not apps_root.exists():
        return None
    candidates = [p for p in apps_root.iterdir() if p.is_dir() and p.name.startswith("kane-county-map-")]
    if not candidates:
        return None
    return max(candidates, key=lambda p: (p.stat().st_mtime, p.name))


def count_files(root: Path) -> tuple[int, int]:
    count = 0
    total_bytes = 0
    if not root.exists():
        return count, total_bytes
    for path in root.rglob("*"):
        if path.is_file():
            count += 1
            total_bytes += path.stat().st_size
    return count, total_bytes


def rel(path: Path, base: Path) -> str:
    try:
        return path.relative_to(base).as_posix()
    except ValueError:
        return path.as_posix()


def layer_chunks(layer_record: dict[str, Any]) -> list[dict[str, Any]]:
    chunks = layer_record.get("chunks", [])
    return chunks if isinstance(chunks, list) else []


def chunk_file_from_entry(data_root: Path, layer_name: str, entry: dict[str, Any]) -> Path:
    explicit_relative = entry.get("relative_path") or entry.get("portable_path")
    if isinstance(explicit_relative, str) and explicit_relative:
        return data_root / explicit_relative

    entry_path = entry.get("path")
    if isinstance(entry_path, str) and entry_path:
        parsed = Path(entry_path)
        if not parsed.is_absolute():
            return data_root / parsed
        return data_root / layer_name / parsed.name

    index = entry.get("chunk_index") or entry.get("index")
    if isinstance(index, int):
        return data_root / layer_name / f"{layer_name}_{index:06d}.json"

    return data_root / layer_name / "UNKNOWN_CHUNK.json"


def verify_app_files(app_root: Path, result: CheckResult) -> dict[str, Any]:
    file_status: dict[str, bool] = {}
    dir_status: dict[str, bool] = {}

    for item in EXPECTED_APP_FILES:
        exists = (app_root / item).is_file()
        file_status[item] = exists
        if not exists:
            result.error(f"missing app file: {item}")

    for item in EXPECTED_APP_DIRS:
        exists = (app_root / item).is_dir()
        dir_status[item] = exists
        if not exists:
            result.error(f"missing app directory: {item}")

    forbidden_roots = ["input", "raw", "downloads", "source", "prepared"]
    for path in app_root.rglob("*"):
        if not path.is_file():
            continue
        relative_parts = set(path.relative_to(app_root).parts)
        if relative_parts.intersection(forbidden_roots):
            result.warn(f"possible non-portable processing artifact copied: {rel(path, app_root)}")

    app_file_count, app_bytes = count_files(app_root)
    return {
        "required_files": file_status,
        "required_directories": dir_status,
        "file_count": app_file_count,
        "bytes": app_bytes,
    }


def verify_portable_manifest(app_root: Path, result: CheckResult) -> dict[str, Any]:
    path = app_root / "portable_manifest.json"
    manifest = read_json(path, result)
    if not manifest:
        return {"path": path.as_posix(), "status": "missing_or_invalid"}

    text = json.dumps(manifest, sort_keys=True)
    if "/home/kaneproc" in text:
        result.warn("portable_manifest.json contains /home/kaneproc path text")
    if str(REPO_ROOT) in text:
        result.warn("portable_manifest.json contains this processing-node repository path")

    return {
        "path": path.as_posix(),
        "status": "readable",
        "top_level_keys": sorted(manifest.keys()),
    }


def verify_chunk_manifest(app_root: Path, result: CheckResult) -> dict[str, Any]:
    data_root = app_root / "data" / "kane-county"
    manifest_path = data_root / "chunk_manifest.json"
    manifest = read_json(manifest_path, result)
    if not manifest:
        return {
            "path": manifest_path.as_posix(),
            "status": "missing_or_invalid",
            "data_root": data_root.as_posix(),
        }

    layers = manifest.get("layers", [])
    if isinstance(layers, dict):
        layer_records = []
        for name, record in layers.items():
            if isinstance(record, dict):
                merged = dict(record)
                merged.setdefault("layer", name)
                layer_records.append(merged)
    elif isinstance(layers, list):
        layer_records = [record for record in layers if isinstance(record, dict)]
    else:
        layer_records = []
        result.error("chunk_manifest.json has unsupported layers structure")

    found_layers: dict[str, dict[str, Any]] = {}
    total_chunks_computed = 0
    total_features_computed = 0
    total_bytes_computed = 0
    missing_chunk_files: list[str] = []
    absolute_path_count = 0

    for record in layer_records:
        layer_name = record.get("layer")
        if not isinstance(layer_name, str) or not layer_name:
            result.error("chunk manifest contains layer entry without layer name")
            continue

        chunks = layer_chunks(record)
        feature_count = record.get("feature_count")
        if not isinstance(feature_count, int):
            feature_count = sum(c.get("feature_count", 0) for c in chunks if isinstance(c.get("feature_count"), int))

        bytes_count = record.get("bytes")
        if not isinstance(bytes_count, int):
            bytes_count = sum(c.get("bytes", 0) for c in chunks if isinstance(c.get("bytes"), int))

        chunk_paths = []
        for chunk in chunks:
            path_text = chunk.get("path")
            if isinstance(path_text, str) and Path(path_text).is_absolute():
                absolute_path_count += 1
            chunk_file = chunk_file_from_entry(data_root, layer_name, chunk)
            chunk_paths.append(rel(chunk_file, app_root))
            if not chunk_file.is_file():
                missing_chunk_files.append(rel(chunk_file, app_root))

        found_layers[layer_name] = {
            "chunks": len(chunks),
            "feature_count": feature_count,
            "bytes": bytes_count,
            "chunk_paths_checked": len(chunk_paths),
        }
        total_chunks_computed += len(chunks)
        total_features_computed += feature_count
        total_bytes_computed += bytes_count

    missing_layers = sorted(set(EXPECTED_LAYERS) - set(found_layers))
    unexpected_layers = sorted(set(found_layers) - set(EXPECTED_LAYERS))
    if missing_layers:
        result.error("missing data layers: " + ", ".join(missing_layers))
    if unexpected_layers:
        result.warn("unexpected data layers: " + ", ".join(unexpected_layers))

    for layer_name, expected_features in EXPECTED_LAYERS.items():
        layer = found_layers.get(layer_name)
        if not layer:
            continue
        if layer["feature_count"] != expected_features:
            result.error(
                f"{layer_name} feature count mismatch: expected {expected_features}, got {layer['feature_count']}"
            )

    recorded_total_chunks = manifest.get("total_chunks")
    recorded_total_features = manifest.get("total_features")
    recorded_total_layers = manifest.get("total_layers")

    if recorded_total_chunks != total_chunks_computed:
        result.error(f"total_chunks mismatch: recorded {recorded_total_chunks}, computed {total_chunks_computed}")
    if recorded_total_features != total_features_computed:
        result.error(
            f"total_features mismatch: recorded {recorded_total_features}, computed {total_features_computed}"
        )
    if recorded_total_layers != len(found_layers):
        result.error(f"total_layers mismatch: recorded {recorded_total_layers}, computed {len(found_layers)}")

    if total_chunks_computed != EXPECTED_TOTAL_CHUNKS:
        result.error(f"expected {EXPECTED_TOTAL_CHUNKS} chunks, found {total_chunks_computed}")
    if total_features_computed != EXPECTED_TOTAL_FEATURES:
        result.error(f"expected {EXPECTED_TOTAL_FEATURES} features, found {total_features_computed}")

    if missing_chunk_files:
        preview = ", ".join(missing_chunk_files[:8])
        suffix = "" if len(missing_chunk_files) <= 8 else f" ... +{len(missing_chunk_files) - 8} more"
        result.error(f"missing chunk files: {preview}{suffix}")

    if absolute_path_count:
        result.warn(
            f"chunk_manifest.json contains {absolute_path_count} absolute source paths; "
            "portable bundles should use relative paths before cross-machine use"
        )

    data_file_count, data_bytes = count_files(data_root)
    if data_file_count != EXPECTED_DATA_FILES:
        result.warn(f"expected {EXPECTED_DATA_FILES} data files, found {data_file_count}")

    return {
        "path": manifest_path.as_posix(),
        "status": "readable",
        "data_root": data_root.as_posix(),
        "data_file_count": data_file_count,
        "data_bytes": data_bytes,
        "recorded_total_layers": recorded_total_layers,
        "recorded_total_chunks": recorded_total_chunks,
        "recorded_total_features": recorded_total_features,
        "computed_total_layers": len(found_layers),
        "computed_total_chunks": total_chunks_computed,
        "computed_total_features": total_features_computed,
        "computed_total_bytes": total_bytes_computed,
        "absolute_path_count": absolute_path_count,
        "layers": found_layers,
    }


def verify_portable_app(app_root: Path) -> dict[str, Any]:
    result = CheckResult()
    if not app_root.exists():
        result.error(f"app root does not exist: {app_root}")
    elif not app_root.is_dir():
        result.error(f"app root is not a directory: {app_root}")

    app_files = verify_app_files(app_root, result) if app_root.exists() else {}
    portable_manifest = verify_portable_manifest(app_root, result) if app_root.exists() else {}
    chunk_manifest = verify_chunk_manifest(app_root, result) if app_root.exists() else {}

    return {
        "status": result.status,
        "app_root": app_root.as_posix(),
        "app_files": app_files,
        "portable_manifest": portable_manifest,
        "chunk_manifest": chunk_manifest,
        "errors": result.errors,
        "warnings": result.warnings,
    }


def print_report(report: dict[str, Any]) -> None:
    chunk = report.get("chunk_manifest", {})
    layers = chunk.get("layers", {}) if isinstance(chunk, dict) else {}

    print("Kane-Map portable app verification")
    print(f"Status: {report.get('status')}")
    print(f"App root: {report.get('app_root')}")
    if chunk:
        print(f"Data root: {chunk.get('data_root')}")
        print(f"Data files: {chunk.get('data_file_count')}")
        print(f"Data layers: {chunk.get('computed_total_layers')}")
        print(f"Data chunks: {chunk.get('computed_total_chunks')}")
        print(f"Data features: {chunk.get('computed_total_features')}")
        print(f"Absolute manifest paths: {chunk.get('absolute_path_count')}")

    if layers:
        print("Layer summary:")
        for layer_name in sorted(layers):
            layer = layers[layer_name]
            print(f"  {layer_name}: {layer.get('chunks')} chunks, {layer.get('feature_count')} features")

    errors = report.get("errors", [])
    warnings = report.get("warnings", [])
    if errors:
        print("Errors:")
        for message in errors:
            print(f"  {message}")
    if warnings:
        print("Warnings:")
        for message in warnings:
            print(f"  {message}")

    if report.get("status") == "ok":
        print("USB-copy status: ready")
    elif report.get("status") == "warning":
        print("USB-copy status: review warnings before cross-machine use")
    else:
        print("USB-copy status: not ready")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify the latest packaged Kane-Map portable app.")
    parser.add_argument("--app-root", help="Specific portable app folder to verify.")
    parser.add_argument("--apps-root", default=str(DEFAULT_APPS_ROOT), help="Folder containing app bundles.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON instead of text.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.app_root:
        app_root = Path(args.app_root).expanduser().resolve()
    else:
        apps_root = Path(args.apps_root).expanduser().resolve()
        app_root = latest_app_root(apps_root)
        if app_root is None:
            app_root = apps_root / "NO_APP_FOUND"

    report = verify_portable_app(app_root)
    REPORTS_ROOT.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print_report(report)
        print(f"Wrote {REPORT_PATH}")


if __name__ == "__main__":
    main()
