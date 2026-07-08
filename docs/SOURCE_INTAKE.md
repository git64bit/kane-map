# Source intake

Batch 027 adds the first source-intake skeleton for the Debian/Python processing node.

It does not import real Kane County geometry. It creates the file and script path that will later support real imports.

## Purpose

Source intake records the existence and identity of raw public-data files before transformation.

The intake step should answer:

```text
which source files are expected
where they are stored locally
which Kane-Map layer they are intended to feed
whether they are present
how large they are
which SHA-256 hash identifies each file
whether the source registry is valid
```

It should not yet simplify, clip, transform, or publish geometry.

## Folder structure

```text
processing/input/
  raw/        copied/downloaded raw files
  sources/    source registry

processing/output/
  prepared/   browser-ready static data later
  reports/    processing reports
```

## Source registry

The registry file is:

```text
processing/input/sources/source_registry.json
```

Each source entry has:

```text
source_id
label
layer
status
authority
source_url
local_path
expected_format
required
notes
```

At Batch 027, entries are placeholders and are not required.

## Commands

From `processing/`:

```bash
python scripts/list_sources.py
python scripts/validate_sources.py
python scripts/intake_sources.py
```

The intake report is written to:

```text
processing/output/reports/source_intake_report.json
```

## Boundary

Raw source files are not browser application data.

The browser app should consume prepared static files only, after later transformation steps write validated chunks or prepared bundles.

