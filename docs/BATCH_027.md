# Batch 027 — Source intake skeleton

Batch 027 adds the first real-data intake skeleton for the processing node.

## Added

```text
processing/input/raw/
processing/input/sources/source_registry.json
processing/output/prepared/
processing/output/reports/
processing/scripts/list_sources.py
processing/scripts/validate_sources.py
processing/scripts/intake_sources.py
processing/kane_map_processing/source_registry.py
processing/kane_map_processing/source_intake.py
docs/SOURCE_INTAKE.md
```

## Updated

```text
processing/README.md
processing/input/README.md
processing/output/README.md
processing/kane_map_processing/config.py
processing/scripts/build_manifest.py
processing/scripts/validate_prepared_data.py
```

## Behavior

No browser behavior changes.

No real Kane County geometry is imported.

No transformation is performed.

The new scripts only validate and report source-file readiness.

## Processing-node test

From `~/kane-map/processing`:

```bash
python scripts/check_environment.py
python scripts/list_sources.py
python scripts/validate_sources.py
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

Expected at this stage:

```text
source registry validation passed
source intake report written
prepared-data validation passed
```

Because the registry entries are placeholders, missing source files are allowed at this stage.

