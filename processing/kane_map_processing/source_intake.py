"""Source-intake report helpers for Kane-Map processing."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import (
    INPUT_DIR,
    PROJECT_NAME,
    SOURCE_INTAKE_REPORT_PATH,
    SOURCE_REGISTRY_PATH,
)
from .manifest import sha256_file
from .source_registry import load_source_registry, resolve_local_source_path, validate_source_registry


def inspect_source(source: dict[str, Any], input_dir: Path = INPUT_DIR) -> dict[str, Any]:
    local_path = str(source.get("local_path", ""))
    path = resolve_local_source_path(local_path, input_dir)

    item: dict[str, Any] = {
        "source_id": source.get("source_id"),
        "label": source.get("label"),
        "layer": source.get("layer"),
        "status": source.get("status"),
        "required": bool(source.get("required", False)),
        "local_path": local_path,
        "exists": path.exists() and path.is_file(),
    }

    if item["exists"]:
        stat = path.stat()
        item.update(
            {
                "bytes": stat.st_size,
                "suffix": path.suffix.lower(),
                "sha256": sha256_file(path),
                "modified_at_utc": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
            }
        )
    else:
        item.update(
            {
                "bytes": 0,
                "suffix": Path(local_path).suffix.lower(),
                "sha256": None,
                "modified_at_utc": None,
            }
        )

    return item


def build_source_intake_report(
    registry_path: Path = SOURCE_REGISTRY_PATH,
    input_dir: Path = INPUT_DIR,
) -> dict[str, Any]:
    validation = validate_source_registry(registry_path, input_dir)
    registry = load_source_registry(registry_path)
    sources = registry.get("sources", [])
    inspected = [inspect_source(source, input_dir) for source in sources if isinstance(source, dict)]

    return {
        "project": PROJECT_NAME,
        "report_type": "source_intake",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "registry_path": registry_path.as_posix(),
        "input_dir": input_dir.as_posix(),
        "source_count": len(inspected),
        "present_source_count": sum(1 for item in inspected if item["exists"]),
        "missing_source_count": sum(1 for item in inspected if not item["exists"]),
        "validation_ok": validation.ok,
        "errors": validation.errors,
        "warnings": validation.warnings,
        "sources": inspected,
    }


def write_source_intake_report(
    report: dict[str, Any],
    path: Path = SOURCE_INTAKE_REPORT_PATH,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

