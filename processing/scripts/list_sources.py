#!/usr/bin/env python3
"""List configured Kane-Map source files."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.config import INPUT_DIR, SOURCE_REGISTRY_PATH  # noqa: E402
from kane_map_processing.source_registry import load_source_registry, resolve_local_source_path  # noqa: E402


def main() -> int:
    if not SOURCE_REGISTRY_PATH.exists():
        print(f"Source registry not found: {SOURCE_REGISTRY_PATH}")
        return 1

    registry = load_source_registry(SOURCE_REGISTRY_PATH)
    sources = registry.get("sources", [])

    print(f"Source registry: {SOURCE_REGISTRY_PATH}")
    print(f"Sources: {len(sources)}")
    print()

    for source in sources:
        if not isinstance(source, dict):
            continue
        local_path = str(source.get("local_path", ""))
        path = resolve_local_source_path(local_path, INPUT_DIR)
        exists = "yes" if path.exists() and path.is_file() else "no"
        print(f"{source.get('source_id')} [{source.get('layer')}]")
        print(f"  label:  {source.get('label')}")
        print(f"  status: {source.get('status')}")
        print(f"  file:   {local_path}")
        print(f"  exists: {exists}")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

