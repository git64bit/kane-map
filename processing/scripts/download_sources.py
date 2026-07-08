#!/usr/bin/env python3
"""Controlled source downloader for Kane-Map processing.

Default mode is dry-run. Use --execute to write files.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.config import INPUT_DIR, SOURCE_DOWNLOAD_REPORT_PATH
from kane_map_processing.source_download import (
    build_download_plan,
    download_plan_item,
    write_download_report,
)
from kane_map_processing.source_registry import load_source_registry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download approved Kane-Map source files.")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually download files. Without this, only print the plan.",
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
        help="Overwrite existing downloaded files.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=120,
        help="Download timeout in seconds per source. Default: 120.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    registry = load_source_registry()
    selected = set(args.source)
    plan = build_download_plan(registry, selected_source_ids=selected)

    print("Kane-Map controlled source downloader")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Sources in plan: {len(plan)}")
    print(f"Enabled: {sum(1 for item in plan if item.enabled)}")
    print("")

    if selected:
        planned_ids = {item.source_id for item in plan}
        missing = selected - planned_ids
        for source_id in sorted(missing):
            print(f"Requested source not found: {source_id}")
        if missing:
            return 2

    for item in plan:
        status = "READY" if item.enabled else "SKIP"
        print(f"{status}: {item.source_id} [{item.layer}]")
        print(f"  reason: {item.reason}")
        print(f"  url:    {item.url or '(none)'}")
        print(f"  output: {item.output_path or '(none)'}")
        print("")

    results = []
    if args.execute:
        for item in plan:
            result = download_plan_item(item, INPUT_DIR, force=args.force, timeout=args.timeout)
            results.append(result)
            marker = "OK" if result.ok else "ERROR"
            print(f"{marker}: {result.source_id}: {result.action} - {result.message}")
            if result.path:
                print(f"  {result.path}")
            if result.bytes_written:
                print(f"  bytes: {result.bytes_written}")
    else:
        print("Dry run only. No files were downloaded.")
        print("Use --execute to download enabled sources.")

    write_download_report(plan, results, SOURCE_DOWNLOAD_REPORT_PATH)
    print(f"Wrote {SOURCE_DOWNLOAD_REPORT_PATH}")

    return 1 if any(not result.ok for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
