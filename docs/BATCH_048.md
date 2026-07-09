# Batch 048 — Local Real-Data Loader Planning

## Purpose

Batch 048 documents the next browser-side transition: moving from synthetic demo data toward locally prepared Kane County data bundles.

This batch does not add browser code.

## Current prepared bundle checkpoint

The processing node produced and validated a prepared data bundle:

```text
output/bundles/kane-map-prepared-20260709T073802Z
```

Validated contents:

```text
county_boundary.json
roads.json
water.json
buildings.json
address_points.json
```

Validation result:

```text
status: ok
layers: 5
total features: 396,005
total size: about 173.6 MB
```

## Core design decision

The browser app must not load the full prepared bundle into memory at startup.

The app should support data modes:

```text
demo mode      = current synthetic local chunks
bundle mode    = prepared Kane County data loaded from local static files
```

Bundle mode should be added gradually and should begin with smaller layers first.

## Recommended browser integration order

1. County boundary
2. Water
3. Roads
4. Buildings
5. Address points

Address points should not be first because it is the largest point layer.

## Out of scope for this batch

- no code changes
- no schema changes
- no storage changes
- no loading of real data into the browser
- no GitHub storage of prepared output files
- no server requirement
