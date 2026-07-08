#!/usr/bin/env python3
"""Prepare the water layer for browser-ready Kane-Map output."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROCESSING_ROOT = Path(__file__).resolve().parents[1]
if str(PROCESSING_ROOT) not in sys.path:
    sys.path.insert(0, str(PROCESSING_ROOT))

from kane_map_processing.prepared_water import WATER_REPORT_PATH, prepare_water


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare Kane-Map water layer")
    parser.add_argument("--execute", action="store_true", help="write output/prepared/water.json")
    parser.add_argument("--force", action="store_true", help="replace existing prepared water output")
    parser.add_argument(
        "--precision",
        type=int,
        default=6,
        help="decimal places for prepared coordinates; default: 6",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = prepare_water(execute=args.execute, force=args.force, places=args.precision)

    print("Kane-Map water preparation")
    print(f"Mode: {report['mode']}")
    print(f"Status: {report['status']}")
    print(f"Message: {report['message']}")
    print(f"Raw: {report['raw_path']}")
    print(f"Output: {report['output_path']}")

    if report.get("raw_features") is not None:
        print(f"Raw features: {report['raw_features']}")
        print(f"Prepared features: {report['prepared_features']}")
        print(f"Skipped features: {report['skipped_features']}")

    if report.get("bytes_written") is not None:
        print(f"Bytes written: {report['bytes_written']}")

    print(f"Wrote {WATER_REPORT_PATH}")

    if report["status"] in {"error", "blocked"}:
        return 1
    if not args.execute:
        print("Dry run only. Use --execute to write prepared water.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
