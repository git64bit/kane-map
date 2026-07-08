#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow direct execution from processing/ without requiring PYTHONPATH.
SCRIPT_DIR = Path(__file__).resolve().parent
PROCESSING_ROOT = SCRIPT_DIR.parent
if str(PROCESSING_ROOT) not in sys.path:
    sys.path.insert(0, str(PROCESSING_ROOT))

from kane_map_processing.prepared_addresses import prepare_address_points_layer


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare Kane-Map address-points layer")
    parser.add_argument("--execute", action="store_true", help="write prepared address_points.json")
    parser.add_argument("--force", action="store_true", help="overwrite existing prepared address_points.json")
    parser.add_argument("--limit", type=int, default=None, help="process only N features for testing")
    args = parser.parse_args()

    report = prepare_address_points_layer(
        execute=args.execute,
        force=args.force,
        limit=args.limit,
    )

    print("Kane-Map address points preparation")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Status: {report['status']}")
    print(f"Message: {report['message']}")
    print(f"Raw: {report['raw_path']}")
    print(f"Output: {report['output_path']}")
    print(f"Raw features scanned: {report['raw_features_scanned']}")
    print(f"Prepared features: {report['prepared_features']}")
    print(f"Skipped features: {report['skipped_features']}")
    if report.get("bytes_written") is not None:
        print(f"Bytes written: {report['bytes_written']}")
    if report.get("limit") is not None:
        print(f"Limit: {report['limit']}")
    print(f"Wrote {report['report_path']}")

    if not args.execute:
        print("Dry run only. Use --execute to write prepared address points.")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
