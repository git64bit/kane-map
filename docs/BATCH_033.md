# Batch 033 — County Boundary Conversion

Batch 033 adds one processing step for the Kane County boundary source.

## Added

```text
processing/scripts/convert_county_boundary_zip.py
```

## Updated

```text
processing/kane_map_processing/shapefile_conversion.py
processing/README.md
```

## Purpose

Convert the downloaded Census county ZIP into:

```text
processing/input/raw/kane-county-boundary.geojson
```

The converter filters the national county file to:

```text
STATEFP = 17
COUNTYFP = 089
```

## Expected result

The output should contain one Kane County boundary feature.
