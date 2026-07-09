# Browser Real-Data Loader

Kane-Map has two browser data modes:

```text
demo       synthetic browser-local demo geometry
prepared   prepared production county bundle loaded from static JSON chunks
```

## Source repository default

Opening the source repository app with no query string keeps demo mode active:

```text
index.html
```

This is the safe source-tree default.

## Explicit prepared mode

Prepared mode is requested by URL parameter:

```text
index.html?data=prepared&bundle=processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z
```

Recognized prepared aliases include:

```text
prepared
real
chunked
chunked-prepared
production
prod
```

Recognized demo aliases include:

```text
demo
synthetic
sample
```

## Portable app default

The generated portable app rewrites `src/data/realBundleConfig.js` so the app can default to the copied production bundle:

```text
data/kane-county
```

That means the generated portable app should load the Kane County production bundle with no query string once it is opened through a local static file-serving mechanism.

The portable app still accepts an explicit demo override:

```text
index.html?data=demo
```

## Local static serving requirement

Browser `fetch()` usually cannot read many local JSON files reliably from `file://` URLs. Prepared mode should be opened through local HTTP/static serving.

Developer fallback example from the repository root:

```bash
python3 -m http.server 8787
```

Then open:

```text
http://localhost:8787/index.html?data=prepared&bundle=processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z
```

This Python example is a developer fallback only. It is not the final Windows/USB runtime assumption.

## What the loader does

The loader reads:

```text
chunk_manifest.json
```

Then it loads each listed chunk file and converts prepared GeoJSON into the existing browser canvas data shape.

Converted browser layers:

```text
countyBoundary
roads
water
buildings
addressPoints
```

## Failure behavior

If demo mode is requested, the app uses demo data.

If prepared/production mode is requested and the production bundle cannot be loaded, the app must not silently fall back to demo data. The failure should be visible as production data unavailable.

## Current limitation

The current loader is direct: it loads all chunk files at boot. Later work may add viewport-based or grid-cell-based lazy loading.
