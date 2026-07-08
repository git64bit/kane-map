# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Offline-first synthetic prototype with local records, search, coverage review, exports, and import safety.

Current batch: Batch 014 — import safety.

## Repository direction

Kane-Map is being built as an offline-first, browser-rendered civic field map for Kane County, Illinois.

The project currently uses:

- direct `index.html` opening
- no CDN
- no server
- no database
- no package manager
- no build step
- pure Canvas rendering
- local JavaScript data chunks
- browser-local observation records
- JSON backup/restore
- CSV/TXT review exports

## Current operational purpose

The first operational purpose is residential address and unit-count reconstruction.

Some HOAs and residential buildings do not expose unit numbers in ordinary public-facing sources. Kane-Map records visible field observations such as:

```text
site/address note
building ID
entrance ID
mailbox bank ID
visible designators
observed unit count
confidence
visit status
access context
notes
```

The grid names places.

The observation ledger records what was observed there.

The unit list does not become part of the public grid code.

## Hard fieldwork boundary

The fieldwork model is visible observation only.

Do not:

- touch mailboxes
- open mailboxes
- insert anything into mailboxes
- remove anything from mailboxes
- read mail
- record resident names
- enter locked or restricted areas
- bypass access control
- treat an unlocked area as automatically lawful access

Each exported observation record includes boundary flags for mailbox touching, mailbox opening, mail reading, and resident-name recording. Kane-Map import now blocks records where those flags violate the fieldwork boundary.

## Current visual model

The prototype renders synthetic data with:

```text
dark gray background
thin wireframe grid
human-readable grid labels
red residential buildings
1, 2, and 3 story block heights
white roads
blue ponds
green forests
simple geometry
browser-side rendering
```

## Current app capabilities

The app currently supports:

- Canvas map rendering
- pan, zoom, rotate, reset
- chunked local demo geometry
- visible-cell chunk status
- selected grid cell and selected building panel
- structured field observation form
- visible designator parser
- automatic unit count from designators
- localStorage persistence
- record edit
- record delete
- selected-building-only record filter
- building summary panel
- map status markers for buildings with records
- navigation search
- jump to grid cell or building
- status-based review filter
- visible-cell coverage table
- JSON export
- JSON import preview and replace
- observation CSV export
- building-summary CSV export
- compact TXT field report export

## Current import behavior

JSON import uses preview mode.

The preview shows:

- current local record count
- incoming record count
- current versus incoming building count
- current versus incoming observed unit total
- current versus incoming verified record count
- current versus incoming conflict record count
- warnings
- blocking errors

Import is currently replace mode.

Use **Download backup** before replacing local records that matter.

Merge import is deferred until conflict rules are defined.

## Current storage model

```text
localStorage  saved observation records
JSON          full-fidelity backup and restore
CSV           spreadsheet review
TXT           compact fieldwork report
JS chunks     synthetic demo geometry
```

A future large dataset should not be stored as one giant array. It should use local chunks or generated bundles keyed by visible grid cells.

## Current source organization

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

## Known technical debt

`src/app.js` and `styles/app.css` are now large enough that the next batch should probably refactor UI and styling into smaller files before adding substantial new features.

Recommended split:

```text
src/ui/dom.js
src/ui/recordsPanel.js
src/ui/importPanel.js
src/ui/searchPanel.js
src/ui/coveragePanel.js
src/ui/observationForm.js
styles/base.css
styles/panels.css
styles/forms.css
styles/records.css
styles/map.css
```

## Immediate next step

Recommended Batch 015:

```text
Refactor app and styles into smaller modules.
```

Do this before importing real Kane County GIS data.
