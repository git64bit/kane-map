# Downloaded source files

This folder is for original acquired source files.

Examples:

```text
kane-county-boundary.zip
kane-address-points.geojson
kane-building-footprints.zip
kane-road-centerlines.zip
kane-water-polygons.zip
```

These files are local working data and should not be committed to GitHub.

Pipeline meaning:

```text
input/downloads/  original acquired source files
input/raw/        staged or converted working source files
output/prepared/  browser-ready Kane-Map data
```

Use:

```bash
python scripts/list_downloads.py
```

to report local downloaded files.
