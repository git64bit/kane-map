#!/usr/bin/env python3
"""Validate the prepared-data manifest."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.config import MANIFEST_PATH, OUTPUT_DIR  # noqa: E402
from kane_map_processing.validation import validate_manifest  # noqa: E402


def main() -> int:
    result = validate_manifest(MANIFEST_PATH, OUTPUT_DIR)

    for warning in result.warnings:
        print(f"WARNING: {warning}")
    for error in result.errors:
        print(f"ERROR: {error}")

    if result.ok:
        print("Prepared-data validation passed.")
        return 0

    print("Prepared-data validation failed.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
