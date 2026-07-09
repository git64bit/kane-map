# Kane-Map Project State

Last updated: 2026-07-09

## Current phase

Kane-Map is the Kane County pilot for an offline-first browser county-map application. The source repository contains the browser app, documentation, and processing scripts. Generated county data and generated portable app folders belong on the Debian processing node and must not be committed to GitHub.

## Current verified portable app

The latest verified USB-copy-ready generated app folder on the processing node is:

```text
/home/kaneproc/kane-map/processing/output/apps/kane-county-map-20260709T113306Z
```

Verification result:

```text
status: ready
data files: 87
layers: 5
chunks: 85
features: 396,005
absolute manifest paths: 0
USB-copy status: ready
```

Layers:

```text
county_boundary
roads
water
buildings
address_points
```

## Browser app architecture

```text
static HTML/CSS/JS
Canvas renderer
local browser observation records
JSON/CSV/TXT export
source-selecting data adapter
demo geometry mode
prepared production county bundle mode
```

The browser application does not process raw county source data. Python processing scripts prepare, chunk, package, and verify data on the Debian processing node.

## Data-source behavior

The source repository remains safe to open in demo mode by default:

```text
index.html
```

The source repository can request prepared production data explicitly when served through local HTTP/static serving and when the requested bundle exists:

```text
index.html?data=prepared&bundle=processing/output/bundles/<bundle-name>
```

The generated portable app rewrites `src/data/realBundleConfig.js` so the copied app defaults to the relative production data path:

```text
data/kane-county
```

In the portable app, `?data=demo` remains an explicit override.

## Production failure rule

Prepared/production mode must not silently fall back to demo data. If production data is requested and cannot be loaded, the app should show a visible production-data-unavailable status.

## Next architectural topic

The next architectural topic after the production-data switch is the county-map / TrivialHTTP path:

```text
kane-map     = Kane County pilot
county-map   = clean generic source-only application/package project
TrivialHTTP  = local-only static file-serving runtime, Windows .exe first or early
```

TrivialHTTP is not part of this batch.
