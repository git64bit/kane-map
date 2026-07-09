# Prepared Data Chunking

Prepared data files are currently valid but too large to load as one browser payload once real layers are used.

Batch 049 adds a chunking step for prepared layers.

## Processing stages

```text
raw source data
  -> processing/output/prepared/*.json
  -> processing/output/chunks/prepared-layers/*
  -> browser-loadable data mode later
```

## Initial scope

This batch chunks only:

- `roads.json`
- `water.json`

These layers are small enough to verify the chunk format without risking the large building and address-point layers.

## Deferred layers

The following layers are not chunked yet:

- `buildings.json`
- `address_points.json`
- `county_boundary.json`

County boundary is tiny and does not need chunking.

Buildings and address points need a spatial chunking rule, not only a feature-count rule.

## Chunk file shape

Each chunk is written as a FeatureCollection with metadata:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "format": "kane-map-prepared-chunk",
    "layer": "roads",
    "chunk_index": 1,
    "feature_count": 2000
  },
  "features": []
}
```

## Chunk manifest

The chunk manifest records:

- chunk set name
- generation timestamp
- source layer file
- output chunk files
- feature counts
- byte sizes
- totals

## Browser rule

The browser should eventually load only the chunks it needs.

Do not wire the browser to load the full prepared bundle at once.
