# Batch 031 — Roads ZIP Conversion

## Purpose

Add the first controlled ZIP/shapefile conversion step for the Kane-Map processing pipeline.

## Added

```text
processing/scripts/convert_roads_zip.py
processing/kane_map_processing/shapefile_conversion.py
docs/ROADS_CONVERSION.md
docs/BATCH_031.md
```

## Updated

```text
processing/requirements.txt
processing/README.md
```

## Behavior

The new script converts:

```text
processing/input/downloads/kane-road-centerlines.zip
```

into:

```text
processing/input/raw/kane-road-centerlines.geojson
```

The script is dry-run by default.

## Dependency

Batch 031 adds:

```text
pyshp>=2.3,<3
```

Install it from the processing venv with:

```bash
pip install -r requirements.txt
```

## Not included

This batch does not convert:

- county boundary
- building footprints
- water polygons
- forest polygons

Those remain later one-source conversion steps.
