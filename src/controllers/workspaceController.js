(function kaneMapWorkspaceController(global) {
  "use strict";

  function installWorkspaceController(ctx) {
    const { els } = ctx;

    ctx.bindWorkspaceTabs = function bindWorkspaceTabs() {
      els.workspaceTabs.forEach((tab) => {
        tab.addEventListener("click", () => ctx.switchWorkspaceTab(tab.getAttribute("data-tab")));
      });
    };

    ctx.switchWorkspaceTab = function switchWorkspaceTab(tabName) {
      if (!tabName) return;
      els.workspaceTabs.forEach((tab) => {
        const isActive = tab.getAttribute("data-tab") === tabName;
        tab.setAttribute("aria-selected", String(isActive));
      });
      els.workspacePanels.forEach((panel) => {
        panel.hidden = panel.getAttribute("data-tab-panel") !== tabName;
      });
    };

    ctx.updateSelectedPanel = function updateSelectedPanel() {
      els.selectedCell.textContent = ctx.selected.cell ? ctx.selected.cell.code : "None";
      els.selectedBuilding.textContent = ctx.selected.building
        ? `${ctx.selected.building.label} · ${ctx.selected.building.name}`
        : "None";
      els.selectedStories.textContent = ctx.selected.building ? `${ctx.selected.building.stories}` : "—";
      ctx.updateBuildingSummary();
      ctx.updateIdentitySummary();
      ctx.updateWorkspaceHeader();
    };

    ctx.updateBuildingSummary = function updateBuildingSummary() {
      if (!ctx.selected.building) {
        els.buildingSummary.textContent = "Select a building to view saved observations.";
        return;
      }

      const records = ctx.store.recordsForBuilding(ctx.selected.building.id);
      if (!records.length) {
        els.buildingSummary.innerHTML = `<strong>${ctx.escapeHtml(ctx.selected.building.label)}</strong><br>No saved observations for this building.`;
        return;
      }

      const summary = ctx.coverageModel.build().summaryByBuilding[ctx.selected.building.id];
      const count = summary.observedUnitCount === null ? "unknown" : String(summary.observedUnitCount);
      const conflict = summary.countVariants.length > 1
        ? `<br><span class="status-warning">Count conflict: ${ctx.escapeHtml(summary.countVariants.join(" / "))}</span>`
        : "";

      els.buildingSummary.innerHTML = [
        `<strong>${ctx.escapeHtml(ctx.selected.building.label)}</strong>`,
        `<br>${records.length} saved observation${records.length === 1 ? "" : "s"}`,
        `<br>Latest count: ${ctx.escapeHtml(count)}`,
        `<br>Latest status: ${ctx.escapeHtml(summary.status)}`,
        `<br>Confidence: ${ctx.escapeHtml(summary.confidence)}`,
        `<br>Latest visit: ${ctx.escapeHtml(summary.latestVisitDate || "undated")}`,
        conflict
      ].join("");
    };

    ctx.updateWorkspaceHeader = function updateWorkspaceHeader() {
      if (!els.selectedWorkspaceHeader) return;

      if (!ctx.selected.building) {
        els.selectedWorkspaceHeader.textContent = ctx.selected.cell
          ? `Selected: ${ctx.selected.cell.code}`
          : "Selected: none";
        return;
      }

      const summary = ctx.coverageModel.build().summaryByBuilding[ctx.selected.building.id];
      const count = summary && summary.observedUnitCount !== null
        ? `${summary.observedUnitCount} units`
        : "no count";
      const status = summary ? summary.status : "unrecorded";
      const identity = ctx.siteIdentityModel.analyzeBuilding(ctx.selected.building.id);
      const site = identity.labels[0] || identity.aliases[0] || ctx.selected.building.name || ctx.selected.building.label;

      els.selectedWorkspaceHeader.textContent = [
        "Selected:",
        ctx.selected.building.label,
        "·",
        ctx.selected.building.cell,
        "·",
        site,
        "·",
        count,
        "·",
        status
      ].join(" ");
    };

    ctx.updateIdentitySummary = function updateIdentitySummary() {
      if (!ctx.selected.building) {
        els.identitySummary.textContent = "Select a building to review site identity.";
        return;
      }

      const identity = ctx.siteIdentityModel.analyzeBuilding(ctx.selected.building.id);
      const lines = [
        `<strong>Identity layer</strong>`,
        `<br>Site labels: ${ctx.escapeHtml(identity.labels.join(" / ") || "none")}`,
        `<br>Building aliases: ${ctx.escapeHtml(identity.aliases.join(" / ") || "none")}`,
        `<br>Entrances: ${ctx.escapeHtml(identity.entrances.join(" / ") || "none")}`,
        `<br>Mailbanks: ${ctx.escapeHtml(identity.mailbanks.join(" / ") || "none")}`
      ];
      identity.warnings.slice(0, 3).forEach((warning) => lines.push(`<br><span class="status-warning">${ctx.escapeHtml(warning)}</span>`));
      ctx.siteIdentityModel.globalWarnings().slice(0, 2).forEach((warning) => lines.push(`<br><span class="status-warning">Global: ${ctx.escapeHtml(warning)}</span>`));
      els.identitySummary.innerHTML = lines.join("");
    };
  }

  global.KaneMapWorkspaceController = { installWorkspaceController };
})(window);
