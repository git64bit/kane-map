# Raw source files

Copy downloaded public source files here.

Examples:

```text
processing/input/raw/kane-county-boundary.geojson
processing/input/raw/kane-address-points.geojson
processing/input/raw/kane-road-centerlines.geojson
processing/input/raw/kane-water-polygons.geojson
processing/input/raw/kane-forest-polygons.geojson
processing/input/raw/kane-building-footprints.geojson
```

Do not commit large raw source files unless they are deliberately small fixtures.

The normal pattern is:

```text
raw source files on processing node
  -> processing scripts
  -> prepared static output
  -> selected prepared files copied into the browser app later
```

