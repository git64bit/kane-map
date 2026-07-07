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

Status: current.

Goal: keep the prototype runnable offline while splitting files into maintainable units.

Current structure:

```text
index.html
styles/app.css
src/app.js
src/data/demoFeatures.js
src/map/grid.js
src/map/renderer.js
src/storage/offlineRecords.js
docs/OFFLINE_FIRST.md
docs/PROXY_LAYER.md
docs/PROJECT_STATE.md
```

Rules:

- keep files generally under 500–700 lines
- avoid build tools for now
- avoid remote libraries for now
- avoid CDN dependencies
- avoid a database dependency
- support JSON export/import for observations

Exit condition:

Opening `index.html` directly shows the working offline prototype.

## Phase 3 — Address/unit observation ledger

Goal: make field observations more structured.

Tasks:

- [ ] Define observation status values
- [ ] Define confidence levels
- [ ] Add visit status
- [ ] Add mailbox-bank ID
- [ ] Add entrance ID
- [ ] Add fieldwork boundary fields to every exported record
- [ ] Add import validation
- [ ] Add visible-designator examples
- [ ] Add conflict status between public record and field observation

Exit condition:

A building can carry structured unit-count evidence without encoding unit details into the grid code.

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

## Phase 5 — Real geometry import

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

## Phase 6 — Server-assisted preparation layer

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

Improve the address/unit observation ledger while keeping the app offline and simple.
