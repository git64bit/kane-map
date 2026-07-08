#!/usr/bin/env python3
"""Prepare browser-ready building-footprint layer."""

from __future__ import annotations

import argparse

from kane_map_processing.prepared_buildings import (
    add_arguments,
    prepare_buildings,
    print_report,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare Kane-Map building footprint layer")
    add_arguments(parser)
    args = parser.parse_args()

    report = prepare_buildings(execute=args.execute, force=args.force)
    print_report(report)
    return 0 if report.status in {"dry_run", "prepared"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
