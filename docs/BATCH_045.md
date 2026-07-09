# Batch 045 — Fix prepared address geometry

This batch fixes the prepared `address_points.json` layer.

The previous prepared address layer wrote each item as a flat object, not as a GeoJSON Feature. Prepared-layer inspection correctly reported null geometry and invalid properties.

This batch changes `prepared_addresses.py` so address points are written as a normal GeoJSON `FeatureCollection` with:

- `Point` geometry
- `properties` object
- `kane_map_layer` metadata
- streaming input processing

No browser files are changed.
