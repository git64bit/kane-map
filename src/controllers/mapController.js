(function kaneMapMapController(global) {
  "use strict";
  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;
  const FINE_GRID_ROWS = 8;
  const FINE_GRID_COLS = 8;
  function installMapController(ctx) {
    const {
      installLayerControls,
      toggleMainMute,
      toggleDetailMute,
      toggleFineMute,
      activeCellsForCodes,
      activeDataCellCodes,
      effectiveMainCellCodes,
      effectiveDetailCells,
      effectiveFineCells,
      activeAreaClipCells,
      activeDetailClipCells,
      mutedSectorCount,
      selectedSectorIsMuted,
      detailGridCellsForDisplay,
      fineGridCellsForDisplay,
      detailCellByCode,
      shortDetailCellCode,
      shortFineCellCode,
      detailCellForFeature,
      fineCellForFeature,
      filterFeaturesByActiveCells,
      featureBelongsToActiveCells,
      polygonCenter
    } = global.KaneMapMapSectorSupport;

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
        renderer.zoomBy(event.deltaY < 0 ? 1.22 : 0.82, ctx.selectedFocusPoint());
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      }, { passive: false });
    };

    ctx.bindMapControlEvents = function bindMapControlEvents() {
      installLayerControls(ctx);
      els.zoomIn.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(1.42, ctx.selectedFocusPoint())));
      els.zoomOut.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(0.70, ctx.selectedFocusPoint())));
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

    ctx.selectedFocusPoint = function selectedFocusPoint() {
      if (ctx.selectedFineCell && Array.isArray(ctx.selectedFineCell.polygon)) {
        return polygonCenter(ctx.selectedFineCell.polygon);
      }
      if (ctx.selectedDetailCell && Array.isArray(ctx.selectedDetailCell.polygon)) {
        return polygonCenter(ctx.selectedDetailCell.polygon);
      }
      if (ctx.selected.cell) return ctx.selected.cell.center;
      return null;
    };

    ctx.fitSelectedSector = function fitSelectedSector() {
      const polygon = ctx.selectedFineCell && ctx.selectedFineCell.polygon
        ? ctx.selectedFineCell.polygon
        : ctx.selectedDetailCell && ctx.selectedDetailCell.polygon
          ? ctx.selectedDetailCell.polygon
          : ctx.selected.cell && ctx.selected.cell.polygon
            ? ctx.selected.cell.polygon
            : null;
      if (polygon) renderer.fitPolygon(polygon, 72);
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
      ctx.fineGridCells = fineGridCellsForDisplay(ctx);
      renderer.setMapLayerState(ctx.layerVisibility, effectiveMainCellCodes(ctx), {
        mutedCellCodes: ctx.mutedCellCodes,
        activeDetailCells: effectiveDetailCells(ctx),
        mutedDetailCells: ctx.mutedDetailCells,
        selectedDetailCell: ctx.selectedDetailCell,
        detailGridCells: ctx.detailGridCells,
        activeFineCells: effectiveFineCells(ctx),
        mutedFineCells: ctx.mutedFineCells,
        selectedFineCell: ctx.selectedFineCell,
        fineGridCells: ctx.fineGridCells
      });
      renderer.setData(ctx.buildMapData());
      ctx.updateLayerControlStatus();
    };

    ctx.buildMapData = function buildMapData() {
      const dataCellCodes = activeDataCellCodes(ctx);
      if (!dataCellCodes.length) return ctx.baseMapData;

      const activeCells = activeCellsForCodes(ctx.grid, dataCellCodes);
      if (!activeCells.length) return ctx.baseMapData;

      const areaClipCells = activeAreaClipCells(ctx, activeCells);
      const detailClipCells = activeDetailClipCells(ctx);
      const detailData = ctx.featureStore.buildDataForCells(dataCellCodes);
      return {
        meta: detailData.meta,
        countyBoundary: ctx.baseMapData.countyBoundary,
        roads: ctx.layerVisibility.roads ? filterFeaturesByActiveCells(detailData.roads, areaClipCells, "path") : [],
        water: ctx.layerVisibility.water ? filterFeaturesByActiveCells(detailData.water, areaClipCells, "polygon") : [],
        forests: ctx.layerVisibility.forests ? filterFeaturesByActiveCells(detailData.forests, areaClipCells, "polygon") : [],
        buildings: ctx.layerVisibility.buildings ? filterFeaturesByActiveCells(detailData.buildings, detailClipCells, "polygon") : [],
        addressPoints: ctx.layerVisibility.addressPoints ? filterFeaturesByActiveCells(detailData.addressPoints, detailClipCells, "point") : []
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

    ctx.selectDetailCell = function selectDetailCell(detailCell) {
      if (!detailCell || !detailCell.parentCode) return;
      ctx.activateCell(detailCell.parentCode);
      ctx.selectedDetailCell = detailCell;
      ctx.selectedFineCell = null;
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
      ctx.selectedFineCell = null;
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.activateFineCell = function activateFineCell(fineCell) {
      if (!fineCell || !fineCell.parentCode || !fineCell.detailParentCode) return;
      ctx.activateCell(fineCell.parentCode);
      const detailCell = detailCellByCode(ctx, fineCell.detailParentCode);
      if (detailCell) ctx.selectedDetailCell = detailCell;
      if (!ctx.activeFineCells.some((cell) => cell.code === fineCell.code)) {
        ctx.activeFineCells = ctx.activeFineCells.concat(fineCell);
      }
      ctx.selectedFineCell = fineCell;
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
      ctx.activeFineCells = [];
      ctx.selectedFineCell = null;
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.clearActiveCells = function clearActiveCells() {
      ctx.activeCellCodes = [];
      ctx.activeDetailCells = [];
      ctx.selectedDetailCell = null;
      ctx.activeFineCells = [];
      ctx.selectedFineCell = null;
      ctx.selected = { cell: ctx.selected.cell, building: null };
      renderer.setSelected(null, ctx.selected.cell, null, null);
      ctx.refreshMapData();
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.toggleMutedAtHit = function toggleMutedAtHit(hit) {
      if (hit && hit.fineCell) {
        ctx.selectedFineCell = hit.fineCell;
        const detailCell = detailCellByCode(ctx, hit.fineCell.detailParentCode);
        if (detailCell) ctx.selectedDetailCell = detailCell;
        toggleFineMute(ctx, hit.fineCell);
      } else if (hit && hit.detailCell) {
        ctx.selectedDetailCell = hit.detailCell;
        ctx.selectedFineCell = null;
        toggleDetailMute(ctx, hit.detailCell);
      } else if (hit && hit.cell) {
        ctx.selectedDetailCell = null;
        ctx.selectedFineCell = null;
        toggleMainMute(ctx, hit.cell);
      }
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.toggleSelectedSectorMuted = function toggleSelectedSectorMuted() {
      if (ctx.selectedFineCell) {
        toggleFineMute(ctx, ctx.selectedFineCell);
      } else if (ctx.selectedDetailCell) {
        toggleDetailMute(ctx, ctx.selectedDetailCell);
      } else if (ctx.selected.cell) {
        toggleMainMute(ctx, ctx.selected.cell);
      }
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.clearMutedSectors = function clearMutedSectors() {
      ctx.mutedCellCodes = [];
      ctx.mutedDetailCells = [];
      ctx.mutedFineCells = [];
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.selectAt = function selectAt(event) {
      const hit = renderer.hitTest(ctx.pointerPosition(event));
      const cell = hit.fineCell ? ctx.cellForCode(hit.fineCell.parentCode) : hit.detailCell ? ctx.cellForCode(hit.detailCell.parentCode) : hit.cell;
      ctx.selected = { cell, building: hit.building };

      if (event.shiftKey || event.altKey) {
        ctx.toggleMutedAtHit(hit);
        renderer.setSelected(hit.building, cell, ctx.selectedDetailCell, ctx.selectedFineCell);
        ctx.updateSelectedPanel();
        ctx.updateRecordPanel();
        return;
      }

      if (hit.fineCell) {
        ctx.activateFineCell(hit.fineCell);
      } else if (hit.detailCell) {
        ctx.selectDetailCell(hit.detailCell);
      } else if (hit.cell) {
        ctx.selectedDetailCell = null;
        ctx.selectedFineCell = null;
        ctx.activateCell(hit.cell.code);
      }

      renderer.setSelected(hit.building, cell, ctx.selectedDetailCell, ctx.selectedFineCell);
      if (hit.fineCell || hit.detailCell || hit.cell) ctx.fitSelectedSector();
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
      const fineCell = detailCell ? fineCellForFeature(detailCell, building, ctx.fineGridRows || FINE_GRID_ROWS, ctx.fineGridCols || FINE_GRID_COLS, "polygon") : null;
      ctx.selected = { cell, building };
      ctx.selectedDetailCell = detailCell;
      ctx.selectedFineCell = fineCell;
      if (cell) ctx.activateCell(cell.code);
      if (fineCell) ctx.activateFineCell(fineCell);
      else if (detailCell) ctx.selectDetailCell(detailCell);
      ctx.layerVisibility.buildings = true;
      renderer.centerOnPolygon(building.polygon);
      ctx.refreshMapData();
      renderer.setSelected(building, cell, detailCell, fineCell);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.jumpToCell = function jumpToCell(cellCode) {
      const cell = ctx.cellForCode(cellCode);
      if (!cell) return;
      ctx.selected = { cell, building: null };
      ctx.selectedDetailCell = null;
      ctx.selectedFineCell = null;
      renderer.fitPolygon(cell.polygon, 72);
      ctx.activateCell(cell.code);
      renderer.setSelected(null, cell, null, null);
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
      const fineCells = effectiveFineCells(ctx);
      const detailCells = effectiveDetailCells(ctx);
      return ctx.allBuildings
        .filter((building) => parentCodes.has(building.cell))
        .filter((building) => !fineCells.length || featureBelongsToActiveCells(building, fineCells, new Set(fineCells.map((cell) => cell.code)), "polygon"))
        .filter((building) => fineCells.length || !detailCells.length || featureBelongsToActiveCells(building, detailCells, new Set(detailCells.map((cell) => cell.code)), "polygon"))
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
      if (!ctx.selected.building && ctx.selectedFineCell) return `Practical cell: ${ctx.selectedFineCell.code}`;
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
        ctx.selectedFineCell ? `Practical cell: ${ctx.selectedFineCell.code}` : "",
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
      els.visibleCellStatus.textContent = `Active cells ${effectiveMainCellCodes(ctx).length}/${ctx.grid.cells.length} · Inspection cells ${effectiveDetailCells(ctx).length} · Practical cells ${effectiveFineCells(ctx).length} · Muted sectors ${mutedSectorCount(ctx)} · Visible cells ${ctx.visibleCellCodes.length}/${ctx.grid.cells.length}`;
    };

    ctx.updateLayerControlStatus = function updateLayerControlStatus() {
      if (ctx.els.layerToggles) {
        ctx.els.layerToggles.forEach((input) => {
          const key = input.getAttribute("data-map-layer");
          input.checked = Boolean(ctx.layerVisibility[key]);
        });
      }
      if (ctx.els.activeCellSummary) {
        const cells = effectiveMainCellCodes(ctx).length ? effectiveMainCellCodes(ctx).join(", ") : "none";
        const detailCells = effectiveDetailCells(ctx).length ? effectiveDetailCells(ctx).map((cell) => shortDetailCellCode(cell)).join(", ") : "none";
        const fineCells = effectiveFineCells(ctx).length ? effectiveFineCells(ctx).map((cell) => shortFineCellCode(cell)).join(", ") : "none";
        const mutedMain = ctx.mutedCellCodes.length ? ctx.mutedCellCodes.join(", ") : "none";
        const mutedDetail = ctx.mutedDetailCells.length ? ctx.mutedDetailCells.map((cell) => shortDetailCellCode(cell)).join(", ") : "none";
        const mutedFine = ctx.mutedFineCells.length ? ctx.mutedFineCells.map((cell) => shortFineCellCode(cell)).join(", ") : "none";
        const selectedDetail = ctx.selectedDetailCell ? shortDetailCellCode(ctx.selectedDetailCell) : "none";
        const selectedFine = ctx.selectedFineCell ? shortFineCellCode(ctx.selectedFineCell) : "none";
        ctx.els.activeCellSummary.textContent = `Active cells: ${cells}
Inspection cells: ${detailCells}
Practical cells: ${fineCells}
Muted cells: ${mutedMain}
Muted inspection: ${mutedDetail}
Muted practical: ${mutedFine}
Selected inspection: ${selectedDetail}
Selected practical: ${selectedFine}`;
      }
      if (ctx.els.muteSelectedSector) {
        ctx.els.muteSelectedSector.textContent = selectedSectorIsMuted(ctx) ? "Restore selected sector" : "Mute selected sector";
        ctx.els.muteSelectedSector.disabled = !(ctx.selectedFineCell || ctx.selectedDetailCell || ctx.selected.cell);
      }
    };
  }

  global.KaneMapMapController = { installMapController };
})(window);
