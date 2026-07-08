# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Batch 020 — app controller refactor.

The application remains offline-first and static. It still opens from `index.html` without a build step, package manager, server, CDN, or remote database.

## Current status

The project now has:

- offline Canvas map rendering
- chunked local demo geometry
- persistent local observation records through browser-local storage
- JSON export/import with import preview and safety checks
- CSV and TXT exports
- structured field ledger
- record edit/delete
- review filters
- coverage summaries
- site/building identity layer
- visit-session tracking
- field-planning layer
- tabbed workspace UI
- keyboard shortcuts
- refactored app controller files

## Important architecture decision

Kane-Map is offline-first, server-assisted later.

The app should work locally. A server/proxy layer may later help with data preparation, synchronization, public distribution, or CivicIPFS integration, but the fieldwork runtime should not depend on network availability.

## Refactor note

`src/app.js` was split because it had exceeded 1,000 lines.

New controller files:

```text
src/app/context.js
src/controllers/workspaceController.js
src/controllers/mapController.js
src/controllers/observationController.js
src/controllers/reviewController.js
src/controllers/importExportController.js
src/controllers/shortcutsController.js
src/utils/domUtils.js
```

See `docs/APP_REFACTOR.md` for details.

## Current testing checklist

After each batch, test:

1. Open `index.html` directly.
2. Pan, zoom, and rotate the map.
3. Select a building.
4. Switch tabs.
5. Add an observation.
6. Edit the observation.
7. Delete a test observation.
8. Export JSON.
9. Import JSON and preview before replacing.
10. Export CSV/TXT reports.
11. Use search and keyboard shortcuts.
12. Reopen the page and confirm local records persist.

## Next likely step

After the refactor is verified, the next useful direction is either:

- polish UI layout and field grouping, or
- start preparing a real-data ingestion plan while keeping the demo map intact.
