"""Prepared bundle validation for Kane-Map.

This module validates a packaged prepared-data bundle under
processing/output/bundles/<bundle-name>/.

It is intentionally conservative and avoids loading whole GeoJSON files into RAM.
Layer files are inspected by streaming enough structure to count top-level
features and detect geometry types.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from kane_map_processing.config import OUTPUT_DIR, REPORTS_DIR
except Exception:  # pragma: no cover - fallback for direct execution experiments
    PROCESSING_ROOT = Path(__file__).resolve().parents[1]
    OUTPUT_DIR = PROCESSING_ROOT / "output"
    REPORTS_DIR = OUTPUT_DIR / "reports"


BUNDLES_DIR = OUTPUT_DIR / "bundles"
DEFAULT_REPORT_PATH = REPORTS_DIR / "bundle_validation_report.json"


@dataclass
class LayerValidation:
    name: str
    path: str
    exists: bool
    bytes: int
    feature_count: int | None
    geometry_types: dict[str, int]
    expected_features: int | None
    expected_bytes: int | None
    ok: bool
    errors: list[str]


@dataclass
class BundleValidationResult:
    status: str
    ok: bool
    bundle_path: str
    bundle_name: str
    checked_at: str
    manifest_exists: bool
    readme_exists: bool
    layer_count: int
    total_bytes: int
    total_features: int
    layers: list[LayerValidation]
    errors: list[str]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def find_latest_bundle(bundles_dir: Path = BUNDLES_DIR) -> Path:
    if not bundles_dir.exists():
        raise FileNotFoundError(f"Bundle directory does not exist: {bundles_dir}")

    bundles = sorted(
        [path for path in bundles_dir.iterdir() if path.is_dir()],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not bundles:
        raise FileNotFoundError(f"No bundle directories found in {bundles_dir}")

    return bundles[0]


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def manifest_layer_entries(manifest: dict[str, Any], bundle_path: Path) -> list[dict[str, Any]]:
    """Return flexible layer entries from a bundle manifest.

    The packaging format may evolve. This function accepts either:
    - {"layers": [{"name": ..., "path": ...}, ...]}
    - {"layers": {"roads": {"path": ...}, ...}}
    - no usable layer section, in which case it falls back to layers/*.json.
    """

    layers_value = manifest.get("layers")
    entries: list[dict[str, Any]] = []

    if isinstance(layers_value, list):
        for item in layers_value:
            if isinstance(item, dict):
                entries.append(dict(item))
            elif isinstance(item, str):
                entries.append({"name": Path(item).stem, "path": item})

    elif isinstance(layers_value, dict):
        for name, item in layers_value.items():
            if isinstance(item, dict):
                entry = dict(item)
                entry.setdefault("name", str(name))
                entries.append(entry)
            elif isinstance(item, str):
                entries.append({"name": str(name), "path": item})

    if entries:
        return entries

    layer_dir = bundle_path / "layers"
    if layer_dir.exists():
        for layer_file in sorted(layer_dir.glob("*.json")):
            entries.append(
                {
                    "name": layer_file.stem,
                    "path": str(layer_file.relative_to(bundle_path)),
                }
            )

    return entries


def expected_int(entry: dict[str, Any], keys: tuple[str, ...]) -> int | None:
    for key in keys:
        value = entry.get(key)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
    return None


def resolve_layer_path(bundle_path: Path, entry: dict[str, Any]) -> Path:
    raw_path = (
        entry.get("path")
        or entry.get("file")
        or entry.get("filename")
        or entry.get("relative_path")
        or f"layers/{entry.get('name', '')}.json"
    )
    path = Path(str(raw_path))
    if path.is_absolute():
        return path
    return bundle_path / path


def iter_feature_items_from_geojson(path: Path):
    """Yield features from a FeatureCollection without json.load.

    This uses a small state machine over json.JSONDecoder.raw_decode. It is not a
    full streaming JSON parser, but it avoids keeping every feature in memory.
    """

    decoder = json.JSONDecoder()
    buffer = ""
    in_features = False

    with path.open("r", encoding="utf-8") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk and not buffer:
                break
            buffer += chunk

            if not in_features:
                marker = '"features"'
                index = buffer.find(marker)
                if index == -1:
                    if not chunk:
                        break
                    buffer = buffer[-len(marker):]
                    continue

                bracket = buffer.find("[", index)
                if bracket == -1:
                    if not chunk:
                        break
                    buffer = buffer[index:]
                    continue

                buffer = buffer[bracket + 1 :]
                in_features = True

            while in_features:
                stripped = buffer.lstrip()
                if stripped != buffer:
                    buffer = stripped

                if not buffer:
                    break

                if buffer[0] == "]":
                    return

                if buffer[0] == ",":
                    buffer = buffer[1:]
                    continue

                try:
                    obj, end = decoder.raw_decode(buffer)
                except json.JSONDecodeError:
                    if not chunk:
                        raise
                    break

                yield obj
                buffer = buffer[end:]

            if not chunk:
                break


def inspect_layer(path: Path) -> tuple[int, dict[str, int], list[str]]:
    errors: list[str] = []
    geometry_types: Counter[str] = Counter()
    feature_count = 0

    try:
        for feature in iter_feature_items_from_geojson(path):
            feature_count += 1
            if not isinstance(feature, dict):
                geometry_types["invalid_feature"] += 1
                continue
            geometry = feature.get("geometry")
            if not isinstance(geometry, dict):
                geometry_types["null"] += 1
                continue
            geometry_type = geometry.get("type")
            if not isinstance(geometry_type, str):
                geometry_types["unknown"] += 1
            else:
                geometry_types[geometry_type] += 1
    except Exception as exc:
        errors.append(str(exc))

    return feature_count, dict(geometry_types), errors


def validate_layer(bundle_path: Path, entry: dict[str, Any]) -> LayerValidation:
    name = str(entry.get("name") or Path(str(entry.get("path", "unknown"))).stem)
    layer_path = resolve_layer_path(bundle_path, entry)
    relative = str(layer_path.relative_to(bundle_path)) if layer_path.is_relative_to(bundle_path) else str(layer_path)

    expected_features = expected_int(
        entry,
        (
            "feature_count",
            "features",
            "count",
            "featureCount",
            "prepared_features",
        ),
    )
    expected_bytes = expected_int(
        entry,
        (
            "bytes",
            "size",
            "size_bytes",
            "byte_count",
            "byteCount",
        ),
    )

    errors: list[str] = []
    if not layer_path.exists():
        return LayerValidation(
            name=name,
            path=relative,
            exists=False,
            bytes=0,
            feature_count=None,
            geometry_types={},
            expected_features=expected_features,
            expected_bytes=expected_bytes,
            ok=False,
            errors=[f"Missing layer file: {relative}"],
        )

    file_bytes = layer_path.stat().st_size
    feature_count, geometry_types, inspect_errors = inspect_layer(layer_path)
    errors.extend(inspect_errors)

    if expected_features is not None and feature_count != expected_features:
        errors.append(f"Feature count mismatch: expected {expected_features}, found {feature_count}")

    if expected_bytes is not None and file_bytes != expected_bytes:
        errors.append(f"Byte count mismatch: expected {expected_bytes}, found {file_bytes}")

    if feature_count == 0:
        errors.append("Layer has zero features")

    return LayerValidation(
        name=name,
        path=relative,
        exists=True,
        bytes=file_bytes,
        feature_count=feature_count,
        geometry_types=geometry_types,
        expected_features=expected_features,
        expected_bytes=expected_bytes,
        ok=not errors,
        errors=errors,
    )


def validate_bundle(bundle_path: Path | None = None) -> BundleValidationResult:
    bundle_path = bundle_path or find_latest_bundle()
    bundle_path = bundle_path.resolve()

    errors: list[str] = []
    manifest_path = bundle_path / "bundle_manifest.json"
    readme_path = bundle_path / "README.txt"

    manifest_exists = manifest_path.exists()
    readme_exists = readme_path.exists()

    if not manifest_exists:
        errors.append("Missing bundle_manifest.json")
        manifest: dict[str, Any] = {}
    else:
        loaded = load_json(manifest_path)
        if isinstance(loaded, dict):
            manifest = loaded
        else:
            manifest = {}
            errors.append("bundle_manifest.json is not an object")

    entries = manifest_layer_entries(manifest, bundle_path)
    if not entries:
        errors.append("No layer entries found")

    layers = [validate_layer(bundle_path, entry) for entry in entries]
    for layer in layers:
        if not layer.ok:
            errors.append(f"Layer failed validation: {layer.name}")

    total_bytes = sum(layer.bytes for layer in layers)
    total_features = sum(layer.feature_count or 0 for layer in layers)

    ok = bool(manifest_exists and readme_exists and layers and not errors)

    return BundleValidationResult(
        status="ok" if ok else "error",
        ok=ok,
        bundle_path=str(bundle_path),
        bundle_name=bundle_path.name,
        checked_at=utc_now(),
        manifest_exists=manifest_exists,
        readme_exists=readme_exists,
        layer_count=len(layers),
        total_bytes=total_bytes,
        total_features=total_features,
        layers=layers,
        errors=errors,
    )


def write_report(result: BundleValidationResult, report_path: Path = DEFAULT_REPORT_PATH) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    payload = asdict(result)
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")


def print_result(result: BundleValidationResult) -> None:
    print("Kane-Map prepared bundle validation")
    print(f"Bundle: {result.bundle_path}")
    print(f"Status: {result.status}")
    print(f"Manifest: {'yes' if result.manifest_exists else 'no'}")
    print(f"README: {'yes' if result.readme_exists else 'no'}")
    print(f"Layers: {result.layer_count}")
    print(f"Total features: {result.total_features}")
    print(f"Total bytes: {result.total_bytes}")
    print()

    for layer in result.layers:
        state = "OK" if layer.ok else "ERROR"
        print(f"{state}: {layer.name}")
        print(f"  file:     {layer.path}")
        print(f"  exists:   {'yes' if layer.exists else 'no'}")
        print(f"  bytes:    {layer.bytes}")
        print(f"  features: {layer.feature_count}")
        print(f"  geometry: {layer.geometry_types}")
        if layer.errors:
            for error in layer.errors:
                print(f"  error:    {error}")
        print()

    if result.errors:
        print("Errors:")
        for error in result.errors:
            print(f"  - {error}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate a prepared Kane-Map bundle.")
    parser.add_argument(
        "--bundle",
        type=Path,
        default=None,
        help="Bundle directory to validate. Defaults to latest output/bundles directory.",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_REPORT_PATH,
        help="Report output path.",
    )
    args = parser.parse_args(argv)

    result = validate_bundle(args.bundle)
    write_report(result, args.report)
    print_result(result)
    print(f"Wrote {args.report}")

    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
