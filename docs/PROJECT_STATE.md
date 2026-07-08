# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Offline fieldwork prototype with local records, import/export safety, coverage review, visit sessions, field planning, and tabbed workspace organization.

## Current confirmed features

- Pure Canvas renderer
- No CDN
- No server
- No database
- No package manager
- No build step
- Chunked local demo geometry
- Pan, zoom, rotate, reset
- Building and grid selection
- Tabbed left workspace
- Persistent selected-object header
- Local observation records
- Schema migration through version 8
- JSON export/import
- Import preview and blocking validation
- Observation CSV export
- Building summary CSV export
- Visit-session CSV export
- Field report export
- Field-plan CSV export
- Search for buildings, grid cells, statuses, sites, aliases, sessions, designators, and plan terms
- Coverage filters
- Site identity layer
- Visit-session summary
- Field-planning worklist

## Latest batch

Batch 018 — Tabbed Workspace.

Added:

```text
docs/TABBED_WORKSPACE.md
```

UI tabs:

```text
Map
Observe
Records
Review
Plan
Export
Project
```

The tabbed workspace reorganizes existing controls without changing the storage schema or offline behavior.

## Current architecture decision

The project remains offline-first and server-assisted later.

The browser app should remain capable of working from local files. A future proxy/server layer may prepare, clean, version, and distribute Kane County geometry, but field use should not depend on network availability.

## Immediate next step

The next maintenance step should be controller refactoring:

```text
src/app.js
  -> src/ui/domRefs.js
  -> src/ui/workspaceTabs.js
  -> src/ui/recordPanel.js
  -> src/ui/importPanel.js
  -> src/ui/planningPanel.js
  -> src/ui/formController.js
```

This should preserve behavior while reducing file size and keeping future changes safer.
