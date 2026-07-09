# Batch 050D — Building Chunk Manifest Fix

This batch fixes the building chunk execute step.

The previous building chunker wrote chunk files correctly, but failed while updating
`output/chunks/prepared-layers/chunk_manifest.json` because the existing manifest
stores `layers` as a list, not a dictionary.

This update keeps the Batch 049 manifest shape and appends or replaces the
`buildings` layer entry.

Run from `processing`:

```bash
PYTHONPATH=. python scripts/chunk_buildings_layer.py --execute
```
