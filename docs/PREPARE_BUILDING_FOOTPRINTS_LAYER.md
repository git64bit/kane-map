# Prepare Building Footprints Layer

The building-footprint preparation step creates the browser-ready building layer from the staged raw building-footprint GeoJSON.

Input:

```text
processing/input/raw/kane-building-footprints.geojson
```

Output:

```text
processing/output/prepared/buildings.json
```

The prepared output is a GeoJSON FeatureCollection with Kane-Map building IDs and selected source fields.

The current preparation step does not yet classify residential versus non-residential buildings. Every staged footprint is marked as a residential candidate until later filtering or classification is added.

The script writes a report to:

```text
processing/output/reports/building_footprints_preparation_report.json
```
