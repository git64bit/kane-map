# Batch 043 — Prepare address points layer

This batch adds the first prepared address-points output step.

It reads:

```text
processing/input/raw/kane-address-points.geojson
```

and writes:

```text
processing/output/prepared/address_points.json
```

The raw address-points file is large, so preparation streams features one at a time instead of loading the full GeoJSON document into memory.

No browser app behavior changes are included in this batch.
