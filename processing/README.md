# Kane-Map processing scaffold

This folder is the offline production-data preparation area for Kane-Map.

The browser application remains a static offline fieldwork tool. The processing folder is for heavier work that should happen outside the browser, preferably on a Debian 12 or Debian 13 node using a Python virtual environment.

No real Kane County geometry is imported by this scaffold.

## Intended workflow

```text
source public data
  -> copy/download into processing/input/raw
  -> register in processing/input/sources/source_registry.json
  -> validate source presence and provenance
  -> normalize and validate
  -> clip to Kane County
  -> simplify geometry
  -> assign Kane-grid cells
  -> generate static prepared data
  -> copy prepared outputs into the browser app
```

## Quick start on the processing node

The current dedicated-user layout is:

```text
/home/kaneproc/kane-map/                    repo
/home/kaneproc/kane-map/processing/         processing scripts
/home/kaneproc/.venvs/kane-map-processing/  Python venv
```

From an interactive login as `kaneproc`, the shell should already be in the venv and in `~/kane-map/processing`.

Run:

```bash
python scripts/check_environment.py
python scripts/list_sources.py
python scripts/validate_sources.py
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

## Folder layout

```text
processing/
  README.md
  requirements.txt
  pyproject.toml
  input/
    raw/
    sources/
      source_registry.json
  output/
    prepared/
    reports/
    manifest.json
  scripts/
    check_environment.py
    list_sources.py
    validate_sources.py
    intake_sources.py
    build_manifest.py
    validate_prepared_data.py
  kane_map_processing/
    config.py
    manifest.py
    source_registry.py
    source_intake.py
    validation.py
```

## Source intake

Source intake is not transformation.

Batch 027 only answers:

```text
What source files are expected?
Are those files present?
How large are they?
What hash identifies them?
Which layer will each source eventually feed?
```

It does not yet answer:

```text
How should geometry be transformed?
How should records be simplified?
How should building IDs be assigned?
How should chunks be written?
```

## Manifest

The manifest now describes `processing/output/prepared/` only.

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


## Source acquisition reporting

Batch 028 adds candidate source URL reporting.

From this directory:

```bash
python scripts/show_source_urls.py
```

This command prints the current candidate URLs and local targets from `input/sources/source_registry.json`.

It does not download source files.
