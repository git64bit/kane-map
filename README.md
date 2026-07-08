# Kane-Map

Kane-Map is a county-local residential mapping project for Kane County, Illinois.

The purpose is to create a browser-rendered navigational map that helps fieldwork, civic recordkeeping, and address reconstruction where ordinary public-facing sources do not expose the needed residential unit detail.

## Current build

This build is an offline-first Canvas prototype with locally saved observation records.

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
- JSON export/import for field observations

The current geometry is synthetic. No real Kane County GIS data has been imported yet.

## Local records

Batch 008 saves structured field-ledger records in the browser using `localStorage`.

That is local workstation storage, not a server database.

Records remain available after closing and reopening the page in the same browser context. Batch 008 writes schema version 4 records and attempts to migrate version 3 and version 2 local records.

Use JSON export/import for backup, portability, review, or archival work.

Read `docs/LOCAL_RECORDS.md` for the record format and current limitations.

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
3. `docs/LOCAL_RECORDS.md`
4. `docs/OFFLINE_FIRST.md`
5. `docs/PROXY_LAYER.md`


## Batch 008 field ledger status

Batch 008 fixes designator counting and display behavior:

- comma-separated, space-separated, and line-separated designators remain deduplicated and counted
- visible designators override accidental `0` unit counts
- record lists show the designator count and up to 24 visible designators, not only the first 6
- older version 3 records with `0` units and visible designators are corrected during migration


The prototype now includes a structured offline field ledger. A selected building can receive an observation with site label, entrance, mailbox bank, visible designators, observed unit count, confidence, visit status, access context, and notes.

Visible designators are parsed locally in the browser. If the unit count field is blank, the parsed designator count becomes the observed unit count.

Records remain local to the browser and can be exported or imported as JSON.

## Batch 009 record management status

Batch 009 adds the first correction workflow for local field observations:

- delete one local observation record without clearing all records
- highlight recent records associated with the selected building
- show a selected-building summary panel
- show latest observed unit count, visit status, and confidence for the selected building
- warn in the summary when the latest selected-building record is `conflict` or `revisit-needed`

The correction workflow is intentionally conservative:

```text
bad local observation → delete record → enter corrected observation
```

The exported record schema remains version 4 because the record shape did not change.

## Current prototype capabilities

The offline prototype currently supports:

- direct `index.html` opening
- Canvas rendering
- chunked local demo geometry
- pan, zoom, rotate, and reset
- selected building and grid cell panels
- local field observation records
- visible designator parsing and unit-count auto-counting
- JSON export/import
- single-record delete
- edit saved records in place
- selected-building-only record filtering
- building status markers on the map

See `docs/EDIT_AND_STATUS.md` for the Batch 010 workflow.


## Current prototype additions

Batch 011 adds local navigation search. The app can search grid cells, building labels, saved observation records, site labels, visit statuses, and visible unit designators without using a server or database.

The right panel also shows a coverage summary so the user can see how many demo buildings have saved records and how many latest observed units are represented by those records.

## Batch 012 coverage review

Batch 012 adds status-based coverage review.

The app can now:

- filter the map by recorded, unrecorded, verified, conflict, revisit-needed, counted, or observed buildings
- dim non-matching buildings without deleting or hiding data
- show coverage by visible grid cell
- show the active review filter in the footer

This keeps the app offline and database-free while making fieldwork review more practical.

See `docs/COVERAGE_FILTERS.md`.


## Export formats

Kane-Map supports multiple offline export formats:

```text
JSON  complete backup and restore format
CSV   spreadsheet review format
TXT   compact fieldwork report
```

Use JSON when preserving the ledger. Use CSV or TXT when reviewing observations outside the app.
