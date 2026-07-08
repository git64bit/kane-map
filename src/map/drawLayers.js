(function attachDrawLayers(global) {
  "use strict";

  const config = global.KaneMapRendererConfig;
  const primitives = global.KaneMapDrawPrimitives;
  const viewport = global.KaneMapViewport;
  const statusMarkers = global.KaneMapStatusMarkers;

  function drawMap(ctx, state, bounds, data, grid) {
    const worldToScreen = (point) => viewport.worldToScreen(state, bounds, point);

    drawBackground(ctx, state);
    drawGrid(ctx, state, grid, worldToScreen);
    drawForests(ctx, state, data, worldToScreen);
    drawWater(ctx, data, worldToScreen);
    drawRoads(ctx, state, data, worldToScreen);
    drawBuildings(ctx, state, bounds, data, worldToScreen);
  }

  function drawBackground(ctx, state) {
    ctx.fillStyle = config.COLORS.background;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawGrid(ctx, state, grid, worldToScreen) {
    ctx.save();
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    grid.cells.forEach((cell) => {
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      ctx.strokeStyle = cell.code === state.selectedCellCode ? config.COLORS.selected : config.COLORS.grid;
      ctx.lineWidth = cell.code === state.selectedCellCode ? 2 : 1;
      ctx.stroke();

      const [x, y] = worldToScreen(cell.center);
      ctx.lineWidth = 4;
      ctx.strokeStyle = config.COLORS.labelHalo;
      ctx.strokeText(cell.code, x, y);
      ctx.fillStyle = config.COLORS.gridText;
      ctx.fillText(cell.code, x, y);
    });
    ctx.restore();
  }

  function drawRoads(ctx, state, data, worldToScreen) {
    ctx.save();
    data.roads.forEach((road) => {
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
    data.water.forEach((feature) => {
      primitives.fillPolygon(ctx, worldToScreen, feature.polygon, config.COLORS.water, config.COLORS.waterEdge, 1.2);
    });
  }

  function drawForests(ctx, state, data, worldToScreen) {
    data.forests.forEach((feature) => {
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

  function drawBuildings(ctx, state, bounds, data, worldToScreen) {
    const sorted = [...data.buildings].sort((a, b) => primitives.centroid(a.polygon)[1] - primitives.centroid(b.polygon)[1]);
    sorted.forEach((building) => drawBuilding(ctx, state, bounds, building, worldToScreen));
  }

  function drawBuilding(ctx, state, bounds, building, worldToScreen) {
    const heightPx = building.stories * 16 * Math.max(0.75, state.zoom);
    const selected = building.id === state.selectedBuildingId;
    const filteredOut = state.buildingFilterIds && !state.buildingFilterIds.has(building.id);

    ctx.save();
    ctx.globalAlpha = filteredOut && !selected ? 0.18 : 1;
    drawBuildingSides(ctx, building.polygon, heightPx, selected, worldToScreen);

    primitives.pathPolygon(ctx, worldToScreen, building.polygon, heightPx);
    ctx.fillStyle = selected ? config.COLORS.selected : config.COLORS.buildingTop;
    ctx.fill();
    ctx.strokeStyle = selected ? "#fff4bf" : "rgba(255, 226, 220, 0.8)";
    ctx.lineWidth = selected ? 2.5 : 1.2;
    ctx.stroke();
    drawBuildingLabel(ctx, building, heightPx, worldToScreen);
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
