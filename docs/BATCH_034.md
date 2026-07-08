# Batch 034 — Building Footprint Conversion

Batch 034 adds one processing step for the downloaded Kane County building-footprint ZIP.

## Added

```text
processing/scripts/convert_building_footprints_zip.py
```

## Updated

```text
processing/kane_map_processing/shapefile_conversion.py
```

## Purpose

Convert:

```text
processing/input/downloads/kane-building-footprints.zip
```

into:

```text
processing/input/raw/kane-building-footprints.geojson
```

## Scope

This batch does not normalize, simplify, clip, grid-assign, or prepare browser chunks.

It only converts the downloaded ZIP shapefile into raw GeoJSON.

## Node sequence

```bash
git -C ~/kane-map pull
python scripts/convert_building_footprints_zip.py
python scripts/convert_building_footprints_zip.py --execute
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```
