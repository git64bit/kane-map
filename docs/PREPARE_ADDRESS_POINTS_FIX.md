# Prepare Address Points Fix

`processing/output/prepared/address_points.json` must be regenerated after this batch.

Use:

```bash
PYTHONPATH=. python scripts/prepare_address_points_layer.py --execute --force
PYTHONPATH=. python scripts/build_manifest.py
PYTHONPATH=. python scripts/validate_prepared_data.py
PYTHONPATH=. python scripts/inspect_prepared_layers.py
```

Expected result for address points:

```text
geometry: {'Point': 219626}
```
