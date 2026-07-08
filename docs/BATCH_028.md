# Batch 028 — Source Acquisition Notes

Batch 028 adds candidate source-acquisition metadata and reporting.

## Added

```text
processing/kane_map_processing/source_urls.py
processing/scripts/show_source_urls.py
processing/input/sources/source_notes.md
docs/SOURCE_ACQUISITION.md
docs/BATCH_028.md
```

## Updated

```text
processing/input/sources/source_registry.json
```

## What changed

The source registry now includes:

- candidate source URLs
- source pages
- candidate query notes
- raw source format notes
- acquisition mode
- license/reuse review notes

## What did not change

Batch 028 does not:

- download files
- query ArcGIS services
- transform geometry
- normalize files
- create prepared browser chunks
- change browser app behavior
- change field-observation records

## Test commands

From `processing/`:

```bash
python scripts/check_environment.py
python scripts/list_sources.py
python scripts/show_source_urls.py
python scripts/validate_sources.py
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

Expected result:

```text
source URL report prints candidate URLs
source files remain missing
source validation passes
intake report shows present 0 / missing 6
prepared-data validation passes
```

## Pull command for node

After pushing Batch 028 to GitHub:

```bash
git -C ~/kane-map pull
cd ~/kane-map/processing
```

Then run the test commands above.
