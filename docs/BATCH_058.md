# Batch 058 — Portable Manifest Relative Paths

Batch 058 corrects the portable app packaging metadata.

## Change

`portable_manifest.json` no longer records the absolute processing-node source bundle path.

Removed from generated portable manifests:

```text
source_data_bundle: /home/kaneproc/...
```

Added instead:

```text
source_data_bundle_name
source_data_bundle_role
```

The portable application should only depend on files inside its own folder.

## Why this matters

The county app folder must be USB-copy ready. Absolute paths from the processing node are not valid on Windows, Mac, or another Linux/MATE machine.

## After pulling

Re-run portable app packaging to create a fresh app folder, then verify the new folder.
