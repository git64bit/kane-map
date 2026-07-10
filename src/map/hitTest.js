(function attachHitTest(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const viewport = global.KaneMapViewport;

  function hitTest(data, grid, state, bounds, screenPoint) {
    const worldPoint = viewport.screenToWorld(state, bounds, screenPoint);
    const cell = global.KaneMapGrid.findCell(grid, worldPoint);
    const fineCell = findFineCell(state, worldPoint);
    const detailCell = fineCell
      ? findDetailCellByCode(state, fineCell.detailParentCode)
      : findDetailCell(state, worldPoint);
    const building = config.practicalFeaturesVisible(state)
      ? [...data.buildings].reverse().find((candidate) => (
          global.KaneMapGrid.polygonContainsPoint(candidate.polygon, worldPoint)
        )) || null
      : null;

    return { worldPoint, cell, detailCell, fineCell, building };
  }

  function findDetailCell(state, worldPoint) {
    const cells = Array.isArray(state.detailGridCells) ? state.detailGridCells : [];
    if (!cells.length) return null;
    return cells.find((cell) => pointInCell(worldPoint, cell)) || null;
  }

  function findDetailCellByCode(state, code) {
    const cells = Array.isArray(state.detailGridCells) ? state.detailGridCells : [];
    if (!cells.length || !code) return null;
    return cells.find((cell) => cell.code === code) || null;
  }

  function findFineCell(state, worldPoint) {
    const cells = Array.isArray(state.fineGridCells) ? state.fineGridCells : [];
    if (!cells.length) return null;
    return cells.find((cell) => pointInCell(worldPoint, cell)) || null;
  }

  function pointInCell(point, cell) {
    return Array.isArray(point) && point.length >= 2 &&
      point[0] >= cell.minX && point[0] <= cell.maxX &&
      point[1] >= cell.minY && point[1] <= cell.maxY;
  }

  global.KaneMapHitTest = { hitTest };
})(window);
