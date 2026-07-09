# Batch 065 — Flat prepared loader first

Batch 065 corrects the Batch 064 loader order.

The browser now treats `processing/output/prepared` as a flat prepared JSON folder when the config or URL says `format=flat-prepared`. In that mode it loads the five prepared layer JSON files directly and does not first request `chunk_manifest.json`.

Changed files:

- `src/data/chunkedBundleLoader.js`
- `src/data/realBundleConfig.js`
- `src/app.js`

Expected USB test URL after clicking Production:

```text
index.html?data=prepared&bundle=processing%2Foutput%2Fprepared&format=flat-prepared
```

Expected visible footer marker:

```text
UI: Batch 065
```

Expected successful load status, if the five prepared JSON files are present under `processing/output/prepared` and TrivialHTTP serves the USB app root:

```text
Runtime: production data active
Data: Kane County prepared JSON files
Load: Layers 5 · Chunks 5 · Features 396,005
```
