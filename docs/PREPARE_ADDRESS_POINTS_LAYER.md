# Prepare address points layer

The address-points layer is prepared from the staged raw Kane County address points GeoJSON.

The raw file may contain more than 200,000 features and is large enough that full-file `json.load()` processing is inappropriate on a small processing node.

Use:

```bash
PYTHONPATH=. python scripts/prepare_address_points_layer.py
PYTHONPATH=. python scripts/prepare_address_points_layer.py --execute
PYTHONPATH=. python scripts/build_manifest.py
PYTHONPATH=. python scripts/validate_prepared_data.py
```

Output:

```text
processing/output/prepared/address_points.json
```

Prepared records keep only fields useful to Kane-Map at this stage:

- `id`
- `x`
- `y`
- `address`
- `common_name`
- `addr_class`
- `addr_subclass`
- `condo`
- `complete_status`
- `fire_addr`
- `source`

The output is intentionally smaller and flatter than the raw source.
