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
  const initialData = featureStore.buildDataForCells(grid.cells.map((cell) => cell.code));
  const store = global.KaneMapLocalStore.createLocalObservationStore();
  const canvas = document.getElementById("mapCanvas");
  const renderer = global.KaneMapRenderer.createRenderer(canvas, initialData, grid);

  const els = {
    selectedCell: document.getElementById("selectedCell"),
    selectedBuilding: document.getElementById("selectedBuilding"),
    selectedStories: document.getElementById("selectedStories"),
    observationForm: document.getElementById("observationForm"),
    unitCount: document.getElementById("unitCount"),
    designatorPattern: document.getElementById("designatorPattern"),
    observationNotes: document.getElementById("observationNotes"),
    recordCount: document.getElementById("recordCount"),
    recordList: document.getElementById("recordList"),
    storageStatus: document.getElementById("storageStatus"),
    viewStatus: document.getElementById("viewStatus"),
    chunkStatus: document.getElementById("chunkStatus"),
    visibleCellStatus: document.getElementById("visibleCellStatus"),
    zoomIn: document.getElementById("zoomIn"),
    zoomOut: document.getElementById("zoomOut"),
    rotateLeft: document.getElementById("rotateLeft"),
    rotateRight: document.getElementById("rotateRight"),
    resetView: document.getElementById("resetView"),
    exportRecords: document.getElementById("exportRecords"),
    importRecords: document.getElementById("importRecords"),
    clearRecords: document.getElementById("clearRecords")
  };

  let selected = { cell: null, building: null };
  let visibleCellCodes = [];

  function init() {
    bindCanvasEvents();
    bindControlEvents();
    bindObservationEvents();
    window.addEventListener("resize", handleResize);
    handleResize();
    updateSelectedPanel();
    updateRecordPanel();
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

    canvas.addEventListener("pointercancel", () => {
      renderer.endDrag();
    });

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

    els.exportRecords.addEventListener("click", () => {
      const filename = `kane-map-observations-${dateStamp()}.json`;
      store.download(filename, store.exportJson());
    });

    els.importRecords.addEventListener("change", handleImportRecords);

    els.clearRecords.addEventListener("click", () => {
      if (!store.snapshot().length) return;
      const ok = confirm("Clear locally saved Kane-Map observation records from this browser?");
      if (!ok) return;
      store.clear();
      updateRecordPanel();
      updateStorageStatus();
    });
  }

  function bindObservationEvents() {
    els.observationForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!selected.building) {
        alert("Select a building before adding an observation.");
        return;
      }

      const observedUnitCount = Number(els.unitCount.value);
      store.addRecord({
        gridCell: selected.cell ? selected.cell.code : selected.building.cell,
        buildingId: selected.building.id,
        buildingLabel: selected.building.label,
        stories: selected.building.stories,
        observedUnitCount: Number.isFinite(observedUnitCount) ? observedUnitCount : null,
        designatorPattern: els.designatorPattern.value.trim(),
        notes: els.observationNotes.value.trim()
      });

      els.unitCount.value = "";
      els.designatorPattern.value = "";
      els.observationNotes.value = "";
      updateRecordPanel();
      updateStorageStatus();
    });
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
  }

  function selectAt(event) {
    const hit = renderer.hitTest(pointerPosition(event));
    selected = { cell: hit.cell, building: hit.building };
    renderer.setSelected(hit.building, hit.cell);
    updateSelectedPanel();
  }

  function updateSelectedPanel() {
    els.selectedCell.textContent = selected.cell ? selected.cell.code : "None";
    els.selectedBuilding.textContent = selected.building
      ? `${selected.building.label} · ${selected.building.name}`
      : "None";
    els.selectedStories.textContent = selected.building ? `${selected.building.stories}` : "—";
  }

  function updateRecordPanel() {
    const records = store.snapshot();
    els.recordCount.textContent = String(records.length);
    els.recordList.innerHTML = "";

    records.slice(-8).reverse().forEach((record) => {
      const item = document.createElement("li");
      const count = record.observedUnitCount === null ? "unknown count" : `${record.observedUnitCount} units`;
      const date = record.createdAt ? record.createdAt.slice(0, 10) : "undated";
      item.innerHTML = [
        `<strong>${escapeHtml(record.buildingLabel)}</strong>`,
        ` ${escapeHtml(record.gridCell)} · ${escapeHtml(count)}`,
        `<br><span class="muted">${escapeHtml(record.id)} · ${escapeHtml(date)}</span>`,
        record.designatorPattern ? `<br>${escapeHtml(record.designatorPattern)}` : "",
        record.notes ? `<br>${escapeHtml(record.notes)}` : ""
      ].join("");
      els.recordList.appendChild(item);
    });
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
      try {
        store.importJson(String(reader.result || ""));
        updateRecordPanel();
        updateStorageStatus();
      } catch (error) {
        alert(`Import failed: ${error.message}`);
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
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
