# Kane-Map Roadmap

This roadmap is organized so the project can pause and resume without losing direction.

## Current milestone — Batch 014

Status: ready for testing.

Adds:

- JSON import preview before replacing local records
- current versus incoming ledger comparison
- warning and error reporting for imports
- backup-before-import control
- blocked import for duplicate incoming IDs or fieldwork boundary flag violations
- documentation for import safety

Next likely milestone: split large application/UI files into smaller modules before adding more features.

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
src/data/geometry.js
src/data/chunkRegistry.js
src/data/demoCatalog.js
src/data/chunks/*.js
src/map/grid.js
src/map/renderer.js
src/storage/recordSchema.js
src/storage/localStore.js
src/field/designators.js
src/navigation/searchIndex.js
src/records/coverage.js
src/export/exporters.js
src/import/importValidator.js
docs/*.md
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

Status: complete enough to proceed.

Goal: make field observation records durable without introducing a server or database.

Completed features:

- browser-local saved records through `localStorage`
- record schema version field
- export envelope with format and version
- import normalization
- import preview and validation
- clear saved records control
- storage status indicator
- explicit fieldwork boundary flags in each exported record
- visible designator parsing
- unit-count auto-counting
- record edit and delete
- selected-building filtering

Remaining tasks:

- [ ] Add merge import behavior after conflict rules are defined
- [ ] Add project namespace support
- [ ] Add duplicate detection by building/designator/date

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

## Phase 5 — Chunked local data

Status: implemented in Batch 006.

Goal: avoid the one-giant-array model before real Kane County data is imported.

Completed features:

- local data catalog
- data chunk registry
- synthetic data split into local chunks
- render chunks selected from visible grid cells
- footer status for visible cells
- footer status for selected chunks
- documentation for chunked data

Exit condition:

The app still opens directly as `index.html`, but the code no longer assumes all geometry should live in one giant feature file.

## Phase 6 — Review dashboard

Status: implemented enough for prototype use.

Completed features:

- local navigation search
- jump to building or grid cell
- selected-building summary
- coverage summary
- status-based map filter
- visible-cell coverage table
- map markers for buildings with records

Future tasks:

- [ ] clearer symbol legend for map status markers
- [ ] better conflict visualization
- [ ] visible-cell printable report
- [ ] selected-building printable report

## Phase 7 — Exports

Status: implemented in Batch 013.

Exports:

```text
Export JSON              full-fidelity backup / restore
Export observation CSV   one row per saved observation record
Export building CSV      one row per building summary
Export field report      compact TXT coverage report
```

JSON remains the authoritative portable format. CSV and TXT are review outputs.

## Phase 8 — Real geometry import

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

## Phase 9 — Server-assisted preparation layer

Goal: keep runtime offline-first while allowing a future online layer to prepare, publish, and version data bundles.

Possible additions:

- ingestion scripts
- GIS cleanup
- local bundle generation
- release manifests
- optional sync service
- optional public archive integration

Do not make field use depend on server availability.

## Immediate next step

Recommended Batch 015:

```text
Refactor app and style files into smaller modules before adding more features.
```

Rationale:

`src/app.js` and `styles/app.css` are now large enough that further feature work should be preceded by cleanup.


## Phase 5.5 — Visit/session workflow

Status: implemented in Batch 016.

Tasks:

- [x] Add visit date to observation records
- [x] Add field session ID to observation records
- [x] Preserve visit/session values across repeated saves
- [x] Show visit-session summary in the UI
- [x] Add footer visit/session status
- [x] Add visit-session CSV export
- [x] Migrate records to schema version 7

Exit condition:

A fieldwork outing can be represented as a group of offline records without a server or database.


## Batch 017 — Field plan

Status: complete.

Added:

- plan priority field
- planned action field
- field-plan panel
- active worklist filter
- priority / follow-up / unrecorded filters
- field-plan CSV export
- schema v8 migration

Next recommended batch:

## Batch 018 — Controller refactor

Goal: split `src/app.js` into smaller UI controller modules while preserving all behavior. The prototype is working, but the main controller is now too large for comfortable long-term maintenance.


## Batch 018 — Tabbed workspace

Status: complete.

Added:

- task tabs under the KANE-MAP header
- persistent selected-object workspace header
- Map / Observe / Records / Review / Plan / Export / Project screens
- `docs/TABBED_WORKSPACE.md`

No storage or schema change was made.

Next recommended batch:

## Batch 019 — Controller refactor

Goal: split `src/app.js` into smaller UI controller modules while preserving all behavior. The tabbed workspace solves interface clutter; the next maintenance issue is controller size.
