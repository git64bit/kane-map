# Source Acquisition Notes

Batch 028 records candidate source URLs and acquisition notes. It does not authorize automatic downloading yet.

## Current acquisition rule

```text
Do not download or transform production geometry until the source, license/reuse posture, and local-file target are reviewed.
```

## Candidate sources

| Source ID | Layer | Status | Candidate source | Local target |
|---|---|---:|---|---|
| `kane-county-boundary` | `county_boundary` | planned | U.S. Census TIGER/Line county boundary ZIP | `raw/kane-county-boundary.geojson` |
| `kane-address-points` | `address_points` | planned | Kane County address-point ArcGIS FeatureServer | `raw/kane-address-points.geojson` |
| `kane-building-footprints` | `buildings` | candidate | Illinois Flood Maps Kane MS building-footprint ZIP | `raw/kane-building-footprints.geojson` |
| `kane-road-centerlines` | `roads` | planned | U.S. Census TIGER/Line Kane roads ZIP | `raw/kane-road-centerlines.geojson` |
| `kane-water-polygons` | `water` | planned | U.S. Census TIGER/Line Kane area-water ZIP | `raw/kane-water-polygons.geojson` |
| `kane-forest-polygons` | `forests` | deferred | no confirmed polygon source yet | `raw/kane-forest-polygons.geojson` |

## Notes by source

### County boundary

The current candidate is the national TIGER/Line county-boundary ZIP. Processing should filter it to:

```text
STATEFP = 17
COUNTYFP = 089
```

The prepared output should contain only Kane County, Illinois.

### Address points

The current candidate is the Kane County address-point ArcGIS FeatureServer. This layer can help locate known address points, but it does not replace field observations and should not be treated as an HOA unit roster.

### Building footprints

The current candidate is the Kane MS building-footprint ZIP published through Illinois Flood Maps. This is a geometry source only. Building-footprint polygons may not represent individual residential buildings cleanly, and they may need classification, cleanup, clipping, and field confirmation.

### Roads

The current candidate is the county-specific TIGER/Line roads ZIP for FIPS `17089`.

### Water polygons

The current candidate is the county-specific TIGER/Line area-water ZIP for FIPS `17089`.

### Forests / wooded polygons

No confirmed production source has been selected. Kane County forest-preserve boundaries, tree canopy, and general wooded land cover are not the same thing. This layer remains deferred until the intended meaning is narrowed.

## Script

Use this command to print current candidate URLs:

```bash
python scripts/show_source_urls.py
```

The script reports URLs only. It does not download anything.
