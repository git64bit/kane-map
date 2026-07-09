# Batch 050 — Chunk Buildings Layer

Batch 050 adds a dedicated building-footprint chunking step.

The goal is to split the prepared buildings layer into smaller files that the browser can load selectively later.

This batch does not change the browser application.

## Added

```text
processing/kane_map_processing/building_chunking.py
processing/scripts/chunk_buildings_layer.py
docs/BUILDING_CHUNKING.md
docs/BATCH_050.md
```

## Output

The chunker writes to:

```text
processing/output/chunks/prepared-layers/buildings/
```

It also writes:

```text
processing/output/reports/buildings_chunking_report.json
```

## Intended command sequence

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing
python scripts/chunk_buildings_layer.py
python scripts/chunk_buildings_layer.py --execute
```

## Notes

The script reads the prepared buildings file feature-by-feature rather than loading the entire FeatureCollection into memory.
