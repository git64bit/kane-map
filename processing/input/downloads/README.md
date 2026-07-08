# Downloaded source files

This directory is for controlled downloaded source files.

Examples:

```text
kane-county-boundary.zip
kane-address-points.geojson
kane-building-footprints.zip
kane-road-centerlines.zip
kane-water-polygons.zip
```

Downloaded files are not automatically production-ready. They are source inputs.
Later processing scripts will convert, filter, clip, simplify, and normalize them
into `processing/input/raw/` and then into `processing/output/prepared/`.

Do not commit large downloaded source files unless the project deliberately
chooses to vendor a small static source snapshot.
