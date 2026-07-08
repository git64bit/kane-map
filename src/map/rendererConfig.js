(function attachRendererConfig(global) {
  "use strict";

  const COLORS = {
    background: "#202426",
    grid: "rgba(210, 220, 228, 0.42)",
    gridText: "rgba(241, 246, 250, 0.82)",
    road: "#f2f2ee",
    roadEdge: "rgba(20, 25, 28, 0.28)",
    water: "#2d72d9",
    waterEdge: "#79adff",
    forest: "#4f8b45",
    forestEdge: "#7cbf70",
    buildingTop: "#e15a45",
    buildingSide: "#a93128",
    buildingSideDark: "#7c241f",
    selected: "#ffe9a8",
    statusObserved: "#74b8ff",
    statusVerified: "#9fe28d",
    statusWarning: "#ffd17a",
    statusConflict: "#ff8a73",
    labelHalo: "rgba(20, 24, 26, 0.9)"
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeBearing(value) {
    let next = value % 360;
    if (next > 180) next -= 360;
    if (next < -180) next += 360;
    return next;
  }

  global.KaneMapRendererConfig = {
    COLORS,
    clamp,
    normalizeBearing
  };
})(window);
