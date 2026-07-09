# Batch 044 — Prepared Layer Inspection

Batch 044 adds inspection for browser-ready prepared output files.

It does not change browser code, source acquisition, raw source conversion, or prepared layer generation.

## Added

```text
processing/kane_map_processing/prepared_inspection.py
processing/scripts/inspect_prepared_layers.py
docs/PREPARED_LAYER_INSPECTION.md
docs/BATCH_044.md
```

## Purpose

Prepared files can become large enough that full-file loading is not appropriate on a 1GB processing node.

This batch inspects prepared GeoJSON-style output by streaming the `features` array.

## Expected use

```bash
PYTHONPATH=. python scripts/inspect_prepared_layers.py
```

Optional single-layer inspection:

```bash
PYTHONPATH=. python scripts/inspect_prepared_layers.py --layer buildings
```

## Output report

```text
processing/output/reports/prepared_layer_inspection_report.json
```
