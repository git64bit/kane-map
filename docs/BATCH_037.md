# Batch 037 — Merge Address Point Pages

## Purpose

Merge the 110 manually downloaded ArcGIS address-point page files into one raw GeoJSON source file.

## Added

```text
processing/scripts/merge_address_pages.py
processing/kane_map_processing/address_page_merge.py
docs/ADDRESS_PAGES_MERGE.md
docs/BATCH_037.md
```

## Updated

```text
processing/scripts/download_address_points_paged.py
```

The update fixes the config import name from `DOWNLOADS_DIR` to `DOWNLOAD_DIR`.

## Behavior

- Dry run by default.
- Requires `--execute` to write output.
- Requires `--force` to replace the existing staged raw address-points file.
- Writes a backup before replacement.
- Writes `output/reports/address_pages_merge_report.json`.

## Expected result

```text
110 pages
219626 features
```
