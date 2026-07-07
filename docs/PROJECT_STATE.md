# Kane-Map Project State

Last updated: 2026-07-07

## Current phase

Phase 1 — Browser-only synthetic prototype.

Phase 0 documentation has been started. The next repo batch adds the first runnable prototype.

## Current repository direction

The repository should now contain documentation plus a single-file prototype:

```text
LICENSE
README.md
ROADMAP.md
docs/
  ARCHITECTURE.md
  DATA_MODEL.md
  FIELDWORK_RULES.md
  PROJECT_STATE.md
index.html
```

## What `index.html` does

The first prototype is intentionally synthetic.

It renders:

- dark gray map background
- Kane-style grid cells
- readable grid labels such as `N11-E05`
- red residential building blocks
- visible 1, 2, and 3 story height differences
- white road lines
- blue ponds
- green forest polygons
- basic map controls for zoom, pitch, and rotation
- a legend and status panels

No real Kane County data has been imported yet.

## Why synthetic data comes first

The visual and technical model should be proven before importing real GIS layers.

Synthetic data lets the project test:

- browser-side rendering
- MapLibre setup
- grid labeling
- building extrusion
- visual contrast
- layer ordering
- simple fieldwork-oriented UI

## Current technical stack

The prototype uses:

```text
MapLibre GL JS from CDN
single HTML file
inline JavaScript
inline synthetic GeoJSON
browser WebGL rendering
```

This is not the final structure. It is a proof-of-rendering milestone.

## Next technical step

After confirming that `index.html` renders correctly in the browser, split the code into modules:

```text
src/main.js
src/data/demoFeatures.js
src/map/initMap.js
src/map/grid.js
src/map/layers.js
```

Do not split the code until the single-file prototype is confirmed working.

## Fieldwork boundary remains unchanged

Kane-Map field observation is visible observation only.

Do not:

- touch mailboxes
- open mailboxes
- insert anything into mailboxes
- remove anything from mailboxes
- read mail
- record resident names
- enter locked or restricted areas
- bypass access control
- treat an unlocked area as automatically lawful access

The useful observation is the visible unit designator and building/unit-count pattern, not resident identity and not mail content.
