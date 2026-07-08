# Processing Pipeline

Last updated: 2026-07-08

Batch 026 adds the first Debian/Python processing scaffold for Kane-Map.

This is not a real Kane County geometry import. It is the toolchain foundation for preparing static data that the offline browser application can consume later.

## Processing decision

Preferred production-data preparation environment:

```text
Debian 12 or Debian 13
Python virtual environment
standard Python scripts first
geospatial dependencies later if needed
flat static outputs copied into the browser app
```

This is a preference, not a hard dependency. The repository should not assume that the browser app requires a Debian server to run.

## Architectural boundary

```text
Heavy processing happens outside the browser.
Field use happens inside the browser.
The browser consumes prepared static data.
```

The processing node may use downloaded source data, public GIS exports, CSV, JSON, GeoJSON, Shapefile-derived outputs, or other local files.

The browser should not be responsible for heavy clipping, projection work, geometry repair, source normalization, or production chunk generation.

## Current scaffold

The new `processing/` folder contains:

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

## Current scripts

### `check_environment.py`

Checks Python version, platform, processing root, input folder, and output folder.

```bash
cd processing
python3 -m venv .venv
. .venv/bin/activate
python scripts/check_environment.py
```

### `build_manifest.py`

Builds `processing/output/manifest.json` from supported prepared files.

Supported prepared extensions in Batch 026:

```text
.csv
.json
.geojson
.js
```

### `validate_prepared_data.py`

Validates `processing/output/manifest.json` and checks that listed files exist and match their recorded size and SHA-256 hash.

## Manifest purpose

The manifest is the handoff record between processing and the browser app.

It records:

```text
manifest version
generated timestamp
file count
total bytes
file paths
file sizes
SHA-256 hashes
basic record-count estimates where possible
```

This gives Kane-Map a stable way to know what prepared static data is present.

## What this batch does not do

Batch 026 does not:

```text
import real Kane County geometry
fetch network data
perform geospatial clipping
assign buildings to Kane-grid cells
replace demo chunks
change browser app behavior
change local field records
add a database
```

## Next technical step

The next processing batch should add a tiny sample prepared-data fixture and prove that the manifest and validator behave correctly.

After that, add conversion scripts for real source layers one layer at a time:

```text
1. county boundary
2. grid cells
3. buildings
4. roads
5. water
6. forest/land-cover polygons
```
