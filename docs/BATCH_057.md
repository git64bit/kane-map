# Batch 057 — Portable App Verification

This batch adds a verifier for the generated Kane County portable app bundle.

The verifier checks the app bundle produced by Batch 056. It does not modify the
bundle and it does not copy data into Git.

## Added files

- `processing/kane_map_processing/portable_app_verify.py`
- `processing/scripts/verify_portable_county_app.py`
- `docs/PORTABLE_APP_VERIFICATION.md`
- `docs/BATCH_057.md`

## What it verifies

- required app files exist
- required app directories exist
- `portable_manifest.json` is present and readable
- `data/kane-county/chunk_manifest.json` is present and readable
- expected five layers are present
- expected 85 chunks are present
- expected 396,005 features are represented
- expected data files are present
- missing chunk files are reported
- absolute source paths in the chunk manifest are reported as portability warnings

## Intended command

From `~/kane-map/processing`:

```bash
PYTHONPATH=. python scripts/verify_portable_county_app.py
```

The script writes:

```text
processing/output/reports/portable_app_verification_report.json
```
