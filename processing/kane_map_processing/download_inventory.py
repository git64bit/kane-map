"""Download inventory helpers for Kane-Map processing.

Downloaded files are original acquired source files. They are not raw staged
GeoJSON and they are not browser-ready prepared data.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import DOWNLOAD_DIR, DOWNLOAD_INVENTORY_REPORT_PATH, INPUT_DIR
from .source_download import build_download_plan


@dataclass(frozen=True)
class DownloadInventoryItem:
    source_id: str
    label: str
    layer: str
    expected_path: str
    exists: bool
    absolute_path: str
    bytes: int
    modified_at: str
    status: str


@dataclass(frozen=True)
class ExtraDownloadItem:
    relative_path: str
    absolute_path: str
    bytes: int
    modified_at: str


def _file_modified_at(path: Path) -> str:
    if not path.exists():
        return ""
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()


def _relative_download_files(download_dir: Path = DOWNLOAD_DIR) -> set[str]:
    if not download_dir.exists():
        return set()
    files: set[str] = set()
    for path in download_dir.rglob("*"):
        if not path.is_file() or path.name == "README.md":
            continue
        files.add(str(path.relative_to(INPUT_DIR)))
    return files


def build_download_inventory(registry: dict[str, Any]) -> tuple[list[DownloadInventoryItem], list[ExtraDownloadItem]]:
    plan = build_download_plan(registry)
    expected_paths = {item.output_path for item in plan if item.output_path}
    items: list[DownloadInventoryItem] = []

    for item in plan:
        expected_path = item.output_path
        path = INPUT_DIR / expected_path if expected_path else Path("")
        exists = bool(expected_path and path.exists() and path.is_file())
        size = path.stat().st_size if exists else 0
        status = "present" if exists else "missing"
        if not item.enabled:
            status = "skipped"
        items.append(
            DownloadInventoryItem(
                source_id=item.source_id,
                label=item.label,
                layer=item.layer,
                expected_path=expected_path,
                exists=exists,
                absolute_path=str(path) if expected_path else "",
                bytes=size,
                modified_at=_file_modified_at(path) if exists else "",
                status=status,
            )
        )

    extras: list[ExtraDownloadItem] = []
    for relative_path in sorted(_relative_download_files() - expected_paths):
        path = INPUT_DIR / relative_path
        extras.append(
            ExtraDownloadItem(
                relative_path=relative_path,
                absolute_path=str(path),
                bytes=path.stat().st_size,
                modified_at=_file_modified_at(path),
            )
        )

    return items, extras


def write_download_inventory_report(
    items: list[DownloadInventoryItem],
    extras: list[ExtraDownloadItem],
    report_path: Path = DOWNLOAD_INVENTORY_REPORT_PATH,
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "report_type": "download_inventory",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": [asdict(item) for item in items],
        "extra_files": [asdict(item) for item in extras],
        "counts": {
            "expected": len(items),
            "present": sum(1 for item in items if item.exists),
            "missing": sum(1 for item in items if not item.exists and item.status != "skipped"),
            "skipped": sum(1 for item in items if item.status == "skipped"),
            "extra_files": len(extras),
            "bytes": sum(item.bytes for item in items) + sum(item.bytes for item in extras),
        },
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
