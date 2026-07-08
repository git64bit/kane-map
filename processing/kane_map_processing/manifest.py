"""Manifest helpers for prepared Kane-Map static data."""

from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import (
    IGNORED_NAMES,
    MANIFEST_VERSION,
    OUTPUT_DIR,
    PROJECT_NAME,
    SUPPORTED_DATA_EXTENSIONS,
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def count_json_records(path: Path) -> int | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None

    if isinstance(data, list):
        return len(data)
    if isinstance(data, dict):
        for key in ("features", "records", "items", "buildings"):
            value = data.get(key)
            if isinstance(value, list):
                return len(value)
        return len(data)
    return None


def count_csv_records(path: Path) -> int | None:
    try:
        with path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.reader(handle)
            rows = list(reader)
    except UnicodeDecodeError:
        return None

    if not rows:
        return 0
    return max(0, len(rows) - 1)


def estimate_record_count(path: Path) -> int | None:
    suffix = path.suffix.lower()
    if suffix in {".json", ".geojson", ".js"}:
        if suffix == ".js":
            return None
        return count_json_records(path)
    if suffix == ".csv":
        return count_csv_records(path)
    return None


def iter_prepared_files(output_dir: Path = OUTPUT_DIR) -> list[Path]:
    if not output_dir.exists():
        return []

    files: list[Path] = []
    for path in output_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.name in IGNORED_NAMES:
            continue
        if path.suffix.lower() not in SUPPORTED_DATA_EXTENSIONS:
            continue
        files.append(path)
    return sorted(files)


def build_manifest(output_dir: Path = OUTPUT_DIR) -> dict[str, Any]:
    files = []
    for path in iter_prepared_files(output_dir):
        rel_path = path.relative_to(output_dir).as_posix()
        stat = path.stat()
        files.append(
            {
                "path": rel_path,
                "bytes": stat.st_size,
                "sha256": sha256_file(path),
                "record_count": estimate_record_count(path),
            }
        )

    return {
        "project": PROJECT_NAME,
        "manifest_version": MANIFEST_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "output_dir": output_dir.as_posix(),
        "file_count": len(files),
        "total_bytes": sum(item["bytes"] for item in files),
        "files": files,
    }


def write_manifest(path: Path, manifest: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
