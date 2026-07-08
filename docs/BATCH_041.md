# Batch 041 — Prepare county boundary layer

This batch adds the county boundary preparation step.

It reads:

```text
processing/input/raw/kane-county-boundary.geojson
```

and writes:

```text
processing/output/prepared/county_boundary.json
```

No browser app behavior changes are included.

## Commands

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing

PYTHONPATH=. python scripts/prepare_county_boundary_layer.py
PYTHONPATH=. python scripts/prepare_county_boundary_layer.py --execute
PYTHONPATH=. python scripts/build_manifest.py
PYTHONPATH=. python scripts/validate_prepared_data.py
```
