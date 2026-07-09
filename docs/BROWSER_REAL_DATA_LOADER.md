# Browser real-data loader

Kane-Map now has two browser data modes.

## Default mode

Opening `index.html` with no query string keeps the synthetic demo data active.

```text
index.html
```

This is the safe default.

## Prepared chunked mode

Prepared chunked mode is activated by URL parameter.

```text
index.html?data=prepared&bundle=processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z
```

The `bundle` value points to the local packaged chunked bundle created by Batch 054.

## Local static server requirement

Browser `fetch()` usually cannot read many local files reliably from `file://` URLs.

For prepared mode, serve the repository root with a local static server, then open the URL through `http://localhost`.

Example from the repository root:

```bash
python3 -m http.server 8787
```

Then open:

```text
http://localhost:8787/index.html?data=prepared&bundle=processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z
```

## What the loader does

The loader reads `chunk_manifest.json`, loads each listed chunk file, and converts prepared GeoJSON into the existing canvas data shape.

Converted browser layers:

```text
countyBoundary
roads
water
buildings
addressPoints
```

The current renderer displays roads, water, forests, and buildings. Address points and county boundary are loaded into the data model for later display and selection work.

## Fallback

If prepared mode is not requested, the app uses demo data.

If prepared mode is requested but the bundle cannot be loaded, the app falls back to demo data and writes the error to the browser console.

## Current limitation

This first loader is intentionally direct: it loads all chunk files at boot.

Later work should add viewport-based or grid-cell-based lazy loading so the browser does not need to parse all building and address-point chunks at startup.
