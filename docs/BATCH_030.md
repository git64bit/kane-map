# Batch 030 — Download Inventory and Raw Staging Distinction

Batch 030 adds local-data hygiene around the processing pipeline.

## Added

```text
.gitignore
processing/scripts/list_downloads.py
processing/scripts/stage_downloads.py
processing/kane_map_processing/download_inventory.py
processing/kane_map_processing/raw_staging.py
docs/DOWNLOAD_INVENTORY.md
docs/RAW_STAGING.md
docs/BATCH_030.md
```

## Purpose

The project now distinguishes three local data states:

```text
input/downloads/  original acquired files
input/raw/        staged or converted working source files
output/prepared/  browser-ready Kane-Map files
```

## Behavior

`list_downloads.py` reports local downloaded files and writes a JSON inventory report.

`stage_downloads.py` is dry-run by default. It only copies direct GeoJSON downloads into `raw/` when run with `--execute`.

ZIP/shapefile conversion is not implemented in this batch.

## Git safety

The new `.gitignore` keeps downloaded source files, staged raw files, prepared output, and generated reports out of Git.

README placeholders remain trackable.

## No browser changes

This batch does not change the offline browser app, data adapter, record schema, rendering, exports, imports, or UI.
