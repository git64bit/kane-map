#!/usr/bin/env python3
"""Inspect staged raw Kane-Map source files."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.raw_inspection import (  # noqa: E402
    RAW_SOURCE_INSPECTION_REPORT_PATH,
    inspect_raw_sources,
    write_raw_source_inspection_report,
)
from kane_map_processing.source_registry import load_source_registry  # noqa: E402


def format_bytes(value: int) -> str:
    if value < 1024:
        return f"{value} B"
    size = float(value)
    for unit in ["KiB", "MiB", "GiB"]:
        size /= 1024.0
        if size < 1024.0:
            return f"{size:.2f} {unit}"
    return f"{size:.2f} TiB"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect staged Kane-Map raw source files.")
    parser.add_argument("--source", action="append", default=[], help="Limit to one source_id. May be repeated.")
    parser.add_argument("--sample-limit", type=int, default=3, help="Sample property objects per source.")
    parser.add_argument("--field-limit", type=int, default=18, help="Property fields to print per source.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    registry = load_source_registry()
    selected = set(args.source)
    inspections = inspect_raw_sources(registry, selected_source_ids=selected, sample_limit=args.sample_limit)

    print("Kane-Map raw source inspection")
    print(f"Sources inspected: {len(inspections)}")
    print(f"Present: {sum(1 for item in inspections if item.exists)}")
    print(f"OK: {sum(1 for item in inspections if item.status == 'ok')}")
    print(f"Missing: {sum(1 for item in inspections if item.status == 'missing')}")
    print(f"Errors: {sum(1 for item in inspections if item.status == 'error')}")
    print("")

    for item in inspections:
        print(f"{item.status.upper()}: {item.source_id} [{item.layer}]")
        print(f"  file:     {item.local_path}")
        if item.exists:
            print(f"  bytes:    {item.bytes} ({format_bytes(item.bytes)})")
        if item.status == "ok":
            print(f"  features: {item.feature_count}")
            print(f"  geometry: {item.geometry_types}")
            fields = list(item.property_fields.keys())[: args.field_limit]
            print(f"  fields:   {', '.join(fields) if fields else '(none)'}")
        if item.error:
            print(f"  error:    {item.error}")
        print("")

    write_raw_source_inspection_report(inspections)
    print(f"Wrote {RAW_SOURCE_INSPECTION_REPORT_PATH}")
    return 1 if any(item.status == "error" for item in inspections) else 0


if __name__ == "__main__":
    raise SystemExit(main())
