# Batch 029 — Controlled Source Downloader

Batch 029 adds a dry-run-first source downloader to the Debian/Python processing pipeline.

## Added

```text
processing/scripts/download_sources.py
processing/kane_map_processing/source_download.py
processing/input/downloads/README.md
docs/SOURCE_DOWNLOADER.md
docs/BATCH_029.md
```

## Updated

```text
processing/kane_map_processing/config.py
processing/kane_map_processing/source_registry.py
processing/kane_map_processing/source_urls.py
processing/scripts/show_source_urls.py
processing/input/sources/source_registry.json
processing/README.md
```

## Design

The downloader writes to:

```text
processing/input/downloads/
```

It does not write prepared browser data.
It does not transform geometry.
It does not replace the existing source-intake or manifest workflow.

## Safety behavior

Default command:

```bash
python scripts/download_sources.py
```

This prints the plan only.

Actual download requires:

```bash
python scripts/download_sources.py --execute
```

Existing files are kept unless:

```bash
python scripts/download_sources.py --execute --force
```

## Node test sequence

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing

python scripts/check_environment.py
python scripts/list_sources.py
python scripts/show_source_urls.py
python scripts/download_sources.py
python scripts/validate_sources.py
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

Optional single-source execution:

```bash
python scripts/download_sources.py --execute --source kane-address-points
```
