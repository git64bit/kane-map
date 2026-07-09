# Batch 054 — Package Chunked Bundle

This batch packages the locally generated chunked prepared layers into a browser-ready bundle.

It does not regenerate chunks. It reads:

```text
processing/output/chunks/prepared-layers/
```

and writes a packaged bundle under:

```text
processing/output/bundles/
```

## Added files

```text
processing/kane_map_processing/chunked_package.py
processing/scripts/package_chunked_data.py
docs/CHUNKED_BUNDLE_PACKAGING.md
docs/BATCH_054.md
```

## Default behavior

The script runs in dry-run mode unless `--execute` is provided.

```bash
PYTHONPATH=. python scripts/package_chunked_data.py
PYTHONPATH=. python scripts/package_chunked_data.py --execute
```

## Expected input state

Batch 053 should already have produced a complete chunk manifest with:

```text
5 layers
85 chunks
396,005 features
```

## Output

Execution creates a timestamped bundle similar to:

```text
processing/output/bundles/kane-map-chunked-prepared-YYYYMMDDTHHMMSSZ/
```

The bundle contains:

```text
README.txt
chunk_manifest.json
layers/
  address_points/
  buildings/
  county_boundary/
  roads/
  water/
```

The packaged manifest rewrites chunk paths to bundle-relative paths so the browser can load them without absolute filesystem paths.
