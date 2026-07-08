# Next Steps

Status after Batch 024.

## Immediate next batch

```text
Batch 025 — data adapter skeleton
```

Goal:

```text
prepare the app to understand data catalogs and demo/production modes
without replacing current synthetic demo chunks
```

Possible additions:

```text
src/data/dataCatalog.js
src/data/dataAdapter.js
src/data/demoDataMode.js
docs/DATA_ADAPTER.md
```

No real GIS import yet.

## Next processing batch after that

```text
Batch 026 — processing folder skeleton
```

Possible additions:

```text
processing/README.md
processing/requirements.txt
processing/scripts/build_demo_catalog.py
processing/scripts/validate_catalog.py
processing/output/.gitkeep
```

This would establish the Debian/Python processing direction without depending on real data yet.

## First real-data decision

Choose one small, low-risk source layer.

Recommended candidates:

```text
county boundary
road centerlines
water polygons
```

Do not start with building footprints unless the source and ID strategy are already clear.

