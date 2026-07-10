(function attachDrawFeatureLayers(global) {
  "use strict";

  const BUILDING_DETAIL_ZOOM = 2.25;
  const MAX_BUILDINGS_WITHOUT_ZOOM = 1200;

  function drawRoads(ctx, state, data, worldToScreen) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
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
    const clamp = global.KaneMapDrawLayerSupport.clamp;
    const sourceWidth = Number.isFinite(road.width) ? road.width : 2;
    const zoomFactor = Math.sqrt(Math.max(0.5, state.zoom));
    const inner = clamp(sourceWidth * zoomFactor * 0.34, 1.1, 5.5);
    return { inner, edge: clamp(inner + 1.4, 2.1, 7.2) };
  }

  function drawWater(ctx, data, worldToScreen) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
    const water = Array.isArray(data.water) ? data.water : [];
    water.forEach((feature) => {
      primitives.fillPolygon(
        ctx,
        worldToScreen,
        feature.polygon,
        config.COLORS.water,
        config.COLORS.waterEdge,
        1.2
      );
    });
  }

  function drawForests(ctx, state, data, worldToScreen) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
    const forests = Array.isArray(data.forests) ? data.forests : [];
    forests.forEach((feature) => {
      primitives.fillPolygon(
        ctx,
        worldToScreen,
        feature.polygon,
        config.COLORS.forest,
        config.COLORS.forestEdge,
        1
      );
      drawTreeDots(ctx, state, feature.polygon, worldToScreen);
    });
  }

  function drawTreeDots(ctx, state, polygon, worldToScreen) {
    const clamp = global.KaneMapDrawLayerSupport.clamp;
    const primitives = global.KaneMapDrawPrimitives;
    const b = primitives.polygonBounds(polygon);
    const spacing = 48;

    ctx.save();
    ctx.fillStyle = "rgba(35, 76, 38, 0.34)";
    for (let y = b.minY + 20; y < b.maxY; y += spacing) {
      for (let x = b.minX + 18; x < b.maxX; x += spacing) {
        if (!global.KaneMapGrid.polygonContainsPoint(polygon, [x, y])) continue;
        const [sx, sy] = worldToScreen([x, y]);
        ctx.beginPath();
        ctx.arc(
          sx,
          sy,
          clamp(1.2 + Math.sqrt(Math.max(0, state.zoom)) * 0.35, 1.3, 3.2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawAddressPoints(ctx, state, data, worldToScreen) {
    const clamp = global.KaneMapDrawLayerSupport.clamp;
    const points = Array.isArray(data.addressPoints) ? data.addressPoints : [];
    if (!points.length) return;

    const radius = clamp(1.15 + Math.sqrt(Math.max(0, state.zoom)) * 0.38, 1.4, 3.1);
    ctx.save();
    points.forEach((item) => {
      const [x, y] = worldToScreen(item.point);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 234, 143, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 24, 26, 0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawBuildings(ctx, state, bounds, data, worldToScreen) {
    const primitives = global.KaneMapDrawPrimitives;
    const buildings = Array.isArray(data.buildings) ? data.buildings : [];
    if (!buildings.length) return;

    const selectedBuilding = selectedBuildingFrom(buildings, state.selectedBuildingId);
    if (!shouldDrawBuildingDetail(state, buildings)) {
      if (selectedBuilding) {
        drawBuilding(ctx, state, bounds, selectedBuilding, worldToScreen, { forceLabel: true });
      }
      return;
    }

    const sorted = [...buildings].sort(
      (a, b) => primitives.centroid(a.polygon)[1] - primitives.centroid(b.polygon)[1]
    );
    sorted.forEach((building) => drawBuilding(ctx, state, bounds, building, worldToScreen));
  }

  function selectedBuildingFrom(buildings, selectedBuildingId) {
    if (!selectedBuildingId) return null;
    return buildings.find((building) => building.id === selectedBuildingId) || null;
  }

  function shouldDrawBuildingDetail(state, buildings) {
    if (state.zoom >= BUILDING_DETAIL_ZOOM) return true;
    return buildings.length <= MAX_BUILDINGS_WITHOUT_ZOOM;
  }

  function buildingHeightPx(building, state) {
    const clamp = global.KaneMapDrawLayerSupport.clamp;
    const stories = Number.isFinite(building.stories) ? building.stories : 1;
    const selected = building.id === state.selectedBuildingId;
    if (!selected) return 0;
    return clamp(stories * Math.sqrt(Math.max(1, state.zoom)) * 1.6, 3, 14);
  }

  function drawBuilding(ctx, state, bounds, building, worldToScreen, options) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
    const statusMarkers = global.KaneMapStatusMarkers;
    const heightPx = buildingHeightPx(building, state);
    const selected = building.id === state.selectedBuildingId;
    const filteredOut = state.buildingFilterIds && !state.buildingFilterIds.has(building.id);
    const drawLabel = selected || Boolean(options && options.forceLabel);

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
    const config = global.KaneMapRendererConfig;
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
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
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

  global.KaneMapDrawFeatureLayers = {
    drawRoads,
    drawWater,
    drawForests,
    drawAddressPoints,
    drawBuildings
  };
})(window);
