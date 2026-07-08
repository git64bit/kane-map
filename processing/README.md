# Kane-Map Processing

This directory contains the Debian/Python processing toolchain for preparing static Kane-Map data.

## Current local workflow

```bash
python scripts/check_environment.py
python scripts/list_sources.py
python scripts/list_downloads.py
python scripts/stage_downloads.py
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

## Conversion commands

Address points are direct GeoJSON and can be staged with:

```bash
python scripts/stage_downloads.py --execute --source kane-address-points
```

Roads:

```bash
python scripts/convert_roads_zip.py
python scripts/convert_roads_zip.py --execute
```

Water:

```bash
python scripts/convert_water_zip.py
python scripts/convert_water_zip.py --execute
```

County boundary:

```bash
python scripts/convert_county_boundary_zip.py
python scripts/convert_county_boundary_zip.py --execute
```

Building footprints:

```bash
python scripts/convert_building_footprints_zip.py
python scripts/convert_building_footprints_zip.py --execute
```

## Folder meaning

```text
input/downloads/   original acquired files
input/raw/         staged or converted raw working files
output/prepared/   future browser-ready Kane-Map output
output/reports/    processing reports
```

Do not commit downloaded source files, raw converted files, or prepared production data unless explicitly decided later.
