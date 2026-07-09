(function attachDrawLayers(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const primitives = global.KaneMapDrawPrimitives;
  const viewport = global.KaneMapViewport;
  const statusMarkers = global.KaneMapStatusMarkers;

  const BUILDING_DETAIL_ZOOM = 2.25;
  const BUILDING_LABEL_ZOOM = 3.25;
  const MAX_BUILDINGS_WITHOUT_ZOOM = 1200;
  const MAX_LABELS_WITHOUT_HIGH_ZOOM = 250;

  function drawMap(ctx, state, bounds, data, grid) {
    const worldToScreen = (point) => viewport.worldToScreen(state, bounds, point);
    const layers = state.layerVisibility || {};

    drawBackground(ctx, state);
    drawCountyBoundary(ctx, data, worldToScreen);
    drawGrid(ctx, state, grid, worldToScreen);

    ctx.save();
    if (clipToActiveCells(ctx, state, grid, worldToScreen)) {
      if (layers.forests) drawForests(ctx, state, data, worldToScreen);
      if (layers.water) drawWater(ctx, data, worldToScreen);
      if (layers.roads) drawRoads(ctx, state, data, worldToScreen);
      if (layers.addressPoints) drawAddressPoints(ctx, state, data, worldToScreen);
      if (layers.buildings) drawBuildings(ctx, state, bounds, data, worldToScreen);
    }
    ctx.restore();
  }

  function clipToActiveCells(ctx, state, grid, worldToScreen) {
    const activeCodes = new Set(Array.isArray(state.activeCellCodes) ? state.activeCellCodes : []);
    if (!activeCodes.size || !grid || !Array.isArray(grid.cells)) return false;

    const activeCells = grid.cells.filter((cell) => activeCodes.has(cell.code));
    if (!activeCells.length) return false;

    ctx.beginPath();
    activeCells.forEach((cell) => {
      const polygon = cell.polygon || [];
      if (!polygon.length) return;
      const first = worldToScreen(polygon[0]);
      ctx.moveTo(first[0], first[1]);
      for (let i = 1; i < polygon.length; i += 1) {
        const point = worldToScreen(polygon[i]);
        ctx.lineTo(point[0], point[1]);
      }
      ctx.closePath();
    });
    ctx.clip();
    return true;
  }

  function drawBackground(ctx, state) {
    ctx.fillStyle = config.COLORS.background;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawCountyBoundary(ctx, data, worldToScreen) {
    const boundaries = Array.isArray(data.countyBoundary) ? data.countyBoundary : [];
    if (!boundaries.length) return;

    ctx.save();
    boundaries.forEach((feature) => {
      primitives.pathPolygon(ctx, worldToScreen, feature.polygon);
      ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 233, 168, 0.95)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawGrid(ctx, state, grid, worldToScreen) {
    const activeCells = new Set(Array.isArray(state.activeCellCodes) ? state.activeCellCodes : []);

    ctx.save();
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    grid.cells.forEach((cell) => {
      const selected = cell.code === state.selectedCellCode;
      const active = activeCells.has(cell.code);
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active) {
        ctx.fillStyle = "rgba(255, 233, 168, 0.08)";
        ctx.fill();
      }
      ctx.strokeStyle = selected ? config.COLORS.selected : active ? "rgba(255, 233, 168, 0.82)" : config.COLORS.grid;
      ctx.lineWidth = selected ? 2.4 : active ? 1.8 : 1;
      ctx.stroke();

      const [x, y] = worldToScreen(cell.center);
      ctx.lineWidth = 4;
      ctx.strokeStyle = config.COLORS.labelHalo;
      ctx.strokeText(cell.code, x, y);
      ctx.fillStyle = active || selected ? config.COLORS.selected : config.COLORS.gridText;
      ctx.fillText(cell.code, x, y);
    });

    ctx.restore();
  }

  function drawRoads(ctx, state, data, worldToScreen) {
    const roads = Array.isArray(data.roads) ? data.roads : [];
    if (!roads.length) return;

    ctx.save();

    roads.forEach((road) => {
      primitives.pathPolyline(ctx, worldToScreen, road.path);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = config.COLORS.roadEdge;
      ctx.lineWidth = road.width * state.zoom + 5;
      ctx.stroke();

      primitives.pathPolyline(ctx, worldToScreen, road.path);
      ctx.strokeStyle = config.COLORS.road;
      ctx.lineWidth = road.width * state.zoom;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawWater(ctx, data, worldToScreen) {
    const water = Array.isArray(data.water) ? data.water : [];
    water.forEach((feature) => {
      primitives.fillPolygon(ctx, worldToScreen, feature.polygon, config.COLORS.water, config.COLORS.waterEdge, 1.2);
    });
  }

  function drawForests(ctx, state, data, worldToScreen) {
    const forests = Array.isArray(data.forests) ? data.forests : [];
    forests.forEach((feature) => {
      primitives.fillPolygon(ctx, worldToScreen, feature.polygon, config.COLORS.forest, config.COLORS.forestEdge, 1);
      drawTreeDots(ctx, state, feature.polygon, worldToScreen);
    });
  }

  function drawTreeDots(ctx, state, polygon, worldToScreen) {
    const b = primitives.polygonBounds(polygon);
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

  function drawAddressPoints(ctx, state, data, worldToScreen) {
    const points = Array.isArray(data.addressPoints) ? data.addressPoints : [];
    if (!points.length) return;

    const drawLabels = state.layerVisibility && state.layerVisibility.labels && state.zoom >= BUILDING_LABEL_ZOOM;
    const radius = Math.max(2, Math.min(6, state.zoom * 2.2));

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "600 10px system-ui, sans-serif";

    points.forEach((item) => {
      const [x, y] = worldToScreen(item.point);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 234, 143, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 24, 26, 0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (drawLabels && item.address) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = config.COLORS.labelHalo;
        ctx.strokeText(item.address, x + radius + 4, y);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(item.address, x + radius + 4, y);
      }
    });

    ctx.restore();
  }

  function drawBuildings(ctx, state, bounds, data, worldToScreen) {
    const buildings = Array.isArray(data.buildings) ? data.buildings : [];
    if (!buildings.length) return;

    const selectedBuilding = selectedBuildingFrom(buildings, state.selectedBuildingId);
    if (!shouldDrawBuildingDetail(state, buildings)) {
      if (selectedBuilding) drawBuilding(ctx, state, bounds, selectedBuilding, worldToScreen, { forceLabel: true });
      return;
    }

    const sorted = [...buildings].sort((a, b) => primitives.centroid(a.polygon)[1] - primitives.centroid(b.polygon)[1]);
    const drawLabels = shouldDrawBuildingLabels(state, sorted);
    sorted.forEach((building) => drawBuilding(ctx, state, bounds, building, worldToScreen, { drawLabel: drawLabels }));
  }

  function selectedBuildingFrom(buildings, selectedBuildingId) {
    if (!selectedBuildingId) return null;
    return buildings.find((building) => building.id === selectedBuildingId) || null;
  }

  function shouldDrawBuildingDetail(state, buildings) {
    if (state.zoom >= BUILDING_DETAIL_ZOOM) return true;
    return buildings.length <= MAX_BUILDINGS_WITHOUT_ZOOM;
  }

  function shouldDrawBuildingLabels(state, buildings) {
    if (!(state.layerVisibility && state.layerVisibility.labels)) return false;
    if (state.zoom >= BUILDING_LABEL_ZOOM) return true;
    return buildings.length <= MAX_LABELS_WITHOUT_HIGH_ZOOM;
  }

  function drawBuilding(ctx, state, bounds, building, worldToScreen, options) {
    const heightPx = building.stories * 16 * Math.max(0.75, state.zoom);
    const selected = building.id === state.selectedBuildingId;
    const filteredOut = state.buildingFilterIds && !state.buildingFilterIds.has(building.id);
    const drawLabel = selected || Boolean(options && (options.forceLabel || options.drawLabel));

    ctx.save();
    ctx.globalAlpha = filteredOut && !selected ? 0.18 : 1;

    drawBuildingSides(ctx, building.polygon, heightPx, selected, worldToScreen);
    primitives.pathPolygon(ctx, worldToScreen, building.polygon, heightPx);
    ctx.fillStyle = selected ? config.COLORS.selected : config.COLORS.buildingTop;
    ctx.fill();
    ctx.strokeStyle = selected ? "#fff4bf" : "rgba(255, 226, 220, 0.8)";
    ctx.lineWidth = selected ? 2.5 : 1.2;
    ctx.stroke();

    if (drawLabel) drawBuildingLabel(ctx, building, heightPx, worldToScreen);
    statusMarkers.drawBuildingStatusMarker(ctx, state, bounds, building, heightPx);

    ctx.restore();
  }

  function drawBuildingSides(ctx, polygon, heightPx, selected, worldToScreen) {
    for (let i = 0; i < polygon.length; i += 1) {
      const next = (i + 1) % polygon.length;
      const a = worldToScreen(polygon[i]);
      const b = worldToScreen(polygon[next]);
      const aTop = [a[0], a[1] - heightPx];
      const bTop = [b[0], b[1] - heightPx];
      const shade = i % 2 === 0 ? config.COLORS.buildingSide : config.COLORS.buildingSideDark;

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

  function drawBuildingLabel(ctx, building, heightPx, worldToScreen) {
    const [x, y] = worldToScreen(primitives.centroid(building.polygon));

    ctx.save();
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = config.COLORS.labelHalo;
    ctx.strokeText(building.label, x, y - heightPx - 8);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(building.label, x, y - heightPx - 8);
    ctx.restore();
  }

  global.KaneMapDrawLayers = {
    drawMap
  };
})(window);
