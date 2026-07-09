# Chunk Manifest Validation

The prepared chunk manifest is the local index used by the browser-facing loader.
It lists each chunked prepared layer and the chunk files belonging to that layer.

## Manifest Location

```text
processing/output/chunks/prepared-layers/chunk_manifest.json
```

## Complete Prepared Layer Set

A complete local real-data chunk set should include:

```text
address_points
buildings
county_boundary
roads
water
```

## Expected Feature Total

The prepared bundle previously validated at:

```text
396,005 features
```

The chunked manifest should match that total after the county boundary is added.

## Layer Normalization

Earlier chunk batches wrote valid chunk entries, but not every layer used the same
summary fields. Batch 053 normalizes each layer entry so every layer has:

```text
feature_count
chunk_count
bytes
chunks
```

This makes the manifest easier for the browser loader to consume.

## Validation Performed

The Batch 053 script checks:

1. required layers are present;
2. global totals equal the sum of layer totals;
3. layer totals equal the sum of chunk entries where available;
4. the county boundary chunk is written as a single chunk.

## Field Use

The county boundary is not a field observation target. It is a map constraint.
It gives the browser loader a visible jurisdiction boundary and helps prevent
Kane-Map from drifting outside the county-based scope.
