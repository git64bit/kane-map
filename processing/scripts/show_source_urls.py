#!/usr/bin/env python3
"""Show candidate source acquisition URLs without downloading anything."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.source_registry import load_source_registry  # noqa: E402
from kane_map_processing.source_urls import count_acquisition_modes, source_url_summaries  # noqa: E402


def main() -> int:
    registry = load_source_registry()
    summaries = source_url_summaries(registry)
    mode_counts = count_acquisition_modes(summaries)

    print("Kane-Map candidate source acquisition list")
    print(f"Sources: {len(summaries)}")
    if mode_counts:
        print("Acquisition modes:")
        for mode, count in sorted(mode_counts.items()):
            print(f"  {mode}: {count}")
    print()

    for summary in summaries:
        print(f"{summary.source_id} [{summary.layer}]")
        print(f"  label:       {summary.label}")
        print(f"  status:      {summary.status}")
        print(f"  mode:        {summary.acquisition_mode or 'unspecified'}")
        print(f"  format:      {summary.source_format or 'unspecified'}")
        print(f"  local path:  {summary.local_path}")
        print(f"  source URL:  {summary.source_url or '(not confirmed)'}")
        print(f"  source page: {summary.source_page or '(not confirmed)'}")
        if summary.candidate_query:
            print(f"  candidate:   {summary.candidate_query}")
        print()

    print("No files were downloaded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
