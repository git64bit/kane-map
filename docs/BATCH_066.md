# Batch 066 — Fix flat prepared production loader

## Purpose

Fix the current GitHub `main` mismatch where the UI points Production at:

```text
processing/output/prepared?format=flat-prepared
```

but `src/data/chunkedBundleLoader.js` still attempts to load:

```text
processing/output/prepared/chunk_manifest.json
```

The USB data layout being tested contains flat prepared JSON files under:

```text
processing/output/prepared/*.json
```

## Changes

- `src/data/chunkedBundleLoader.js`
  - Adds explicit `format=flat-prepared` support.
  - Loads these flat prepared files directly:
    - `county_boundary.json`
    - `roads.json`
    - `water.json`
    - `buildings.json`
    - `address_points.json`
  - Keeps the existing chunked-manifest path for chunked bundles.

- `src/data/realBundleConfig.js`
  - Makes `processing/output/prepared` the current production test bundle path.
  - Adds `defaultBundleFormat: "flat-prepared"`.
  - Adds configured format URL parameter names.

- `src/app.js`
  - Updates the visible UI batch marker to `UI: Batch 066`.

## Expected USB result through TrivialHTTP

After copying `src/` to the USB app folder and reloading:

```text
UI: Batch 066
```

After choosing Production:

```text
Runtime: production data active
Data: Kane County prepared JSON files
Load: Layers 5 · Chunks 5 · Features 396,005
```

No processing, packaging, or data regeneration is required for this batch.
