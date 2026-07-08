# Batch 040 — Prepare Water Layer

Batch 040 adds the first prepared water-output step.

It reads:

```text
processing/input/raw/kane-water-polygons.geojson
```

and writes, when executed:

```text
processing/output/prepared/water.json
```

This batch does not change the browser app.

## Node commands

After pulling the batch:

```bash
PYTHONPATH=. python scripts/prepare_water_layer.py
PYTHONPATH=. python scripts/prepare_water_layer.py --execute
PYTHONPATH=. python scripts/build_manifest.py
PYTHONPATH=. python scripts/validate_prepared_data.py
```
