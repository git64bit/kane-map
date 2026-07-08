# Download Inventory

Batch 030 adds a download inventory step to the Kane-Map processing pipeline.

The purpose is to make the local acquired data visible without confusing it with staged raw data or prepared browser data.

## Pipeline distinction

```text
processing/input/downloads/  original acquired files
processing/input/raw/        staged or converted working source files
processing/output/prepared/  browser-ready Kane-Map output
```

The download inventory reads the source registry and checks whether the expected files exist under `processing/input/downloads/`.

## Command

From `processing/`:

```bash
python scripts/list_downloads.py
```

The script prints:

- expected source downloads
- whether each expected file is present
- file sizes
- modification timestamps
- unregistered files in `downloads/`

It also writes:

```text
processing/output/reports/download_inventory_report.json
```

## Git rule

Downloaded source files are local working data.

Do not commit:

```text
processing/input/downloads/*
processing/input/raw/*
processing/output/prepared/*
processing/output/reports/*
```

The repository keeps only README placeholders and source code.
