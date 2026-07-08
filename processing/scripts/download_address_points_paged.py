#!/usr/bin/env python3
"""Download all Kane County address points from the ArcGIS FeatureServer using paging."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.arcgis_paged_download import PagedDownloadConfig, download_paged_geojson
from kane_map_processing.config import DOWNLOADS_DIR, REPORTS_DIR

ENDPOINT = "https://services1.arcgis.com/oRKmdBXD6EbdmVgJ/ArcGIS/rest/services/KaneCo_IL_AddressPoints/FeatureServer/0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download Kane address points using ArcGIS paging.")
    parser.add_argument("--execute", action="store_true", help="Actually download and write the GeoJSON file.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing downloaded address-points GeoJSON.")
    parser.add_argument("--page-size", type=int, default=2000, help="ArcGIS page size. Default: 2000.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config = PagedDownloadConfig(
        endpoint=ENDPOINT,
        output_path=DOWNLOADS_DIR / "kane-address-points.geojson",
        report_path=REPORTS_DIR / "address_points_paged_download_report.json",
        page_size=args.page_size,
    )

    print("Kane-Map address points paged downloader")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Endpoint: {ENDPOINT}")
    print(f"Output: {config.output_path}")

    try:
        report = download_paged_geojson(config, execute=args.execute, force=args.force)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    print(f"Expected features: {report['expected_count']}")
    print(f"Pages expected: {report['pages_expected']}")

    if args.execute:
        print(f"Features written: {report.get('features_written')}")
        print(f"Bytes written: {report.get('bytes_written')}")
        print(f"Count matches: {report.get('count_matches')}")
    else:
        print("Dry run only. Use --execute --force to replace the current limited download.")

    print(f"Wrote {config.report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
