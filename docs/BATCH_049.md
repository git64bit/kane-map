# Batch 049 — Chunk Prepared Bundle

Batch 049 adds the first prepared-data chunking tool.

It does not change the browser application.

## Purpose

Split prepared layer files into smaller browser-loadable chunk files.

This batch starts with the small/simple layers:

- roads
- water

Buildings and address points are intentionally left for later batches because their chunking rules need grid/cell assignment and viewport strategy.

## Added files

```text
processing/kane_map_processing/prepared_chunking.py
processing/scripts/chunk_prepared_layers.py
docs/PREPARED_CHUNKING.md
docs/BATCH_049.md
```

## Default behavior

Dry run only:

```bash
PYTHONPATH=. python scripts/chunk_prepared_layers.py
```

Execute:

```bash
PYTHONPATH=. python scripts/chunk_prepared_layers.py --execute
```

## Default output

```text
processing/output/chunks/prepared-layers/
  chunk_manifest.json
  roads/
    roads_000001.json
    roads_000002.json
    ...
  water/
    water_000001.json
```

## Notes

This is not the final browser bundle format. It is the first controlled chunking step.
