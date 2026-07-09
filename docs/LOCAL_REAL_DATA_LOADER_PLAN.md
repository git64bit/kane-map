# Local Real-Data Loader Plan

## Goal

Add a browser-side path for loading prepared Kane County data from a local bundle while preserving the existing offline-first design.

The current application uses synthetic demo chunks. The next major browser milestone is to allow Kane-Map to load prepared real-data layers from a local folder produced by the processing pipeline.

## Current data situation

The processing pipeline can now produce a validated prepared bundle with these layers:

```text
county_boundary.json
roads.json
water.json
buildings.json
address_points.json
```

The validated bundle size is approximately:

```text
173.6 MB
```

The largest files are:

```text
address_points.json  about 92 MB
buildings.json       about 77 MB
```

Those files are manageable on disk, but they should not be loaded all at once on browser startup.

## Loading principle

```text
Load small orientation layers first.
Load large layers only when explicitly requested or spatially narrowed.
```

Recommended order:

```text
1. county_boundary.json
2. water.json
3. roads.json
4. buildings.json
5. address_points.json
```

## Data modes

Kane-Map should have an explicit data mode:

```text
demo
prepared_bundle
```

### Demo mode

Demo mode keeps the current behavior:

- synthetic data chunks
- small dataset
- direct `index.html` use
- no external files required beyond the repo
- useful for UI development and regression testing

### Prepared bundle mode

Prepared bundle mode should read local prepared layer files from a user-supplied bundle folder.

Example bundle layout:

```text
kane-map-prepared-YYYYMMDDTHHMMSSZ/
  README.txt
  bundle_manifest.json
  layers/
    county_boundary.json
    roads.json
    water.json
    buildings.json
    address_points.json
```

The prepared files remain outside GitHub.

## Browser-loading constraints

A static offline browser app has limits:

- direct `index.html` use can restrict `fetch()` access to local files
- large JSON parsing can block the UI thread
- loading all features at once can waste memory
- search indexes should be incremental or layer-specific

The cleanest first implementation is not automatic folder loading. It is manual file loading through the browser file picker.

## Recommended first browser implementation

Batch 049 should add a local bundle manifest import screen.

First implementation:

```text
User selects bundle_manifest.json
App validates the manifest shape
App shows available layers
App does not load layer files yet
```

Second implementation:

```text
User selects one small layer file
App loads county_boundary.json
App renders boundary over the demo map or in a separate real-data preview mode
```

Third implementation:

```text
Load water.json and roads.json
Render orientation layers
Do not load buildings or address points yet
```

## Avoid initially

Do not immediately add:

- full-bundle startup loading
- automatic recursive folder access
- service worker cache
- IndexedDB storage of all prepared features
- building/address spatial joins in the browser
- address-point rendering at all zoom levels

Those can be added later after the small-layer path works.

## File API direction

For offline local use, prefer browser file input first:

```text
<input type="file">
```

Later options:

```text
webkitdirectory folder picker
File System Access API where supported
local static server for development
```

The first version should be boring and reliable.

## Renderer constraints

The existing Canvas renderer should not receive hundreds of thousands of features at once.

Before real buildings and address points are loaded into the map, Kane-Map needs one of these strategies:

```text
spatial chunks
visible-window filtering
zoom-gated rendering
layer simplification
```

For now, start with the small layers.

## Recommended Batch 049

Batch 049 should be:

```text
Batch 049 — bundle manifest loader
```

It should add:

```text
src/data/bundleManifestLoader.js
src/controllers/bundleController.js
styles/bundle.css
docs/BUNDLE_MANIFEST_LOADER.md
```

It should not load the layer data yet.

It should only prove:

- a local manifest file can be selected
- the manifest can be parsed
- layers can be listed in the Project or Export tab
- invalid manifests are rejected cleanly

## Rule

```text
Demo data remains the default until prepared-bundle loading is proven layer by layer.
```
