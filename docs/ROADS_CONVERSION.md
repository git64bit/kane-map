# Roads Conversion

Batch 031 adds the first ZIP/shapefile conversion step.

This batch converts only this source:

```text
kane-road-centerlines
```

Input:

```text
processing/input/downloads/kane-road-centerlines.zip
```

Output:

```text
processing/input/raw/kane-road-centerlines.geojson
```

The converter is dry-run by default.

```bash
python scripts/convert_roads_zip.py
```

Execute conversion:

```bash
python scripts/convert_roads_zip.py --execute
```

Overwrite an existing output file:

```bash
python scripts/convert_roads_zip.py --execute --force
```

After conversion:

```bash
python scripts/intake_sources.py
python scripts/build_manifest.py
python scripts/validate_prepared_data.py
```

This batch does not convert county boundary, buildings, water, or forests.
