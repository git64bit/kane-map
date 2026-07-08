# Batch 038 — Streaming Raw Inspection

Batch 038 changes raw GeoJSON inspection from full-file loading to streaming feature-by-feature inspection.

## Reason

The staged address-points file can be over 300 MB. On a 1 GB Debian node, loading the entire FeatureCollection into memory can cause the process to be killed.

## Change

Updated:

```text
processing/kane_map_processing/raw_inspection.py
```

The inspection now scans the GeoJSON `features` array and decodes one feature at a time.

## Expected result

`inspect_raw_sources.py` should be able to inspect the full address-points file on the current node.

## No behavior changes

This batch does not change:

- browser app
- prepared data
- source registry
- download process
- merge process
- schema
