(function attachDrawLayers(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const primitives = global.KaneMapDrawPrimitives;
  const viewport = global.KaneMapViewport;
  const statusMarkers = global.KaneMapStatusMarkers;

  const BUILDING_DETAIL_ZOOM = 2.25;
  const BUILDING_LABEL_ZOOM = 5.5;
  const MAX_BUILDINGS_WITHOUT_ZOOM = 1200;
  const MAX_LABELS_WITHOUT_HIGH_ZOOM = 80;
  const FINE_GRID_LABEL_ZOOM = 8.0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawMap(ctx, state, bounds, data, grid) {
    const worldToScreen = (point) => viewport.worldToScreen(state, bounds, point);
    const layers = state.layerVisibility || {};

    drawBackground(ctx, state);
    drawCountyBoundary(ctx, data, worldToScreen);
    drawGrid(ctx, state, grid, worldToScreen);
    drawInspectionGrid(ctx, state, worldToScreen);
    drawFineGrid(ctx, state, worldToScreen);

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
    const activeCells = activeClipCells(state, grid);
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

  function activeClipCells(state, grid) {
    const mutedMainCodes = new Set(Array.isArray(state.mutedCellCodes) ? state.mutedCellCodes : []);
    const mutedDetailCodes = new Set(Array.isArray(state.mutedDetailCellCodes) ? state.mutedDetailCellCodes : []);
    const mutedFineCodes = new Set(Array.isArray(state.mutedFineCellCodes) ? state.mutedFineCellCodes : []);

    const activeFineCells = Array.isArray(state.activeFineCells) ? state.activeFineCells : [];
    const unmutedFineCells = activeFineCells.filter((cell) => !mutedMainCodes.has(cell.parentCode) && !mutedDetailCodes.has(cell.detailParentCode) && !mutedFineCodes.has(cell.code));
    if (unmutedFineCells.length || activeFineCells.length || mutedFineCodes.size) return unmutedFineCells;

    const activeDetailCells = Array.isArray(state.activeDetailCells) ? state.activeDetailCells : [];
    const unmutedDetailCells = activeDetailCells.filter((cell) => !mutedMainCodes.has(cell.parentCode) && !mutedDetailCodes.has(cell.code));
    if (unmutedDetailCells.length || activeDetailCells.length || mutedDetailCodes.size) return unmutedDetailCells;

    const activeCodes = new Set(Array.isArray(state.activeCellCodes) ? state.activeCellCodes : []);
    if (!activeCodes.size || !grid || !Array.isArray(grid.cells)) return [];
    return grid.cells.filter((cell) => activeCodes.has(cell.code) && !mutedMainCodes.has(cell.code));
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
    const mutedCells = new Set(Array.isArray(state.mutedCellCodes) ? state.mutedCellCodes : []);

    ctx.save();
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    grid.cells.forEach((cell) => {
      const selected = cell.code === state.selectedCellCode;
      const active = activeCells.has(cell.code);
      const muted = mutedCells.has(cell.code);
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active && !muted) {
        ctx.fillStyle = "rgba(255, 233, 168, 0.08)";
        ctx.fill();
      } else if (muted) {
        ctx.fillStyle = "rgba(90, 96, 101, 0.18)";
        ctx.fill();
      }
      ctx.strokeStyle = muted ? "rgba(160, 168, 176, 0.56)" : selected ? config.COLORS.selected : active ? "rgba(255, 233, 168, 0.82)" : config.COLORS.grid;
      ctx.lineWidth = selected ? 2.4 : active ? 1.8 : muted ? 1.4 : 1;
      ctx.stroke();

      const [x, y] = worldToScreen(cell.center);
      ctx.lineWidth = 4;
      ctx.strokeStyle = config.COLORS.labelHalo;
      ctx.strokeText(cell.code, x, y);
      ctx.fillStyle = muted ? "rgba(180, 188, 196, 0.82)" : active || selected ? config.COLORS.selected : config.COLORS.gridText;
      ctx.fillText(cell.code, x, y);
    });

    ctx.restore();
  }

  function drawInspectionGrid(ctx, state, worldToScreen) {
    const cells = Array.isArray(state.detailGridCells) ? state.detailGridCells : [];
    if (!cells.length) return;

    const activeDetailCells = new Set(Array.isArray(state.activeDetailCellCodes) ? state.activeDetailCellCodes : []);
    const mutedDetailCells = new Set(Array.isArray(state.mutedDetailCellCodes) ? state.mutedDetailCellCodes : []);
    const selectedDetailCellCode = state.selectedDetailCellCode || null;
    const drawLabels = state.zoom >= 5.8;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 10px system-ui, sans-serif";

    cells.forEach((cell) => {
      const active = activeDetailCells.has(cell.code);
      const muted = mutedDetailCells.has(cell.code);
      const selected = selectedDetailCellCode === cell.code;
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active && !muted) {
        ctx.fillStyle = "rgba(89, 168, 255, 0.12)";
        ctx.fill();
      } else if (muted) {
        ctx.fillStyle = "rgba(90, 96, 101, 0.20)";
        ctx.fill();
      }
      ctx.strokeStyle = muted ? "rgba(165, 174, 184, 0.62)" : selected ? "rgba(255, 244, 191, 0.95)" : active ? "rgba(89, 168, 255, 0.82)" : "rgba(120, 190, 255, 0.34)";
      ctx.lineWidth = selected ? 2 : active ? 1.4 : muted ? 1.2 : 0.75;
      ctx.stroke();

      if (drawLabels || selected || active || muted) {
        const [x, y] = worldToScreen(cell.center);
        const label = detailCellLabel(cell);
        ctx.lineWidth = 3;
        ctx.strokeStyle = config.COLORS.labelHalo;
        ctx.strokeText(label, x, y);
        ctx.fillStyle = muted ? "rgba(185, 192, 200, 0.9)" : selected || active ? "#fff4bf" : "rgba(174, 213, 255, 0.9)";
        ctx.fillText(label, x, y);
      }
    });

    ctx.restore();
  }

  function detailCellLabel(cell) {
    const row = Number.isFinite(cell.row) ? cell.row + 1 : "?";
    const col = Number.isFinite(cell.col) ? cell.col + 1 : "?";
    return `${row}-${col}`;
  }

  function drawFineGrid(ctx, state, worldToScreen) {
    const cells = Array.isArray(state.fineGridCells) ? state.fineGridCells : [];
    if (!cells.length) return;

    const activeFineCells = new Set(Array.isArray(state.activeFineCellCodes) ? state.activeFineCellCodes : []);
    const mutedFineCells = new Set(Array.isArray(state.mutedFineCellCodes) ? state.mutedFineCellCodes : []);
    const selectedFineCellCode = state.selectedFineCellCode || null;
    const drawLabels = state.zoom >= FINE_GRID_LABEL_ZOOM;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 9px system-ui, sans-serif";

    cells.forEach((cell) => {
      const active = activeFineCells.has(cell.code);
      const muted = mutedFineCells.has(cell.code);
      const selected = selectedFineCellCode === cell.code;
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active && !muted) {
        ctx.fillStyle = "rgba(255, 233, 168, 0.11)";
        ctx.fill();
      } else if (muted) {
        ctx.fillStyle = "rgba(92, 98, 104, 0.24)";
        ctx.fill();
      }
      ctx.strokeStyle = muted ? "rgba(178, 186, 194, 0.72)" : selected ? "rgba(255, 244, 191, 0.98)" : active ? "rgba(255, 233, 168, 0.86)" : "rgba(170, 215, 255, 0.28)";
      ctx.lineWidth = selected ? 1.7 : active ? 1.1 : muted ? 1.0 : 0.55;
      ctx.stroke();

      if (drawLabels || selected || active || muted) {
        const [x, y] = worldToScreen(cell.center);
        const label = fineCellLabel(cell);
        ctx.lineWidth = 3;
        ctx.strokeStyle = config.COLORS.labelHalo;
        ctx.strokeText(label, x, y);
        ctx.fillStyle = muted ? "rgba(190, 198, 206, 0.92)" : selected || active ? "#fff4bf" : "rgba(190, 225, 255, 0.9)";
        ctx.fillText(label, x, y);
      }
    });

    ctx.restore();
  }

  function fineCellLabel(cell) {
    const row = Number.isFinite(cell.row) ? cell.row + 1 : "?";
    const col = Number.isFinite(cell.col) ? cell.col + 1 : "?";
    return `${row}-${col}`;
  }

  function drawRoads(ctx, state, data, worldToScreen) {
    const roads = Array.isArray(data.roads) ? data.roads : [];
    if (!roads.length) return;

    ctx.save();

    roads.forEach((road) => {
      const width = roadScreenWidth(road, state);
      primitives.pathPolyline(ctx, worldToScreen, road.path);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = config.COLORS.roadEdge;
      ctx.lineWidth = width.edge;
      ctx.stroke();

      primitives.pathPolyline(ctx, worldToScreen, road.path);
      ctx.strokeStyle = config.COLORS.road;
      ctx.lineWidth = width.inner;
      ctx.stroke();
    });

    ctx.restore();
  }

  function roadScreenWidth(road, state) {
    const sourceWidth = Number.isFinite(road.width) ? road.width : 2;
    const zoomFactor = Math.sqrt(Math.max(0.5, state.zoom));
    const inner = clamp(sourceWidth * zoomFactor * 0.34, 1.1, 5.5);
    return {
      inner,
      edge: clamp(inner + 1.4, 2.1, 7.2)
    };
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
        ctx.arc(sx, sy, clamp(1.2 + Math.sqrt(Math.max(0, state.zoom)) * 0.35, 1.3, 3.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawAddressPoints(ctx, state, data, worldToScreen) {
    const points = Array.isArray(data.addressPoints) ? data.addressPoints : [];
    if (!points.length) return;

    const drawLabels = state.layerVisibility && state.layerVisibility.labels && state.zoom >= BUILDING_LABEL_ZOOM;
    const radius = clamp(1.15 + Math.sqrt(Math.max(0, state.zoom)) * 0.38, 1.4, 3.1);

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

  function buildingHeightPx(building, state) {
    const stories = Number.isFinite(building.stories) ? building.stories : 1;
    const selected = building.id === state.selectedBuildingId;
    if (!selected) return 0;
    return clamp(stories * Math.sqrt(Math.max(1, state.zoom)) * 1.6, 3, 14);
  }

  function drawBuilding(ctx, state, bounds, building, worldToScreen, options) {
    const heightPx = buildingHeightPx(building, state);
    const selected = building.id === state.selectedBuildingId;
    const filteredOut = state.buildingFilterIds && !state.buildingFilterIds.has(building.id);
    const drawLabel = selected || Boolean(options && (options.forceLabel || options.drawLabel));

    ctx.save();
    ctx.globalAlpha = filteredOut && !selected ? 0.18 : 1;

    if (heightPx > 1) drawBuildingSides(ctx, building.polygon, heightPx, selected, worldToScreen);
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
