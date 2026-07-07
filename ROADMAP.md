# Kane-Map Roadmap

This roadmap is organized so the project can pause and resume without losing direction.

## Phase 0 — Project memory

Goal: make the repository self-explaining before adding application code.

Status: started.

Tasks:

- [x] Add `README.md`
- [x] Add `ROADMAP.md`
- [x] Add `docs/PROJECT_STATE.md`
- [x] Add `docs/ARCHITECTURE.md`
- [x] Add `docs/DATA_MODEL.md`
- [x] Add `docs/FIELDWORK_RULES.md`

Exit condition:

A future reader can understand what Kane-Map is, why it exists, what the first prototype should do, and what boundaries govern field observation.

## Phase 1 — Browser-only synthetic prototype

Goal: prove the visual model without real GIS data.

Status: in progress.

Tasks:

- [x] Add `index.html`
- [x] Add a dark map canvas
- [x] Add synthetic Kane-style grid cells
- [x] Add readable grid labels such as `N12-E07`
- [x] Add red residential building blocks
- [x] Add 1, 2, and 3 story height differences
- [x] Add white roads
- [x] Add blue ponds
- [x] Add green forest polygons
- [x] Add basic pan, zoom, pitch, and rotate controls
- [x] Add a small legend
- [x] Add a simple status panel

Exit condition:

Opening `index.html` in a browser shows a convincing Kane-Map mockup using fake data.

## Phase 2 — Code organization

Goal: split the prototype into maintainable files.

Target structure:

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
```

Tasks:

- [ ] Move synthetic geometry out of `index.html`
- [ ] Move map initialization into `src/map/initMap.js`
- [ ] Move layer definitions into `src/map/layers.js`
- [ ] Move grid generation into `src/map/grid.js`
- [ ] Keep the prototype runnable with minimal setup

Exit condition:

The project is still simple, but no longer trapped inside one large HTML file.

## Phase 3 — Kane-grid design

Goal: define the local grid scheme.

Tasks:

- [ ] Define grid origin
- [ ] Define cell size
- [ ] Define row and column naming convention
- [ ] Define clipping behavior at county boundary
- [ ] Define how grid cells relate to Plus Codes
- [ ] Define how grid cells relate to H3 indexes
- [ ] Define how grid cells relate to building records

Draft rule:

```text
Kane-Map names places.
The address ledger records observations.
The unit list never becomes part of the public grid code.
```

Exit condition:

A grid cell code can be generated consistently from coordinates and shown on the map.

## Phase 4 — Field observation data model

Goal: define the address/unit reconstruction ledger.

Core entities:

```text
grid_cell
site
building
entrance
mailbox_bank
visible_designator
observation_event
source_record
conflict_record
```

Tasks:

- [ ] Define site record
- [ ] Define building record
- [ ] Define mailbox-bank record
- [ ] Define visible-designator record
- [ ] Define unit-count observation
- [ ] Define confidence levels
- [ ] Define revisit statuses
- [ ] Define conflict statuses
- [ ] Define privacy and fieldwork limits

Exit condition:

A building rectangle can carry observed unit-count evidence without putting unit detail into the grid code itself.

## Phase 5 — Local persistence

Goal: store working data locally in the browser.

Tasks:

- [ ] Add IndexedDB wrapper
- [ ] Save field observations locally
- [ ] Save visit status locally
- [ ] Save map settings locally
- [ ] Save last viewed grid cell locally
- [ ] Add export/import for local records

Exit condition:

A user can close the browser, reopen Kane-Map, and retain fieldwork state.

## Phase 6 — Real geometry import

Goal: replace synthetic geometry with real or derived local data.

Candidate layers:

- Kane County boundary
- road centerlines
- water polygons
- forest or land-cover polygons
- building footprints
- parcel references
- municipality/township boundaries

Tasks:

- [ ] Identify source datasets
- [ ] Verify licensing and reuse terms
- [ ] Normalize geometry
- [ ] Clip to Kane County
- [ ] Simplify geometry for browser rendering
- [ ] Assign layer styles
- [ ] Generate static bundles

Exit condition:

The map displays real Kane County orientation layers.

## Phase 7 — Offline-first static bundles

Goal: make base map data downloadable and locally reusable.

Possible formats:

- GeoJSON for early development
- PMTiles or vector tiles for larger datasets
- compressed static bundles for generated arrays

Tasks:

- [ ] Decide bundle format
- [ ] Build cache strategy
- [ ] Add download/cache UI
- [ ] Add cache status UI
- [ ] Add refresh/rebuild process
- [ ] Document data versioning

Exit condition:

The base map can load from local browser storage after initial download.

## Phase 8 — POI and observation sync

Goal: separate static geometry from dynamic records.

Tasks:

- [ ] Define POI API shape
- [ ] Define observation sync shape
- [ ] Add network status indicator
- [ ] Add conflict handling
- [ ] Add export format
- [ ] Add import format
- [ ] Add server-side placeholder API later

Exit condition:

Static geometry remains local, while dynamic records can sync online.

## Phase 9 — CivicIPFS / archival integration

Goal: preserve selected civic records and evidence references.

Tasks:

- [ ] Define what should be archived
- [ ] Define what should remain private/local
- [ ] Define public record references
- [ ] Define immutable source links
- [ ] Define record hashes
- [ ] Define attestation format

Exit condition:

Kane-Map can support durable civic recordkeeping without turning field observations into uncontrolled public exposure.

## Current next step

Confirm that the single-file prototype renders in the browser.

After that, split the code into modules.
