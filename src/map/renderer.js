(function attachRenderer(global) {
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

  function createRenderer(canvas, initialData, grid) {
    const ctx = canvas.getContext("2d");
    const bounds = initialData.meta.bounds;
    let data = initialData;

    const state = {
      width: 0,
      height: 0,
      zoom: 0.72,
      bearing: -18,
      pitchScale: 0.76,
      offsetX: 0,
      offsetY: 18,
      selectedBuildingId: null,
      selectedCellCode: null,
      recordSummaryByBuilding: {},
      buildingFilterIds: null,
      dragging: false,
      lastPointer: null
    };

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      state.width = Math.max(1, Math.floor(rect.width));
      state.height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(state.width * ratio);
      canvas.height = Math.floor(state.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      render();
    }

    function worldCenter() {
      return [
        (bounds.minX + bounds.maxX) / 2,
        (bounds.minY + bounds.maxY) / 2
      ];
    }

    function worldToScreen(point) {
      const [centerX, centerY] = worldCenter();
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

    function screenToWorld(point) {
      const [centerX, centerY] = worldCenter();
      const angle = (-state.bearing * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const sx = (point[0] - state.width / 2 - state.offsetX) / state.zoom;
      const sy = (point[1] - state.height / 2 - state.offsetY) / (state.zoom * state.pitchScale);
      const wx = sx * cos - sy * sin;
      const wy = sx * sin + sy * cos;
      return [wx + centerX, wy + centerY];
    }

    function visibleWorldBounds() {
      const points = [
        screenToWorld([0, 0]),
        screenToWorld([state.width, 0]),
        screenToWorld([state.width, state.height]),
        screenToWorld([0, state.height])
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

    function setData(nextData) {
      data = nextData;
      render();
    }

    function pathPolygon(polygon, heightPx = 0) {
      ctx.beginPath();
      polygon.forEach((point, index) => {
        const [x, y] = worldToScreen(point);
        const sy = y - heightPx;
        if (index === 0) ctx.moveTo(x, sy);
        else ctx.lineTo(x, sy);
      });
      ctx.closePath();
    }

    function pathPolyline(path) {
      ctx.beginPath();
      path.forEach((point, index) => {
        const [x, y] = worldToScreen(point);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    }

    function fillPolygon(polygon, fill, stroke, lineWidth = 1) {
      pathPolygon(polygon);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }

    function render() {
      if (!ctx) return;
      drawBackground();
      drawGrid();
      drawForests();
      drawWater();
      drawRoads();
      drawBuildings();
    }

    function drawBackground() {
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, state.width, state.height);
    }

    function drawGrid() {
      ctx.save();
      ctx.font = "600 15px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      grid.cells.forEach((cell) => {
        pathPolygon(cell.polygon);
        ctx.strokeStyle = cell.code === state.selectedCellCode ? COLORS.selected : COLORS.grid;
        ctx.lineWidth = cell.code === state.selectedCellCode ? 2 : 1;
        ctx.stroke();

        const [x, y] = worldToScreen(cell.center);
        ctx.lineWidth = 4;
        ctx.strokeStyle = COLORS.labelHalo;
        ctx.strokeText(cell.code, x, y);
        ctx.fillStyle = COLORS.gridText;
        ctx.fillText(cell.code, x, y);
      });
      ctx.restore();
    }

    function drawRoads() {
      ctx.save();
      data.roads.forEach((road) => {
        pathPolyline(road.path);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = COLORS.roadEdge;
        ctx.lineWidth = road.width * state.zoom + 5;
        ctx.stroke();

        pathPolyline(road.path);
        ctx.strokeStyle = COLORS.road;
        ctx.lineWidth = road.width * state.zoom;
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawWater() {
      data.water.forEach((feature) => fillPolygon(feature.polygon, COLORS.water, COLORS.waterEdge, 1.2));
    }

    function drawForests() {
      data.forests.forEach((feature) => {
        fillPolygon(feature.polygon, COLORS.forest, COLORS.forestEdge, 1);
        drawTreeDots(feature.polygon);
      });
    }

    function drawTreeDots(polygon) {
      const b = polygonBounds(polygon);
      const spacing = 48;
      ctx.save();
      ctx.fillStyle = "rgba(35, 76, 38, 0.34)";
      for (let y = b.minY + 20; y < b.maxY; y += spacing) {
        for (let x = b.minX + 18; x < b.maxX; x += spacing) {
          if (!global.KaneMapGrid.polygonContainsPoint(polygon, [x, y])) continue;
          const [sx, sy] = worldToScreen([x, y]);
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(1.5, state.zoom * 5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function drawBuildings() {
      const sorted = [...data.buildings].sort((a, b) => centroid(a.polygon)[1] - centroid(b.polygon)[1]);
      sorted.forEach(drawBuilding);
    }

    function drawBuilding(building) {
      const heightPx = building.stories * 16 * Math.max(0.75, state.zoom);
      const selected = building.id === state.selectedBuildingId;
      const filteredOut = state.buildingFilterIds && !state.buildingFilterIds.has(building.id);

      ctx.save();
      ctx.globalAlpha = filteredOut && !selected ? 0.18 : 1;
      drawBuildingSides(building.polygon, heightPx, selected);

      pathPolygon(building.polygon, heightPx);
      ctx.fillStyle = selected ? COLORS.selected : COLORS.buildingTop;
      ctx.fill();
      ctx.strokeStyle = selected ? "#fff4bf" : "rgba(255, 226, 220, 0.8)";
      ctx.lineWidth = selected ? 2.5 : 1.2;
      ctx.stroke();
      drawBuildingLabel(building, heightPx);
      drawBuildingStatusMarker(building, heightPx);
      ctx.restore();
    }

    function drawBuildingSides(polygon, heightPx, selected) {
      for (let i = 0; i < polygon.length; i += 1) {
        const next = (i + 1) % polygon.length;
        const a = worldToScreen(polygon[i]);
        const b = worldToScreen(polygon[next]);
        const aTop = [a[0], a[1] - heightPx];
        const bTop = [b[0], b[1] - heightPx];
        const shade = i % 2 === 0 ? COLORS.buildingSide : COLORS.buildingSideDark;

        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(bTop[0], bTop[1]);
        ctx.lineTo(aTop[0], aTop[1]);
        ctx.closePath();
        ctx.fillStyle = selected ? "#a77a2f" : shade;
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawBuildingLabel(building, heightPx) {
      const [x, y] = worldToScreen(centroid(building.polygon));
      ctx.save();
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.labelHalo;
      ctx.strokeText(building.label, x, y - heightPx - 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(building.label, x, y - heightPx - 8);
      ctx.restore();
    }

    function drawBuildingStatusMarker(building, heightPx) {
      const summary = state.recordSummaryByBuilding[building.id];
      if (!summary) return;

      const [x, y] = worldToScreen(centroid(building.polygon));
      const statusColor = colorForStatus(summary.status);
      const label = summary.observedUnitCount === null ? "?" : String(summary.observedUnitCount);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + 18, y - heightPx - 23, 11, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.labelHalo;
      ctx.stroke();

      ctx.font = "800 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#11171b";
      ctx.fillText(label.slice(0, 3), x + 18, y - heightPx - 23);
      ctx.restore();
    }

    function colorForStatus(status) {
      if (status === "verified") return COLORS.statusVerified;
      if (status === "conflict") return COLORS.statusConflict;
      if (status === "revisit-needed" || status === "pattern-inferred") return COLORS.statusWarning;
      return COLORS.statusObserved;
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

    function centerOnWorldPoint(point) {
      const [x, y] = worldToScreen(point);
      state.offsetX += state.width / 2 - x;
      state.offsetY += state.height / 2 - y;
      render();
    }

    function centerOnPolygon(polygon) {
      centerOnWorldPoint(centroid(polygon));
    }

    function zoomBy(factor) {
      state.zoom = clamp(state.zoom * factor, 0.35, 2.4);
      render();
    }

    function rotateBy(degrees) {
      state.bearing = normalizeBearing(state.bearing + degrees);
      render();
    }

    function resetView() {
      state.zoom = 0.72;
      state.bearing = -18;
      state.offsetX = 0;
      state.offsetY = 18;
      render();
    }

    function setSelected(building, cell) {
      state.selectedBuildingId = building ? building.id : null;
      state.selectedCellCode = cell ? cell.code : null;
      render();
    }

    function setBuildingRecordSummary(summaryByBuilding) {
      state.recordSummaryByBuilding = summaryByBuilding || {};
      render();
    }

    function setBuildingFilter(buildingIds) {
      state.buildingFilterIds = Array.isArray(buildingIds) ? new Set(buildingIds) : null;
      render();
    }

    function hitTest(screenPoint) {
      const worldPoint = screenToWorld(screenPoint);
      const cell = global.KaneMapGrid.findCell(grid, worldPoint);
      const building = [...data.buildings].reverse().find((candidate) => (
        global.KaneMapGrid.polygonContainsPoint(candidate.polygon, worldPoint)
      )) || null;

      return { worldPoint, cell, building };
    }

    function beginDrag(point) {
      state.dragging = true;
      state.lastPointer = point;
      canvas.classList.add("dragging");
    }

    function dragTo(point) {
      if (!state.dragging || !state.lastPointer) return;
      state.offsetX += point[0] - state.lastPointer[0];
      state.offsetY += point[1] - state.lastPointer[1];
      state.lastPointer = point;
      render();
    }

    function endDrag() {
      state.dragging = false;
      state.lastPointer = null;
      canvas.classList.remove("dragging");
    }

    return {
      state,
      resize,
      render,
      setData,
      visibleWorldBounds,
      zoomBy,
      rotateBy,
      resetView,
      setSelected,
      setBuildingRecordSummary,
      setBuildingFilter,
      centerOnWorldPoint,
      centerOnPolygon,
      hitTest,
      beginDrag,
      dragTo,
      endDrag
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeBearing(value) {
    let next = value % 360;
    if (next > 180) next -= 360;
    if (next < -180) next += 360;
    return next;
  }

  global.KaneMapRenderer = {
    createRenderer
  };
})(window);
