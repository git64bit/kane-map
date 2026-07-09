# Address Point Chunking

## Why this exists

The prepared Kane County address point layer contains 219,626 point features. The browser should not load that full file as one unit during field use.

Batch 052 creates a smaller chunked form of the address point layer.

## Input

```text
processing/output/prepared/address_points.json
```

## Output

```text
processing/output/chunks/prepared-layers/address_points/
```

Chunk files are named:

```text
address_points_000001.json
address_points_000002.json
...
```

Each chunk is a GeoJSON `FeatureCollection` with:

- layer name
- chunk index
- feature count
- source file path
- generated timestamp
- bounding box
- feature list

## Manifest update

The script updates:

```text
processing/output/chunks/prepared-layers/chunk_manifest.json
```

The manifest is normalized so it can preserve the earlier roads, water, and buildings chunk entries while adding address points.

## Dry run first

Run the dry run first:

```bash
PYTHONPATH=. python scripts/chunk_address_points_layer.py
```

Expected dry-run result with the current prepared layer:

```text
Source features: 219626
Chunks: 44
Max features/chunk: 5000
```

## Execute

After the dry run is correct:

```bash
PYTHONPATH=. python scripts/chunk_address_points_layer.py --execute
```

## Memory behavior

Unlike the simplified building chunker, the address-point chunker streams feature objects from the GeoJSON features array. It does not load the full `address_points.json` layer into memory.

## Current limitation

This is still sequential chunking, not spatial tiling.

Each chunk has a bounding box so later browser-side and processing-side code can move toward spatial loading or spatial indexes without changing the prepared address-point source.
