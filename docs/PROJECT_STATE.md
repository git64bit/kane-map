# Kane-Map Project State

Last updated: 2026-07-07

## Current phase

Phase 3 — Local saved observations.

## What changed in this batch

Batch 005 keeps the app offline and database-free, but makes observation records durable across browser sessions.

Records now save in browser-local `localStorage` and can still be exported/imported as JSON.

## Current working rule

Kane-Map should be offline-first and server-assisted later.

That means:

```text
field runtime: local browser
base rendering: local files
observation records: local browser storage and JSON export/import
server/proxy: optional later for data preparation and bundle publishing
```

## Current file structure

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
ROADMAP.md
README.md
```

The older `src/storage/offlineRecords.js` file may still exist in the repository if it was pushed in Batch 004. It is no longer loaded by `index.html`.

## Current prototype behavior

Open `index.html` directly in a browser.

The map renders:

- dark background
- synthetic Kane-style grid
- red residential building blocks
- 1, 2, and 3 story heights
- white roads
- blue ponds
- green forests
- pan by drag
- zoom by wheel or buttons
- rotate by buttons
- click selection for buildings/grid cells
- local saved observation records
- JSON export/import

## Current local record behavior

Records save under this browser storage key:

```text
kane-map.local-observations.v2
```

Export format:

```text
kane-map-offline-observations
version 2
```

Each exported record includes fieldwork boundary fields:

```text
mailboxTouched: false
mailboxOpened: false
mailRead: false
residentNamesRecorded: false
```

## Important limits

The map is not geographically accurate yet.

The current geometry is synthetic demo geometry.

There is no real Kane County data in the app yet.

`localStorage` is acceptable for the early prototype, but it is not the final storage choice for very large record sets.

Export JSON before changing machines, browsers, or project folders.

## Why no database yet

The immediate purpose is to prove that the map and observation workflow can run without any server or database dependency.

Later options:

- keep JSON-only workflow
- keep localStorage for small records/settings
- add local IndexedDB for larger offline records
- add optional sync service
- support all modes separately

## Next recommended task

Improve the observation ledger fields.

Suggested next batch:

```text
Batch 006 — structured observation form
```

Possible additions:

- confidence selector
- visit status selector
- entrance ID
- mailbox bank ID
- designator list field
- record delete button
- record edit flow
- import merge/replace choice
