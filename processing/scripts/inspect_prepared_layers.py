#!/usr/bin/env python3
"""Inspect prepared Kane-Map output layers."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROCESSING_ROOT = Path(__file__).resolve().parents[1]
if str(PROCESSING_ROOT) not in sys.path:
    sys.path.insert(0, str(PROCESSING_ROOT))

from kane_map_processing.prepared_inspection import (
    PREPARED_LAYER_INSPECTION_REPORT_PATH,
    inspect_prepared_layers,
    write_prepared_layer_inspection_report,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect Kane-Map prepared layers")
    parser.add_argument(
        "--layer",
        action="append",
        default=[],
        help="inspect one layer name or file name; may be supplied more than once",
    )
    parser.add_argument(
        "--sample-limit",
        type=int,
        default=3,
        help="number of sample property objects to retain per layer; default: 3",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected = set(args.layer) if args.layer else None
    inspections = inspect_prepared_layers(selected_layers=selected, sample_limit=args.sample_limit)
    write_prepared_layer_inspection_report(inspections)

    ok = sum(1 for item in inspections if item.status == "ok")
    errors = sum(1 for item in inspections if item.status == "error")
    total_bytes = sum(item.bytes for item in inspections)
    total_features = sum(item.feature_count for item in inspections)

    print("Kane-Map prepared layer inspection")
    print(f"Files inspected: {len(inspections)}")
    print(f"OK: {ok}")
    print(f"Errors: {errors}")
    print(f"Total features: {total_features}")
    print(f"Total bytes: {total_bytes}")
    print()

    for item in inspections:
        status = item.status.upper()
        print(f"{status}: {item.layer_name}")
        print(f"  file:     {item.file_name}")
        print(f"  bytes:    {item.bytes}")
        print(f"  features: {item.feature_count}")
        if item.geometry_types:
            print(f"  geometry: {item.geometry_types}")
        if item.property_fields:
            fields = ", ".join(item.property_fields.keys())
            print(f"  fields:   {fields}")
        layer_meta = item.kane_map_layer
        if layer_meta:
            print(f"  layer meta: {layer_meta.get('layer', '')} v{layer_meta.get('version', '')}")
        if item.error:
            print(f"  error:    {item.error}")
        print()

    print(f"Wrote {PREPARED_LAYER_INSPECTION_REPORT_PATH}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
