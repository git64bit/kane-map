"""Source-registry helpers for Kane-Map processing."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import (
    INPUT_DIR,
    PROJECT_NAME,
    SOURCE_REGISTRY_PATH,
    SOURCE_REGISTRY_VERSION,
    SUPPORTED_RAW_EXTENSIONS,
)


@dataclass(frozen=True)
class SourceValidationResult:
    ok: bool
    errors: list[str]
    warnings: list[str]


def load_source_registry(path: Path = SOURCE_REGISTRY_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def is_safe_relative_path(value: str) -> bool:
    path = Path(value)
    return not path.is_absolute() and ".." not in path.parts and value.strip() == value


def resolve_local_source_path(local_path: str, input_dir: Path = INPUT_DIR) -> Path:
    if not is_safe_relative_path(local_path):
        raise ValueError(f"unsafe source local_path: {local_path}")
    return input_dir / local_path


def validate_source_registry_shape(registry: dict[str, Any]) -> SourceValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    if registry.get("project") != PROJECT_NAME:
        errors.append("source registry project does not match kane-map")

    if registry.get("registry_version") != SOURCE_REGISTRY_VERSION:
        errors.append("source registry version does not match expected version")

    sources = registry.get("sources")
    if not isinstance(sources, list):
        errors.append("source registry must contain a sources list")
        return SourceValidationResult(False, errors, warnings)

    seen_ids: set[str] = set()
    seen_paths: set[str] = set()

    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"sources[{index}] must be an object")
            continue

        source_id = source.get("source_id")
        if not isinstance(source_id, str) or not source_id.strip():
            errors.append(f"sources[{index}].source_id is missing")
        elif source_id in seen_ids:
            errors.append(f"duplicate source_id: {source_id}")
        else:
            seen_ids.add(source_id)

        for field in ("label", "layer", "status", "local_path", "expected_format"):
            value = source.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"source {source_id or index} missing {field}")

        local_path = source.get("local_path")
        if isinstance(local_path, str):
            if not is_safe_relative_path(local_path):
                errors.append(f"source {source_id or index} has unsafe local_path: {local_path}")
            elif local_path in seen_paths:
                warnings.append(f"multiple sources refer to local_path: {local_path}")
            else:
                seen_paths.add(local_path)

            suffix = Path(local_path).suffix.lower()
            if suffix and suffix not in SUPPORTED_RAW_EXTENSIONS:
                warnings.append(f"source {source_id or index} has uncommon raw extension: {suffix}")

        required = source.get("required")
        if required is not None and not isinstance(required, bool):
            errors.append(f"source {source_id or index} required must be boolean")

    return SourceValidationResult(not errors, errors, warnings)


def validate_source_files(registry: dict[str, Any], input_dir: Path = INPUT_DIR) -> SourceValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        return SourceValidationResult(False, ["source registry sources must be a list"], [])

    for source in sources:
        if not isinstance(source, dict):
            continue

        source_id = source.get("source_id", "unknown")
        local_path = source.get("local_path")
        if not isinstance(local_path, str) or not local_path.strip():
            continue

        try:
            path = resolve_local_source_path(local_path, input_dir)
        except ValueError as exc:
            errors.append(str(exc))
            continue

        required = bool(source.get("required", False))
        status = str(source.get("status", "")).lower()

        if not path.exists():
            message = f"source file missing for {source_id}: {path}"
            if required:
                errors.append(message)
            elif status not in {"planned", "candidate", "deferred"}:
                warnings.append(message)
            continue

        if not path.is_file():
            errors.append(f"source path is not a file for {source_id}: {path}")
            continue

        if path.suffix.lower() not in SUPPORTED_RAW_EXTENSIONS:
            warnings.append(f"source file has unsupported extension for {source_id}: {path.name}")

    return SourceValidationResult(not errors, errors, warnings)


def validate_source_registry(path: Path = SOURCE_REGISTRY_PATH, input_dir: Path = INPUT_DIR) -> SourceValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    if not path.exists():
        return SourceValidationResult(False, [f"source registry not found: {path}"], [])

    try:
        registry = load_source_registry(path)
    except json.JSONDecodeError as exc:
        return SourceValidationResult(False, [f"source registry is invalid JSON: {exc}"], [])

    if not isinstance(registry, dict):
        return SourceValidationResult(False, ["source registry root must be an object"], [])

    shape = validate_source_registry_shape(registry)
    files = validate_source_files(registry, input_dir)

    errors.extend(shape.errors)
    errors.extend(files.errors)
    warnings.extend(shape.warnings)
    warnings.extend(files.warnings)

    return SourceValidationResult(not errors, errors, warnings)

