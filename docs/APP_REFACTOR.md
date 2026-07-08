# App Refactor

Batch 020 split the original large `src/app.js` controller into smaller files.

The goal was structural only:

- no schema change
- no storage change
- no export/import change
- no rendering behavior change
- no new feature requirement

## Why this was needed

`src/app.js` had grown past 1,000 lines and was carrying several unrelated responsibilities:

- application bootstrapping
- DOM element lookup
- map interaction
- navigation/search
- observation form handling
- record list rendering
- review/coverage panels
- visit-session summaries
- field-plan summaries
- import/export handlers
- keyboard shortcut behavior

That made future work harder and increased the risk that a small change in one area would affect unrelated behavior.

## New structure

```text
src/app.js
src/app/context.js
src/controllers/workspaceController.js
src/controllers/mapController.js
src/controllers/observationController.js
src/controllers/reviewController.js
src/controllers/importExportController.js
src/controllers/shortcutsController.js
src/utils/domUtils.js
```

## File roles

### `src/app.js`

Boots Kane-Map.

It creates the shared context, installs controllers, binds events, and performs the initial UI refresh.

### `src/app/context.js`

Creates shared application state:

- catalog
- grid
- feature store
- building list
- renderer
- local record store
- DOM references
- selected cell/building
- model helpers

### `src/controllers/workspaceController.js`

Handles:

- workspace tabs
- selected-object panel
- selected-object persistent header
- building summary
- identity summary

### `src/controllers/mapController.js`

Handles:

- canvas pointer events
- pan, zoom, rotate, reset
- visible chunk updates
- search result rendering
- jump-to-building
- jump-to-cell
- next/previous building navigation
- copy selected summary

### `src/controllers/observationController.js`

Handles:

- observation form
- edit mode
- record save/update/delete
- record list rendering
- designator preview
- unit-count resolution

### `src/controllers/reviewController.js`

Handles:

- coverage summaries
- review filters
- building status overlay
- coverage by visible grid cell
- visit-session summary
- field-plan summary

### `src/controllers/importExportController.js`

Handles:

- JSON export
- CSV exports
- TXT report export
- JSON import preview
- import confirmation
- backup before import
- clear local records
- storage status

### `src/controllers/shortcutsController.js`

Handles keyboard shortcut wiring and shortcut-specific actions.

### `src/utils/domUtils.js`

Shared small utilities:

- HTML escaping
- date stamp generation
- clipboard copy fallback

## Current rule

Future source files should generally stay below 500–700 lines.

JSON and static data files may grow more freely than JavaScript, HTML, or CSS.

## Compatibility note

The app still runs as a static offline browser app.

There is still:

- no CDN
- no package manager
- no build step
- no server requirement
- no remote database
