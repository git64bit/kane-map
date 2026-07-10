(function kaneMapMapNavigationSupport(global) {
  "use strict";

  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;
  const FINE_GRID_ROWS = 8;
  const FINE_GRID_COLS = 8;

  function installMapNavigationSupport(ctx) {
    const {
      activeDataCellCodes,
      effectiveMainCellCodes,
      effectiveDetailCells,
      effectiveFineCells,
      mutedSectorCount,
      selectedSectorIsMuted,
      shortDetailCellCode,
      shortFineCellCode,
      detailCellForFeature,
      fineCellForFeature,
      featureBelongsToActiveCells
    } = global.KaneMapMapSectorSupport;

    const { els, renderer } = ctx;
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

  global.KaneMapMapNavigationSupport = { installMapNavigationSupport };
})(window);
