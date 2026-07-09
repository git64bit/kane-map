# Batch 053 — County Boundary Chunk and Manifest Validation

## Purpose

Batch 053 adds the final prepared layer to the chunked local output:

- `county_boundary`

It also normalizes the chunk manifest so every layer records the same fields:

- `feature_count`
- `chunk_count`
- `bytes`
- `chunks`

## Files Added

```text
processing/kane_map_processing/county_boundary_chunking.py
processing/scripts/chunk_county_boundary_layer.py
docs/BATCH_053.md
docs/CHUNK_MANIFEST_VALIDATION.md
```

## Expected Result

After Batch 052, the manifest contained four chunked layers:

```text
roads
water
buildings
address_points
```

The feature total was `396,004`.

The missing feature is the county boundary polygon.

After this batch executes, the expected complete chunked total is:

```text
396,005 features
```

Expected layer count:

```text
5 layers
```

Expected layers:

```text
address_points
buildings
county_boundary
roads
water
```

## Commands

Dry run:

```bash
PYTHONPATH=. python scripts/chunk_county_boundary_layer.py
```

Execute:

```bash
PYTHONPATH=. python scripts/chunk_county_boundary_layer.py --execute
```

## Output

The script writes:

```text
processing/output/chunks/prepared-layers/county_boundary/county_boundary_000001.json
processing/output/chunks/prepared-layers/chunk_manifest.json
processing/output/reports/county_boundary_chunking_report.json
```

Generated output remains local and should not be committed to GitHub.
