# Kane-Map Next Steps

Last updated: 2026-07-08

The codebase is now structurally clean enough to move from synthetic prototype work toward real-data planning.

## Current stable checkpoint

Completed and working:

```text
offline Canvas renderer
tabbed workspace
local field observations
edit/delete/import/export
search
coverage filters
field plan
visit sessions
keyboard shortcuts
app/controller refactor
renderer refactor
CSS refactor
documentation index
```

## Next recommended batch

```text
Batch 024 — real-data source plan
```

Purpose:

Identify and document the first real Kane County source layers before importing anything.

Do not import real GIS data yet.

Recommended files:

```text
docs/REAL_DATA_PLAN.md
docs/SOURCE_LAYERS.md
docs/DATA_LICENSE_CHECKLIST.md
docs/GEOMETRY_PIPELINE.md
```

Questions to answer:

```text
What public source should provide roads?
What public source should provide water/ponds?
What public source should provide forest/land-cover clues?
What source can provide building footprints?
What source can provide the Kane County boundary?
What license or terms apply to each source?
What fields should be retained?
What fields should be discarded?
What geometry simplification is acceptable?
How should source/version metadata be preserved?
```

Exit condition:

A future batch can import or hand-create real data without guessing the data source strategy.

## Batch 025 — local data format decision

Purpose:

Decide the first real static geometry format.

Candidate formats:

```text
chunked JS modules
static GeoJSON files
compressed JSON bundles
PMTiles later
custom compact arrays later
```

Current preference:

Use chunked JS modules for now because they open directly from `index.html` without `fetch()` restrictions.

Likely future path:

```text
Phase A: chunked JS demo modules
Phase B: generated chunked JS from real data
Phase C: optional static bundle builder
Phase D: optional PMTiles/vector tile path if needed
```

Exit condition:

The repo documents what data format it expects before real geometry is generated.

## Batch 026 — grid design lock

Purpose:

Make the Kane-grid naming scheme explicit and stable.

Questions:

```text
What is the grid origin?
What is the default cell size?
How are rows named?
How are columns named?
How are partial county-edge cells handled?
How does a building inherit a grid code?
How are future subcells named?
Should the current Nxx-Exx demo naming be retained or revised?
```

Exit condition:

Grid code generation is stable enough for records to depend on it.

## Batch 027 — real-data import prototype

Purpose:

Add a small, hand-limited real-data sample to prove the pipeline.

This should not attempt all of Kane County.

Recommended scope:

```text
one known area
one or two grid cells
roads/water/forest/building footprints if available
synthetic buildings retained elsewhere for comparison
```

Exit condition:

The app can display a small real-data patch while preserving the offline model.

## Batch 028 — observation record audit

Purpose:

Prepare the record model for long-term field use.

Review:

```text
schema fields
fieldwork boundary flags
site identity fields
visit session fields
plan priority fields
export fields
import blocking checks
search index fields
```

Exit condition:

The schema is stable enough to start collecting more real observations.

## Batch 029 — performance guardrails

Purpose:

Prevent the app from becoming slow as geometry grows.

Possible additions:

```text
visible-feature count
render-time estimate
chunk count
largest chunk warning
record count warning
optional debug overlay
```

Exit condition:

The app reports enough runtime state to detect when data growth starts hurting performance.

## Batch 030 — release packaging

Purpose:

Create a simple downloadable offline release package.

Possible files:

```text
README_OFFLINE_RELEASE.md
VERSION.txt
CHANGELOG.md
```

Possible output:

```text
kane-map-offline-v0.1.zip
```

Exit condition:

A user can download one zip, unzip it, open `index.html`, and understand how to back up records.

## Work to avoid for now

Avoid these until the real-data plan is documented:

```text
large UI feature expansion
new storage backend
server sync
authentication
live APIs
framework migration
MapLibre migration
PMTiles migration
multi-user collaboration
```

Reason:

The next major unknown is not UI or storage. It is the source-data strategy.

## Current one-line next step

Document the real-data source and geometry pipeline before importing Kane County data.
