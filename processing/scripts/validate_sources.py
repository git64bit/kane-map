#!/usr/bin/env python3
"""Validate the Kane-Map source registry and local source files."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.config import INPUT_DIR, SOURCE_REGISTRY_PATH  # noqa: E402
from kane_map_processing.source_registry import validate_source_registry  # noqa: E402


def main() -> int:
    result = validate_source_registry(SOURCE_REGISTRY_PATH, INPUT_DIR)

    for warning in result.warnings:
        print(f"WARNING: {warning}")
    for error in result.errors:
        print(f"ERROR: {error}")

    if result.ok:
        print("Source registry validation passed.")
        return 0

    print("Source registry validation failed.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

