# Kane Grid Specification

Status: draft specification.

This document defines the current planning direction for the Kane-Map local grid.

## Purpose

The Kane grid is a county-local navigation and filing system.

It is not a legal boundary system, not a postal address system, and not a replacement for official GIS.

The grid provides a short human-readable way to locate buildings, observations, and fieldwork records inside Kane County.

## Design rule

```text
Kane-Map names places.
The address ledger records observations.
The unit list never becomes part of the public grid code.
```

## Draft naming pattern

Current demo-style labels:

```text
N14-E08
```

Longer future form:

```text
KANE-N14-E08
KANE-N14-E08-04
KANE-N14-E08-04-C3
```

The current app uses the short form in the UI.

## Recommended levels

```text
Level 1: County namespace
  KANE

Level 2: map tile / major cell
  KANE-N14-E08

Level 3: local subdivision
  KANE-N14-E08-04

Level 4: fine locator / building-area cell
  KANE-N14-E08-04-C3
```

The field-observation ledger sits below the grid and should not extend the public grid name.

## Building attachment

A grid cell may contain many buildings.

A building may carry many observations.

A single observation may include:

```text
site label
building alias
entrance ID
mailbox bank ID
visible designators
observed unit count
confidence
visit status
field session
planned action
```

Those fields belong to the ledger, not to the grid code.

## Grid generation

The grid should eventually be generated from a documented origin, cell size, and coordinate system.

Required future spec fields:

```text
origin_x
origin_y
coordinate_reference_system
major_cell_width
major_cell_height
subcell_width
subcell_height
row_direction
column_direction
county_clip_source
grid_version
```

## County clipping

The grid may be rectangular internally, but active cells should be clipped or flagged based on Kane County boundary intersection.

Cell statuses:

```text
active-county
edge-county
outside-county
retired
```

Only active or edge cells should appear in ordinary fieldwork views.

## Plus Code and H3 relationship

The Kane grid is a human navigation alias layer.

It may store interoperability fields later:

```text
plus_code
h3_res_9
h3_res_10
centroid_lat
centroid_lon
```

The public fieldwork UI should not expose H3 names as the primary navigation language.

## Production grid output

Recommended files:

```text
data/grid/catalog.json
data/grid/kane-grid-v001.json
data/grid/kane-grid-v001.js
```

The `.js` file supports direct `index.html` opening.

The `.json` file supports processing, local server mode, and future proxy mode.

## Versioning

The grid must have a version.

Example:

```text
grid_version: KANE-GRID-v001
```

Changing origin, cell size, row/column naming, or clipping rules should create a new grid version.

Field observations should store the grid version used at the time of observation if production grid changes become possible.

