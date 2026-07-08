#!/usr/bin/env python3
"""Create a source-intake report from configured local source files."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kane_map_processing.config import SOURCE_INTAKE_REPORT_PATH  # noqa: E402
from kane_map_processing.source_intake import build_source_intake_report, write_source_intake_report  # noqa: E402


def main() -> int:
    report = build_source_intake_report()
    write_source_intake_report(report, SOURCE_INTAKE_REPORT_PATH)

    print(f"Wrote {SOURCE_INTAKE_REPORT_PATH}")
    print(f"Sources: {report['source_count']}")
    print(f"Present: {report['present_source_count']}")
    print(f"Missing: {report['missing_source_count']}")

    for warning in report["warnings"]:
        print(f"WARNING: {warning}")
    for error in report["errors"]:
        print(f"ERROR: {error}")

    return 0 if report["validation_ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

