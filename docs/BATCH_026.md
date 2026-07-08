# Batch 026 — Processing Scaffold

Batch 026 establishes the offline processing toolchain for future Kane County production data.

## Scope

Documentation and processing scaffold only.

## Added

```text
processing/README.md
processing/requirements.txt
processing/pyproject.toml
processing/input/README.md
processing/output/README.md
processing/scripts/check_environment.py
processing/scripts/build_manifest.py
processing/scripts/validate_prepared_data.py
processing/kane_map_processing/__init__.py
processing/kane_map_processing/config.py
processing/kane_map_processing/manifest.py
processing/kane_map_processing/validation.py
docs/PROCESSING_PIPELINE.md
```

## No behavior change

The offline browser app is not changed by this batch.

## Test commands

```bash
cd processing
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/check_environment.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

On an empty `processing/output/` folder, the manifest should contain zero prepared files and validation should pass.
