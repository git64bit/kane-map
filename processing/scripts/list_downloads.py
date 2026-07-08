#!/usr/bin/env python3
"""List downloaded Kane-Map source files and write an inventory report."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.config import DOWNLOAD_INVENTORY_REPORT_PATH
from kane_map_processing.download_inventory import (
    build_download_inventory,
    write_download_inventory_report,
)
from kane_map_processing.source_registry import load_source_registry


def format_bytes(value: int) -> str:
    if value < 1024:
        return f"{value} B"
    units = ["KiB", "MiB", "GiB"]
    size = float(value)
    for unit in units:
        size /= 1024.0
        if size < 1024.0:
            return f"{size:.2f} {unit}"
    return f"{size:.2f} TiB"


def main() -> int:
    registry = load_source_registry()
    items, extras = build_download_inventory(registry)

    print("Kane-Map download inventory")
    print(f"Expected downloads: {len(items)}")
    print(f"Present: {sum(1 for item in items if item.exists)}")
    print(f"Missing: {sum(1 for item in items if not item.exists and item.status != 'skipped')}")
    print(f"Skipped/deferred: {sum(1 for item in items if item.status == 'skipped')}")
    print("")

    for item in items:
        marker = "PRESENT" if item.exists else item.status.upper()
        print(f"{marker}: {item.source_id} [{item.layer}]")
        print(f"  expected: {item.expected_path or '(none)'}")
        if item.exists:
            print(f"  path:     {item.absolute_path}")
            print(f"  bytes:    {item.bytes} ({format_bytes(item.bytes)})")
            print(f"  modified: {item.modified_at}")
        print("")

    if extras:
        print("Unregistered files in downloads/:")
        for extra in extras:
            print(f"  {extra.relative_path} ({format_bytes(extra.bytes)})")
        print("")

    write_download_inventory_report(items, extras, DOWNLOAD_INVENTORY_REPORT_PATH)
    print(f"Wrote {DOWNLOAD_INVENTORY_REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
