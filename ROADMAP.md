# Kane-Map Roadmap

Last updated: 2026-07-08

## Current checkpoint

Kane-Map has a working offline prototype with modular code, split CSS, split renderer, tabbed workspace, local records, imports/exports, and fieldwork planning tools.

The next major transition is from synthetic geometry to real-data planning.

## Phase 0 — Project memory

Status: complete and ongoing.

Completed:

```text
README.md
ROADMAP.md
docs/PROJECT_STATE.md
docs/README.md
docs/FILE_MAP.md
docs/CURRENT_ARCHITECTURE.md
docs/NEXT_STEPS.md
```

Rule:

Update `docs/PROJECT_STATE.md` after major batches.

## Phase 1 — Browser-only synthetic prototype

Status: complete.

Completed:

```text
dark canvas map
synthetic grid
red residential buildings
roads
ponds
forests
pan / zoom / rotate / reset
selection
legend/status panels
```

## Phase 2 — Offline-first local records

Status: complete.

Completed:

```text
localStorage persistence
record schema and migrations
JSON export/import
import preview and safety checks
CSV/TXT exports
edit/delete records
```

## Phase 3 — Field ledger workflow

Status: complete for prototype use.

Completed:

```text
visible designator parser
unit count derivation
site/address note
building alias
entrance ID
mailbox bank ID
confidence
visit status
visit date
field session
plan priority
planned action
```

## Phase 4 — Usability and review tools

Status: complete for prototype use.

Completed:

```text
tabbed workspace
persistent selected-object header
search
coverage filters
building status markers
field plan
visit sessions
keyboard shortcuts
```

## Phase 5 — Code structure and maintainability

Status: complete for current scale.

Completed:

```text
app controller refactor
renderer refactor
CSS refactor
documentation index
file map
architecture summary
next-step plan
```

## Phase 6 — Real-data planning

Status: next.

Goal:

Plan the real Kane County data source and processing strategy before importing data.

Recommended next files:

```text
docs/REAL_DATA_PLAN.md
docs/SOURCE_LAYERS.md
docs/DATA_LICENSE_CHECKLIST.md
docs/GEOMETRY_PIPELINE.md
```

Questions to resolve:

```text
county boundary source
roads source
water/pond source
forest/land-cover source
building footprint source
parcel/reference source
licensing/terms
geometry simplification
chunk generation
source/version metadata
```

Exit condition:

A small real-data import can proceed without guessing the source strategy.

## Phase 7 — Grid design lock

Status: pending.

Goal:

Stabilize the Kane-grid naming system before records depend on real geography.

Tasks:

```text
define origin
define cell size
define naming convention
define county-edge clipping
define building-to-cell assignment
define subcell rules
define future Plus Code/H3 cross-reference fields
```

## Phase 8 — Small real-data pilot

Status: pending.

Goal:

Import a limited real-data patch, not the whole county.

Recommended scope:

```text
one known area
one or two grid cells
roads/water/forest/buildings if available
synthetic data retained for comparison
```

## Phase 9 — Performance guardrails

Status: pending.

Goal:

Prepare for larger geometry.

Possible features:

```text
visible feature counts
render-time status
chunk-size warnings
largest chunk warning
record count warnings
optional debug overlay
```

## Phase 10 — Offline release package

Status: pending.

Goal:

Make Kane-Map easy to download, unzip, and run.

Possible additions:

```text
VERSION.txt
CHANGELOG.md
README_OFFLINE_RELEASE.md
kane-map-offline-v0.1.zip process
```

## Work to avoid until Phase 6 is done

Avoid:

```text
server sync
authentication
large framework migration
remote-only basemaps
new database backend
large UI feature expansion
```

Reason:

The main open question is now the real-data pipeline.
