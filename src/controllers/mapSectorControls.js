(function kaneMapMapSectorControls(global) {
  "use strict";

  const LAYER_SPECS = Object.freeze([
    { key: "roads", label: "Roads" },
    { key: "water", label: "Water" },
    { key: "buildings", label: "Building shapes" },
    { key: "addressPoints", label: "Address points" },
    { key: "labels", label: "Labels" }
  ]);

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

  global.KaneMapMapSectorControls = { installLayerControls };
})(window);
