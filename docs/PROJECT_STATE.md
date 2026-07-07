# Kane-Map Project State

Last updated: 2026-07-07

## Current phase

Phase 2 — Offline-first modular prototype.

## What changed in this batch

This batch replaces the CDN-dependent MapLibre prototype direction with a pure Canvas prototype.

The reason is practical: a pure Canvas renderer can run directly from `index.html` with no internet, no server, no database, no build step, and no vendored third-party library.

## Current working rule

Kane-Map should be offline-first and server-assisted later.

That means:

```text
field runtime: local browser
base rendering: local files
observation records: local memory and JSON export/import
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
src/storage/offlineRecords.js
docs/OFFLINE_FIRST.md
docs/PROXY_LAYER.md
docs/PROJECT_STATE.md
ROADMAP.md
README.md
```

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
- simple offline observation records
- JSON export/import

## Important limits

The map is not geographically accurate yet.

The current geometry is synthetic demo geometry.

There is no real Kane County data in the app yet.

There is no persistent browser database in this batch. Records are kept in memory until exported.

## Why no database yet

The immediate purpose is to prove that the map and observation workflow can run without any server or database dependency.

Later options:

- keep JSON-only workflow
- add local IndexedDB
- add optional sync service
- support all three as separate modes

## Next recommended task

Improve the observation ledger.

Suggested next batch:

```text
Batch 005 — structured address/unit observations
```

Possible additions:

- status field: candidate, observed, counted, conflict, revisit-needed
- confidence field: low, medium, high
- entrance ID
- mailbox bank ID
- designator list field
- privacy boundary flags in exported JSON
- better export filename
- visible fieldwork disclaimer in UI
