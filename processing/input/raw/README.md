# Raw staged source files

This folder is for source files after they have been staged or converted into a working raw format.

Raw files are not the same as downloaded files. A downloaded file may be a ZIP archive, shapefile bundle, or direct GeoJSON. Raw files should be easier for the processing pipeline to read.

Expected early raw files:

```text
kane-address-points.geojson
kane-county-boundary.geojson
kane-building-footprints.geojson
kane-road-centerlines.geojson
kane-water-polygons.geojson
```

Batch 030 can stage direct GeoJSON downloads only. ZIP/shapefile conversion is handled later.

These files are local working data and should not be committed to GitHub.
