# Portable App Verification

The portable app bundle is generated on the processing node. It is not pushed to
GitHub because it contains processed county data.

The verification step confirms whether the generated app folder is ready to copy
to a USB drive.

## Operating model

```text
GitHub repo
  code, documentation, processing scripts

Processing node
  raw source data
  prepared data
  chunks
  packaged county app

USB drive
  portable offline county application
```

The local browser interface may still need a local static file-serving launcher.
That launcher is separate from the data bundle and is not added in this batch.

## Default behavior

The verifier automatically selects the latest app folder under:

```text
processing/output/apps/
```

It expects a folder like:

```text
processing/output/apps/kane-county-map-YYYYMMDDTHHMMSSZ/
```

## Command

From `~/kane-map/processing`:

```bash
PYTHONPATH=. python scripts/verify_portable_county_app.py
```

To verify a specific app folder:

```bash
PYTHONPATH=. python scripts/verify_portable_county_app.py \
  --app-root output/apps/kane-county-map-20260709T103618Z
```

## Expected Kane County totals

```text
address_points: 219,626
buildings:      166,766
county_boundary:      1
roads:            9,326
water:              286

total features: 396,005
total chunks:        85
```

## Portability warning

The verifier checks whether `chunk_manifest.json` contains absolute paths from
the processing node, such as `/home/kaneproc/...`.

Absolute paths do not necessarily mean chunk files are missing, but they are not
USB-portable. A later normalization batch should rewrite chunk references to
relative paths if these warnings appear.

## Report file

The verification report is written to:

```text
processing/output/reports/portable_app_verification_report.json
```
