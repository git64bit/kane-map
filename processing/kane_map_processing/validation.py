"""Validation helpers for prepared Kane-Map static data."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import MANIFEST_VERSION, OUTPUT_DIR, SUPPORTED_DATA_EXTENSIONS
from .manifest import sha256_file


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    errors: list[str]
    warnings: list[str]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_manifest_shape(manifest: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if manifest.get("manifest_version") != MANIFEST_VERSION:
        errors.append("manifest_version does not match expected version")

    files = manifest.get("files")
    if not isinstance(files, list):
        errors.append("manifest.files must be a list")
        return errors, warnings

    seen_paths: set[str] = set()
    for index, item in enumerate(files):
        if not isinstance(item, dict):
            errors.append(f"manifest.files[{index}] must be an object")
            continue

        path = item.get("path")
        if not isinstance(path, str) or not path:
            errors.append(f"manifest.files[{index}].path is missing")
            continue

        if path in seen_paths:
            errors.append(f"duplicate manifest file path: {path}")
        seen_paths.add(path)

        if ".." in Path(path).parts:
            errors.append(f"unsafe manifest path: {path}")

        if not isinstance(item.get("bytes"), int):
            errors.append(f"manifest entry {path} has invalid bytes value")

        sha = item.get("sha256")
        if not isinstance(sha, str) or len(sha) != 64:
            errors.append(f"manifest entry {path} has invalid sha256 value")

        if item.get("record_count") is None:
            warnings.append(f"manifest entry {path} has unknown record count")

    return errors, warnings


def validate_manifest_files(manifest: dict[str, Any], output_dir: Path = OUTPUT_DIR) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    for item in manifest.get("files", []):
        if not isinstance(item, dict):
            continue

        rel_path = item.get("path")
        if not isinstance(rel_path, str):
            continue

        path = output_dir / rel_path
        if path.suffix.lower() not in SUPPORTED_DATA_EXTENSIONS:
            warnings.append(f"unsupported extension listed in manifest: {rel_path}")

        if not path.exists():
            errors.append(f"missing prepared file: {rel_path}")
            continue

        actual_bytes = path.stat().st_size
        if actual_bytes != item.get("bytes"):
            errors.append(f"byte-size mismatch for {rel_path}")

        actual_sha = sha256_file(path)
        if actual_sha != item.get("sha256"):
            errors.append(f"sha256 mismatch for {rel_path}")

    return errors, warnings


def validate_manifest(path: Path, output_dir: Path = OUTPUT_DIR) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    if not path.exists():
        return ValidationResult(False, [f"manifest not found: {path}"], [])

    try:
        manifest = load_json(path)
    except json.JSONDecodeError as exc:
        return ValidationResult(False, [f"manifest is invalid JSON: {exc}"], [])

    if not isinstance(manifest, dict):
        return ValidationResult(False, ["manifest root must be an object"], [])

    shape_errors, shape_warnings = validate_manifest_shape(manifest)
    file_errors, file_warnings = validate_manifest_files(manifest, output_dir)
    errors.extend(shape_errors)
    errors.extend(file_errors)
    warnings.extend(shape_warnings)
    warnings.extend(file_warnings)

    return ValidationResult(not errors, errors, warnings)
