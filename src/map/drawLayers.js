(function attachDrawLayers(global) {
  "use strict";

  function drawMap(ctx, state, bounds, data, grid) {
    const viewport = global.KaneMapViewport;
    const gridLayers = global.KaneMapDrawGridLayers;
    const featureLayers = global.KaneMapDrawFeatureLayers;
    const support = global.KaneMapDrawLayerSupport;
    const worldToScreen = (point) => viewport.worldToScreen(state, bounds, point);
    const layers = state.layerVisibility || {};

    gridLayers.drawBackground(ctx, state);
    gridLayers.drawCountyBoundary(ctx, data, worldToScreen);
    gridLayers.drawGrid(ctx, state, grid, worldToScreen);
    gridLayers.drawInspectionGrid(ctx, state, worldToScreen);
    gridLayers.drawFineGrid(ctx, state, worldToScreen);

    ctx.save();
    if (support.clipToActiveCells(ctx, state, grid, worldToScreen)) {
      if (layers.forests) featureLayers.drawForests(ctx, state, data, worldToScreen);
      if (layers.water) featureLayers.drawWater(ctx, data, worldToScreen);
      if (layers.roads) featureLayers.drawRoads(ctx, state, data, worldToScreen);
      if (layers.addressPoints) featureLayers.drawAddressPoints(ctx, state, data, worldToScreen);
      if (layers.buildings) featureLayers.drawBuildings(ctx, state, bounds, data, worldToScreen);
    }
    ctx.restore();
  }

  global.KaneMapDrawLayers = { drawMap };
})(window);
