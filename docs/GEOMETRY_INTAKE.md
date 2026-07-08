# Geometry Intake

Status: planning document.

This document describes how real geometry should be prepared before it enters Kane-Map.

## Core rule

Kane-Map should not import raw source geometry directly into the browser app.

Raw source data should first pass through a processing pipeline that produces simplified, versioned, offline-ready output.

## Preferred intake pipeline

```text
1. Acquire source data
2. Store raw source copy
3. Record source metadata
4. Normalize CRS/projection
5. Validate geometry
6. Clip or filter to Kane County
7. Simplify for browser rendering
8. Assign Kane-grid cells
9. Generate stable feature IDs
10. Split into chunks
11. Validate output counts
12. Export static files
13. Update data catalog
```

## Raw source preservation

Raw source files should be kept separate from processed output.

Suggested processing workspace:

```text
processing/sources/raw/
processing/sources/normalized/
processing/output/data/
processing/output/reports/
```

The runtime app should receive only the prepared output.

## Coordinate systems

The project may encounter data in:

- local Illinois / county projected systems
- Esri-specific projected systems
- Web Mercator
- WGS84 latitude/longitude
- Census TIGER/Line NAD83-style geographic coordinates

Processing should normalize geometry before chunk generation.

The browser renderer currently uses a simple local synthetic coordinate system. Real-data support should either:

1. convert real coordinates into Kane-Map local planar coordinates during processing, or
2. add a projection adapter that maps lon/lat or projected coordinates into render coordinates.

The first option is simpler for the current offline prototype.

## Geometry simplification

The browser should draw lightweight geometry.

Simplification rules:

```text
roads: preserve topology enough for visual orientation
water: preserve recognizable pond/lake shapes
forests: preserve broad orientation patches
buildings: preserve footprint shape enough for identification
parcels: optional; simplify heavily or keep hidden by default
```

Do not simplify field-observation records. Simplify only orientation/base geometry.

## Building records

A production building feature should have at minimum:

```text
building_id
source_building_id
source_name
source_date
grid_cell
geometry
height_stories_estimate
height_source
geometry_status
```

The existing demo IDs such as `B20` are not production-stable identifiers.

A future production ID might follow a format such as:

```text
KMB-N14-E08-B000020
```

This is only a draft pattern.

## Feature IDs

Feature IDs must be stable across regeneration whenever possible.

Preferred stability inputs:

```text
source object ID
source parcel number
building centroid rounded to safe precision
grid cell
geometry fingerprint/hash
```

If source data lacks stable IDs, processing scripts should generate IDs and preserve a crosswalk.

Example crosswalk:

```text
source_id, kane_building_id, grid_cell, source_name, geometry_hash
```

## Chunk generation

Geometry should be split by Kane-grid cell or related local chunk key.

Current direct-open app uses JavaScript chunk files. Future static JSON can sit alongside them.

Recommended output:

```text
data/chunks/N14-E08.js
data/json/N14-E08.json
data/catalog.json
```

The JavaScript chunk format preserves direct `file://` usability.

The JSON format preserves neutrality for local-server, proxy, and processing workflows.

## Validation checks

Every processing run should generate a report with:

```text
source record count
normalized record count
invalid geometry count
clipped record count
simplified record count
chunk count
feature count by chunk
feature count by layer
missing ID count
duplicate ID count
empty geometry count
large geometry warning count
```

## Intake statuses

Geometry status values:

```text
source-imported
source-normalized
source-simplified
manual-created
manual-adjusted
candidate
needs-review
source-conflict
retired
```

## Non-goal

The intake process should not solve every source conflict automatically.

It should preserve conflicts clearly enough that Kane-Map can display or export them later.

