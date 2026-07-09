(function attachViewport(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const MAX_ZOOM = 12.0;

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

  function rotateBy(state, degrees) {
    state.bearing = config.normalizeBearing(state.bearing + degrees);
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
    zoomBy,
    rotateBy,
    resetView
  };
})(window);
