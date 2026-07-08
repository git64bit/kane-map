#!/usr/bin/env python3
"""Convert the Kane water-polygons ZIP shapefile into raw GeoJSON."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.shapefile_conversion import (
    WATER_CONVERSION_REPORT_PATH,
    build_water_conversion_plan,
    convert_water_zip,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert Kane water-polygons ZIP into raw GeoJSON.")
    parser.add_argument("--execute", action="store_true", help="write raw/kane-water-polygons.geojson")
    parser.add_argument("--force", action="store_true", help="overwrite an existing raw water GeoJSON")
    args = parser.parse_args()

    plan = build_water_conversion_plan()
    print("Kane-Map water ZIP conversion")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Source: {plan.source_id} [{plan.layer}]")
    print(f"Action: {plan.action}")
    print(f"Reason: {plan.reason}")
    print(f"Download: {plan.download_path}")
    print(f"Raw path: {plan.raw_path}")

    result = convert_water_zip(execute=args.execute, force=args.force)

    if result.ok:
        print(f"OK: {result.source_id}: {result.action} - {result.message}")
        if "feature_count" in result.report:
            print(f"Features: {result.report['feature_count']}")
            print(f"Bytes: {result.report['output_bytes']}")
            if result.report.get("shapefile_name"):
                print(f"Shapefile: {result.report['shapefile_name']}")
    else:
        print(f"SKIP: {result.source_id}: {result.action} - {result.message}")

    print(f"Wrote {WATER_CONVERSION_REPORT_PATH}")
    if not args.execute and result.action == "dry_run":
        print("Dry run only. Use --execute to convert water.")
    return 0 if result.ok or result.action.startswith("skip") else 1


if __name__ == "__main__":
    raise SystemExit(main())
