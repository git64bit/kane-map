# Batch 050B — Building chunking syntax fix

This batch corrects a syntax error in `processing/kane_map_processing/building_chunking.py` from Batch 050.

It replaces only the building chunking module.

No browser files, data files, schema files, or prepared output files are included.

After pushing:

```bash
git -C ~/kane-map pull
PYTHONPATH=. python scripts/chunk_buildings_layer.py
PYTHONPATH=. python scripts/chunk_buildings_layer.py --execute
```
