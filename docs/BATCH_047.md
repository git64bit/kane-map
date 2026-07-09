# Batch 047 — Prepared Bundle Validation

Batch 047 adds a validator for packaged prepared-data bundles.

## Added files

```text
processing/kane_map_processing/bundle_validation.py
processing/scripts/validate_prepared_bundle.py
docs/BUNDLE_VALIDATION.md
docs/BATCH_047.md
```

## Purpose

The validator checks the packaged bundle produced by Batch 046 before that bundle is copied into browser-loadable data paths.

## Expected command

From `processing/`:

```bash
PYTHONPATH=. python scripts/validate_prepared_bundle.py
```

## Expected result

The validator should report:

- manifest present
- README present
- 5 layer files
- address points as Point geometry
- buildings and water as Polygon geometry
- roads as LineString geometry
- county boundary as Polygon geometry

It writes:

```text
processing/output/reports/bundle_validation_report.json
```
