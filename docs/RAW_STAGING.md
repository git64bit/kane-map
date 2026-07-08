# Raw Staging

Raw staging is the boundary between acquired source files and working source files.

Kane-Map keeps this distinction explicit:

```text
downloads/  acquired originals
raw/        staged or converted inputs
prepared/   browser-ready output
```

## Command

From `processing/`:

```bash
python scripts/stage_downloads.py
```

Default mode is dry-run. No files are copied.

To stage sources that have a safe direct-copy rule:

```bash
python scripts/stage_downloads.py --execute
```

To stage one source:

```bash
python scripts/stage_downloads.py --execute --source kane-address-points
```

## Batch 030 staging rules

Batch 030 only stages direct GeoJSON downloads into `raw/`.

This means:

```text
kane-address-points.geojson  download GeoJSON -> raw GeoJSON
```

ZIP files are not converted in this batch. They are reported as requiring later extraction/conversion.

Examples requiring later conversion:

```text
kane-county-boundary.zip
kane-building-footprints.zip
kane-road-centerlines.zip
kane-water-polygons.zip
```

## Report

The staging script writes:

```text
processing/output/reports/raw_staging_report.json
```

## Why this is separate

The project should not treat a downloaded ZIP file as ready browser data.

The processing pipeline must preserve provenance:

```text
source URL -> downloaded original -> raw staged/converted file -> prepared Kane-Map chunk
```
