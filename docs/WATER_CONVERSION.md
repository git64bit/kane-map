# Water ZIP Conversion

Batch 032 adds one processing step: convert the downloaded Kane County TIGER/Line area-water ZIP into working raw GeoJSON.

Input:

```text
processing/input/downloads/kane-water-polygons.zip
```

Output:

```text
processing/input/raw/kane-water-polygons.geojson
```

Report:

```text
processing/output/reports/water_conversion_report.json
```

The script is dry-run by default.

```bash
python scripts/convert_water_zip.py
```

Execute conversion:

```bash
python scripts/convert_water_zip.py --execute
```

Overwrite an existing raw water file:

```bash
python scripts/convert_water_zip.py --execute --force
```

This batch does not generate browser-ready prepared data. It only creates the raw source GeoJSON used by later normalization and chunk-generation steps.
