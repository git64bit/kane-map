# Prepared Data Packaging

Prepared layers are generated under:

```text
processing/output/prepared/
```

Batch 046 adds a packaging step that copies those generated layers into a versioned browser-loadable bundle under:

```text
processing/output/bundles/
```

Generated bundles are local production artifacts and should not be committed to GitHub.

## Commands

Dry run:

```bash
python scripts/package_prepared_data.py
```

Write a bundle:

```bash
python scripts/package_prepared_data.py --execute
```

Write a named bundle:

```bash
python scripts/package_prepared_data.py --execute --bundle-name kane-map-prepared-local
```

Write a named bundle and ZIP it:

```bash
python scripts/package_prepared_data.py --execute --force --bundle-name kane-map-prepared-local --zip
```

The ZIP uses stored files by default. Use `--compress` only when compression time is acceptable.

## Bundle layout

```text
processing/output/bundles/<bundle-name>/
  README.txt
  bundle_manifest.json
  layers/
    address_points.json
    buildings.json
    county_boundary.json
    roads.json
    water.json
```

The bundle manifest records file names, sizes, source prepared directory, source manifest, and optional hashes.
