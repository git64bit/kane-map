(function kaneMapMapController(global) {
  "use strict";

  function installMapController(ctx) {
    const {
      installLayerControls,
      toggleMainMute,
      toggleDetailMute,
      toggleFineMute,
      effectiveMainCellCodes,
      effectiveDetailCells,
      effectiveFineCells,
      detailGridCellsForDisplay,
      fineGridCellsForDisplay,
      detailCellByCode,
      filterFeaturesByActiveCells,
      polygonCenter
    } = global.KaneMapMapSectorSupport;
    const { els, canvas, renderer } = ctx;

    ctx.runtimeSectorCode = null;
    ctx.runtimeSectorData = null;
    ctx.runtimeDetailCode = null;
    ctx.runtimeDetailData = ctx.baseMapData;

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
      });

      canvas.addEventListener("pointerup", (event) => {
        renderer.endDrag();
        if (!moved) {
          ctx.selectAt(event);
          return;
        }
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      });

      canvas.addEventListener("pointercancel", () => renderer.endDrag());

      canvas.addEventListener(
        "wheel",
        (event) => {
          event.preventDefault();
          renderer.zoomBy(
            event.deltaY < 0 ? 1.22 : 0.82,
            ctx.selectedFocusPoint()
          );
          ctx.updateActiveChunks();
          ctx.updateViewAndChunkStatus();
        },
        { passive: false }
      );
    };

    ctx.bindMapControlEvents = function bindMapControlEvents() {
      installLayerControls(ctx);
      els.zoomIn.addEventListener("click", () =>
        ctx.changeView(() => renderer.zoomBy(1.42, ctx.selectedFocusPoint()))
      );
      els.zoomOut.addEventListener("click", () =>
        ctx.changeView(() => renderer.zoomBy(0.70, ctx.selectedFocusPoint()))
      );
      els.prevBuilding.addEventListener("click", () => ctx.goToAdjacentBuilding(-1));
      els.nextBuilding.addEventListener("click", () => ctx.goToAdjacentBuilding(1));
      els.resetView.addEventListener("click", () =>
        ctx.changeView(() => renderer.resetView())
      );
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
      const visibleBounds = global.KaneMapGrid.expandBounds(
        renderer.visibleWorldBounds(),
        90
      );
      const visibleCells = global.KaneMapGrid.findCellsIntersectingBounds(
        ctx.grid,
        visibleBounds
      );
      ctx.visibleCellCodes = visibleCells.map((cell) => cell.code);
    };

    ctx.refreshMapData = function refreshMapData() {
      ctx.detailGridCells = detailGridCellsForDisplay(ctx);
      ctx.fineGridCells = fineGridCellsForDisplay(ctx);

      const sectorCode = currentSectorCode(ctx);
      const detailCode = currentDetailCode(ctx);
      const activeDetailCells = cellsForSector(effectiveDetailCells(ctx), sectorCode);
      const mutedDetailCells = cellsForSector(ctx.mutedDetailCells, sectorCode);
      const activeFineCells = cellsForDetail(
        cellsForSector(effectiveFineCells(ctx), sectorCode),
        detailCode
      );
      const mutedFineCells = cellsForDetail(
        cellsForSector(ctx.mutedFineCells, sectorCode),
        detailCode
      );

      renderer.setMapLayerState(ctx.layerVisibility, effectiveMainCellCodes(ctx), {
        mutedCellCodes: ctx.mutedCellCodes,
        activeDetailCells,
        mutedDetailCells,
        selectedDetailCell: ctx.selectedDetailCell,
        detailGridCells: ctx.detailGridCells,
        activeFineCells,
        mutedFineCells,
        selectedFineCell: ctx.selectedFineCell,
        fineGridCells: ctx.fineGridCells
      });
      ctx.updateLayerControlStatus();
    };

    ctx.buildMapData = function buildMapData() {
      return ctx.runtimeDetailData || ctx.baseMapData;
    };

    ctx.activeChunkStatus = function activeChunkStatus() {
      const sectorCode = ctx.runtimeSectorCode || currentSectorCode(ctx);
      if (!sectorCode) {
        return { selected: 0, total: ctx.totalChunkCount || 0, ids: [] };
      }
      return ctx.featureStore.statusForCells([sectorCode]);
    };

    ctx.activateCell = function activateCell(cellCode) {
      if (!cellCode) return;
      ensureMainActive(ctx, cellCode);
      releaseRuntimeSectorIfChanged(ctx, cellCode, renderer);
      ctx.refreshMapData();
      ctx.updateViewAndChunkStatus();
    };

    ctx.selectDetailCell = function selectDetailCell(detailCell) {
      if (!detailCell || !detailCell.parentCode) return;
      ensureMainActive(ctx, detailCell.parentCode);
      ctx.selectedDetailCell = detailCell;
      ctx.selectedFineCell = null;
      ctx.refreshMapData();
      loadRuntimeDetail(ctx, detailCell, renderer, filterFeaturesByActiveCells);
      ctx.updateViewAndChunkStatus();
    };

    ctx.activateDetailCell = function activateDetailCell(detailCell) {
      if (!detailCell || !detailCell.parentCode) return;
      ensureMainActive(ctx, detailCell.parentCode);
      if (!ctx.activeDetailCells.some((cell) => cell.code === detailCell.code)) {
        ctx.activeDetailCells = ctx.activeDetailCells.concat(detailCell);
      }
      ctx.selectedDetailCell = detailCell;
      ctx.selectedFineCell = null;
      ctx.refreshMapData();
      loadRuntimeDetail(ctx, detailCell, renderer, filterFeaturesByActiveCells);
      ctx.updateViewAndChunkStatus();
    };

    ctx.activateFineCell = function activateFineCell(fineCell) {
      if (!fineCell || !fineCell.parentCode || !fineCell.detailParentCode) return;
      ensureMainActive(ctx, fineCell.parentCode);

      const detailCell = detailCellByCode(ctx, fineCell.detailParentCode);
      if (detailCell) ctx.selectedDetailCell = detailCell;
      if (detailCell && ctx.runtimeDetailCode !== detailCell.code) {
        loadRuntimeDetail(ctx, detailCell, renderer, filterFeaturesByActiveCells);
      }

      if (!ctx.activeFineCells.some((cell) => cell.code === fineCell.code)) {
        ctx.activeFineCells = ctx.activeFineCells.concat(fineCell);
      }
      ctx.selectedFineCell = fineCell;
      ctx.refreshMapData();
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
        releaseRuntimeSectorIfChanged(ctx, hit.cell.code, renderer);
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

    ctx.selectAt = function selectAt(event) {
      const hit = renderer.hitTest(ctx.pointerPosition(event));
      const cell = hit.fineCell
        ? ctx.cellForCode(hit.fineCell.parentCode)
        : hit.detailCell
          ? ctx.cellForCode(hit.detailCell.parentCode)
          : hit.cell;
      ctx.selected = { cell, building: hit.building };

      if (event.shiftKey || event.altKey) {
        ctx.toggleMutedAtHit(hit);
        renderer.setSelected(
          hit.building,
          cell,
          ctx.selectedDetailCell,
          ctx.selectedFineCell
        );
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

      renderer.setSelected(
        hit.building,
        cell,
        ctx.selectedDetailCell,
        ctx.selectedFineCell
      );
      if (hit.fineCell || hit.detailCell || hit.cell) ctx.fitSelectedSector();
      ctx.updateActiveChunks();
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
    };

    global.KaneMapMapNavigationSupport.installMapNavigationSupport(ctx);
  }

  function ensureMainActive(ctx, cellCode) {
    if (!ctx.activeCellCodes.includes(cellCode)) {
      ctx.activeCellCodes = ctx.activeCellCodes.concat(cellCode);
    }
  }

  function currentSectorCode(ctx) {
    const code = ctx.selected && ctx.selected.cell && ctx.selected.cell.code;
    return code && ctx.allCellCodes.includes(code) ? code : null;
  }

  function currentDetailCode(ctx) {
    if (ctx.selectedFineCell && ctx.selectedFineCell.detailParentCode) {
      return ctx.selectedFineCell.detailParentCode;
    }
    return ctx.selectedDetailCell ? ctx.selectedDetailCell.code : null;
  }

  function cellsForSector(cells, sectorCode) {
    if (!sectorCode) return [];
    return (Array.isArray(cells) ? cells : [])
      .filter((cell) => cell && cell.parentCode === sectorCode);
  }

  function cellsForDetail(cells, detailCode) {
    if (!detailCode) return [];
    return (Array.isArray(cells) ? cells : [])
      .filter((cell) => cell && cell.detailParentCode === detailCode);
  }

  function releaseRuntimeSectorIfChanged(ctx, sectorCode, renderer) {
    if (!ctx.runtimeSectorCode || ctx.runtimeSectorCode === sectorCode) return;
    ctx.runtimeSectorCode = null;
    ctx.runtimeSectorData = null;
    ctx.runtimeDetailCode = null;
    ctx.runtimeDetailData = ctx.baseMapData;
    renderer.setData(ctx.baseMapData);
  }

  function loadRuntimeDetail(ctx, detailCell, renderer, filterFeatures) {
    if (!detailCell || !detailCell.parentCode) return;
    if (ctx.runtimeDetailCode === detailCell.code && ctx.runtimeDetailData) return;

    const sectorData = ensureRuntimeSector(ctx, detailCell.parentCode);
    const clipCells = [detailCell];
    const detailData = {
      meta: sectorData.meta,
      countyBoundary: ctx.baseMapData.countyBoundary,
      roads: filterFeatures(sectorData.roads, clipCells, "path"),
      water: filterFeatures(sectorData.water, clipCells, "polygon"),
      forests: filterFeatures(sectorData.forests, clipCells, "polygon"),
      buildings: filterFeatures(sectorData.buildings, clipCells, "polygon"),
      addressPoints: filterFeatures(sectorData.addressPoints, clipCells, "point")
    };

    ctx.runtimeDetailCode = detailCell.code;
    ctx.runtimeDetailData = detailData;
    renderer.setData(detailData);
  }

  function ensureRuntimeSector(ctx, sectorCode) {
    if (ctx.runtimeSectorCode === sectorCode && ctx.runtimeSectorData) {
      return ctx.runtimeSectorData;
    }

    const source = ctx.featureStore.buildDataForCells([sectorCode]);
    ctx.runtimeSectorCode = sectorCode;
    ctx.runtimeSectorData = {
      meta: source.meta,
      countyBoundary: ctx.baseMapData.countyBoundary,
      roads: Array.isArray(source.roads) ? source.roads : [],
      water: Array.isArray(source.water) ? source.water : [],
      forests: Array.isArray(source.forests) ? source.forests : [],
      buildings: Array.isArray(source.buildings) ? source.buildings : [],
      addressPoints: Array.isArray(source.addressPoints) ? source.addressPoints : []
    };
    ctx.runtimeDetailCode = null;
    ctx.runtimeDetailData = ctx.baseMapData;
    return ctx.runtimeSectorData;
  }

  global.KaneMapMapController = { installMapController };
})(window);
