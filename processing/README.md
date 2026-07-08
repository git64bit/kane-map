# Kane-Map processing scaffold

This folder is the offline production-data preparation area for Kane-Map.

The browser application remains a static offline fieldwork tool. The processing folder is for heavier work that should happen outside the browser, preferably on a Debian 12 or Debian 13 node using a Python virtual environment.

## Current node workflow

From an interactive login as `kaneproc`, the shell should already be in the venv and in:

```text
/home/kaneproc/kane-map/processing
```

## Common checks

```bash
python scripts/check_environment.py
python scripts/list_sources.py
python scripts/validate_sources.py
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

## Downloads and staging

Downloaded original files go here:

```text
processing/input/downloads/
```

Working raw GeoJSON files go here:

```text
processing/input/raw/
```

Browser-ready prepared files will later go here:

```text
processing/output/prepared/
```

## Current conversion scripts

```bash
python scripts/convert_roads_zip.py
python scripts/convert_roads_zip.py --execute

python scripts/convert_water_zip.py
python scripts/convert_water_zip.py --execute

python scripts/convert_county_boundary_zip.py
python scripts/convert_county_boundary_zip.py --execute
```

All conversion scripts are dry-run by default.

## Design rule

Heavy processing happens outside the browser.

Field use happens inside the browser.

The browser consumes prepared static data.
