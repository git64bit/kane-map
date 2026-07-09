#!/usr/bin/env python3
"""Command wrapper for prepared-data packaging."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.prepared_package import main

if __name__ == "__main__":
    raise SystemExit(main())
