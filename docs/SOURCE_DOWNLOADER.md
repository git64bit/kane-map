# Source Downloader

Batch 029 adds a controlled source downloader for the processing node.

The downloader is intentionally conservative.

## Rules

- Dry-run by default.
- No files are downloaded unless `--execute` is supplied.
- Existing files are not overwritten unless `--force` is supplied.
- Deferred sources are skipped.
- Downloaded files are written under `processing/input/downloads/`.
- Downloaded files are source material, not production-ready Kane-Map data.

## Commands

From the processing directory:

```bash
python scripts/download_sources.py
```

Dry-run for one source:

```bash
python scripts/download_sources.py --source kane-address-points
```

Execute one source:

```bash
python scripts/download_sources.py --execute --source kane-address-points
```

Execute all enabled sources:

```bash
python scripts/download_sources.py --execute
```

Force overwrite:

```bash
python scripts/download_sources.py --execute --force --source kane-address-points
```

## Output

The script writes:

```text
processing/output/reports/source_download_report.json
```

The report records the download plan and any actions taken.

## Current status

Five sources are eligible for controlled scripted download:

- Kane County boundary ZIP from Census TIGER/Line county files
- Kane County address points GeoJSON from the public ArcGIS FeatureServer query
- Kane building footprints ZIP from Illinois Flood Maps
- Kane road centerlines ZIP from Census TIGER/Line roads
- Kane water polygons ZIP from Census TIGER/Line area water

The forest/wooded source remains deferred because a precise source has not been confirmed.

## Pipeline position

```text
source URL
  -> processing/input/downloads/
  -> processing/input/raw/        later conversion/normalization
  -> processing/output/prepared/  later browser-ready chunks
```

The browser app does not consume files from `downloads/` directly.
