(function attachDrawPrimitives(global) {
  "use strict";

  function pathPolygon(ctx, worldToScreen, polygon, heightPx = 0) {
    ctx.beginPath();
    polygon.forEach((point, index) => {
      const [x, y] = worldToScreen(point);
      const sy = y - heightPx;
      if (index === 0) ctx.moveTo(x, sy);
      else ctx.lineTo(x, sy);
    });
    ctx.closePath();
  }

  function pathPolyline(ctx, worldToScreen, path) {
    ctx.beginPath();
    path.forEach((point, index) => {
      const [x, y] = worldToScreen(point);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
  }

  function fillPolygon(ctx, worldToScreen, polygon, fill, stroke, lineWidth = 1) {
    pathPolygon(ctx, worldToScreen, polygon);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function polygonBounds(polygon) {
    const xs = polygon.map((point) => point[0]);
    const ys = polygon.map((point) => point[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  function centroid(polygon) {
    const total = polygon.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
    return [total[0] / polygon.length, total[1] / polygon.length];
  }

  global.KaneMapDrawPrimitives = {
    pathPolygon,
    pathPolyline,
    fillPolygon,
    polygonBounds,
    centroid
  };
})(window);
