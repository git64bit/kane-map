# Building Chunking

The prepared building footprint layer is large enough that it should not be loaded into the browser as one file.

Batch 050 creates a dedicated chunking step for:

```text
processing/output/prepared/buildings.json
```

The output folder is:

```text
processing/output/chunks/prepared-layers/buildings/
```

## Default behavior

The script runs in dry-run mode by default.

```bash
python scripts/chunk_buildings_layer.py
```

To write chunks:

```bash
python scripts/chunk_buildings_layer.py --execute
```

## Default chunk size

The default is 5,000 features per chunk.

With the current prepared building layer, this should produce about 34 chunks.

## Reports

The script writes:

```text
processing/output/reports/buildings_chunking_report.json
```

Each chunk includes:

- layer name
- chunk index
- feature count
- source file
- prepared feature data

## Manifest behavior

The script writes a building-specific chunk manifest:

```text
processing/output/chunks/prepared-layers/buildings/buildings_chunk_manifest.json
```

It also attempts to update the root chunk manifest:

```text
processing/output/chunks/prepared-layers/chunk_manifest.json
```

The root manifest update is conservative and preserves existing content where possible.
