(function attachViewport(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const MAX_ZOOM = 48.0;

  function worldCenter(bounds) {
    return [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
  }

  function worldToScreen(state, bounds, point) {
    const [centerX, centerY] = worldCenter(bounds);
    const angle = (state.bearing * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point[0] - centerX;
    const dy = point[1] - centerY;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return [
      state.width / 2 + state.offsetX + rx * state.zoom,
      state.height / 2 + state.offsetY + ry * state.zoom * state.pitchScale
    ];
  }

  function screenToWorld(state, bounds, point) {
    const [centerX, centerY] = worldCenter(bounds);
    const angle = (-state.bearing * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const sx = (point[0] - state.width / 2 - state.offsetX) / state.zoom;
    const sy = (point[1] - state.height / 2 - state.offsetY) / (state.zoom * state.pitchScale);
    const wx = sx * cos - sy * sin;
    const wy = sx * sin + sy * cos;
    return [wx + centerX, wy + centerY];
  }

  function visibleWorldBounds(state, bounds) {
    const points = [
      screenToWorld(state, bounds, [0, 0]),
      screenToWorld(state, bounds, [state.width, 0]),
      screenToWorld(state, bounds, [state.width, state.height]),
      screenToWorld(state, bounds, [0, state.height])
    ];
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }

  function centerOnWorldPoint(state, bounds, point) {
    const [x, y] = worldToScreen(state, bounds, point);
    state.offsetX += state.width / 2 - x;
    state.offsetY += state.height / 2 - y;
  }

  function zoomBy(state, factor) {
    state.zoom = config.clamp(state.zoom * factor, 0.35, MAX_ZOOM);
  }

  function fitPolygon(state, bounds, polygon, padding) {
    if (!Array.isArray(polygon) || polygon.length < 2) return;
    const margin = Math.max(24, Number.isFinite(padding) ? padding : 72);
    const xs = polygon.map((point) => point[0]);
    const ys = polygon.map((point) => point[1]);
    const center = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2
    ];
    const angle = (state.bearing * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let maxRx = 0;
    let maxRy = 0;

    polygon.forEach((point) => {
      const dx = point[0] - center[0];
      const dy = point[1] - center[1];
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      maxRx = Math.max(maxRx, Math.abs(rx));
      maxRy = Math.max(maxRy, Math.abs(ry));
    });

    const availableWidth = Math.max(1, state.width - margin * 2);
    const availableHeight = Math.max(1, state.height - margin * 2);
    const zoomX = maxRx > 0 ? availableWidth / (maxRx * 2) : MAX_ZOOM;
    const zoomY = maxRy > 0 ? availableHeight / (maxRy * 2 * state.pitchScale) : MAX_ZOOM;
    state.zoom = config.clamp(Math.min(zoomX, zoomY), 0.35, MAX_ZOOM);
    centerOnWorldPoint(state, bounds, center);
  }

  function resetView(state) {
    state.zoom = 0.72;
    state.bearing = -18;
    state.offsetX = 0;
    state.offsetY = 18;
  }

  global.KaneMapViewport = {
    worldCenter,
    worldToScreen,
    screenToWorld,
    visibleWorldBounds,
    centerOnWorldPoint,
    fitPolygon,
    zoomBy,
    resetView
  };
})(window);
