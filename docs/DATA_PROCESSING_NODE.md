# Data Processing Node

Status: planning standard.

This document describes the preferred processing environment for converting real Kane County geometry into Kane-Map offline data bundles.

## Preferred model

Kane-Map should treat real-data processing as a separate preparation step.

```text
Debian processing node
  -> Python virtual environment
  -> source-data intake
  -> geometry cleanup
  -> Kane-grid assignment
  -> static output files
  -> copied into Kane-Map local data folders
```

The browser application should remain simple and offline-first. It should consume prepared static files rather than performing heavy geospatial processing during field use.

## Preference, not hard requirement

The preferred processing system is:

```text
Operating system: Debian 12 or Debian 13
Runtime:          Python virtual environment
Output:           CSV, JSON, GeoJSON, JavaScript chunks, or another flat/static format
Deployment:       copied to local drive or committed into the repository
```

This is a preferred architecture, not a rule that blocks other processing tools.

Acceptable alternatives may include:

- another Linux distribution
- a local workstation
- containerized processing
- QGIS-assisted export
- command-line GDAL/OGR processing
- temporary SQLite/GeoPackage during processing

The production Kane-Map application should not require that same environment to run.

## Processing vs. runtime

Heavy processing belongs outside the browser.

Runtime fieldwork belongs inside the browser.

The browser should not need to know how source datasets were converted. It should only receive prepared, versioned, static geometry and record files.

## Why this fits Kane County

Kane County is not large enough to require a permanent database server for single-user offline mapping. The larger risk is poor source handling, inconsistent IDs, or uncontrolled geometry conversion.

The processing node should therefore focus on:

- repeatable scripts
- source provenance
- geometry normalization
- stable building IDs
- grid-cell assignment
- chunk generation
- export verification

## Processing outputs

Preferred output classes:

```text
data/catalog.json
  global data version and source inventory

data/chunks/*.js
  direct-open browser chunks for index.html mode

data/json/*.json
  neutral static geometry and metadata files

data/csv/*.csv
  inspection/export-friendly tabular files

data/reports/*.txt
  conversion logs and validation summaries
```

The direct-open offline app should continue to support JavaScript chunk files because many browsers restrict local `fetch()` from `file://` pages.

JSON should remain available as a neutral format for later local-server, sync, or proxy-based workflows.

## Python virtual environment outline

A future processing folder may use this shape:

```text
processing/
  README.md
  requirements.txt
  make_data.py
  scripts/
    fetch_sources.py
    normalize_geometry.py
    assign_grid_cells.py
    build_chunks.py
    validate_outputs.py
  sources/
    raw/
    normalized/
  output/
    data/
    reports/
```

The repository does not need to add this folder until the first real source dataset is selected.

## Non-goals

The processing node should not become a required runtime service.

It should not require a remote database for ordinary offline use.

It should not force the browser app to depend on Python, GDAL, QGIS, PostgreSQL, PostGIS, or any other processing dependency during fieldwork.

