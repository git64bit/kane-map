(function kaneMapMapGeometrySupport(global) {
  "use strict";

  function filterFeaturesByActiveCells(features, activeCells, geometryKey) {
    const input = Array.isArray(features) ? features : [];
    if (!input.length || !activeCells.length) return [];
    const activeCodes = new Set(activeCells.map((cell) => cell.code));
    return input.filter((feature) => featureBelongsToActiveCells(feature, activeCells, activeCodes, geometryKey));
  }

  function featureBelongsToActiveCells(feature, activeCells, activeCodes, geometryKey) {
    if (!feature) return false;

    const declaredCells = featureCellCodes(feature);
    if (declaredCells.length && declaredCells.some((code) => activeCodes.has(code))) return true;

    const points = featurePoints(feature, geometryKey);
    if (!points.length) return false;

    if (points.some((point) => activeCells.some((cell) => pointInCell(point, cell)))) return true;

    const bounds = boundsForPoints(points);
    return activeCells.some((cell) => boundsIntersect(bounds, cell));
  }

  function featureCellCodes(feature) {
    const output = [];
    [feature.cell, feature.cellCode, feature.gridCell, feature.grid_cell].forEach((code) => {
      if (typeof code === "string" && code) output.push(code);
    });
    if (Array.isArray(feature.cells)) {
      feature.cells.forEach((code) => {
        if (typeof code === "string" && code) output.push(code);
      });
    }
    return output;
  }

  function featurePoints(feature, geometryKey) {
    if (geometryKey === "point" && Array.isArray(feature.point)) return [feature.point];
    if (geometryKey === "path" && Array.isArray(feature.path)) return feature.path;
    if (geometryKey === "polygon" && Array.isArray(feature.polygon)) return feature.polygon;
    return [];
  }

  function pointInCell(point, cell) {
    return Array.isArray(point) && point.length >= 2 &&
      point[0] >= cell.minX && point[0] <= cell.maxX &&
      point[1] >= cell.minY && point[1] <= cell.maxY;
  }

  function boundsForPoints(points) {
    return points.reduce((bounds, point) => ({
      minX: Math.min(bounds.minX, point[0]),
      minY: Math.min(bounds.minY, point[1]),
      maxX: Math.max(bounds.maxX, point[0]),
      maxY: Math.max(bounds.maxY, point[1])
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  }

  function boundsIntersect(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
  }

  function polygonCenter(polygon) {
    if (!Array.isArray(polygon) || !polygon.length) return null;
    const xs = polygon.map((point) => point[0]);
    const ys = polygon.map((point) => point[1]);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2
    ];
  }

  global.KaneMapMapGeometrySupport = {
    filterFeaturesByActiveCells,
    featureBelongsToActiveCells,
    featurePoints,
    pointInCell,
    boundsForPoints,
    polygonCenter
  };
})(window);
