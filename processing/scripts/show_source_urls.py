#!/usr/bin/env python3
"""Print candidate source-acquisition URLs for Kane-Map processing."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kane_map_processing.source_registry import load_source_registry
from kane_map_processing.source_urls import count_acquisition_modes, source_url_summaries


def main() -> int:
    registry = load_source_registry()
    summaries = source_url_summaries(registry)
    mode_counts = count_acquisition_modes(summaries)

    print("Kane-Map candidate source acquisition list")
    print(f"Sources: {len(summaries)}")
    print("Acquisition modes:")
    for mode, count in sorted(mode_counts.items()):
        print(f"  {mode}: {count}")
    print("")

    for summary in summaries:
        print(f"{summary.source_id} [{summary.layer}]")
        print(f"  label:       {summary.label}")
        print(f"  status:      {summary.status}")
        print(f"  mode:        {summary.acquisition_mode}")
        print(f"  format:      {summary.source_format}")
        print(f"  local path:  {summary.local_path}")
        print(f"  source URL:  {summary.source_url or '(not confirmed)'}")
        print(f"  source page: {summary.source_page or '(not confirmed)'}")
        print(f"  candidate:   {summary.candidate_query or '(none)'}")
        print(f"  download:    {'enabled' if summary.download_enabled else 'disabled'}")
        print(f"  download URL:{'  ' + summary.download_url if summary.download_url else ' (none)'}")
        print(f"  download to: {summary.download_path or '(none)'}")
        print("")

    print("No files were downloaded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
