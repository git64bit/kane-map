# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Phase 5.6 — Local field-ledger record management.

The app is an offline-first Canvas prototype with local saved observations, chunked local geometry, and basic per-record management.

## Current repository state

The project contains:

```text
index.html
styles/app.css
src/app.js
src/data/geometry.js
src/data/chunkRegistry.js
src/data/demoCatalog.js
src/data/chunks/*.js
src/field/designators.js
src/map/grid.js
src/map/renderer.js
src/storage/localStore.js
src/storage/recordSchema.js
docs/*.md
README.md
ROADMAP.md
```

## What works

The prototype can be opened directly from `index.html`.

Working features:

- dark Canvas map
- Kane-style grid labels
- red residential building blocks
- 1, 2, and 3 story building height
- white roads
- blue ponds
- green forests
- pan, zoom, rotate, reset
- building and grid selection
- chunked local demo geometry
- visible-cell and selected-chunk footer status
- structured field observations
- visible-designator parsing and unit-count derivation
- `localStorage` persistence
- JSON export/import
- single-record delete
- selected-building summary panel
- selected-building record highlighting

## Current data mode

The current demo data is synthetic.

It is split into local JavaScript chunks:

```text
regional-orientation
west-neighborhood
central-townhomes
east-apartments
```

The app computes visible grid cells and materializes the matching chunks for rendering.

This prepares the project for larger local data without requiring a remote database.

## Current record mode

The field ledger writes schema version 4 records to browser-local storage.

The app supports:

```text
add record
list recent records
delete one record
clear all local records
export JSON
import JSON
```

Correction workflow for now:

```text
delete incorrect local record
enter corrected local record
export JSON backup if needed
```

Full edit-in-place is deferred until audit/version behavior is defined.

## Important architecture decision

Kane-Map remains:

```text
offline-first
server-assisted later
browser-rendered
local-record capable
export/import capable
```

The project should not become fully online-dependent.

A future proxy layer may prepare data, clean GIS files, clip geometry, and publish releases. The field map itself should continue to work without network access after the needed files are available locally.

## Fieldwork boundary

The fieldwork model remains visible observation only.

Do not:

- touch mailboxes
- open mailboxes
- insert anything into mailboxes
- remove anything from mailboxes
- read mail
- record resident names
- bypass access control
- enter locked or restricted areas

The useful observation is the visible unit designator and the countable building-level pattern.

## Immediate next step

Recommended Batch 010:

```text
Add a building-status layer from saved records.
```

Possible additions:

- tint or outline selected buildings based on saved observation status
- show `revisit-needed` and `conflict` buildings more clearly
- add a map legend entry for observation status
- add building summary totals by visible grid cell

Do not import real Kane County data yet.


## Batch 011 status

Navigation search was added.

The right panel can now search local grid cells, buildings, saved records, site labels, statuses, and visible designators. Selecting a search result recenters the map and selects the related cell or building.

A coverage summary was added for:

```text
recorded buildings / total buildings
latest observed unit total
verified / revisit / conflict counts
saved observation record count
```

This remains fully offline and database-free.

## Batch 012 status

Coverage review was added.

The right panel now includes a review filter for:

```text
all buildings
recorded
unrecorded
verified
conflict
revisit-needed
counted
observed
```

Matching buildings remain prominent and non-matching buildings are dimmed on the map.

The right panel also shows coverage by visible grid cell, including recorded building count, total building count, latest observed units, conflict count, and revisit-needed count.

This remains a fully offline, database-free review layer based on local observation records.

## Immediate next step

Recommended Batch 013:

```text
Add print/export review output.
```

Possible additions:

- printable selected-building summary
- printable grid-cell coverage report
- export CSV for observations
- export CSV for building coverage
- preserve JSON as the full-fidelity backup format
