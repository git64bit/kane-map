# Kane-Map Project State

Last updated: 2026-07-07

## Current phase

Phase 5.5 — Chunked local data prototype.

The app is now an offline-first Canvas prototype with local saved observations and a first scale-oriented chunk layer.

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
- local field observations
- `localStorage` persistence
- JSON export/import
- chunk status in footer
- visible-cell status in footer
- JavaScript data chunks registered locally

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

Recommended Batch 009:

```text
Add edit/delete controls for individual field records.
Add a selected-building summary panel using saved records.
```

Possible additions:

- latest observed count by selected building
- latest confidence and visit status
- revisit-needed highlighting
- delete single record
- export filtered building history

Do not import real Kane County data yet.


## Batch 008 state

The app now has a structured field ledger for the primary Kane-Map use case.

Current working capabilities:

```text
select a building
enter site/address note
enter entrance id
enter mailbox bank id
enter visible designators
parse and count visible designators
record observed unit count
record confidence
record visit status
record access context
record notes
save locally in browser storage
export/import JSON
```

The record schema is version 4. The app writes to `kane-map.local-observations.v4` and attempts to migrate records from version 3 and version 2 local storage. Batch 008 fixes an inconsistent-record case where visible designators exist but the saved unit count is `0`; normalization now uses the visible-designator count.

Current next step:

```text
Add edit/delete controls for individual records.
Add a selected-building summary panel using saved records.
```
