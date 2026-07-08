(function attachHitTest(global) {
  "use strict";

  const viewport = global.KaneMapViewport;

  function hitTest(data, grid, state, bounds, screenPoint) {
    const worldPoint = viewport.screenToWorld(state, bounds, screenPoint);
    const cell = global.KaneMapGrid.findCell(grid, worldPoint);
    const building = [...data.buildings].reverse().find((candidate) => (
      global.KaneMapGrid.polygonContainsPoint(candidate.polygon, worldPoint)
    )) || null;

    return { worldPoint, cell, building };
  }

  global.KaneMapHitTest = {
    hitTest
  };
})(window);
