# Batch 035 — Raw Source Inspection

Batch 035 adds inspection of staged raw source files.

## Added

```text
processing/scripts/inspect_raw_sources.py
processing/kane_map_processing/raw_inspection.py
docs/RAW_SOURCE_INSPECTION.md
docs/BATCH_035.md
```

## Purpose

Report the contents of staged raw GeoJSON files before normalization begins.

The inspection reports:

- present and missing raw files
- file size
- feature count
- geometry types
- property field names
- small property samples in the JSON report

## Scope

This batch does not modify source files, prepare browser data, simplify geometry, or change the browser app.
