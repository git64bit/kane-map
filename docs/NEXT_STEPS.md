# Next Steps

## Current next step

Batch 026 should add a processing-node skeleton.

Goal:

```text
Prepare the repo for Debian/Python geometry processing without importing real data yet.
```

Candidate files:

```text
tools/processing/README.md
tools/processing/requirements.txt
tools/processing/scripts/inspect_source.py
tools/processing/scripts/normalize_geometry.py
tools/processing/scripts/build_manifest.py
docs/PROCESSING_PIPELINE.md
```

## Why this is next

Batch 025 added the browser-side data adapter skeleton. The next missing piece is the external processing path that will eventually produce prepared static chunks.

## Do not do yet

Do not import real production geometry yet.

First define the processing tool structure, script responsibilities, output folders, and manifest format.

## Near-term sequence

```text
Batch 026 — processing-node skeleton
Batch 027 — prepared-data output format
Batch 028 — sample generated chunk from synthetic input
Batch 029 — source inspection reports
Batch 030 — first real-data intake experiment
```
