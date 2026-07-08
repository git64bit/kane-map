# County Boundary Conversion

The county boundary source is downloaded as a Census TIGER/Line national county ZIP.

Batch 033 adds a converter that writes the Kane County boundary into the raw input folder.

## Command

```bash
python scripts/convert_county_boundary_zip.py
python scripts/convert_county_boundary_zip.py --execute
```

The first command is a dry run.

The second command writes:

```text
processing/input/raw/kane-county-boundary.geojson
```

## Filter

The converter keeps only the feature matching:

```text
STATEFP = 17
COUNTYFP = 089
```

## Report

The conversion report is written to:

```text
processing/output/reports/county_boundary_conversion_report.json
```
