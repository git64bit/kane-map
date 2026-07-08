(function kaneMapImportExportController(global) {
  "use strict";

  function installImportExportController(ctx) {
    const { els } = ctx;

    ctx.bindImportExportEvents = function bindImportExportEvents() {
      els.exportRecords.addEventListener("click", () => {
        ctx.store.download(`kane-map-observations-${ctx.dateStamp()}.json`, ctx.store.exportJson());
      });

      els.exportObservationCsv.addEventListener("click", () => {
        const csv = global.KaneMapExporters.observationCsv(ctx.store.snapshot());
        ctx.store.download(`kane-map-observations-${ctx.dateStamp()}.csv`, csv, "text/csv");
      });

      els.exportBuildingCsv.addEventListener("click", () => {
        const csv = global.KaneMapExporters.buildingSummaryCsv(ctx.allBuildings, ctx.coverageModel.build());
        ctx.store.download(`kane-map-building-summary-${ctx.dateStamp()}.csv`, csv, "text/csv");
      });

      els.exportFieldReport.addEventListener("click", () => {
        const report = global.KaneMapExporters.fieldReport(ctx.coverageModel.build());
        ctx.store.download(`kane-map-field-report-${ctx.dateStamp()}.txt`, report, "text/plain");
      });

      els.exportVisitCsv.addEventListener("click", () => {
        const csv = global.KaneMapExporters.visitSessionCsv(global.KaneMapVisitSessions.summarize(ctx.store.snapshot(), ctx.allBuildings));
        ctx.store.download(`kane-map-visit-sessions-${ctx.dateStamp()}.csv`, csv, "text/csv");
      });

      els.exportPlanCsv.addEventListener("click", () => {
        const csv = global.KaneMapExporters.fieldPlanCsv(ctx.currentFieldPlan());
        ctx.store.download(`kane-map-field-plan-${ctx.dateStamp()}.csv`, csv, "text/csv");
      });

      els.importRecords.addEventListener("change", ctx.handleImportRecords);
      els.confirmImport.addEventListener("click", ctx.confirmPendingImport);
      els.cancelImport.addEventListener("click", ctx.clearImportPreview);
      els.downloadBackupBeforeImport.addEventListener("click", () => {
        ctx.store.download(`kane-map-before-import-${ctx.dateStamp()}.json`, ctx.store.exportJson());
      });

      els.clearRecords.addEventListener("click", () => {
        if (!ctx.store.snapshot().length) return;
        const ok = confirm("Clear locally saved Kane-Map observation records from this browser?");
        if (!ok) return;
        ctx.stopEditing();
        ctx.clearImportPreview();
        ctx.store.clear();
        ctx.refreshRecordUi();
      });
    };

    ctx.handleImportRecords = function handleImportRecords(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const knownBuildingIds = ctx.allBuildings.map((building) => building.id);
        const knownCellCodes = ctx.grid.cells.map((cell) => cell.code);
        const preview = global.KaneMapImportValidator.previewObservationImport(
          String(reader.result || ""),
          ctx.store.snapshot(),
          { knownBuildingIds, knownCellCodes }
        );

        ctx.pendingImport = preview.ok ? preview : null;
        ctx.renderImportPreview(preview, file.name);
        event.target.value = "";
      };
      reader.readAsText(file);
    };

    ctx.confirmPendingImport = function confirmPendingImport() {
      if (!ctx.pendingImport || !ctx.pendingImport.ok) return;

      const count = ctx.pendingImport.records.length;
      const ok = confirm(`Replace all local observation records with ${count} imported records? Export a backup first if needed.`);
      if (!ok) return;

      ctx.stopEditing();
      ctx.store.replaceAll(ctx.pendingImport.records);
      ctx.clearImportPreview();
      ctx.refreshRecordUi();
    };

    ctx.renderImportPreview = function renderImportPreview(preview, filename) {
      const summary = preview.summary;
      const status = preview.ok ? "Import can be applied." : "Import blocked.";
      const warnings = preview.warnings.length
        ? `<ul>${preview.warnings.map((item) => `<li>${ctx.escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p class="muted">No warnings.</p>`;
      const errors = preview.errors.length
        ? `<ul>${preview.errors.map((item) => `<li>${ctx.escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p class="muted">No errors.</p>`;

      els.importPreview.hidden = false;
      els.importActions.hidden = false;
      els.confirmImport.disabled = !preview.ok;
      els.importPreview.innerHTML = [
        `<strong>${ctx.escapeHtml(status)}</strong>`,
        `<br><span class="muted">File: ${ctx.escapeHtml(filename)}</span>`,
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
    };

    ctx.clearImportPreview = function clearImportPreview() {
      ctx.pendingImport = null;
      els.importPreview.hidden = true;
      els.importActions.hidden = true;
      els.importPreview.innerHTML = "";
      els.confirmImport.disabled = false;
      els.importRecords.value = "";
    };

    ctx.updateStorageStatus = function updateStorageStatus() {
      const status = ctx.store.storageStatus();
      els.storageStatus.textContent = status.label;
      els.storageStatus.title = status.detail;
    };
  }

  global.KaneMapImportExportController = { installImportExportController };
})(window);
