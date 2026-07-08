# Batch 039 — Prepare Roads Layer

This batch adds the first prepared browser-ready output layer.

Added files:

```text
processing/kane_map_processing/prepared_roads.py
processing/scripts/prepare_roads_layer.py
docs/PREPARE_ROADS_LAYER.md
docs/BATCH_039.md
```

Expected node workflow:

```bash
git -C ~/kane-map pull
python scripts/prepare_roads_layer.py
python scripts/prepare_roads_layer.py --execute
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

This batch does not modify the browser app.
