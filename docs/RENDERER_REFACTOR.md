# Renderer Refactor

Batch 021 splits the Kane-Map rendering system into smaller map modules.

## Purpose

The previous `src/map/renderer.js` file carried the full map rendering stack:

- viewport math
- world/screen conversion
- drawing primitives
- grid drawing
- road drawing
- water drawing
- forest drawing
- building extrusion drawing
- status markers
- hit testing
- pan/zoom/rotate state

That was still functional, but it was becoming the largest core JavaScript file. Before adding real Kane County geometry or more map behavior, the renderer needed a structural split.

## Result

The rendering stack now uses:

```text id="4ef7a7"
src/map/rendererConfig.js   colors and small renderer utilities
src/map/viewport.js         world/screen transforms and view movement
src/map/drawPrimitives.js   polygon, polyline, bounds, and centroid helpers
src/map/statusMarkers.js    observed-unit/status bubble drawing
src/map/drawLayers.js       grid, roads, water, forests, and buildings
src/map/hitTest.js          screen click to cell/building lookup
src/map/renderer.js         public renderer API and state coordinator
```

The public renderer API is intentionally unchanged.

Controllers should continue to call:

```text id="7cybcr"
renderer.resize()
renderer.render()
renderer.setData(data)
renderer.visibleWorldBounds()
renderer.zoomBy(factor)
renderer.rotateBy(degrees)
renderer.resetView()
renderer.setSelected(building, cell)
renderer.setBuildingRecordSummary(summary)
renderer.setBuildingFilter(buildingIds)
renderer.centerOnWorldPoint(point)
renderer.centerOnPolygon(polygon)
renderer.hitTest(screenPoint)
renderer.beginDrag(point)
renderer.dragTo(point)
renderer.endDrag()
```

## What did not change

This batch is a refactor only.

No intended change to:

- schema
- local storage
- JSON import/export
- CSV export
- field observations
- search
- keyboard shortcuts
- tabbed workspace
- drawing style
- map coordinates
- chunked data loading
- direct `index.html` offline use

## File-size policy

JSON and static data files may grow more freely.

Core JavaScript, HTML, and CSS should remain small enough to review manually. The current target remains roughly 500–700 lines or less per file, with preference for smaller controller and renderer modules.

## Development note

Future map features should usually attach to one of the smaller map modules rather than expanding `renderer.js` again.

Examples:

```text id="nma4vq"
new drawing behavior       -> drawLayers.js or a new drawing module
new selected marker style  -> statusMarkers.js
new map movement behavior  -> viewport.js
new click/selection logic  -> hitTest.js
new renderer API method    -> renderer.js
```
