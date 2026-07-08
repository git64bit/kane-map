# Kane-Map

Kane-Map is a county-local residential mapping project for Kane County, Illinois.

The purpose is to create a browser-rendered navigational map that helps fieldwork, civic recordkeeping, and address reconstruction where ordinary public-facing sources do not expose the needed residential unit detail.

## Current build

This build is an offline-first Canvas prototype with locally saved observation records, search, coverage review, exports, and import preview.

It requires:

- no CDN
- no server
- no database
- no build step
- no package manager
- no internet connection after download

Open `index.html` directly in a browser.

## What the prototype does

The prototype renders synthetic map data:

- dark gray background
- local Kane-style grid labels
- red 1, 2, and 3 story residential blocks
- white roads
- blue ponds
- green forest polygons
- pan, zoom, rotate, and reset controls
- click selection for grid cells and buildings
- browser-local observation records
- JSON backup/export and previewed JSON import
- CSV and TXT review exports
- local navigation search
- coverage filters and visible-cell coverage summary

The current geometry is synthetic. No real Kane County GIS data has been imported yet.

## Local records

Kane-Map saves structured field-ledger records in the browser using `localStorage`.

That is local workstation storage, not a server database.

Records remain available after closing and reopening the page in the same browser context. Current exports use schema version 5 records and older local records are normalized forward when loaded.

Use JSON export/import for backup, portability, review, or archival work.

Read:

- `docs/LOCAL_RECORDS.md`
- `docs/FIELD_LEDGER.md`
- `docs/IMPORT_SAFETY.md`
- `docs/EXPORTS.md`

## Import safety

JSON import now uses preview mode.

The app shows:

- current local record count
- incoming record count
- current versus incoming building count
- current versus incoming observed unit total
- verified record comparison
- conflict record comparison
- warnings
- blocking errors

The current import behavior is replace mode, not merge mode. Use **Download backup** before replacing a local ledger that matters.

## Core rule

The grid names places.

The observation ledger records field evidence.

The unit list never becomes part of the public grid code.

## Fieldwork boundary

The fieldwork model is visible observation only.

Do not:

- touch mailboxes
- open mailboxes
- insert anything into mailboxes
- remove anything from mailboxes
- read mail
- record resident names
- bypass locked or restricted access
- treat an unlocked area as automatically lawful access

The useful observation is the visible unit designator pattern and count, not resident identity and not mail content.

## Architecture direction

Kane-Map should be offline-first and server-assisted later.

The browser should be able to run the map locally.

A future server/proxy layer may help with:

- importing public GIS data
- cleaning geometry
- clipping to Kane County
- generating static map bundles
- publishing versioned releases
- optional sync

Field use should not depend on network signal, login, uptime, or a remote database.

## Start here after a pause

Read:

1. `docs/PROJECT_STATE.md`
2. `ROADMAP.md`
3. `docs/IMPORT_SAFETY.md`
4. `docs/LOCAL_RECORDS.md`
5. `docs/OFFLINE_FIRST.md`
6. `docs/PROXY_LAYER.md`

## Current prototype capabilities

The offline prototype currently supports:

- direct `index.html` opening
- Canvas rendering
- chunked local demo geometry
- pan, zoom, rotate, and reset
- selected building and grid cell panels
- local field observation records
- visible designator parsing and unit-count auto-counting
- JSON export/import with preview
- CSV/TXT review exports
- single-record delete
- edit saved records in place
- selected-building-only record filtering
- building status markers on the map
- navigation search
- coverage filters
- visible-cell coverage summary


## Current implemented features

The offline prototype currently supports:

- chunked local demo geometry
- local canvas rendering
- pan, zoom, rotate, and reset
- building and grid-cell selection
- local observation records
- edit and delete of records
- JSON backup/import with preview safety checks
- CSV and TXT exports
- search and coverage filters
- selected-building identity checks
- building alias and site label tracking


## Visit/session layer

Kane-Map now records `visitDate` and `fieldSessionId` on each local field observation. This allows repeated observations from the same field outing to be grouped without requiring a server or database.

The Visit Sessions panel summarizes visit dates, field sessions, records, buildings covered, unit totals, and follow-up records. JSON remains the restore format; CSV exports are review/report formats.


## Batch 017 field planning

The offline prototype now includes a field-planning layer. Observation records can carry `planPriority` and `planAction` values, and the right-side panel can show an active worklist for priority buildings, conflict/revisit records, and unrecorded buildings.

The field plan remains local and offline. It can be exported as CSV for spreadsheet review or field use.


## Batch 018 tabbed workspace

The interface now uses task-focused workspace tabs under the KANE-MAP header:

```text
Map · Observe · Records · Review · Plan · Export · Project
```

The map remains visible. The left workspace switches task mode. A compact selected-building header remains visible across tabs so the user does not lose context while entering observations, reviewing records, planning fieldwork, or exporting data.

This batch does not change storage, schema, exports, or offline behavior.


## Batch 019 update

Batch 019 adds keyboard and fieldwork-speed controls while keeping the application offline-first and schema-stable.

New controls include search focus, numbered workspace tabs, next/previous visible building navigation, selected-summary copy, form clearing, save shortcut, JSON export shortcut, and Escape handling.

See `docs/KEYBOARD_SHORTCUTS.md`.
