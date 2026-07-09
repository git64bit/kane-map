# Batch 055 — Browser real-data loader

Batch 055 adds the first browser-side loader for the packaged chunked prepared-data bundle.

## Adds

- `src/data/realBundleConfig.js`
- `src/data/chunkedBundleLoader.js`
- async prepared-data support in `src/data/adapter.js`
- URL-based data-source selection in `src/data/sourceTypes.js`
- async app boot in `src/app.js`
- async context creation in `src/app/context.js`
- updated script loading in `index.html`
- `docs/BROWSER_REAL_DATA_LOADER.md`

## Behavior

Demo mode remains the default.

Prepared mode is activated by URL parameters:

```text
?data=prepared&bundle=processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z
```

The loader reads:

```text
chunk_manifest.json
layers/county_boundary/*.json
layers/roads/*.json
layers/water/*.json
layers/buildings/*.json
layers/address_points/*.json
```

It converts prepared GeoJSON into the current browser renderer shape.

## Boundary

This batch does not commit generated data files.

The chunked bundle remains local under:

```text
processing/output/bundles/
```

## Current limitation

This loader loads all chunk files at boot. Later batches can change this to lazy loading by viewport or grid cell.
