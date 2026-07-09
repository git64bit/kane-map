#!/usr/bin/env python3
"""CLI wrapper for building-footprint chunking."""

from __future__ import annotations

import sys
from pathlib import Path

PROCESSING_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROCESSING_ROOT))

from kane_map_processing.building_chunking import main


if __name__ == "__main__":
    main()
