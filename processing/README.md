# Kane-Map processing scaffold

This folder is the offline production-data preparation area for Kane-Map.

The browser application remains a static offline fieldwork tool. The processing folder is for heavier work that should happen outside the browser, preferably on a Debian 12 or Debian 13 node using a Python virtual environment.

No real Kane County geometry is imported by this scaffold.

## Intended workflow

```text
source public data
  -> normalize and validate
  -> clip to Kane County
  -> simplify geometry
  -> assign Kane-grid cells
  -> generate static prepared data
  -> copy prepared outputs into the browser app
```

## Quick start

From the repository root:

```bash
cd processing
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python scripts/check_environment.py
```

The initial scaffold uses only the Python standard library. The virtual environment is still useful because later geometry tooling will likely add geospatial dependencies.

## Folder layout

```text
processing/
  README.md
  requirements.txt
  pyproject.toml
  input/
    README.md
  output/
    README.md
  scripts/
    check_environment.py
    build_manifest.py
    validate_prepared_data.py
  kane_map_processing/
    __init__.py
    config.py
    manifest.py
    validation.py
```

## Input folder

Use `processing/input/` for downloaded or copied source files.

Do not commit large raw files unless they are deliberately small test fixtures.

## Output folder

Use `processing/output/` for prepared Kane-Map static outputs.

The browser app should eventually consume files copied from this folder.

## Manifest

The manifest records file names, sizes, hashes, and basic metadata. It gives the browser app and the maintainer a stable way to know what prepared data is present.

Run:

```bash
python scripts/build_manifest.py
```

Validate:

```bash
python scripts/validate_prepared_data.py
```

## Design rule

Heavy processing happens outside the browser.

Field use happens inside the browser.

The browser consumes prepared static data.
