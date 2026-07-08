# Kane-Map File Map

This file explains where things live in the repository.

It is not a complete API reference. It is a navigation aid for returning to the project after pauses.

## Root files

| Path | Purpose |
|---|---|
| `index.html` | Static application shell. Links CSS and JavaScript modules. Opens directly in a browser. |
| `README.md` | Public project overview and quick start. |
| `ROADMAP.md` | Phase-level project plan. |
| `LICENSE` | Project license. |

## Styles

| Path | Purpose |
|---|---|
| `styles/app.css` | Compatibility marker only. Split styles are linked directly. |
| `styles/base.css` | Reset, variables, base page typography and colors. |
| `styles/layout.css` | Main page structure, map/workspace layout, responsive frame. |
| `styles/panels.css` | Left panel sections and general panel styling. |
| `styles/buttons.css` | Buttons, small controls, action groups. |
| `styles/forms.css` | Labels, inputs, selects, textareas, form grids. |
| `styles/records.css` | Saved-record list, summaries, edit/delete affordances. |
| `styles/navigation.css` | Search, search results, navigation controls. |
| `styles/review.css` | Review filters, coverage, field-plan visual summaries. |
| `styles/import-export.css` | Export/import controls and import preview. |
| `styles/tabs.css` | Workspace tabs and active tab behavior. |
| `styles/status.css` | Footer/status bar and compact runtime messages. |

## Application bootstrap

| Path | Purpose |
|---|---|
| `src/app.js` | Small bootstrap that wires the app together. Should remain small. |
| `src/app/context.js` | Shared state/context object for controllers. |

## Controllers

| Path | Purpose |
|---|---|
| `src/controllers/workspaceController.js` | Tabs, workspace switching, selected-object header. |
| `src/controllers/mapController.js` | Map interaction wiring, selection, pan/zoom/rotate/reset. |
| `src/controllers/observationController.js` | Observation form, save/edit/delete integration. |
| `src/controllers/reviewController.js` | Review filters, coverage panel, records display state. |
| `src/controllers/importExportController.js` | JSON import/export, CSV/TXT exports, import preview. |
| `src/controllers/shortcutsController.js` | Keyboard shortcuts and shortcut status messages. |

Controller rule:

```text
Controllers connect UI to state.
Controllers should not become data-model libraries.
```

## Map rendering

| Path | Purpose |
|---|---|
| `src/map/renderer.js` | Main renderer orchestration. Should remain small. |
| `src/map/rendererConfig.js` | Color, sizing, and style constants for the canvas map. |
| `src/map/viewport.js` | Coordinate transforms, pan, zoom, rotate, screen/world conversion. |
| `src/map/drawPrimitives.js` | Low-level drawing helpers. |
| `src/map/drawLayers.js` | Draws roads, forests, ponds, grid, buildings, labels. |
| `src/map/statusMarkers.js` | Draws observation/count/status markers on buildings. |
| `src/map/hitTest.js` | Click/selection hit testing for buildings and cells. |
| `src/map/grid.js` | Kane-style grid generation and cell utilities. |

Renderer rule:

```text
Renderer files draw and select geometry.
They should not know about import/export, CSV, storage, or UI tabs.
```

## Data files

| Path | Purpose |
|---|---|
| `src/data/demoCatalog.js` | Catalog of available synthetic chunks. |
| `src/data/chunkRegistry.js` | Loads and indexes the local chunk modules. |
| `src/data/geometry.js` | Geometry access helpers used by the renderer/search/review layers. |
| `src/data/chunks/*.js` | Synthetic local geometry chunks. These may grow more freely than application logic. |

Data rule:

```text
Large generated geometry should live in data files or bundles.
Application code should stay small and maintainable.
```

## Fieldwork logic

| Path | Purpose |
|---|---|
| `src/field/designators.js` | Parses visible unit designators and derives counts. |
| `src/field/visitSessions.js` | Groups records by visit date/session. |
| `src/field/fieldPlan.js` | Priority, planned action, and worklist helpers. |

Fieldwork rule:

```text
The visible designator is the useful observation.
Resident names, mail contents, and mailbox access are out of scope.
```

## Records and storage

| Path | Purpose |
|---|---|
| `src/storage/recordSchema.js` | Current record schema, defaults, migration logic. |
| `src/storage/localStore.js` | localStorage persistence layer. |
| `src/storage/offlineRecords.js` | Earlier/offline record helpers retained as needed. |
| `src/records/coverage.js` | Coverage summaries, status counts, review filtering. |
| `src/records/siteIdentity.js` | Site labels, aliases, duplicate warnings, identity summaries. |

Storage rule:

```text
JSON export remains the portable backup.
localStorage is the current local persistence layer.
IndexedDB is optional later only if record size requires it.
```

## Search, navigation, export, import

| Path | Purpose |
|---|---|
| `src/navigation/searchIndex.js` | Offline search index for cells, buildings, records, statuses, and designators. |
| `src/navigation/shortcuts.js` | Keyboard shortcut definitions and handlers. |
| `src/export/exporters.js` | JSON/CSV/TXT export helpers. |
| `src/import/importValidator.js` | Safe import preview, warnings, and blocking errors. |

## Utilities

| Path | Purpose |
|---|---|
| `src/utils/domUtils.js` | DOM selection, event, and UI helper functions. |

Utility rule:

```text
Utilities should stay generic.
If a helper knows about records, buildings, or fieldwork, it belongs elsewhere.
```

## Documentation

| Path | Purpose |
|---|---|
| `docs/README.md` | Documentation index. Start here. |
| `docs/PROJECT_STATE.md` | Current stable state. Read this first after pauses. |
| `docs/NEXT_STEPS.md` | Ordered next work items. |
| `docs/CURRENT_ARCHITECTURE.md` | Current architecture and design boundaries. |
| `docs/FILE_MAP.md` | This file. |

## Files that should stay small

Try to keep these below roughly 500-700 lines:

```text
src/app.js
src/controllers/*.js
src/map/*.js
src/field/*.js
src/records/*.js
src/storage/*.js
styles/*.css
```

Files allowed to grow more freely:

```text
src/data/chunks/*.js
future generated geometry bundles
future static data catalogs
exported JSON backups
```
