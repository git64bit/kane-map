(function kaneMapMapController(global) {
  "use strict";

  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;
  const FINE_GRID_ROWS = 8;
  const FINE_GRID_COLS = 8;

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
        renderer.zoomBy(event.deltaY < 0 ? 1.22 : 0.82);
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      }, { passive: false });
    };

    ctx.bindMapControlEvents = function bindMapControlEvents() {
      installLayerControls(ctx);
      els.zoomIn.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(1.42)));
      els.zoomOut.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(0.70)));
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
      renderer.centerOnWorldPoint(cell.center);
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

  function installLayerControls(ctx) {
    if (ctx.els.layerControlPanel) return;
    const section = ctx.els.zoomIn ? ctx.els.zoomIn.closest(".section") : null;
    if (!section) return;

    const panel = document.createElement("div");
    panel.className = "section map-layer-controls";
    panel.innerHTML = [
      `<h2>Detail layers</h2>`,
      `<p class="muted">Base view always shows county outline and Kane grid. Click a grid cell for its 16×16 area grid, then click an area cell for an 8×8 practical grid. Shift-click or use Mute selected sector to turn irrelevant sectors off.</p>`,
      `<div class="button-grid">`,
      `<button id="activateVisibleCells" type="button" class="secondary">Add visible cells</button>`,
      `<button id="clearInspectionCells" type="button" class="secondary">Clear inspection cells</button>`,
      `<button id="clearActiveCells" type="button" class="secondary">Clear active cells</button>`,
      `<button id="muteSelectedSector" type="button" class="secondary">Mute selected sector</button>`,
      `<button id="clearMutedSectors" type="button" class="secondary">Clear muted sectors</button>`,
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
    ctx.els.muteSelectedSector = panel.querySelector("#muteSelectedSector");
    ctx.els.clearMutedSectors = panel.querySelector("#clearMutedSectors");
    ctx.els.layerToggles = Array.from(panel.querySelectorAll("input[data-map-layer]"));

    ctx.els.activateVisibleCells.addEventListener("click", ctx.activateVisibleCells);
    ctx.els.clearInspectionCells.addEventListener("click", ctx.clearInspectionCells);
    ctx.els.clearActiveCells.addEventListener("click", ctx.clearActiveCells);
    ctx.els.muteSelectedSector.addEventListener("click", ctx.toggleSelectedSectorMuted);
    ctx.els.clearMutedSectors.addEventListener("click", ctx.clearMutedSectors);
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

  function toggleMainMute(ctx, cell) {
    if (!cell || !cell.code) return;
    if (mainCellMuted(ctx, cell.code)) {
      ctx.mutedCellCodes = ctx.mutedCellCodes.filter((code) => code !== cell.code);
      return;
    }
    ctx.mutedCellCodes = uniqueStrings(ctx.mutedCellCodes.concat(cell.code));
    ctx.activeCellCodes = ctx.activeCellCodes.filter((code) => code !== cell.code);
    ctx.activeDetailCells = ctx.activeDetailCells.filter((candidate) => candidate.parentCode !== cell.code);
    ctx.activeFineCells = ctx.activeFineCells.filter((candidate) => candidate.parentCode !== cell.code);
  }

  function toggleDetailMute(ctx, cell) {
    if (!cell || !cell.code) return;
    if (cellListHasCode(ctx.mutedDetailCells, cell.code)) {
      ctx.mutedDetailCells = removeCellByCode(ctx.mutedDetailCells, cell.code);
      return;
    }
    ctx.mutedDetailCells = addUniqueCell(ctx.mutedDetailCells, cell);
    ctx.activeDetailCells = removeCellByCode(ctx.activeDetailCells, cell.code);
    ctx.activeFineCells = ctx.activeFineCells.filter((candidate) => candidate.detailParentCode !== cell.code);
  }

  function toggleFineMute(ctx, cell) {
    if (!cell || !cell.code) return;
    if (cellListHasCode(ctx.mutedFineCells, cell.code)) {
      ctx.mutedFineCells = removeCellByCode(ctx.mutedFineCells, cell.code);
      return;
    }
    ctx.mutedFineCells = addUniqueCell(ctx.mutedFineCells, cell);
    ctx.activeFineCells = removeCellByCode(ctx.activeFineCells, cell.code);
  }

  function addUniqueCell(cells, cell) {
    const output = removeCellByCode(cells, cell.code);
    output.push(cell);
    return output;
  }

  function removeCellByCode(cells, code) {
    return (Array.isArray(cells) ? cells : []).filter((cell) => cell && cell.code !== code);
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value)));
  }

  function activeCellsForCodes(grid, cellCodes) {
    const wanted = new Set(Array.isArray(cellCodes) ? cellCodes : []);
    if (!wanted.size || !grid || !Array.isArray(grid.cells)) return [];
    return grid.cells.filter((cell) => wanted.has(cell.code));
  }

  function activeDataCellCodes(ctx) {
    const codes = new Set(effectiveMainCellCodes(ctx));
    effectiveDetailCells(ctx).forEach((cell) => {
      if (cell.parentCode) codes.add(cell.parentCode);
    });
    effectiveFineCells(ctx).forEach((cell) => {
      if (cell.parentCode) codes.add(cell.parentCode);
    });
    if (ctx.selectedDetailCell && !detailCellMuted(ctx, ctx.selectedDetailCell)) codes.add(ctx.selectedDetailCell.parentCode);
    if (ctx.selectedFineCell && !fineCellMuted(ctx, ctx.selectedFineCell)) codes.add(ctx.selectedFineCell.parentCode);
    return Array.from(codes);
  }

  function effectiveMainCellCodes(ctx) {
    const muted = new Set(Array.isArray(ctx.mutedCellCodes) ? ctx.mutedCellCodes : []);
    return (Array.isArray(ctx.activeCellCodes) ? ctx.activeCellCodes : []).filter((code) => !muted.has(code));
  }

  function effectiveDetailCells(ctx) {
    return (Array.isArray(ctx.activeDetailCells) ? ctx.activeDetailCells : []).filter((cell) => !detailCellMuted(ctx, cell));
  }

  function effectiveFineCells(ctx) {
    return (Array.isArray(ctx.activeFineCells) ? ctx.activeFineCells : []).filter((cell) => !fineCellMuted(ctx, cell));
  }

  function activeAreaClipCells(ctx, activeCells) {
    const fineCells = effectiveFineCells(ctx);
    const selectedFine = ctx.selectedFineCell && !fineCellMuted(ctx, ctx.selectedFineCell) ? ctx.selectedFineCell : null;
    if (fineCells.length) return fineCells;
    if (selectedFine) return [selectedFine];
    if (fineModeActive(ctx)) return [];

    const detailCells = effectiveDetailCells(ctx);
    const selectedDetail = ctx.selectedDetailCell && !detailCellMuted(ctx, ctx.selectedDetailCell) ? ctx.selectedDetailCell : null;
    if (detailCells.length) return detailCells;
    if (selectedDetail) return [selectedDetail];
    if (detailModeActive(ctx)) return [];

    return activeCells.filter((cell) => !mainCellMuted(ctx, cell.code));
  }

  function activeDetailClipCells(ctx) {
    const fineCells = effectiveFineCells(ctx);
    const selectedFine = ctx.selectedFineCell && !fineCellMuted(ctx, ctx.selectedFineCell) ? ctx.selectedFineCell : null;
    if (fineCells.length) return fineCells;
    if (selectedFine) return [selectedFine];
    return [];
  }

  function fineModeActive(ctx) {
    return Boolean((ctx.activeFineCells && ctx.activeFineCells.length) || (ctx.mutedFineCells && ctx.mutedFineCells.length) || ctx.selectedFineCell);
  }

  function detailModeActive(ctx) {
    return Boolean((ctx.activeDetailCells && ctx.activeDetailCells.length) || (ctx.mutedDetailCells && ctx.mutedDetailCells.length) || ctx.selectedDetailCell);
  }

  function mainCellMuted(ctx, code) {
    return Boolean(code && Array.isArray(ctx.mutedCellCodes) && ctx.mutedCellCodes.includes(code));
  }

  function detailCellMuted(ctx, cell) {
    if (!cell) return false;
    if (mainCellMuted(ctx, cell.parentCode)) return true;
    return cellListHasCode(ctx.mutedDetailCells, cell.code);
  }

  function fineCellMuted(ctx, cell) {
    if (!cell) return false;
    if (mainCellMuted(ctx, cell.parentCode)) return true;
    if (cell.detailParentCode && cellListHasCode(ctx.mutedDetailCells, cell.detailParentCode)) return true;
    return cellListHasCode(ctx.mutedFineCells, cell.code);
  }

  function cellListHasCode(cells, code) {
    return Boolean(code && Array.isArray(cells) && cells.some((cell) => cell && cell.code === code));
  }

  function mutedSectorCount(ctx) {
    return (ctx.mutedCellCodes ? ctx.mutedCellCodes.length : 0) +
      (ctx.mutedDetailCells ? ctx.mutedDetailCells.length : 0) +
      (ctx.mutedFineCells ? ctx.mutedFineCells.length : 0);
  }

  function selectedSectorIsMuted(ctx) {
    if (ctx.selectedFineCell) return fineCellMuted(ctx, ctx.selectedFineCell);
    if (ctx.selectedDetailCell) return detailCellMuted(ctx, ctx.selectedDetailCell);
    if (ctx.selected.cell) return mainCellMuted(ctx, ctx.selected.cell.code);
    return false;
  }

  function detailGridCellsForDisplay(ctx) {
    const parentCodes = new Set();
    if (ctx.selected && ctx.selected.cell) parentCodes.add(ctx.selected.cell.code);
    ctx.activeDetailCells.forEach((cell) => parentCodes.add(cell.parentCode));
    ctx.mutedDetailCells.forEach((cell) => parentCodes.add(cell.parentCode));
    ctx.activeFineCells.forEach((cell) => parentCodes.add(cell.parentCode));
    ctx.mutedFineCells.forEach((cell) => parentCodes.add(cell.parentCode));
    if (ctx.selectedDetailCell) parentCodes.add(ctx.selectedDetailCell.parentCode);
    if (ctx.selectedFineCell) parentCodes.add(ctx.selectedFineCell.parentCode);
    return Array.from(parentCodes)
      .map((code) => ctx.cellForCode(code))
      .filter(Boolean)
      .flatMap((cell) => makeInspectionGrid(cell, ctx.detailGridRows || INSPECTION_GRID_ROWS, ctx.detailGridCols || INSPECTION_GRID_COLS));
  }

  function fineGridCellsForDisplay(ctx) {
    const detailCodes = new Set();
    if (ctx.selectedDetailCell) detailCodes.add(ctx.selectedDetailCell.code);
    if (ctx.selectedFineCell && ctx.selectedFineCell.detailParentCode) detailCodes.add(ctx.selectedFineCell.detailParentCode);
    ctx.activeFineCells.forEach((cell) => {
      if (cell.detailParentCode) detailCodes.add(cell.detailParentCode);
    });
    ctx.mutedFineCells.forEach((cell) => {
      if (cell.detailParentCode) detailCodes.add(cell.detailParentCode);
    });
    return Array.from(detailCodes)
      .map((code) => detailCellByCode(ctx, code))
      .filter(Boolean)
      .flatMap((cell) => makeFineGrid(cell, ctx.fineGridRows || FINE_GRID_ROWS, ctx.fineGridCols || FINE_GRID_COLS));
  }

  function detailCellByCode(ctx, code) {
    if (!code || typeof code !== "string") return null;
    const parsed = parseDetailCellCode(code);
    if (!parsed) return null;
    const parentCell = ctx.cellForCode(parsed.parentCode);
    if (!parentCell) return null;
    return makeInspectionGrid(parentCell, ctx.detailGridRows || INSPECTION_GRID_ROWS, ctx.detailGridCols || INSPECTION_GRID_COLS)
      .find((cell) => cell.code === code) || null;
  }

  function parseDetailCellCode(code) {
    const match = code.match(/^(.*):r(\d{2})c(\d{2})$/);
    if (!match) return null;
    return { parentCode: match[1], row: Number(match[2]) - 1, col: Number(match[3]) - 1 };
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
          level: "inspection",
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

  function makeFineGrid(detailCell, rows, cols) {
    const cells = [];
    const width = (detailCell.maxX - detailCell.minX) / cols;
    const height = (detailCell.maxY - detailCell.minY) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const minX = detailCell.minX + col * width;
        const maxX = col === cols - 1 ? detailCell.maxX : minX + width;
        const minY = detailCell.minY + row * height;
        const maxY = row === rows - 1 ? detailCell.maxY : minY + height;
        cells.push({
          code: `${detailCell.code}:f${pad2(row + 1)}c${pad2(col + 1)}`,
          parentCode: detailCell.parentCode,
          detailParentCode: detailCell.code,
          level: "practical",
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

  function shortFineCellCode(cell) {
    if (!cell || !cell.code) return "";
    return cell.code.replace(":r", ":").replace("c", "-").replace(":f", "→").replace("c", "-");
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

  function fineCellForFeature(detailCell, feature, rows, cols, geometryKey) {
    const points = featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = boundsForPoints(points);
    const target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
    return makeFineGrid(detailCell, rows, cols).find((cell) => pointInCell(target, cell)) || null;
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
