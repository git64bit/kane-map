(function kaneMapMapController(global) {
  "use strict";

  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;

  const LAYER_SPECS = Object.freeze([
    { key: "roads", label: "Roads" },
    { key: "water", label: "Water" },
    { key: "buildings", label: "Building shapes" },
    { key: "addressPoints", label: "Address points" },
    { key: "labels", label: "Labels" }
  ]);

  function installMapController(ctx) {
    const { els, canvas, renderer } = ctx;

    ctx.bindCanvasEvents = function bindCanvasEvents() {
      let moved = false;
      canvas.addEventListener("pointerdown", (event) => {
        moved = false;
        canvas.setPointerCapture(event.pointerId);
        renderer.beginDrag(ctx.pointerPosition(event));
      });
      canvas.addEventListener("pointermove", (event) => {
        if (!renderer.state.dragging) return;
        moved = true;
        renderer.dragTo(ctx.pointerPosition(event));
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      });
      canvas.addEventListener("pointerup", (event) => {
        renderer.endDrag();
        if (!moved) ctx.selectAt(event);
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      });
      canvas.addEventListener("pointercancel", () => renderer.endDrag());
      canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        renderer.zoomBy(event.deltaY < 0 ? 1.16 : 0.86);
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      }, { passive: false });
    };

    ctx.bindMapControlEvents = function bindMapControlEvents() {
      installLayerControls(ctx);
      els.zoomIn.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(1.28)));
      els.zoomOut.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(0.78)));
      els.rotateLeft.addEventListener("click", () => ctx.changeView(() => renderer.rotateBy(-12)));
      els.rotateRight.addEventListener("click", () => ctx.changeView(() => renderer.rotateBy(12)));
      els.prevBuilding.addEventListener("click", () => ctx.goToAdjacentBuilding(-1));
      els.nextBuilding.addEventListener("click", () => ctx.goToAdjacentBuilding(1));
      els.resetView.addEventListener("click", () => ctx.changeView(() => renderer.resetView()));
      els.copySelection.addEventListener("click", () => ctx.copySelectedSummary());
      els.navSearch.addEventListener("input", ctx.handleNavigationSearch);
      els.clearSearch.addEventListener("click", () => {
        els.navSearch.value = "";
        ctx.renderSearchResults([]);
        els.navSearch.focus();
      });
      els.searchResults.addEventListener("click", ctx.handleSearchResultClick);
      ctx.updateLayerControlStatus();
    };

    ctx.handleResize = function handleResize() {
      renderer.resize();
      ctx.updateActiveChunks();
      ctx.updateViewAndChunkStatus();
    };

    ctx.changeView = function changeView(action) {
      action();
      ctx.updateActiveChunks();
      ctx.updateViewAndChunkStatus();
    };

    ctx.updateActiveChunks = function updateActiveChunks() {
      const visibleBounds = global.KaneMapGrid.expandBounds(renderer.visibleWorldBounds(), 90);
      const visibleCells = global.KaneMapGrid.findCellsIntersectingBounds(ctx.grid, visibleBounds);
      ctx.visibleCellCodes = visibleCells.map((cell) => cell.code);
      ctx.refreshMapData();
      ctx.updateCoverageByCell(ctx.coverageModel.build());
      ctx.updateFieldPlanUi();
    };

    ctx.refreshMapData = function refreshMapData() {
      ctx.detailGridCells = detailGridCellsForDisplay(ctx);
      renderer.setMapLayerState(ctx.layerVisibility, ctx.activeCellCodes, {
        activeDetailCells: ctx.activeDetailCells,
        selectedDetailCell: ctx.selectedDetailCell,
        detailGridCells: ctx.detailGridCells
      });
      renderer.setData(ctx.buildMapData());
      ctx.updateLayerControlStatus();
    };

    ctx.buildMapData = function buildMapData() {
      const dataCellCodes = activeDataCellCodes(ctx);
      if (!dataCellCodes.length) return ctx.baseMapData;

      const activeCells = activeCellsForCodes(ctx.grid, dataCellCodes);
      if (!activeCells.length) return ctx.baseMapData;

      const clipCells = ctx.activeDetailCells.length ? ctx.activeDetailCells : activeCells;
      const detailData = ctx.featureStore.buildDataForCells(dataCellCodes);
      return {
        meta: detailData.meta,
        countyBoundary: ctx.baseMapData.countyBoundary,
        roads: ctx.layerVisibility.roads ? filterFeaturesByActiveCells(detailData.roads, clipCells, "path") : [],
        water: ctx.layerVisibility.water ? filterFeaturesByActiveCells(detailData.water, clipCells, "polygon") : [],
        forests: ctx.layerVisibility.forests ? filterFeaturesByActiveCells(detailData.forests, clipCells, "polygon") : [],
        buildings: ctx.layerVisibility.buildings ? filterFeaturesByActiveCells(detailData.buildings, clipCells, "polygon") : [],
        addressPoints: ctx.layerVisibility.addressPoints ? filterFeaturesByActiveCells(detailData.addressPoints, clipCells, "point") : []
      };
    };

    ctx.activeChunkStatus = function activeChunkStatus() {
      const dataCellCodes = activeDataCellCodes(ctx);
      if (!dataCellCodes.length) {
        return { selected: 0, total: ctx.totalChunkCount || 0, ids: [] };
      }
      return ctx.featureStore.statusForCells(dataCellCodes);
    };

    ctx.activateCell = function activateCell(cellCode) {
      if (!cellCode) return;
      if (!ctx.activeCellCodes.includes(cellCode)) {
        ctx.activeCellCodes = ctx.activeCellCodes.concat(cellCode);
      }
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.activateDetailCell = function activateDetailCell(detailCell) {
      if (!detailCell || !detailCell.parentCode) return;
      ctx.activateCell(detailCell.parentCode);
      if (!ctx.activeDetailCells.some((cell) => cell.code === detailCell.code)) {
        ctx.activeDetailCells = ctx.activeDetailCells.concat(detailCell);
      }
      ctx.selectedDetailCell = detailCell;
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.activateVisibleCells = function activateVisibleCells() {
      const next = new Set(ctx.activeCellCodes);
      ctx.visibleCellCodes.forEach((code) => next.add(code));
      ctx.activeCellCodes = Array.from(next);
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.clearInspectionCells = function clearInspectionCells() {
      ctx.activeDetailCells = [];
      ctx.selectedDetailCell = null;
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.clearActiveCells = function clearActiveCells() {
      ctx.activeCellCodes = [];
      ctx.activeDetailCells = [];
      ctx.selectedDetailCell = null;
      ctx.selected = { cell: ctx.selected.cell, building: null };
      renderer.setSelected(null, ctx.selected.cell, null);
      ctx.refreshMapData();
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.selectAt = function selectAt(event) {
      const hit = renderer.hitTest(ctx.pointerPosition(event));
      const cell = hit.detailCell ? ctx.cellForCode(hit.detailCell.parentCode) : hit.cell;
      ctx.selected = { cell, building: hit.building };

      if (hit.detailCell) {
        ctx.selectedDetailCell = hit.detailCell;
        ctx.activateDetailCell(hit.detailCell);
      } else if (hit.cell) {
        ctx.selectedDetailCell = null;
        ctx.activateCell(hit.cell.code);
      }

      renderer.setSelected(hit.building, cell, ctx.selectedDetailCell);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
    };

    ctx.handleNavigationSearch = function handleNavigationSearch() {
      ctx.renderSearchResults(ctx.searchIndex.search(els.navSearch.value));
    };

    ctx.renderSearchResults = function renderSearchResults(results) {
      els.searchResults.innerHTML = "";
      if (!els.navSearch.value.trim()) {
        els.searchResults.innerHTML = `
          <li class="muted">Search grid cells, buildings, sites, statuses, or unit designators.</li>
        `;
        return;
      }
      if (!results.length) {
        els.searchResults.innerHTML = `
          <li class="muted">No local matches.</li>
        `;
        return;
      }
      results.forEach((result) => {
        const item = document.createElement("li");
        item.innerHTML = [
          `<button type="button" data-result-type="${ctx.escapeHtml(result.type)}" data-building-id="${ctx.escapeHtml(result.buildingId || "")}" data-cell-code="${ctx.escapeHtml(result.cellCode || "")}">`,
          `<strong>${ctx.escapeHtml(result.label)}</strong>`,
          `<span>${ctx.escapeHtml(result.type)} · ${ctx.escapeHtml(result.detail)}</span>`,
          `</button>`
        ].join("");
        els.searchResults.appendChild(item);
      });
    };

    ctx.handleSearchResultClick = function handleSearchResultClick(event) {
      const button = event.target.closest("button[data-result-type]");
      if (!button) return;
      const buildingId = button.getAttribute("data-building-id");
      const cellCode = button.getAttribute("data-cell-code");
      if (buildingId) ctx.jumpToBuilding(buildingId);
      else if (cellCode) ctx.jumpToCell(cellCode);
    };

    ctx.jumpToBuilding = function jumpToBuilding(buildingId) {
      const building = ctx.findBuildingById(buildingId);
      if (!building) return;
      const cell = ctx.cellForCode(building.cell);
      const detailCell = cell ? detailCellForFeature(cell, building, ctx.detailGridRows || INSPECTION_GRID_ROWS, ctx.detailGridCols || INSPECTION_GRID_COLS, "polygon") : null;
      ctx.selected = { cell, building };
      ctx.selectedDetailCell = detailCell;
      if (cell) ctx.activateCell(cell.code);
      if (detailCell) ctx.activateDetailCell(detailCell);
      ctx.layerVisibility.buildings = true;
      renderer.centerOnPolygon(building.polygon);
      ctx.refreshMapData();
      renderer.setSelected(building, cell, detailCell);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.jumpToCell = function jumpToCell(cellCode) {
      const cell = ctx.cellForCode(cellCode);
      if (!cell) return;
      ctx.selected = { cell, building: null };
      ctx.selectedDetailCell = null;
      renderer.centerOnWorldPoint(cell.center);
      ctx.activateCell(cell.code);
      renderer.setSelected(null, cell, null);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.goToAdjacentBuilding = function goToAdjacentBuilding(direction) {
      const buildings = ctx.visibleNavigableBuildings();
      if (!buildings.length) return "No visible buildings";
      const currentIndex = ctx.selected.building ? buildings.findIndex((building) => building.id === ctx.selected.building.id) : -1;
      let nextIndex = currentIndex + direction;
      if (currentIndex === -1) nextIndex = direction > 0 ? 0 : buildings.length - 1;
      if (nextIndex < 0) nextIndex = buildings.length - 1;
      if (nextIndex >= buildings.length) nextIndex = 0;
      const next = buildings[nextIndex];
      ctx.jumpToBuilding(next.id);
      return `${next.label} selected`;
    };

    ctx.visibleNavigableBuildings = function visibleNavigableBuildings() {
      const coverage = ctx.coverageModel.build();
      const filterIds = global.KaneMapCoverage.filterBuildingIds(
        ctx.allBuildings,
        coverage.summaryByBuilding,
        els.statusFilter.value
      );
      const allowed = filterIds === null ? null : new Set(filterIds);
      const parentCodes = new Set(activeDataCellCodes(ctx).length ? activeDataCellCodes(ctx) : ctx.visibleCellCodes.length ? ctx.visibleCellCodes : ctx.allCellCodes);
      const detailCells = ctx.activeDetailCells;
      return ctx.allBuildings
        .filter((building) => parentCodes.has(building.cell))
        .filter((building) => !detailCells.length || featureBelongsToActiveCells(building, detailCells, new Set(detailCells.map((cell) => cell.code)), "polygon"))
        .filter((building) => !allowed || allowed.has(building.id))
        .sort((a, b) => a.cell.localeCompare(b.cell) || a.label.localeCompare(b.label));
    };

    ctx.copySelectedSummary = function copySelectedSummary() {
      const text = ctx.selectedSummaryText();
      if (!text) return "Nothing selected";
      ctx.copyText(text);
      return "Selected summary copied";
    };

    ctx.selectedSummaryText = function selectedSummaryText() {
      if (!ctx.selected.building && ctx.selectedDetailCell) return `Inspection cell: ${ctx.selectedDetailCell.code}`;
      if (!ctx.selected.building && ctx.selected.cell) return `Grid cell: ${ctx.selected.cell.code}`;
      if (!ctx.selected.building) return "";
      const summary = ctx.coverageModel.build().summaryByBuilding[ctx.selected.building.id];
      const identity = ctx.siteIdentityModel.analyzeBuilding(ctx.selected.building.id);
      const site = identity.labels[0] || ctx.selected.building.name || "";
      const count = summary && summary.observedUnitCount !== null ? `${summary.observedUnitCount}` : "unknown";
      const status = summary ? summary.status : "unrecorded";
      return [
        `Building: ${ctx.selected.building.label}`,
        `Grid cell: ${ctx.selected.building.cell}`,
        ctx.selectedDetailCell ? `Inspection cell: ${ctx.selectedDetailCell.code}` : "",
        site ? `Site: ${site}` : "",
        `Stories: ${ctx.selected.building.stories}`,
        `Observed units: ${count}`,
        `Status: ${status}`
      ].filter(Boolean).join("\n");
    };

    ctx.updateViewAndChunkStatus = function updateViewAndChunkStatus() {
      const chunkStatus = ctx.activeChunkStatus();
      els.viewStatus.textContent = [
        `Zoom ${renderer.state.zoom.toFixed(2)}`,
        `Bearing ${Math.round(renderer.state.bearing)}°`
      ].join(" / ");
      els.chunkStatus.textContent = activeDataCellCodes(ctx).length
        ? `Active chunks ${chunkStatus.selected}/${chunkStatus.total}`
        : `Active chunks 0/${chunkStatus.total}`;
      els.chunkStatus.title = chunkStatus.ids.join(", ");
      els.visibleCellStatus.textContent = `Active cells ${ctx.activeCellCodes.length}/${ctx.grid.cells.length} · Inspection cells ${ctx.activeDetailCells.length} · Visible cells ${ctx.visibleCellCodes.length}/${ctx.grid.cells.length}`;
    };

    ctx.updateLayerControlStatus = function updateLayerControlStatus() {
      if (ctx.els.layerToggles) {
        ctx.els.layerToggles.forEach((input) => {
          const key = input.getAttribute("data-map-layer");
          input.checked = Boolean(ctx.layerVisibility[key]);
        });
      }
      if (ctx.els.activeCellSummary) {
        const cells = ctx.activeCellCodes.length ? ctx.activeCellCodes.join(", ") : "none";
        const detailCells = ctx.activeDetailCells.length ? ctx.activeDetailCells.map((cell) => shortDetailCellCode(cell)).join(", ") : "none";
        const selectedDetail = ctx.selectedDetailCell ? shortDetailCellCode(ctx.selectedDetailCell) : "none";
        ctx.els.activeCellSummary.textContent = `Active cells: ${cells}\nInspection cells: ${detailCells}\nSelected inspection: ${selectedDetail}`;
      }
    };
  }

  function installLayerControls(ctx) {
    if (ctx.els.layerControlPanel) return;
    const section = ctx.els.zoomIn ? ctx.els.zoomIn.closest(".section") : null;
    if (!section) return;

    const panel = document.createElement("div");
    panel.className = "section map-layer-controls";
    panel.innerHTML = [
      `<h2>Detail layers</h2>`,
      `<p class="muted">Base view always shows county outline and Kane grid. Click a grid cell to show its 16×16 inspection grid. Click an inspection cell to make it the practical active detail area.</p>`,
      `<div class="button-grid">`,
      `<button id="activateVisibleCells" type="button" class="secondary">Add visible cells</button>`,
      `<button id="clearInspectionCells" type="button" class="secondary">Clear inspection cells</button>`,
      `<button id="clearActiveCells" type="button" class="secondary">Clear active cells</button>`,
      `</div>`,
      `<div class="layer-toggle-list">`,
      LAYER_SPECS.map((spec) => `
        <label class="layer-toggle-row">
          <input type="checkbox" data-map-layer="${spec.key}" /> ${spec.label}
        </label>
      `).join(""),
      `</div>`,
      `<div id="activeCellSummary" class="summary-box">Active cells: none</div>`
    ].join("");

    section.insertAdjacentElement("afterend", panel);
    ctx.els.layerControlPanel = panel;
    ctx.els.activeCellSummary = panel.querySelector("#activeCellSummary");
    ctx.els.activateVisibleCells = panel.querySelector("#activateVisibleCells");
    ctx.els.clearInspectionCells = panel.querySelector("#clearInspectionCells");
    ctx.els.clearActiveCells = panel.querySelector("#clearActiveCells");
    ctx.els.layerToggles = Array.from(panel.querySelectorAll("input[data-map-layer]"));

    ctx.els.activateVisibleCells.addEventListener("click", ctx.activateVisibleCells);
    ctx.els.clearInspectionCells.addEventListener("click", ctx.clearInspectionCells);
    ctx.els.clearActiveCells.addEventListener("click", ctx.clearActiveCells);
    ctx.els.layerToggles.forEach((input) => {
      const key = input.getAttribute("data-map-layer");
      input.checked = Boolean(ctx.layerVisibility[key]);
      input.addEventListener("change", () => {
        ctx.layerVisibility[key] = input.checked;
        ctx.refreshMapData();
        ctx.updateViewAndChunkStatus();
      });
    });
  }

  function activeCellsForCodes(grid, cellCodes) {
    const wanted = new Set(Array.isArray(cellCodes) ? cellCodes : []);
    if (!wanted.size || !grid || !Array.isArray(grid.cells)) return [];
    return grid.cells.filter((cell) => wanted.has(cell.code));
  }

  function activeDataCellCodes(ctx) {
    const codes = new Set(Array.isArray(ctx.activeCellCodes) ? ctx.activeCellCodes : []);
    (Array.isArray(ctx.activeDetailCells) ? ctx.activeDetailCells : []).forEach((cell) => {
      if (cell.parentCode) codes.add(cell.parentCode);
    });
    return Array.from(codes);
  }

  function detailGridCellsForDisplay(ctx) {
    const parentCodes = new Set();
    if (ctx.selected && ctx.selected.cell) parentCodes.add(ctx.selected.cell.code);
    ctx.activeDetailCells.forEach((cell) => parentCodes.add(cell.parentCode));
    return Array.from(parentCodes)
      .map((code) => ctx.cellForCode(code))
      .filter(Boolean)
      .flatMap((cell) => makeInspectionGrid(cell, ctx.detailGridRows || INSPECTION_GRID_ROWS, ctx.detailGridCols || INSPECTION_GRID_COLS));
  }

  function makeInspectionGrid(parentCell, rows, cols) {
    const cells = [];
    const width = (parentCell.maxX - parentCell.minX) / cols;
    const height = (parentCell.maxY - parentCell.minY) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const minX = parentCell.minX + col * width;
        const maxX = col === cols - 1 ? parentCell.maxX : minX + width;
        const minY = parentCell.minY + row * height;
        const maxY = row === rows - 1 ? parentCell.maxY : minY + height;
        cells.push({
          code: `${parentCell.code}:r${pad2(row + 1)}c${pad2(col + 1)}`,
          parentCode: parentCell.code,
          row,
          col,
          minX,
          minY,
          maxX,
          maxY,
          center: [(minX + maxX) / 2, (minY + maxY) / 2],
          polygon: [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]
        });
      }
    }
    return cells;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function shortDetailCellCode(cell) {
    return cell && cell.code ? cell.code.replace(":r", ":").replace("c", "-") : "";
  }

  function detailCellForFeature(parentCell, feature, rows, cols, geometryKey) {
    const points = featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = boundsForPoints(points);
    const target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
    return makeInspectionGrid(parentCell, rows, cols).find((cell) => pointInCell(target, cell)) || null;
  }

  function filterFeaturesByActiveCells(features, activeCells, geometryKey) {
    const input = Array.isArray(features) ? features : [];
    if (!input.length || !activeCells.length) return [];
    const activeCodes = new Set(activeCells.map((cell) => cell.code));
    return input.filter((feature) => featureBelongsToActiveCells(feature, activeCells, activeCodes, geometryKey));
  }

  function featureBelongsToActiveCells(feature, activeCells, activeCodes, geometryKey) {
    if (!feature) return false;

    const declaredCells = featureCellCodes(feature);
    if (declaredCells.length && declaredCells.some((code) => activeCodes.has(code))) return true;

    const points = featurePoints(feature, geometryKey);
    if (!points.length) return false;

    if (points.some((point) => activeCells.some((cell) => pointInCell(point, cell)))) return true;

    const bounds = boundsForPoints(points);
    return activeCells.some((cell) => boundsIntersect(bounds, cell));
  }

  function featureCellCodes(feature) {
    const output = [];
    [feature.cell, feature.cellCode, feature.gridCell, feature.grid_cell].forEach((code) => {
      if (typeof code === "string" && code) output.push(code);
    });
    if (Array.isArray(feature.cells)) {
      feature.cells.forEach((code) => {
        if (typeof code === "string" && code) output.push(code);
      });
    }
    return output;
  }

  function featurePoints(feature, geometryKey) {
    if (geometryKey === "point" && Array.isArray(feature.point)) return [feature.point];
    if (geometryKey === "path" && Array.isArray(feature.path)) return feature.path;
    if (geometryKey === "polygon" && Array.isArray(feature.polygon)) return feature.polygon;
    return [];
  }

  function pointInCell(point, cell) {
    return Array.isArray(point) && point.length >= 2 &&
      point[0] >= cell.minX && point[0] <= cell.maxX &&
      point[1] >= cell.minY && point[1] <= cell.maxY;
  }

  function boundsForPoints(points) {
    return points.reduce((bounds, point) => ({
      minX: Math.min(bounds.minX, point[0]),
      minY: Math.min(bounds.minY, point[1]),
      maxX: Math.max(bounds.maxX, point[0]),
      maxY: Math.max(bounds.maxY, point[1])
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  }

  function boundsIntersect(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
  }

  global.KaneMapMapController = { installMapController };
})(window);
