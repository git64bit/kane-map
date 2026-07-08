# Prepare Water Layer

The water preparation step converts staged raw water polygons into a smaller browser-ready layer.

Input:

```text
processing/input/raw/kane-water-polygons.geojson
```

Output:

```text
processing/output/prepared/water.json
```

Report:

```text
processing/output/reports/water_preparation_report.json
```

The prepared layer keeps only the fields currently needed by Kane-Map:

```text
id
name
mtfcc
source_index
```

Coordinates are rounded to six decimal places by default.

The script supports dry-run and execute modes:

```bash
PYTHONPATH=. python scripts/prepare_water_layer.py
PYTHONPATH=. python scripts/prepare_water_layer.py --execute
```

Use `--force` only if replacing an existing prepared water output.
