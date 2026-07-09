# Batch 052 — Chunk Address Points Layer

## Purpose

Batch 052 adds address-point chunking for the prepared Kane County address point layer.

The prepared `address_points.json` file is large enough that it should not be treated as a single browser-loadable unit. This batch splits it into smaller local chunk files and updates the existing prepared-layer chunk manifest.

## Added files

- `processing/kane_map_processing/address_point_chunking.py`
- `processing/scripts/chunk_address_points_layer.py`
- `docs/ADDRESS_POINT_CHUNKING.md`
- `docs/BATCH_052.md`

## Behavior

The script reads:

```text
processing/output/prepared/address_points.json
```

It writes chunks under:

```text
processing/output/chunks/prepared-layers/address_points/
```

It updates:

```text
processing/output/chunks/prepared-layers/chunk_manifest.json
```

It writes a local report to:

```text
processing/output/reports/address_point_chunking_report.json
```

## Default chunk size

Default chunk size is 5,000 address-point features per chunk.

For 219,626 address points, this should produce 44 chunks.

## Run sequence

Dry run:

```bash
PYTHONPATH=. python scripts/chunk_address_points_layer.py
```

Execute:

```bash
PYTHONPATH=. python scripts/chunk_address_points_layer.py --execute
```

## Notes

Generated chunk files remain local processing output and should not be committed to GitHub.
