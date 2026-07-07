# Kane-Map Architecture

Last updated: 2026-07-07

## Purpose

Kane-Map is intended to be a browser-rendered county-local residential map for Kane County, Illinois.

The architecture should support three separate concerns:

```text
1. Base map geometry
2. Local field observation records
3. Online points of interest and sync records
```

These concerns should remain separate so the map can be useful offline while still allowing selected records to sync later.

## Core principle

The server should distribute data.

The browser should process, cache, and render it.

The first version does not need a server. A browser-only prototype with synthetic geometry is enough to prove the rendering model.

## Intended high-level architecture

```text
Internet server
  ├── static app files
  ├── static geometry bundles
  ├── optional vector tile or PMTiles bundles
  ├── POI API
  ├── field-observation sync API
  └── optional authentication later

Browser workstation
  ├── map renderer
  ├── Kane-grid generator
  ├── local geometry cache
  ├── IndexedDB field-observation ledger
  ├── local visit-status records
  ├── offline-first state
  └── online sync when available
```

## Rendering direction

The map should use simple geometry first:

```text
red polygons / extrusions   = residential buildings
white lines                 = roads
blue polygons               = ponds and water
forest green polygons       = forests and wooded areas
gray wireframe              = local grid
dark gray background        = contrast layer
```

The first implementation should use synthetic GeoJSON.

Later implementations may use PMTiles, vector tiles, or compressed custom bundles.

## Recommended renderer

The first serious browser renderer should be MapLibre GL JS or an equivalent WebGL-based vector map renderer.

Reasons:

- supports vector layers
- supports fill extrusion for building height
- supports pan, zoom, pitch, and rotate
- supports custom GeoJSON sources
- can later support vector tiles
- runs in the browser

## Geometry pipeline

The project should evolve through these geometry stages:

```text
Stage 1: synthetic GeoJSON
Stage 2: hand-authored local demo geometry
Stage 3: real public-source geometry clipped to Kane County
Stage 4: simplified static bundles
Stage 5: cached vector tile or PMTiles distribution
```

Do not begin with full real-world data. First prove that the visual model works.

## Storage split

Use different browser storage systems for different jobs.

```text
CacheStorage
  Static app assets
  Static map bundles
  Large downloaded files

IndexedDB
  Structured field records
  Building observations
  Visit statuses
  POI cache
  Sync queue

Memory
  Currently visible map features
  temporary interaction state

Network
  POI updates
  sync records
  static bundle refreshes
```

Avoid using `localStorage` for map data or large arrays.

`localStorage` may be acceptable only for tiny preferences such as the last selected layer mode.

## Offline-first behavior

Kane-Map should eventually support this sequence:

```text
1. User opens the app online.
2. Browser downloads the base geometry bundle.
3. Browser caches the bundle locally.
4. User can later reopen the map without downloading the base geometry again.
5. Field observations are saved locally immediately.
6. Online sync happens separately when available.
```

The base map should not depend on the network after the initial download.

## Data separation

The base map is not the field ledger.

The grid is not the unit ledger.

The building polygon is not the observation itself.

A building can have many observations over time.

A grid cell can contain many buildings.

A building can have multiple mailbox banks or entrances.

## Proposed module structure

Initial structure after the first prototype:

```text
index.html
src/
  main.js
  data/
    demoFeatures.js
  map/
    initMap.js
    grid.js
    layers.js
  storage/
    indexedDb.js
  sync/
    poiSync.js
docs/
  ARCHITECTURE.md
  DATA_MODEL.md
  FIELDWORK_RULES.md
  PROJECT_STATE.md
ROADMAP.md
README.md
```

## Server later

Do not build the server first.

When needed, the server should initially be simple:

```text
GET /bundles/kane-base-v001.pmtiles
GET /api/poi?bbox=...
POST /api/observations/sync
GET /api/observations/changes?since=...
```

The first server can be replaced later. The important design requirement is keeping base geometry separate from dynamic observation records.

## Render performance assumptions

The project should prefer:

- simple polygons
- simplified lines
- low-detail extrusions
- grid generated client-side where possible
- visible features only
- cached data bundles
- lazy-loaded POIs

The project should avoid:

- rendering every record at every zoom level
- large untiled raw arrays in memory
- public grid codes that become too long
- mixing private observations into public base geometry

## Architectural rule

```text
Server distributes.
Browser renders.
IndexedDB remembers.
Network syncs.
Grid locates.
Field ledger observes.
```
