#!/usr/bin/env python3
"""Download Kane County address points from ArcGIS in pages.

This script is retained for reproducibility. The current recommended workflow may use
curl page files plus scripts/merge_address_pages.py when memory is limited.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone

from kane_map_processing.arcgis_paged_download import (
    ADDRESS_POINTS_ENDPOINT,
    get_feature_count,
    download_feature_pages,
)
from kane_map_processing.config import DOWNLOAD_DIR, REPORTS_DIR

OUTPUT_PATH = DOWNLOAD_DIR / "kane-address-points.geojson"
REPORT_PATH = REPORTS_DIR / "address_points_paged_download_report.json"


def write_report(report: dict) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, sort_keys=True)
        handle.write("\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Download all Kane County address points from ArcGIS.")
    parser.add_argument("--execute", action="store_true", help="Actually download the combined file.")
    parser.add_argument("--force", action="store_true", help="Replace existing output file.")
    parser.add_argument("--page-size", type=int, default=2000, help="ArcGIS resultRecordCount value.")
    args = parser.parse_args()

    count = get_feature_count(ADDRESS_POINTS_ENDPOINT)
    pages = (count + args.page_size - 1) // args.page_size

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "execute" if args.execute else "dry_run",
        "endpoint": ADDRESS_POINTS_ENDPOINT,
        "output_path": str(OUTPUT_PATH),
        "expected_features": count,
        "page_size": args.page_size,
        "pages_expected": pages,
        "result": None,
    }

    print("Kane-Map address points paged downloader")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Endpoint: {ADDRESS_POINTS_ENDPOINT}")
    print(f"Output: {OUTPUT_PATH}")
    print(f"Expected features: {count}")
    print(f"Pages expected: {pages}")

    if not args.execute:
        print("Dry run only. Use --execute --force to replace the current limited download.")
        write_report(report)
        print(f"Wrote {REPORT_PATH}")
        return 0

    if OUTPUT_PATH.exists() and not args.force:
        report["result"] = {"status": "blocked", "reason": "output exists; use --force"}
        write_report(report)
        print("Blocked: output exists. Use --force to replace it.")
        print(f"Wrote {REPORT_PATH}")
        return 1

    result = download_feature_pages(
        endpoint=ADDRESS_POINTS_ENDPOINT,
        output_path=OUTPUT_PATH,
        page_size=args.page_size,
        expected_count=count,
    )
    report["result"] = result
    write_report(report)

    print("OK: downloaded address points")
    print(f"Features: {result.get('features')}")
    print(f"Bytes: {OUTPUT_PATH.stat().st_size}")
    print(f"Wrote {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
