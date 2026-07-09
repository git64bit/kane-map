# Batch 064 — Flat prepared JSON production loader

## Purpose

Batch 064 keeps the UI/runtime path aligned with the current USB layout:

```text
processing/output/prepared/*.json
```

The browser no longer assumes production data must be a packaged `data/kane-county/chunk_manifest.json` bundle. The existing chunked-bundle path still works, but the production switch can now load the five prepared JSON layer files directly through TrivialHTTP.

## Changed files

```text
src/app.js
src/data/realBundleConfig.js
src/data/chunkedBundleLoader.js
```

## Expected USB test

Run TrivialHTTP from the app root and open Production from the UI, or open:

```text
/index.html?data=prepared&bundle=processing/output/prepared
```

Expected successful status:

```text
Runtime: production data active
Data: Kane County prepared JSON files
Load: Layers 5 · Chunks 5 · Features 396,005
UI: Batch 064
```

## Notes

This is a UI/runtime change only. It does not change the processing workflow, regenerate data, or require a portable app packaging step.
