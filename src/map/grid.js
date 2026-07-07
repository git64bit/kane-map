(function attachGrid(global) {
  "use strict";

  function makeKaneGrid(bounds, options = {}) {
    const cols = options.cols || 6;
    const rows = options.rows || 4;
    const startNorth = options.startNorth || 11;
    const startEast = options.startEast || 5;
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const minX = bounds.minX + col * cellWidth;
        const minY = bounds.minY + row * cellHeight;
        const maxX = minX + cellWidth;
        const maxY = minY + cellHeight;
        const code = `N${startNorth + row}-E${String(startEast + col).padStart(2, "0")}`;

        cells.push({
          code,
          row,
          col,
          minX,
          minY,
          maxX,
          maxY,
          center: [(minX + maxX) / 2, (minY + maxY) / 2],
          polygon: [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]
        });
      }
    }

    return {
      bounds,
      cols,
      rows,
      cells
    };
  }

  function findCell(grid, point) {
    const [x, y] = point;
    return grid.cells.find((cell) => (
      x >= cell.minX && x <= cell.maxX && y >= cell.minY && y <= cell.maxY
    )) || null;
  }

  function polygonContainsPoint(polygon, point) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const intersects = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi);

      if (intersects) inside = !inside;
    }

    return inside;
  }

  global.KaneMapGrid = {
    makeKaneGrid,
    findCell,
    polygonContainsPoint
  };
})(window);
