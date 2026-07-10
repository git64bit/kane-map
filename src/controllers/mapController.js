(function kaneMapMapController(global) {
  "use strict";
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
      detailGridCellsForDisplay,
      fineGridCellsForDisplay,
      detailCellByCode,
      filterFeaturesByActiveCells,
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

    global.KaneMapMapNavigationSupport.installMapNavigationSupport(ctx);
  }

  global.KaneMapMapController = { installMapController };
})(window);
