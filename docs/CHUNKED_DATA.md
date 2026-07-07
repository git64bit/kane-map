# Chunked Data

Last updated: 2026-07-07

## Purpose

Batch 006 introduces the first scale-oriented data structure.

The earlier prototype kept all demo features in one file. That is acceptable for a visual test, but it is not the correct mental model for a Kane County residential map.

Kane-Map should not load and scan every feature forever.

The working rule is:

```text
Split the base map into local chunks.
Materialize only the chunks relevant to the current view.
Keep observations separate from base geometry.
```

## Current implementation

The current batch still runs as a plain offline `index.html` file.

It does not use:

- network requests
- `fetch()`
- a server
- a database
- a package manager
- a build step
- a CDN

To preserve direct file opening, the demo chunks are ordinary JavaScript files:

```text
src/data/demoCatalog.js
src/data/chunkRegistry.js
src/data/chunks/regionalOrientation.js
src/data/chunks/westNeighborhood.js
src/data/chunks/centralTownhomes.js
src/data/chunks/eastApartments.js
```

Each chunk registers itself with `KaneMapChunkRegistry`.

The app decides which chunks to materialize based on the current visible grid cells.

## Why JavaScript chunks instead of JSON for now

A browser opened directly from the filesystem may block local `fetch()` calls to nearby JSON files.

JavaScript data chunks avoid that problem because they load through ordinary `<script>` tags.

This is not the final storage format. It is a practical offline prototype format.

## Future formats

Later versions may support:

```text
plain JSON chunks
compressed JSON bundles
PMTiles
SQLite/GeoPackage converted offline into static chunks
server-built release bundles
```

The current prototype keeps the runtime rule simple:

```text
No server is required to use the app.
```

## Data separation

Base geometry and field observations are different kinds of records.

Base geometry:

```text
roads
water
forests
building footprints
Kane-grid cells
```

Field observations:

```text
visible unit designators
observed unit count
field notes
confidence
visit status
hard-boundary flags
```

The base geometry can be replaced by a new release bundle.

The field observations belong to the user and should be exportable/importable as JSON.

## Current chunk behavior

The footer now shows:

```text
Chunks selected / total chunks
Visible cells selected / total grid cells
```

When the view changes, the app recomputes visible cells and rebuilds the render data from matching chunks.

Because this is still a small demo, most views may include most or all chunks. The point is the structure, not the current feature count.

## Long-term scale rule

Do not create one giant Kane County JavaScript array.

Prefer:

```text
data/chunks/N12-E05.js
data/chunks/N12-E06.js
data/chunks/N13-E05.js
```

or later:

```text
data/buildings/N12-E05.json
data/roads/N12-E05.json
data/water/N12-E05.json
```

The map should be able to load, render, search, and export data by grid cell or chunk.
