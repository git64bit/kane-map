# Kane-Map Roadmap

This roadmap is organized so the project can pause and resume without losing direction.

## Completed / stable foundation

- Phase 0: project memory and documentation foundation
- Phase 1: browser-only synthetic prototype
- Offline-first Canvas renderer
- Local records with JSON export/import
- Chunked local demo data
- Structured field ledger
- Designator count fix and schema migrations
- Record management
- Edit/status markers
- Search/navigation
- Coverage filters
- Export formats
- Import safety
- Site identity
- Visit sessions
- Field planning
- Tabbed workspace
- Keyboard shortcuts
- App controller refactor
- Renderer refactor
- CSS refactor
- Documentation index
- Real-data planning docs
- Data adapter skeleton

## Current phase — Real-data planning

Goal: define source, geometry, processing, and grid rules before importing real Kane County data.

Batch 024 adds:

```text
docs/DATA_SOURCES.md
docs/GEOMETRY_INTAKE.md
docs/KANE_GRID_SPEC.md
docs/REAL_DATA_PLAN.md
docs/DATA_PROCESSING_NODE.md
```

## Processing architecture preference

Preferred but not mandatory:

```text
Debian 12 or Debian 13
Python virtual environment
processing scripts outside the browser
static CSV/JSON/JS chunk outputs copied into the app
```

## Phase — Data adapter skeleton

Status: complete.

Batch 025 adds a browser-side data adapter path for demo and future prepared geometry sources. Demo geometry remains active. No real Kane County geometry is imported yet.

## Phase — Processing folder skeleton

Next planned batch:

```text
Batch 026 — processing-node skeleton
```

Goal: establish repeatable local processing workflow.

Possible files:

```text
tools/processing/README.md
tools/processing/requirements.txt
tools/processing/scripts/
tools/processing/output/
```

## Phase — First real layer

Goal: import one low-risk source layer into a production-style chunk.

Candidate first layers:

- county boundary
- roads
- water
- forest/green orientation polygons

Building footprints should come after stable source review and ID strategy.

## Hard rule

Real data should not be imported into Kane-Map without source provenance and repeatable processing notes.

