# Building Footprints Conversion

The building-footprint source is downloaded as a ZIP shapefile.

Batch 034 adds a converter that writes raw GeoJSON for the building-footprint layer.

## Input

```text
processing/input/downloads/kane-building-footprints.zip
```

## Output

```text
processing/input/raw/kane-building-footprints.geojson
```

## Command

Dry run:

```bash
python scripts/convert_building_footprints_zip.py
```

Execute:

```bash
python scripts/convert_building_footprints_zip.py --execute
```

## Notes

This is still raw source data.

Later batches will decide how to normalize, simplify, clip, grid-assign, and chunk the building data for browser use.
