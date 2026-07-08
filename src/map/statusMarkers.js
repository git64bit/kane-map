(function attachStatusMarkers(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const primitives = global.KaneMapDrawPrimitives;
  const viewport = global.KaneMapViewport;

  function colorForStatus(status) {
    if (status === "verified") return config.COLORS.statusVerified;
    if (status === "conflict") return config.COLORS.statusConflict;
    if (status === "revisit-needed" || status === "pattern-inferred") return config.COLORS.statusWarning;
    return config.COLORS.statusObserved;
  }

  function drawBuildingStatusMarker(ctx, state, bounds, building, heightPx) {
    const summary = state.recordSummaryByBuilding[building.id];
    if (!summary) return;

    const [x, y] = viewport.worldToScreen(state, bounds, primitives.centroid(building.polygon));
    const statusColor = colorForStatus(summary.status);
    const label = summary.observedUnitCount === null ? "?" : String(summary.observedUnitCount);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 18, y - heightPx - 23, 11, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = config.COLORS.labelHalo;
    ctx.stroke();

    ctx.font = "800 9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#11171b";
    ctx.fillText(label.slice(0, 3), x + 18, y - heightPx - 23);
    ctx.restore();
  }

  global.KaneMapStatusMarkers = {
    colorForStatus,
    drawBuildingStatusMarker
  };
})(window);
