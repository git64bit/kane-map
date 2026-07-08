(function kaneMapMapController(global) {
  "use strict";

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
        renderer.zoomBy(event.deltaY < 0 ? 1.12 : 0.88);
        ctx.updateActiveChunks();
        ctx.updateViewAndChunkStatus();
      }, { passive: false });
    };

    ctx.bindMapControlEvents = function bindMapControlEvents() {
      els.zoomIn.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(1.18)));
      els.zoomOut.addEventListener("click", () => ctx.changeView(() => renderer.zoomBy(0.84)));
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
      renderer.setData(ctx.featureStore.buildDataForCells(ctx.visibleCellCodes));
      ctx.updateCoverageByCell(ctx.coverageModel.build());
      ctx.updateFieldPlanUi();
    };

    ctx.selectAt = function selectAt(event) {
      const hit = renderer.hitTest(ctx.pointerPosition(event));
      ctx.selected = { cell: hit.cell, building: hit.building };
      renderer.setSelected(hit.building, hit.cell);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
    };

    ctx.handleNavigationSearch = function handleNavigationSearch() {
      ctx.renderSearchResults(ctx.searchIndex.search(els.navSearch.value));
    };

    ctx.renderSearchResults = function renderSearchResults(results) {
      els.searchResults.innerHTML = "";
      if (!els.navSearch.value.trim()) {
        els.searchResults.innerHTML = `<li class="muted">Search grid cells, buildings, sites, statuses, or unit designators.</li>`;
        return;
      }
      if (!results.length) {
        els.searchResults.innerHTML = `<li class="muted">No local matches.</li>`;
        return;
      }

      results.forEach((result) => {
        const item = document.createElement("li");
        item.innerHTML = [
          `<button type="button" data-result-type="${ctx.escapeHtml(result.type)}"`,
          ` data-building-id="${ctx.escapeHtml(result.buildingId || "" )}"`,
          ` data-cell-code="${ctx.escapeHtml(result.cellCode || "")}">`,
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

      ctx.selected = { cell, building };
      renderer.centerOnPolygon(building.polygon);
      ctx.updateActiveChunks();
      renderer.setSelected(building, cell);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.jumpToCell = function jumpToCell(cellCode) {
      const cell = ctx.cellForCode(cellCode);
      if (!cell) return;

      ctx.selected = { cell, building: null };
      renderer.centerOnWorldPoint(cell.center);
      ctx.updateActiveChunks();
      renderer.setSelected(null, cell);
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.goToAdjacentBuilding = function goToAdjacentBuilding(direction) {
      const buildings = ctx.visibleNavigableBuildings();
      if (!buildings.length) return "No visible buildings";

      const currentIndex = ctx.selected.building
        ? buildings.findIndex((building) => building.id === ctx.selected.building.id)
        : -1;
      let nextIndex = currentIndex + direction;

      if (currentIndex === -1) nextIndex = direction > 0 ? 0 : buildings.length - 1;
      if (nextIndex < 0) nextIndex = buildings.length - 1;
      if (nextIndex >= buildings.length) nextIndex = 0;

      const next = buildings[nextIndex];
      ctx.jumpToBuilding(next.id);
      return `${next.label} selected`;
    };

    ctx.visibleNavigableBuildings = function visibleNavigableBuildings() {
      const visible = new Set(ctx.visibleCellCodes.length ? ctx.visibleCellCodes : ctx.allCellCodes);
      const coverage = ctx.coverageModel.build();
      const filterIds = global.KaneMapCoverage.filterBuildingIds(
        ctx.allBuildings,
        coverage.summaryByBuilding,
        els.statusFilter.value
      );
      const allowed = filterIds === null ? null : new Set(filterIds);

      return ctx.allBuildings
        .filter((building) => visible.has(building.cell))
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
        site ? `Site: ${site}` : "",
        `Stories: ${ctx.selected.building.stories}`,
        `Observed units: ${count}`,
        `Status: ${status}`
      ].filter(Boolean).join("\n");
    };

    ctx.updateViewAndChunkStatus = function updateViewAndChunkStatus() {
      const chunkStatus = ctx.featureStore.statusForCells(ctx.visibleCellCodes);
      els.viewStatus.textContent = [
        `Zoom ${renderer.state.zoom.toFixed(2)}`,
        `Bearing ${Math.round(renderer.state.bearing)}°`
      ].join(" / ");
      els.chunkStatus.textContent = `Chunks ${chunkStatus.selected}/${chunkStatus.total}`;
      els.chunkStatus.title = chunkStatus.ids.join(", ");
      els.visibleCellStatus.textContent = `Visible cells ${ctx.visibleCellCodes.length}/${ctx.grid.cells.length}`;
    };
  }

  global.KaneMapMapController = { installMapController };
})(window);
