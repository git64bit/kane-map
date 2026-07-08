#!/usr/bin/env python3
"""Check the local Python processing environment."""

from __future__ import annotations

import platform
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.config import INPUT_DIR, OUTPUT_DIR, PROCESSING_ROOT  # noqa: E402


def main() -> int:
    print("Kane-Map processing environment")
    print(f"Python: {sys.version.split()[0]}")
    print(f"Platform: {platform.platform()}")
    print(f"Processing root: {PROCESSING_ROOT}")
    print(f"Input dir: {INPUT_DIR}")
    print(f"Output dir: {OUTPUT_DIR}")

    if sys.version_info < (3, 11):
        print("ERROR: Python 3.11 or newer is recommended.")
        return 1

    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Environment check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
