(function bootKaneMap(global) {
  "use strict";

  const catalog = global.KaneMapDemoCatalog;
  const grid = global.KaneMapGrid.makeKaneGrid(catalog.meta.bounds, {
    rows: 4,
    cols: 6,
    startNorth: 11,
    startEast: 5
  });

  const featureStore = global.KaneMapChunkRegistry.createFeatureStore(catalog);
  const allCellCodes = grid.cells.map((cell) => cell.code);
  const allBuildings = featureStore.buildDataForCells(allCellCodes).buildings;
  const initialData = featureStore.buildDataForCells(allCellCodes);
  const store = global.KaneMapLocalStore.createLocalObservationStore();
  const canvas = document.getElementById("mapCanvas");
  const renderer = global.KaneMapRenderer.createRenderer(canvas, initialData, grid);
  const designators = global.KaneMapDesignators;
  const searchIndex = global.KaneMapSearchIndex.createSearchIndex({
    grid,
    buildings: allBuildings,
    getRecords: () => store.snapshot()
  });
  const coverageModel = global.KaneMapCoverage.createCoverageModel({
    grid,
    buildings: allBuildings,
    getRecords: () => store.snapshot()
  });

  const els = {
    selectedCell: document.getElementById("selectedCell"),
    selectedBuilding: document.getElementById("selectedBuilding"),
    selectedStories: document.getElementById("selectedStories"),
    buildingSummary: document.getElementById("buildingSummary"),
    observationForm: document.getElementById("observationForm"),
    observationFormTitle: document.getElementById("observationFormTitle"),
    editModeNotice: document.getElementById("editModeNotice"),
    saveObservation: document.getElementById("saveObservation"),
    cancelEdit: document.getElementById("cancelEdit"),
    siteLabel: document.getElementById("siteLabel"),
    entranceId: document.getElementById("entranceId"),
    mailboxBankId: document.getElementById("mailboxBankId"),
    visibleDesignators: document.getElementById("visibleDesignators"),
    designatorPreview: document.getElementById("designatorPreview"),
    unitCount: document.getElementById("unitCount"),
    designatorPattern: document.getElementById("designatorPattern"),
    confidence: document.getElementById("confidence"),
    visitStatus: document.getElementById("visitStatus"),
    accessContext: document.getElementById("accessContext"),
    observationNotes: document.getElementById("observationNotes"),
    showSelectedOnly: document.getElementById("showSelectedOnly"),
    recordCount: document.getElementById("recordCount"),
    recordList: document.getElementById("recordList"),
    storageStatus: document.getElementById("storageStatus"),
    viewStatus: document.getElementById("viewStatus"),
    chunkStatus: document.getElementById("chunkStatus"),
    visibleCellStatus: document.getElementById("visibleCellStatus"),
    reviewFilterStatus: document.getElementById("reviewFilterStatus"),
    zoomIn: document.getElementById("zoomIn"),
    zoomOut: document.getElementById("zoomOut"),
    rotateLeft: document.getElementById("rotateLeft"),
    rotateRight: document.getElementById("rotateRight"),
    resetView: document.getElementById("resetView"),
    navSearch: document.getElementById("navSearch"),
    clearSearch: document.getElementById("clearSearch"),
    searchResults: document.getElementById("searchResults"),
    coverageSummary: document.getElementById("coverageSummary"),
    statusFilter: document.getElementById("statusFilter"),
    coverageByCell: document.getElementById("coverageByCell"),
    exportRecords: document.getElementById("exportRecords"),
    exportObservationCsv: document.getElementById("exportObservationCsv"),
    exportBuildingCsv: document.getElementById("exportBuildingCsv"),
    exportFieldReport: document.getElementById("exportFieldReport"),
    importRecords: document.getElementById("importRecords"),
    importPreview: document.getElementById("importPreview"),
    importActions: document.getElementById("importActions"),
    confirmImport: document.getElementById("confirmImport"),
    cancelImport: document.getElementById("cancelImport"),
    downloadBackupBeforeImport: document.getElementById("downloadBackupBeforeImport"),
    clearRecords: document.getElementById("clearRecords")
  };

  let selected = { cell: null, building: null };
  let visibleCellCodes = [];
  let editingRecordId = null;
  let pendingImport = null;

  function init() {
    bindCanvasEvents();
    bindControlEvents();
    bindObservationEvents();
    window.addEventListener("resize", handleResize);
    handleResize();
    updateSelectedPanel();
    updateDesignatorPreview();
    updateRecordPanel();
    updateBuildingSummary();
    updateReviewUi();
    updateStorageStatus();
    updateViewAndChunkStatus();
  }

  function handleResize() {
    renderer.resize();
    updateActiveChunks();
    updateViewAndChunkStatus();
  }

  function bindCanvasEvents() {
    let moved = false;

    canvas.addEventListener("pointerdown", (event) => {
      moved = false;
      canvas.setPointerCapture(event.pointerId);
      renderer.beginDrag(pointerPosition(event));
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!renderer.state.dragging) return;
      moved = true;
      renderer.dragTo(pointerPosition(event));
      updateActiveChunks();
      updateViewAndChunkStatus();
    });

    canvas.addEventListener("pointerup", (event) => {
      renderer.endDrag();
      if (!moved) selectAt(event);
      updateActiveChunks();
      updateViewAndChunkStatus();
    });

    canvas.addEventListener("pointercancel", () => renderer.endDrag());

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      renderer.zoomBy(event.deltaY < 0 ? 1.12 : 0.88);
      updateActiveChunks();
      updateViewAndChunkStatus();
    }, { passive: false });
  }

  function bindControlEvents() {
    els.zoomIn.addEventListener("click", () => changeView(() => renderer.zoomBy(1.18)));
    els.zoomOut.addEventListener("click", () => changeView(() => renderer.zoomBy(0.84)));
    els.rotateLeft.addEventListener("click", () => changeView(() => renderer.rotateBy(-12)));
    els.rotateRight.addEventListener("click", () => changeView(() => renderer.rotateBy(12)));
    els.resetView.addEventListener("click", () => changeView(() => renderer.resetView()));
    els.navSearch.addEventListener("input", handleNavigationSearch);
    els.clearSearch.addEventListener("click", () => {
      els.navSearch.value = "";
      renderSearchResults([]);
      els.navSearch.focus();
    });
    els.searchResults.addEventListener("click", handleSearchResultClick);
    els.statusFilter.addEventListener("change", updateReviewUi);
    els.showSelectedOnly.addEventListener("change", updateRecordPanel);
    els.cancelEdit.addEventListener("click", () => {
      stopEditing();
      clearObservationForm();
    });

    els.exportRecords.addEventListener("click", () => {
      const filename = `kane-map-observations-${dateStamp()}.json`;
      store.download(filename, store.exportJson());
    });

    els.exportObservationCsv.addEventListener("click", () => {
      const filename = `kane-map-observations-${dateStamp()}.csv`;
      const csv = global.KaneMapExporters.observationCsv(store.snapshot());
      store.download(filename, csv, "text/csv");
    });

    els.exportBuildingCsv.addEventListener("click", () => {
      const filename = `kane-map-building-summary-${dateStamp()}.csv`;
      const csv = global.KaneMapExporters.buildingSummaryCsv(allBuildings, coverageModel.build());
      store.download(filename, csv, "text/csv");
    });

    els.exportFieldReport.addEventListener("click", () => {
      const filename = `kane-map-field-report-${dateStamp()}.txt`;
      const report = global.KaneMapExporters.fieldReport(coverageModel.build());
      store.download(filename, report, "text/plain");
    });

    els.importRecords.addEventListener("change", handleImportRecords);
    els.confirmImport.addEventListener("click", confirmPendingImport);
    els.cancelImport.addEventListener("click", clearImportPreview);
    els.downloadBackupBeforeImport.addEventListener("click", () => {
      const filename = `kane-map-before-import-${dateStamp()}.json`;
      store.download(filename, store.exportJson());
    });

    els.clearRecords.addEventListener("click", () => {
      if (!store.snapshot().length) return;
      const ok = confirm("Clear locally saved Kane-Map observation records from this browser?");
      if (!ok) return;
      stopEditing();
      clearImportPreview();
      store.clear();
      refreshRecordUi();
    });

    els.recordList.addEventListener("click", handleRecordListClick);
  }

  function bindObservationEvents() {
    els.visibleDesignators.addEventListener("input", updateDesignatorPreview);

    els.observationForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!selected.building) {
        alert("Select a building before adding or updating an observation.");
        return;
      }

      const input = buildRecordInput();
      if (editingRecordId) {
        const updated = store.updateRecord(editingRecordId, input);
        if (!updated) alert(`Could not update ${editingRecordId}.`);
      } else {
        store.addRecord(input);
      }

      stopEditing();
      clearObservationForm();
      refreshRecordUi();
    });
  }

  function handleRecordListClick(event) {
    const editButton = event.target.closest("button[data-record-edit]");
    const deleteButton = event.target.closest("button[data-record-delete]");

    if (editButton) {
      startEditing(editButton.getAttribute("data-record-edit"));
      return;
    }

    if (!deleteButton) return;
    const recordId = deleteButton.getAttribute("data-record-delete");
    const ok = confirm(`Delete local observation record ${recordId}?`);
    if (!ok) return;
    if (editingRecordId === recordId) stopEditing();
    store.deleteRecord(recordId);
    refreshRecordUi();
  }

  function buildRecordInput() {
    const parsedDesignators = designators.parseDesignators(els.visibleDesignators.value);
    const observedUnitCount = resolveObservedUnitCount(els.unitCount.value, parsedDesignators);

    return {
      gridCell: selected.cell ? selected.cell.code : selected.building.cell,
      buildingId: selected.building.id,
      buildingLabel: selected.building.label,
      buildingName: selected.building.name,
      stories: selected.building.stories,
      siteLabel: els.siteLabel.value.trim(),
      entranceId: els.entranceId.value.trim(),
      mailboxBankId: els.mailboxBankId.value.trim(),
      observedUnitCount,
      designatorPattern: els.designatorPattern.value.trim(),
      visibleDesignators: parsedDesignators,
      designatorRaw: els.visibleDesignators.value.trim(),
      confidence: els.confidence.value,
      visitStatus: els.visitStatus.value,
      accessContext: els.accessContext.value.trim(),
      notes: els.observationNotes.value.trim()
    };
  }

  function startEditing(recordId) {
    const record = store.getRecord(recordId);
    if (!record) return;

    const building = findBuildingById(record.buildingId);
    if (building) {
      selected = { cell: cellForCode(record.gridCell || building.cell), building };
      renderer.setSelected(selected.building, selected.cell);
      updateSelectedPanel();
    }

    editingRecordId = record.id;
    els.observationFormTitle.textContent = "Edit observation";
    els.editModeNotice.hidden = false;
    els.saveObservation.textContent = "Update field observation";
    els.cancelEdit.hidden = false;

    els.siteLabel.value = record.siteLabel || "";
    els.entranceId.value = record.entranceId || "";
    els.mailboxBankId.value = record.mailboxBankId || "";
    els.visibleDesignators.value = record.designatorRaw || record.visibleDesignators.join(", ");
    els.unitCount.value = record.observedUnitCount === null ? "" : String(record.observedUnitCount);
    els.designatorPattern.value = record.designatorPattern || "";
    els.confidence.value = record.confidence || "unreviewed";
    els.visitStatus.value = record.visitStatus || "observed";
    els.accessContext.value = record.accessContext || "";
    els.observationNotes.value = record.notes || "";
    updateDesignatorPreview();
    updateRecordPanel();
  }

  function stopEditing() {
    editingRecordId = null;
    els.observationFormTitle.textContent = "Offline observation";
    els.editModeNotice.hidden = true;
    els.saveObservation.textContent = "Add field observation";
    els.cancelEdit.hidden = true;
  }

  function clearObservationForm() {
    els.siteLabel.value = "";
    els.entranceId.value = "";
    els.mailboxBankId.value = "";
    els.visibleDesignators.value = "";
    els.unitCount.value = "";
    els.designatorPattern.value = "";
    els.confidence.value = "unreviewed";
    els.visitStatus.value = "observed";
    els.accessContext.value = "";
    els.observationNotes.value = "";
    updateDesignatorPreview();
  }

  function updateDesignatorPreview() {
    els.designatorPreview.textContent = designators.compactPreview(els.visibleDesignators.value);
  }

  function changeView(action) {
    action();
    updateActiveChunks();
    updateViewAndChunkStatus();
  }

  function updateActiveChunks() {
    const visibleBounds = global.KaneMapGrid.expandBounds(renderer.visibleWorldBounds(), 90);
    const visibleCells = global.KaneMapGrid.findCellsIntersectingBounds(grid, visibleBounds);
    visibleCellCodes = visibleCells.map((cell) => cell.code);
    renderer.setData(featureStore.buildDataForCells(visibleCellCodes));
    updateCoverageByCell(coverageModel.build());
  }

  function selectAt(event) {
    const hit = renderer.hitTest(pointerPosition(event));
    selected = { cell: hit.cell, building: hit.building };
    renderer.setSelected(hit.building, hit.cell);
    updateSelectedPanel();
    updateRecordPanel();
  }

  function handleNavigationSearch() {
    renderSearchResults(searchIndex.search(els.navSearch.value));
  }

  function renderSearchResults(results) {
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
        `<button type="button" data-result-type="${escapeHtml(result.type)}"`,
        ` data-building-id="${escapeHtml(result.buildingId || "")}"`,
        ` data-cell-code="${escapeHtml(result.cellCode || "")}">`,
        `<strong>${escapeHtml(result.label)}</strong>`,
        `<span>${escapeHtml(result.type)} · ${escapeHtml(result.detail)}</span>`,
        `</button>`
      ].join("");
      els.searchResults.appendChild(item);
    });
  }

  function handleSearchResultClick(event) {
    const button = event.target.closest("button[data-result-type]");
    if (!button) return;

    const buildingId = button.getAttribute("data-building-id");
    const cellCode = button.getAttribute("data-cell-code");

    if (buildingId) jumpToBuilding(buildingId);
    else if (cellCode) jumpToCell(cellCode);
  }

  function jumpToBuilding(buildingId) {
    const building = findBuildingById(buildingId);
    if (!building) return;
    const cell = cellForCode(building.cell);

    selected = { cell, building };
    renderer.centerOnPolygon(building.polygon);
    updateActiveChunks();
    renderer.setSelected(building, cell);
    updateSelectedPanel();
    updateRecordPanel();
    updateViewAndChunkStatus();
  }

  function jumpToCell(cellCode) {
    const cell = cellForCode(cellCode);
    if (!cell) return;

    selected = { cell, building: null };
    renderer.centerOnWorldPoint(cell.center);
    updateActiveChunks();
    renderer.setSelected(null, cell);
    updateSelectedPanel();
    updateRecordPanel();
    updateViewAndChunkStatus();
  }

  function updateSelectedPanel() {
    els.selectedCell.textContent = selected.cell ? selected.cell.code : "None";
    els.selectedBuilding.textContent = selected.building
      ? `${selected.building.label} · ${selected.building.name}`
      : "None";
    els.selectedStories.textContent = selected.building ? `${selected.building.stories}` : "—";
    updateBuildingSummary();
  }

  function updateBuildingSummary() {
    if (!selected.building) {
      els.buildingSummary.textContent = "Select a building to view saved observations.";
      return;
    }

    const records = store.recordsForBuilding(selected.building.id);
    if (!records.length) {
      els.buildingSummary.innerHTML = `<strong>${escapeHtml(selected.building.label)}</strong><br>No saved observations for this building.`;
      return;
    }

    const summary = coverageModel.build().summaryByBuilding[selected.building.id];
    const count = summary.observedUnitCount === null ? "unknown" : String(summary.observedUnitCount);
    const conflict = summary.countVariants.length > 1
      ? `<br><span class="status-warning">Count conflict: ${escapeHtml(summary.countVariants.join(" / "))}</span>`
      : "";

    els.buildingSummary.innerHTML = [
      `<strong>${escapeHtml(selected.building.label)}</strong>`,
      `<br>${records.length} saved observation${records.length === 1 ? "" : "s"}`,
      `<br>Latest count: ${escapeHtml(count)}`,
      `<br>Latest status: ${escapeHtml(summary.status)}`,
      `<br>Confidence: ${escapeHtml(summary.confidence)}`,
      conflict
    ].join("");
  }

  function updateRecordPanel() {
    let records = store.snapshot();
    els.recordCount.textContent = String(records.length);
    els.recordList.innerHTML = "";

    if (els.showSelectedOnly.checked && selected.building) {
      records = records.filter((record) => record.buildingId === selected.building.id);
    }

    records.slice(-12).reverse().forEach((record) => renderRecordItem(record));
  }

  function renderRecordItem(record) {
    const item = document.createElement("li");
    const count = record.observedUnitCount === null ? "unknown count" : `${record.observedUnitCount} units`;
    const date = record.updatedAt ? record.updatedAt.slice(0, 10) : "undated";
    const designatorText = formatDesignatorList(record);
    if (selected.building && record.buildingId === selected.building.id) item.classList.add("record-selected-building");
    if (editingRecordId === record.id) item.classList.add("record-selected-building");

    item.innerHTML = [
      `<div class="record-header"><strong>${escapeHtml(record.buildingLabel)}</strong>`,
      `<span class="record-actions">`,
      `<button type="button" data-record-edit="${escapeHtml(record.id)}">Edit</button>`,
      `<button type="button" data-record-delete="${escapeHtml(record.id)}">Delete</button>`,
      `</span></div>`,
      ` ${escapeHtml(record.gridCell)} · ${escapeHtml(count)}`,
      `<br><span class="muted">${escapeHtml(record.id)} · updated ${escapeHtml(date)}</span>`,
      `<br><span class="status-pill">${escapeHtml(record.visitStatus)} · ${escapeHtml(record.confidence)}</span>`,
      record.siteLabel ? `<br>Site: ${escapeHtml(record.siteLabel)}` : "",
      record.mailboxBankId ? `<br>Mailbank: ${escapeHtml(record.mailboxBankId)}` : "",
      designatorText ? `<br>Designators: ${escapeHtml(designatorText)}` : "",
      record.notes ? `<br>${escapeHtml(record.notes)}` : ""
    ].join("");
    els.recordList.appendChild(item);
  }

  function refreshRecordUi() {
    updateRecordPanel();
    updateBuildingSummary();
    updateReviewUi();
    handleNavigationSearch();
    updateStorageStatus();
  }

  function updateReviewUi() {
    const coverage = coverageModel.build();
    updateBuildingStatusOverlay(coverage);
    updateCoverageSummary(coverage);
    updateCoverageByCell(coverage);
    updateMapReviewFilter(coverage);
  }

  function updateBuildingStatusOverlay(coverage) {
    renderer.setBuildingRecordSummary(coverage.summaryByBuilding);
  }

  function updateCoverageSummary(coverage) {
    const summary = coverage.totals;
    els.coverageSummary.innerHTML = [
      `<strong>${summary.recordedBuildings}/${summary.totalBuildings}</strong> buildings have records`,
      `<br>${summary.unrecordedBuildings} buildings still unrecorded`,
      `<br>${summary.latestUnitTotal} latest observed units`,
      `<br>${summary.verifiedBuildings} verified · ${summary.revisitBuildings} revisit · ${summary.conflictBuildings} conflict`,
      `<br>${summary.recordCount} saved observation records`
    ].join("");
  }

  function updateCoverageByCell(coverage) {
    const visible = new Set(visibleCellCodes);
    const rows = coverage.cellRows
      .filter((row) => visible.size === 0 || visible.has(row.cellCode))
      .filter((row) => row.totalBuildings > 0)
      .sort((a, b) => b.recordedBuildings - a.recordedBuildings || a.cellCode.localeCompare(b.cellCode))
      .slice(0, 8);

    if (!rows.length) {
      els.coverageByCell.textContent = "No residential buildings in the current visible cells.";
      return;
    }

    els.coverageByCell.innerHTML = rows.map((row) => [
      `<div class="coverage-row">`,
      `<strong>${escapeHtml(row.cellCode)}</strong>`,
      `<span>${row.recordedBuildings}/${row.totalBuildings} recorded</span>`,
      `<span>${row.latestUnitTotal} units</span>`,
      `<span>${row.conflictBuildings} conflict · ${row.revisitBuildings} revisit</span>`,
      `</div>`
    ].join("")).join("");
  }

  function updateMapReviewFilter(coverage) {
    const filter = els.statusFilter.value;
    const ids = global.KaneMapCoverage.filterBuildingIds(allBuildings, coverage.summaryByBuilding, filter);
    renderer.setBuildingFilter(ids);

    const matching = ids === null ? allBuildings.length : ids.length;
    const label = global.KaneMapCoverage.labelForFilter(filter);
    els.reviewFilterStatus.textContent = `Review: ${label} (${matching}/${allBuildings.length})`;
  }

  function resolveObservedUnitCount(rawUnitCount, parsedDesignators) {
    const typed = String(rawUnitCount || "").trim();
    const typedNumber = Number(typed);

    if (typed !== "" && Number.isFinite(typedNumber) && typedNumber > 0) return Math.floor(typedNumber);
    if (parsedDesignators.length > 0) return parsedDesignators.length;
    if (typed !== "" && Number.isFinite(typedNumber) && typedNumber === 0) return 0;
    return null;
  }

  function formatDesignatorList(record) {
    const values = Array.isArray(record.visibleDesignators) ? record.visibleDesignators : [];
    if (!values.length) return record.designatorPattern || "";

    const limit = 24;
    const shown = values.slice(0, limit).join(", ");
    const extra = values.length > limit ? ` +${values.length - limit} more` : "";
    return `${values.length} designators: ${shown}${extra}`;
  }

  function updateStorageStatus() {
    const status = store.storageStatus();
    els.storageStatus.textContent = status.label;
    els.storageStatus.title = status.detail;
  }

  function updateViewAndChunkStatus() {
    const chunkStatus = featureStore.statusForCells(visibleCellCodes);
    els.viewStatus.textContent = [
      `Zoom ${renderer.state.zoom.toFixed(2)}`,
      `Bearing ${Math.round(renderer.state.bearing)}°`
    ].join(" / ");
    els.chunkStatus.textContent = `Chunks ${chunkStatus.selected}/${chunkStatus.total}`;
    els.chunkStatus.title = chunkStatus.ids.join(", ");
    els.visibleCellStatus.textContent = `Visible cells ${visibleCellCodes.length}/${grid.cells.length}`;
  }

  function handleImportRecords(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const knownBuildingIds = allBuildings.map((building) => building.id);
      const knownCellCodes = grid.cells.map((cell) => cell.code);
      const preview = global.KaneMapImportValidator.previewObservationImport(
        String(reader.result || ""),
        store.snapshot(),
        { knownBuildingIds, knownCellCodes }
      );

      pendingImport = preview.ok ? preview : null;
      renderImportPreview(preview, file.name);
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function confirmPendingImport() {
    if (!pendingImport || !pendingImport.ok) return;

    const count = pendingImport.records.length;
    const ok = confirm(`Replace all local observation records with ${count} imported records? Export a backup first if needed.`);
    if (!ok) return;

    stopEditing();
    store.replaceAll(pendingImport.records);
    clearImportPreview();
    refreshRecordUi();
  }

  function renderImportPreview(preview, filename) {
    const summary = preview.summary;
    const status = preview.ok ? "Import can be applied." : "Import blocked.";
    const warnings = preview.warnings.length
      ? `<ul>${preview.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : `<p class="muted">No warnings.</p>`;
    const errors = preview.errors.length
      ? `<ul>${preview.errors.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : `<p class="muted">No errors.</p>`;

    els.importPreview.hidden = false;
    els.importActions.hidden = false;
    els.confirmImport.disabled = !preview.ok;
    els.importPreview.innerHTML = [
      `<strong>${escapeHtml(status)}</strong>`,
      `<br><span class="muted">File: ${escapeHtml(filename)}</span>`,
      `<div class="import-compare">`,
      `<span>Current: ${summary.currentCount} records · ${summary.currentBuildings} buildings · ${summary.currentUnits} units</span>`,
      `<span>Incoming: ${summary.incomingCount} records · ${summary.incomingBuildings} buildings · ${summary.incomingUnits} units</span>`,
      `<span>Verified: ${summary.currentVerified} → ${summary.incomingVerified}</span>`,
      `<span>Conflicts: ${summary.currentConflicts} → ${summary.incomingConflicts}</span>`,
      `</div>`,
      `<details ${preview.errors.length ? "open" : ""}><summary>Errors</summary>${errors}</details>`,
      `<details ${preview.warnings.length ? "open" : ""}><summary>Warnings</summary>${warnings}</details>`,
      `<p class="fine-print">Import uses replace mode. JSON backup remains the full-fidelity restore format.</p>`
    ].join("");
  }

  function clearImportPreview() {
    pendingImport = null;
    els.importPreview.hidden = true;
    els.importActions.hidden = true;
    els.importPreview.innerHTML = "";
    els.confirmImport.disabled = false;
    els.importRecords.value = "";
  }

  function findBuildingById(buildingId) {
    return allBuildings.find((building) => building.id === buildingId) || null;
  }

  function cellForCode(code) {
    return grid.cells.find((cell) => cell.code === code) || null;
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  init();
})(window);
