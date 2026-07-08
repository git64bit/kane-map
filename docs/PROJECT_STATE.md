# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Phase 6 preparation — real-data intake planning and data adapter skeleton.

The app remains an offline-first browser application using synthetic demo geometry. Batch 025 adds a data adapter layer so the renderer and controllers no longer need to care whether geometry comes from demo chunks or future prepared Kane County chunks.

## Stable checkpoints

Recent stable checkpoints:

```text
Batch 018 — tabbed workspace
Batch 019 — keyboard and fieldwork speed
Batch 020 — app controller refactor
Batch 021 — renderer refactor
Batch 022 — CSS refactor
Batch 023 — documentation index
Batch 024 — real data plan
Batch 025 — data adapter skeleton
```

## Current architecture

```text
Browser app
  ├── static HTML/CSS/JS
  ├── Canvas renderer
  ├── local demo geometry chunks
  ├── data adapter skeleton
  ├── localStorage observation ledger
  ├── JSON backup/restore
  ├── CSV/TXT review exports
  └── no server/database requirement
```

## Current active geometry source

```text
Synthetic demo geometry
```

No real Kane County geometry is bundled yet.

## Data adapter decision

The app now has a formal source path:

```text
src/data/adapter.js
src/data/sourceTypes.js
src/data/preparedDataManifest.js
src/data/realDataPlaceholder.js
```

The renderer and controllers should receive geometry through the adapter path, not directly from a specific source implementation.

## Preferred real-data processing path

The preferred production-data path is:

```text
Debian 12 or 13 node
Python venv
source data intake
geometry cleanup
Kane-grid assignment
static output generation
copy prepared files to local drive or repo
browser renders prepared static files offline
```

This is a preference, not a hard dependency.

## Current next step

Add the first data-processing-node skeleton:

```text
tools/
  processing/
    README.md
    requirements.txt
    scripts/
      inspect_source.py
      normalize_geometry.py
      build_manifest.py
```

This should remain separate from the browser app and should not be required to open `index.html`.
