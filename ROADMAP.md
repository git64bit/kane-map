# Kane-Map Roadmap

This roadmap is organized so the project can pause and resume without losing direction.

## Phase 0 — Project memory

Status: complete enough to proceed.

Goal: make the repository self-explaining before adding application code.

Core files:

- `README.md`
- `ROADMAP.md`
- `docs/PROJECT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/FIELDWORK_RULES.md`

## Phase 1 — Browser-only synthetic prototype

Status: complete.

Goal: prove the visual model without real GIS data.

Completed features:

- dark map canvas
- synthetic Kane-style grid cells
- readable grid labels such as `N12-E07`
- red residential building blocks
- 1, 2, and 3 story height differences
- white roads
- blue ponds
- green forest polygons
- pan, zoom, rotate, and reset controls
- basic legend and status panel

## Phase 2 — Offline-first modular prototype

Status: complete.

Goal: keep the prototype runnable offline while splitting files into maintainable units.

Current structure:

```text
index.html
styles/app.css
src/app.js
src/data/demoFeatures.js
src/map/grid.js
src/map/renderer.js
src/storage/recordSchema.js
src/storage/localStore.js
docs/OFFLINE_FIRST.md
docs/PROXY_LAYER.md
docs/LOCAL_RECORDS.md
docs/PROJECT_STATE.md
```

Rules:

- keep files generally under 500–700 lines
- avoid build tools for now
- avoid remote libraries for now
- avoid CDN dependencies
- avoid a remote database dependency
- support JSON export/import for observations

Exit condition:

Opening `index.html` directly shows the working offline prototype.

## Phase 3 — Local saved observations

Status: current.

Goal: make field observation records durable without introducing a server or database.

Completed features:

- browser-local saved records through `localStorage`
- record schema version field
- export envelope with format and version
- import validation and normalization
- clear saved records control
- storage status indicator
- explicit fieldwork boundary flags in each exported record

Remaining tasks:

- [ ] Add confidence selector
- [ ] Add visit-status selector
- [ ] Add entrance ID
- [ ] Add mailbox-bank ID
- [ ] Add visible designator list field
- [ ] Add conflict status between public record and field observation
- [ ] Add record edit/delete controls
- [ ] Add better import merge behavior

Exit condition:

A building can carry durable local unit-count evidence without encoding unit details into the grid code.

## Phase 4 — Kane-grid design

Goal: define the local grid scheme.

Tasks:

- [ ] Define grid origin
- [ ] Define cell size
- [ ] Define row and column naming convention
- [ ] Define clipping behavior at county boundary
- [ ] Define how grid cells relate to Plus Codes
- [ ] Define how grid cells relate to H3 indexes
- [ ] Define how grid cells relate to building records

Exit condition:

A grid cell code can be generated consistently from coordinates and shown on the map.

## Phase 5 — Static bundle strategy

Goal: support large local datasets without loading everything at once.

Tasks:

- [ ] Define chunk naming convention
- [ ] Define grid-cell bundle format
- [ ] Define building bundle format
- [ ] Define road/water/forest bundle format
- [ ] Define manifest file
- [ ] Define lazy loading by visible grid cells
- [ ] Decide when to move from JSON to compressed/tiled bundles

Exit condition:

The app can load only the local files needed for the current view.

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

## Phase 7 — Server-assisted preparation layer

Goal: add online infrastructure only where it improves maintenance.

Tasks:

- [ ] Define ingestion pipeline
- [ ] Define geometry cleanup workflow
- [ ] Define static bundle release format
- [ ] Define version manifest
- [ ] Define optional sync API shape
- [ ] Keep runtime independent from server availability

Exit condition:

A server/proxy can publish better data bundles, but the field map still runs offline.

## Current next step

Improve the observation form and ledger fields:

```text
confidence
visit status
entrance ID
mailbox bank ID
designator list
record edit/delete
```
