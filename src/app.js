(function bootKaneMap(global) {
  "use strict";

  const data = global.KaneMapDemoFeatures;
  const grid = global.KaneMapGrid.makeKaneGrid(data.meta.bounds, {
    rows: 4,
    cols: 6,
    startNorth: 11,
    startEast: 5
  });

  const store = global.KaneMapOfflineRecords.createOfflineRecordStore();
  const canvas = document.getElementById("mapCanvas");
  const renderer = global.KaneMapRenderer.createRenderer(canvas, data, grid);

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
    viewStatus: document.getElementById("viewStatus"),
    zoomIn: document.getElementById("zoomIn"),
    zoomOut: document.getElementById("zoomOut"),
    rotateLeft: document.getElementById("rotateLeft"),
    rotateRight: document.getElementById("rotateRight"),
    resetView: document.getElementById("resetView"),
    exportRecords: document.getElementById("exportRecords"),
    importRecords: document.getElementById("importRecords"),
    clearRecords: document.getElementById("clearRecords")
  };

  let selected = {
    cell: null,
    building: null
  };

  function init() {
    bindCanvasEvents();
    bindControlEvents();
    bindObservationEvents();
    window.addEventListener("resize", handleResize);
    handleResize();
    updateSelectedPanel();
    updateRecordPanel();
    updateViewStatus();
  }

  function handleResize() {
    renderer.resize();
    updateViewStatus();
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
      updateViewStatus();
    });

    canvas.addEventListener("pointerup", (event) => {
      renderer.endDrag();
      if (!moved) selectAt(event);
    });

    canvas.addEventListener("pointercancel", () => {
      renderer.endDrag();
    });

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      renderer.zoomBy(event.deltaY < 0 ? 1.12 : 0.88);
      updateViewStatus();
    }, { passive: false });
  }

  function bindControlEvents() {
    els.zoomIn.addEventListener("click", () => {
      renderer.zoomBy(1.18);
      updateViewStatus();
    });

    els.zoomOut.addEventListener("click", () => {
      renderer.zoomBy(0.84);
      updateViewStatus();
    });

    els.rotateLeft.addEventListener("click", () => {
      renderer.rotateBy(-12);
      updateViewStatus();
    });

    els.rotateRight.addEventListener("click", () => {
      renderer.rotateBy(12);
      updateViewStatus();
    });

    els.resetView.addEventListener("click", () => {
      renderer.resetView();
      updateViewStatus();
    });

    els.exportRecords.addEventListener("click", () => {
      const filename = `kane-map-observations-${dateStamp()}.json`;
      store.download(filename, store.exportJson());
    });

    els.importRecords.addEventListener("change", handleImportRecords);

    els.clearRecords.addEventListener("click", () => {
      if (!store.snapshot().length) return;
      const ok = confirm("Clear offline memory records for this browser session?");
      if (!ok) return;
      store.clear();
      updateRecordPanel();
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
    });
  }

  function selectAt(event) {
    const hit = renderer.hitTest(pointerPosition(event));
    selected = {
      cell: hit.cell,
      building: hit.building
    };
    renderer.setSelected(hit.building, hit.cell);
    updateSelectedPanel();
  }

  function updateSelectedPanel() {
    els.selectedCell.textContent = selected.cell ? selected.cell.code : "None";
    els.selectedBuilding.textContent = selected.building
      ? `${selected.building.label} · ${selected.building.name}`
      : "None";
    els.selectedStories.textContent = selected.building
      ? `${selected.building.stories}`
      : "—";
  }

  function updateRecordPanel() {
    const records = store.snapshot();
    els.recordCount.textContent = String(records.length);
    els.recordList.innerHTML = "";

    records.slice(-8).reverse().forEach((record) => {
      const item = document.createElement("li");
      const count = record.observedUnitCount === null ? "unknown count" : `${record.observedUnitCount} units`;
      item.innerHTML = [
        `<strong>${escapeHtml(record.buildingLabel)}</strong>`,
        ` ${escapeHtml(record.gridCell)} · ${escapeHtml(count)}`,
        record.designatorPattern ? `<br>${escapeHtml(record.designatorPattern)}` : "",
        record.notes ? `<br>${escapeHtml(record.notes)}` : ""
      ].join("");
      els.recordList.appendChild(item);
    });
  }

  function updateViewStatus() {
    els.viewStatus.textContent = [
      `Zoom ${renderer.state.zoom.toFixed(2)}`,
      `Bearing ${Math.round(renderer.state.bearing)}°`
    ].join(" / ");
  }

  function handleImportRecords(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importJson(String(reader.result || ""));
        updateRecordPanel();
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
