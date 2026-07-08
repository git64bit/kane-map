# Prepare Roads Layer

Batch 039 adds the first browser-ready prepared output step.

Input:

```text
processing/input/raw/kane-road-centerlines.geojson
```

Output:

```text
processing/output/prepared/roads.json
```

The script keeps the roads as GeoJSON features, reduces the properties to the fields Kane-Map needs, rounds coordinates, removes duplicate consecutive points, and writes a report.

Dry run:

```bash
python scripts/prepare_roads_layer.py
```

Execute:

```bash
python scripts/prepare_roads_layer.py --execute
```

Replace existing output:

```bash
python scripts/prepare_roads_layer.py --execute --force
```

After execution, rebuild the manifest:

```bash
python scripts/build_manifest.py
```
