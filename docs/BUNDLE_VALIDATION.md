# Prepared Bundle Validation

Batch 047 adds validation for a packaged prepared-data bundle.

The validator checks the latest bundle in:

```text
processing/output/bundles/
```

It expects a bundle layout like:

```text
bundle_manifest.json
README.txt
layers/
  county_boundary.json
  roads.json
  water.json
  buildings.json
  address_points.json
```

The validator confirms:

- the bundle folder exists
- `bundle_manifest.json` exists
- `README.txt` exists
- listed layer files exist
- layer feature counts can be read
- geometry types are detectable
- validation report is written

The validator is designed to avoid loading large layer files fully into memory.

## Command

From `processing/`:

```bash
PYTHONPATH=. python scripts/validate_prepared_bundle.py
```

Optional explicit bundle:

```bash
PYTHONPATH=. python scripts/validate_prepared_bundle.py \
  --bundle output/bundles/kane-map-prepared-YYYYMMDDTHHMMSSZ
```

## Report

The report is written to:

```text
processing/output/reports/bundle_validation_report.json
```
