#!/usr/bin/env python3
"""Convert the Kane road-centerline ZIP shapefile into raw GeoJSON."""

from __future__ import annotations

import argparse

from kane_map_processing.shapefile_conversion import (
    ROADS_CONVERSION_REPORT_PATH,
    build_roads_conversion_plan,
    convert_roads_zip,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert Kane road-centerline ZIP into raw GeoJSON.")
    parser.add_argument("--execute", action="store_true", help="write raw/kane-road-centerlines.geojson")
    parser.add_argument("--force", action="store_true", help="overwrite an existing raw roads GeoJSON")
    args = parser.parse_args()

    plan = build_roads_conversion_plan()
    print("Kane-Map roads ZIP conversion")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Source: {plan.source_id} [{plan.layer}]")
    print(f"Action: {plan.action}")
    print(f"Reason: {plan.reason}")
    print(f"Download: {plan.download_path}")
    print(f"Raw path: {plan.raw_path}")

    result = convert_roads_zip(execute=args.execute, force=args.force)

    if result.ok:
        print(f"OK: {result.source_id}: {result.action} - {result.message}")
        if "feature_count" in result.report:
            print(f"Features: {result.report['feature_count']}")
            print(f"Bytes: {result.report['output_bytes']}")
    else:
        print(f"SKIP: {result.source_id}: {result.action} - {result.message}")

    print(f"Wrote {ROADS_CONVERSION_REPORT_PATH}")
    if not args.execute and result.action == "dry_run":
        print("Dry run only. Use --execute to convert roads.")
    return 0 if result.ok or result.action.startswith("skip") else 1


if __name__ == "__main__":
    raise SystemExit(main())
