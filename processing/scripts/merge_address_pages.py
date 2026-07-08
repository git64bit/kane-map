#!/usr/bin/env python3
"""Merge downloaded address-point page files into raw/kane-address-points.geojson."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

from kane_map_processing.address_page_merge import (
    DEFAULT_EXPECTED_FEATURES,
    make_merge_plan,
    inspect_pages,
    merge_pages,
    write_report,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Merge paged Kane County address-point GeoJSON files.")
    parser.add_argument("--execute", action="store_true", help="Actually write the merged raw GeoJSON file.")
    parser.add_argument("--force", action="store_true", help="Replace an existing raw address-points file.")
    parser.add_argument(
        "--expected",
        type=int,
        default=DEFAULT_EXPECTED_FEATURES,
        help="Expected total feature count. Use 0 to disable this check.",
    )
    args = parser.parse_args()

    expected = None if args.expected == 0 else args.expected
    plan = make_merge_plan(expected_features=expected)
    inspection = inspect_pages(plan)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "execute" if args.execute else "dry_run",
        "force": args.force,
        "inspection": inspection,
        "result": None,
    }

    print("Kane-Map address pages merge")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Pages: {inspection['page_count']}")
    print(f"Features: {inspection['total_features']}")
    print(f"Expected: {inspection['expected_features']}")
    print(f"Expected OK: {inspection['expected_ok']}")
    print(f"Output: {plan.output_path}")
    print(f"Existing output: {'yes' if plan.existing_output else 'no'}")

    if inspection["errors"]:
        print("Errors found. No merge performed.")
        for error in inspection["errors"]:
            print(f"  {error}")
        write_report(report)
        return 1

    if not args.execute:
        print("Dry run only. Use --execute --force to replace the staged raw address-points file.")
        write_report(report)
        print(f"Wrote {plan.report_path}")
        return 0

    try:
        result = merge_pages(plan, force=args.force)
    except Exception as exc:  # noqa: BLE001 - command-line reporting
        report["result"] = {"status": "error", "message": str(exc)}
        write_report(report)
        print(f"ERROR: {exc}")
        print(f"Wrote {plan.report_path}")
        return 1

    report["result"] = {"status": "ok", **result}
    write_report(report)

    print("OK: merged address pages into raw GeoJSON")
    print(f"Features: {result['total_features']}")
    print(f"Bytes: {result['bytes']}")
    if result.get("backup_path"):
        print(f"Backup: {result['backup_path']}")
    print(f"Wrote {plan.report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
