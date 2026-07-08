#!/usr/bin/env python3
"""Stage downloaded files into processing/input/raw when a safe rule exists.

Default mode is dry-run. Batch 030 only stages direct GeoJSON downloads.
ZIP/shapefile conversion is reported but not executed here.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.config import RAW_STAGING_REPORT_PATH
from kane_map_processing.raw_staging import (
    build_raw_stage_plan,
    stage_plan_item,
    write_raw_staging_report,
)
from kane_map_processing.source_registry import load_source_registry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Stage downloaded Kane-Map source files into raw/.")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually stage files when a safe direct-copy rule exists.",
    )
    parser.add_argument(
        "--source",
        action="append",
        default=[],
        help="Limit to one source_id. May be repeated.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing raw files when staging.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    registry = load_source_registry()
    selected = set(args.source)
    plan = build_raw_stage_plan(registry, selected_source_ids=selected)

    print("Kane-Map raw staging")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Sources in plan: {len(plan)}")
    print(f"Ready to stage: {sum(1 for item in plan if item.ready)}")
    print(f"Needs conversion: {sum(1 for item in plan if item.action == 'needs_conversion')}")
    print("")

    if selected:
        planned_ids = {item.source_id for item in plan}
        missing = selected - planned_ids
        for source_id in sorted(missing):
            print(f"Requested source not found: {source_id}")
        if missing:
            return 2

    for item in plan:
        marker = "READY" if item.ready else item.action.upper()
        print(f"{marker}: {item.source_id} [{item.layer}]")
        print(f"  action:   {item.action}")
        print(f"  reason:   {item.reason}")
        print(f"  source:   {item.download_path or '(none)'}")
        print(f"  raw path: {item.raw_path or '(none)'}")
        print("")

    results = []
    if args.execute:
        for item in plan:
            result = stage_plan_item(item, force=args.force)
            results.append(result)
            marker = "OK" if result.ok else "ERROR"
            print(f"{marker}: {result.source_id}: {result.action} - {result.message}")
            if result.path:
                print(f"  {result.path}")
            if result.bytes_written:
                print(f"  bytes: {result.bytes_written}")
    else:
        print("Dry run only. No files were staged into raw/.")
        print("Use --execute to copy safe direct GeoJSON sources into raw/.")

    write_raw_staging_report(plan, results, RAW_STAGING_REPORT_PATH)
    print(f"Wrote {RAW_STAGING_REPORT_PATH}")
    return 1 if any(not result.ok for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
