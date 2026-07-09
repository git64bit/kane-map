# Batch 046 — Prepared Data Packaging

Batch 046 adds a local packaging step for generated prepared layers.

It does not change the browser app.

## Added

```text
processing/kane_map_processing/prepared_package.py
processing/scripts/package_prepared_data.py
docs/PREPARED_DATA_PACKAGING.md
docs/BATCH_046.md
```

## Purpose

The prepared layer files can now be copied into a bundle structure for local browser testing and future app integration.

## Expected command sequence

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing
python scripts/package_prepared_data.py
python scripts/package_prepared_data.py --execute --bundle-name kane-map-prepared-local --zip
```

Generated bundle data remains local and should not be committed to GitHub.
