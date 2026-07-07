# Proxy / Server-Assisted Layer

Kane-Map should not be fully online at runtime.

The better architecture is server-assisted and offline-first.

## What the proxy layer is for

A future proxy or server layer is useful for preparing and publishing data.

Good server-side jobs:

- fetch public GIS datasets
- normalize source formats
- clean bad geometry
- simplify polygons
- clip data to Kane County
- assign Kane-grid cells
- generate static bundles
- publish version manifests
- publish release notes
- optionally sync selected observation records

## What the proxy layer is not for

The proxy layer should not be required for basic field operation.

Avoid making runtime dependent on:

- live map tiles
- live API calls
- login state
- remote database reads
- remote database writes
- server uptime

## Correct split

```text
Server/proxy:
  prepare data
  publish static releases
  optionally sync records

Browser:
  render the map
  hold field state
  record observations
  export/import JSON
  keep working offline
```

## Release bundle idea

A future static release could look like this:

```text
releases/kane-map-2026-07-07/
  manifest.json
  grid.json
  roads.json
  water.json
  forests.json
  buildings.json
  parcels-index.json
```

The browser downloads a release once and then renders from local files or local browser storage.

## Long-term rule

The proxy can improve the map.

The proxy must not become the map.
