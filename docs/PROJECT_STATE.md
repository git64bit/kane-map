# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

The project is at a stable offline prototype checkpoint.

The current priority is to prepare for real Kane County geometry by documenting source layers, licensing, and the geometry pipeline before importing data.

## Current repository state

The app currently includes:

```text
static offline index.html
split CSS files
modular JavaScript controllers
split Canvas renderer
synthetic local data chunks
field observation ledger
localStorage persistence
JSON import/export
CSV/TXT exports
search
coverage filters
field planning
visit sessions
keyboard shortcuts
tabbed workspace
documentation index
```

## Recent completed batches

```text
Batch 018 — tabbed workspace
Batch 019 — keyboard and fieldwork speed
Batch 020 — app controller refactor
Batch 021 — renderer refactor
Batch 022 — CSS/UI refactor
Batch 023 — documentation index and file map
```

## Current stable behavior

Confirmed working by user testing:

```text
open index.html directly
pan / zoom / rotate / reset
building selection
record save/edit/delete
record persistence
JSON export/import
CSV/TXT exports
search
review filters
coverage counts
field plan
visit sessions
tabbed workspace
keyboard shortcuts
```

## Architecture decision

Kane-Map is currently:

```text
offline-first
browser-only
server-free at runtime
CDN-free
package-manager-free
build-step-free
Canvas-rendered
localStorage-backed
JSON-portable
```

Future server/proxy infrastructure may be useful for data preparation, versioning, and optional sync, but field use should remain offline-capable.

## Current visual model

The map renders:

```text
dark gray background
Kane-style grid
cell labels
red residential buildings
building status markers
white roads
blue ponds/water
green forests/wooded areas
simple polygon/line geometry
```

## Current fieldwork model

The active use case is residential address/unit-count reconstruction.

The app supports:

```text
site/address note
building alias
entrance ID
mailbox bank ID
visible designators
parsed unit count
confidence
visit status
access context
visit date
field session
plan priority
planned action
```

The project boundary remains:

```text
visible observation only
no mailbox contact
no mailbox opening
no inserted items
no reading mail
no resident-name capture
no access bypassing
```

## Current code health

Recent refactors reduced large files:

```text
src/app.js is now a small bootstrap file
controllers are split by task
renderer is split by drawing/viewport/hit-test/status modules
CSS is split by UI responsibility
```

General rule:

```text
Application JS, HTML, and CSS should stay small and readable.
Generated geometry/data files may grow more freely.
```

## Current documentation entry points

Read these first:

```text
docs/README.md
docs/PROJECT_STATE.md
docs/NEXT_STEPS.md
docs/CURRENT_ARCHITECTURE.md
docs/FILE_MAP.md
```

## Immediate next step

Create the real-data planning documentation.

Recommended next batch:

```text
Batch 024 — real-data source plan
```

Suggested files:

```text
docs/REAL_DATA_PLAN.md
docs/SOURCE_LAYERS.md
docs/DATA_LICENSE_CHECKLIST.md
docs/GEOMETRY_PIPELINE.md
```

Do not import real Kane County data until the source/layer plan is written.
