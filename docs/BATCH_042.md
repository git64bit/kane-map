# Batch 042 — Prepare building footprints layer

This batch adds the first prepared building-footprints output step.

It reads:

```text
processing/input/raw/kane-building-footprints.geojson
```

and writes:

```text
processing/output/prepared/buildings.json
```

The conversion is designed to avoid loading the full raw GeoJSON file into memory.

## Node commands

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing
PYTHONPATH=. python scripts/prepare_building_footprints_layer.py
PYTHONPATH=. python scripts/prepare_building_footprints_layer.py --execute
PYTHONPATH=. python scripts/build_manifest.py
PYTHONPATH=. python scripts/validate_prepared_data.py
```

Use `--force` only if `buildings.json` already exists and should be replaced.
