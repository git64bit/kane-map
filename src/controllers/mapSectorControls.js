(function kaneMapMapSectorControls(global) {
  "use strict";

  const LAYER_SPECS = Object.freeze([
    { key: "roads", label: "Roads" },
    { key: "water", label: "Water" },
    { key: "buildings", label: "Building shapes" },
    { key: "addressPoints", label: "Address points" }
  ]);

  function installLayerControls(ctx) {
    if (ctx.els.layerControlPanel) return;
    const section = ctx.els.zoomIn ? ctx.els.zoomIn.closest(".section") : null;
    if (!section) return;

    const panel = document.createElement("div");
    panel.className = "section map-layer-controls";
    panel.innerHTML = [
      `<div class="button-grid">`,
      `<button id="muteSelectedSector" type="button" class="secondary">Mute selected sector</button>`,
      `</div>`,
      `<div class="layer-toggle-list">`,
      LAYER_SPECS.map((spec) => `
        <label class="layer-toggle-row">
          <input type="checkbox" data-map-layer="${spec.key}" /> ${spec.label}
        </label>
      `).join(""),
      `</div>`
    ].join("");

    section.insertAdjacentElement("afterend", panel);
    ctx.els.layerControlPanel = panel;
    ctx.els.muteSelectedSector = panel.querySelector("#muteSelectedSector");
    ctx.els.layerToggles = Array.from(panel.querySelectorAll("input[data-map-layer]"));

    ctx.els.muteSelectedSector.addEventListener("click", ctx.toggleSelectedSectorMuted);
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
