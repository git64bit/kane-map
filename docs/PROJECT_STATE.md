# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Offline fieldwork prototype with local records, import/export safety, coverage review, visit sessions, and field planning.

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

Batch 017 — Field Plan.

Added:

```text
src/field/fieldPlan.js
docs/FIELD_PLAN.md
```

New record fields:

```text
planPriority
planAction
```

The field plan derives a local worklist from:

- priority-marked buildings
- conflict records
- revisit-needed records
- unrecorded buildings

## Current architecture decision

The project remains offline-first and server-assisted later.

The browser app should remain capable of working from local files. A future proxy/server layer may prepare, clean, version, and distribute Kane County geometry, but field use should not depend on network availability.

## Immediate next step

The main application controller has grown large. The next maintenance step should be controller refactoring:

```text
src/app.js
  -> src/ui/domRefs.js
  -> src/ui/recordPanel.js
  -> src/ui/importPanel.js
  -> src/ui/planningPanel.js
  -> src/ui/formController.js
```

This should preserve behavior while reducing file size and keeping future changes safer.
