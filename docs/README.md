# Kane-Map Documentation

This directory is the documentation entry point for Kane-Map.

Read these files first when returning to the project after a pause:

```text
1. docs/PROJECT_STATE.md
2. docs/NEXT_STEPS.md
3. docs/CURRENT_ARCHITECTURE.md
4. docs/FILE_MAP.md
```

## Project memory files

| File | Purpose |
|---|---|
| `PROJECT_STATE.md` | Current stable state of the project and what was last completed. |
| `NEXT_STEPS.md` | Ordered next work items and why they matter. |
| `CURRENT_ARCHITECTURE.md` | Current offline-first architecture and design boundaries. |
| `FILE_MAP.md` | Directory and module map for finding code quickly. |
| `ROADMAP.md` | Phase-level project direction. |

## Major design documents

| File | Purpose |
|---|---|
| `OFFLINE_FIRST.md` | Explains the no-server/no-CDN/no-build runtime model. |
| `PROXY_LAYER.md` | Explains the future server-assisted data-preparation layer. |
| `DATA_MODEL.md` | Core entities: grid cell, site, building, mailbox bank, observations, conflicts. |
| `FIELDWORK_RULES.md` | Observation boundaries and mailbox/access limits. |
| `FIELD_LEDGER.md` | Structured field observation records and designator capture. |
| `LOCAL_RECORDS.md` | Browser-local persistence and schema versioning. |
| `IMPORT_SAFETY.md` | Safe JSON import preview and blocking checks. |
| `EXPORTS.md` | JSON, CSV, and TXT export meanings. |

## UI and workflow documents

| File | Purpose |
|---|---|
| `TABBED_WORKSPACE.md` | The task-tab organization used by the left panel. |
| `KEYBOARD_SHORTCUTS.md` | Keyboard and fieldwork-speed controls. |
| `NAVIGATION_SEARCH.md` | Offline search behavior. |
| `COVERAGE_FILTERS.md` | Review filters and visible-cell coverage. |
| `RECORD_MANAGEMENT.md` | Edit/delete/filter lifecycle of saved records. |
| `EDIT_AND_STATUS.md` | In-place edits and map status markers. |
| `SITE_IDENTITY.md` | Site names, building aliases, duplicate warnings. |
| `VISIT_SESSIONS.md` | Visit date/session tracking. |
| `FIELD_PLAN.md` | Priority, planned action, and worklist support. |

## Refactor documents

| File | Purpose |
|---|---|
| `APP_REFACTOR.md` | Split of the original large app controller. |
| `RENDERER_REFACTOR.md` | Split of the renderer into drawing, viewport, and hit-test modules. |
| `CSS_REFACTOR.md` | Split of styles into focused CSS files. |

## Current development rule

Kane-Map is now large enough that each batch should preserve one of these categories:

```text
feature batch
refactor batch
documentation batch
data-preparation batch
```

Avoid mixing major schema changes, UI restructuring, and rendering changes in the same batch unless there is no practical alternative.

## Current stable posture

Kane-Map is currently:

```text
offline-first
browser-only
server-free at runtime
CDN-free
package-manager-free
build-step-free
localStorage-backed for field records
JSON-exportable
CSV/TXT-reviewable
modularized enough for the next stage
```

The next strategic shift is from synthetic geometry to real-data planning.

## Real-data preparation documents

| File | Purpose |
|---|---|
| `DATA_PROCESSING_NODE.md` | Preferred Debian/Python processing-node model. |
| `DATA_SOURCES.md` | Candidate public data sources and provenance questions. |
| `GEOMETRY_INTAKE.md` | Geometry cleanup, clipping, simplification, and intake rules. |
| `KANE_GRID_SPEC.md` | Draft Kane-grid naming and assignment rules. |
| `REAL_DATA_PLAN.md` | Ordered plan before importing real Kane County data. |
| `DATA_ADAPTER.md` | Browser-side source adapter for demo and future prepared geometry. |
