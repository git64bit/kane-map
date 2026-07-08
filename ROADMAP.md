# Kane-Map Roadmap

This roadmap is organized so the project can pause and resume without losing direction.

## Current milestone — Batch 010

Status: ready for testing.

Adds:

- edit saved observation records in place
- preserve record ID and original creation date during edit
- add updated timestamp
- filter records to selected building only
- display map markers for buildings with saved observations
- migrate local storage to schema v5

Next likely milestone: search / locate / building registry.


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
docs/OFFLINE_FIRST.md
docs/PROXY_LAYER.md
docs/LOCAL_RECORDS.md
docs/CHUNKED_DATA.md
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

Status: complete enough to proceed.

Goal: make field observation records durable without introducing a server or database.

Completed features:

- browser-local saved records through `localStorage`
- record schema version field
- export envelope with format and version
- import validation and normalization
- clear saved records control
- storage status indicator
- explicit fieldwork boundary flags in each exported record

Completed in Batch 007:

- [x] Add confidence selector
- [x] Add visit-status selector
- [x] Add entrance ID
- [x] Add mailbox-bank ID
- [x] Add visible designator list field
- [x] Parse visible designators into a normalized list
- [x] Derive unit count from designators when count is blank
- [x] Add access-context field
- [x] Add schema version 4
- [x] Migrate local schema version 2 records when possible

Remaining tasks:

- [ ] Add conflict status between public record and field observation
- [x] Add record delete controls
- [x] Add per-building summary panel
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

## Phase 5.5 — Chunked local data

Goal: avoid the one-giant-array model before real Kane County data is imported.

Status: implemented in Batch 006.

Tasks:

- [x] Add local data catalog
- [x] Add data chunk registry
- [x] Split synthetic data into local chunks
- [x] Select render chunks from visible grid cells
- [x] Add footer status for visible cells
- [x] Add footer status for selected chunks
- [x] Document chunked data model

Exit condition:

The app still opens directly as `index.html`, but the code no longer assumes all geometry should live in one giant feature file.

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

Batch 007 completed the first structured field-ledger pass. Batch 008 fixed designator count/display handling.

Next likely batch:

```text
building-status overlay from saved records
revisit-needed highlighting on the map
conflict highlighting on the map
summary totals by visible grid cell
```


## Batch 008 — Designator count fix

Completed:

- [x] Visible designators now override accidental `0` counts
- [x] Record list shows designator count and up to 24 designators
- [x] Schema version advanced to 4
- [x] Version 3 and version 2 local records migrate forward
- [x] Inconsistent older records with visible designators and `0` unit count normalize to the designator count

## Batch 009 — Record management and building summary

Completed:

- [x] Add delete control for individual records
- [x] Keep schema version 4 because exported record shape did not change
- [x] Add selected-building summary panel
- [x] Highlight recent records for the selected building
- [x] Refresh storage and summary panels after delete/import/clear/add
- [x] Document conservative correction workflow

Correction workflow:

```text
incorrect local observation → delete record → enter corrected observation
```

Next recommended batch:

```text
Batch 010 — building-status overlay from saved records
```


## Batch 011 — Navigation search

Status: complete in prototype.

Added:

- offline search over grid cells
- offline search over buildings
- offline search over saved field records
- click-to-jump behavior for cells and buildings
- coverage summary for recorded buildings and latest observed unit totals
- `docs/NAVIGATION_SEARCH.md`

Next likely work:

- add a visit queue / revisit list
- add CSV export for spreadsheet review
- add a simple validation report for conflicts and suspicious counts

## Batch 012 — coverage filters

Status: complete in this batch.

Adds:

- status-based review filter
- recorded/unrecorded building review
- conflict and revisit-needed review
- visible-cell coverage table
- footer review-filter count
- documentation in `docs/COVERAGE_FILTERS.md`

Next recommended work:

```text
Batch 013 — print and CSV export
```

The project now needs human-readable outputs for fieldwork review, not only JSON backup files.
