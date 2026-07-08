# Batch 032 — Water ZIP Conversion

## Purpose

Convert the downloaded water-polygons ZIP source into a working raw GeoJSON file.

## Added

```text
processing/scripts/convert_water_zip.py
```

## Updated

```text
processing/kane_map_processing/shapefile_conversion.py
processing/scripts/convert_roads_zip.py
```

`convert_roads_zip.py` now sets its import path internally, so it no longer needs `PYTHONPATH=.`.

## Node commands

After pulling the batch:

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing
python scripts/convert_water_zip.py
python scripts/convert_water_zip.py --execute
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

## Expected result

`intake_sources.py` should move from:

```text
Present: 2
Missing: 4
```

to:

```text
Present: 3
Missing: 3
```

assuming address points and roads are already staged.

## No browser changes

This batch does not change the offline browser app, UI, storage, record schema, exports, or renderer.
