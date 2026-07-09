# Batch 056 — Portable county app bundle

This batch adds processing-side packaging for a self-contained Kane County app folder.

The generated app folder is written under:

```text
processing/output/apps/
```

The generated app folder contains:

```text
index.html
src/
local chunked county data under data/kane-county/
APP_README.txt
portable_manifest.json
```

The data is copied from the packaged chunked bundle already created on the processing node.

The generated portable app folder is local output. It is not meant to be committed to GitHub.

## Commands

Dry run:

```bash
PYTHONPATH=. python scripts/package_portable_county_app.py
```

Execute:

```bash
PYTHONPATH=. python scripts/package_portable_county_app.py --execute
```

## Boundary

This batch does not add a launcher or a local HTTP server.

The launcher/local file-serving strategy is a later step.
