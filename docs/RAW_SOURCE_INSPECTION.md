# Raw Source Inspection

Raw source inspection reads staged raw source files and writes a report.

## Command

From `processing/`:

```bash
python scripts/inspect_raw_sources.py
```

Inspect one source:

```bash
python scripts/inspect_raw_sources.py --source kane-building-footprints
```

## Report

The script writes:

```text
processing/output/reports/raw_source_inspection_report.json
```

## Notes

The inspection step is read-only.

It does not normalize, simplify, clip, or chunk geometry.
