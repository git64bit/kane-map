(function kaneMapReviewController(global) {
  "use strict";

  function installReviewController(ctx) {
    const { els } = ctx;

    ctx.bindReviewEvents = function bindReviewEvents() {
      els.statusFilter.addEventListener("change", ctx.updateReviewUi);
      els.planFilter.addEventListener("change", ctx.updateFieldPlanUi);
      els.fieldPlanRows.addEventListener("click", ctx.handleFieldPlanClick);
    };

    ctx.updateReviewUi = function updateReviewUi() {
      const coverage = ctx.coverageModel.build();
      ctx.updateBuildingStatusOverlay(coverage);
      ctx.updateCoverageSummary(coverage);
      ctx.updateCoverageByCell(coverage);
      ctx.updateMapReviewFilter(coverage);
    };

    ctx.updateBuildingStatusOverlay = function updateBuildingStatusOverlay(coverage) {
      ctx.renderer.setBuildingRecordSummary(coverage.summaryByBuilding);
    };

    ctx.updateCoverageSummary = function updateCoverageSummary(coverage) {
      const summary = coverage.totals;
      els.coverageSummary.innerHTML = [
        `<strong>${summary.recordedBuildings}/${summary.totalBuildings}</strong> buildings have records`,
        `<br>${summary.unrecordedBuildings} buildings still unrecorded`,
        `<br>${summary.latestUnitTotal} latest observed units`,
        `<br>${summary.verifiedBuildings} verified · ${summary.revisitBuildings} revisit · ${summary.conflictBuildings} conflict`,
        `<br>${summary.recordCount} saved observation records`
      ].join("");
    };

    ctx.updateCoverageByCell = function updateCoverageByCell(coverage) {
      const visible = new Set(ctx.visibleCellCodes);
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
        `<strong>${ctx.escapeHtml(row.cellCode)}</strong>`,
        `<span>${row.recordedBuildings}/${row.totalBuildings} recorded</span>`,
        `<span>${row.latestUnitTotal} units</span>`,
        `<span>${row.conflictBuildings} conflict · ${row.revisitBuildings} revisit</span>`,
        `</div>`
      ].join("")).join("");
    };

    ctx.updateMapReviewFilter = function updateMapReviewFilter(coverage) {
      const filter = els.statusFilter.value;
      const ids = global.KaneMapCoverage.filterBuildingIds(ctx.allBuildings, coverage.summaryByBuilding, filter);
      ctx.renderer.setBuildingFilter(ids);

      const matching = ids === null ? ctx.allBuildings.length : ids.length;
      const label = global.KaneMapCoverage.labelForFilter(filter);
      els.reviewFilterStatus.textContent = `Review: ${label} (${matching}/${ctx.allBuildings.length})`;
    };

    ctx.updateVisitSessionUi = function updateVisitSessionUi() {
      const visits = global.KaneMapVisitSessions.summarize(ctx.store.snapshot(), ctx.allBuildings);
      els.visitStatusSummary.textContent = `Visits: ${visits.totals.visitDates} days / ${visits.totals.sessions} sessions`;

      if (!visits.totals.records) {
        els.visitSessionSummary.textContent = "No saved visit-session records yet.";
        els.visitSessionRows.textContent = "No visit sessions yet.";
        return;
      }

      els.visitSessionSummary.innerHTML = [
        `<strong>${visits.totals.records}</strong> records across ${visits.totals.buildings} buildings`,
        `<br>${visits.totals.visitDates} visit date${visits.totals.visitDates === 1 ? "" : "s"} · ${visits.totals.sessions} session${visits.totals.sessions === 1 ? "" : "s"}`,
        `<br>${visits.revisitRecords.length} follow-up record${visits.revisitRecords.length === 1 ? "" : "s"}`
      ].join("");

      els.visitSessionRows.innerHTML = visits.sessionRows.slice(0, 6).map((row) => [
        `<div class="coverage-row">`,
        `<strong>${ctx.escapeHtml(row.sessionId)}</strong>`,
        `<span>${row.recordCount} records · ${row.buildingCount} buildings</span>`,
        `<span>${row.unitTotal} units</span>`,
        `<span>${row.conflictCount} conflict · ${row.revisitCount} revisit</span>`,
        `</div>`
      ].join("")).join("");
    };

    ctx.currentFieldPlan = function currentFieldPlan() {
      return global.KaneMapFieldPlan.summarize(ctx.allBuildings, ctx.coverageModel.build(), ctx.store.snapshot(), {
        filter: els.planFilter ? els.planFilter.value : "active",
        visibleCellCodes: ctx.visibleCellCodes
      });
    };

    ctx.updateFieldPlanUi = function updateFieldPlanUi() {
      if (!els.fieldPlanSummary || !els.fieldPlanRows) return;
      const plan = ctx.currentFieldPlan();
      const totals = plan.totals;
      const rows = plan.visibleRows.slice(0, 8);

      els.planStatusSummary.textContent = `Plan: ${plan.filteredRows.length} active / ${totals.priorityBuildings} priority`;
      els.fieldPlanSummary.innerHTML = [
        `<strong>${plan.filteredRows.length}</strong> buildings in current plan filter`,
        `<br>${totals.priorityBuildings} priority · ${totals.highPriorityBuildings} high/urgent`,
        `<br>${totals.conflictBuildings} conflict · ${totals.revisitBuildings} revisit`,
        `<br>${totals.unrecordedBuildings} unrecorded buildings`
      ].join("");

      if (!rows.length) {
        els.fieldPlanRows.textContent = "No field-plan rows in the current visible cells.";
        return;
      }

      els.fieldPlanRows.innerHTML = rows.map((row) => [
        `<button type="button" class="plan-row" data-building-id="${ctx.escapeHtml(row.buildingId)}">`,
        `<strong>${ctx.escapeHtml(row.buildingLabel)}</strong>`,
        `<span>${ctx.escapeHtml(row.gridCell)} · ${ctx.escapeHtml(row.status)} · ${row.observedUnitCount === null ? "unknown" : row.observedUnitCount + " units"}</span>`,
        `<span>Priority: ${ctx.escapeHtml(global.KaneMapFieldPlan.labelForPriority(row.planPriority))}</span>`,
        row.planAction ? `<span>${ctx.escapeHtml(row.planAction)}</span>` : `<span class="muted">No planned action note.</span>`,
        `</button>`
      ].join("")).join("");
    };

    ctx.handleFieldPlanClick = function handleFieldPlanClick(event) {
      const button = event.target.closest("button[data-building-id]");
      if (!button) return;
      ctx.jumpToBuilding(button.getAttribute("data-building-id"));
    };
  }

  global.KaneMapReviewController = { installReviewController };
})(window);
