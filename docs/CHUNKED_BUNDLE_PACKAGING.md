# Chunked Bundle Packaging

The prepared data now exists in two local forms:

1. Prepared full-layer files.
2. Chunked prepared-layer files.

The browser should consume the chunked form because the full prepared data is too large to load as one static object.

## Source directory

The source chunk directory is:

```text
processing/output/chunks/prepared-layers/
```

It contains:

```text
chunk_manifest.json
address_points/
buildings/
county_boundary/
roads/
water/
```

## Package directory

The package script writes a timestamped bundle under:

```text
processing/output/bundles/
```

Example:

```text
processing/output/bundles/kane-map-chunked-prepared-20260709T120000Z/
```

## Bundle layout

The packaged bundle uses this browser-oriented layout:

```text
README.txt
chunk_manifest.json
layers/address_points/address_points_000001.json
layers/buildings/buildings_000001.json
layers/county_boundary/county_boundary_000001.json
layers/roads/roads_000001.json
layers/water/water_000001.json
```

## Why paths are rewritten

The working chunk manifest may contain local filesystem paths such as:

```text
/home/kaneproc/kane-map/processing/output/chunks/prepared-layers/roads/roads_000001.json
```

Those paths are not valid in the browser. During packaging, each chunk entry receives a bundle-relative path such as:

```text
layers/roads/roads_000001.json
```

The browser loader should use the relative path from the packaged manifest.

## Validation

The packaging script validates that:

- the source chunk manifest exists;
- all layer entries contain chunk records;
- every referenced chunk file exists;
- copied chunk count equals manifest chunk count;
- copied feature count equals manifest feature count;
- the packaged manifest uses relative paths.

## Local-only output

The packaged bundle is generated output. It should stay local and should not be committed to GitHub.
