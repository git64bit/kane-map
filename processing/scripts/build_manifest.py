#!/usr/bin/env python3
"""Build a manifest for files in processing/output/prepared."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.config import MANIFEST_PATH, PREPARED_DIR  # noqa: E402
from kane_map_processing.manifest import build_manifest, write_manifest  # noqa: E402


def main() -> int:
    PREPARED_DIR.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest(PREPARED_DIR)
    write_manifest(MANIFEST_PATH, manifest)

    print(f"Wrote {MANIFEST_PATH}")
    print(f"Prepared dir: {PREPARED_DIR}")
    print(f"Files: {manifest['file_count']}")
    print(f"Bytes: {manifest['total_bytes']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

