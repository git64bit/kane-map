(function bootKaneMap(global) {
  "use strict";

  const ctx = global.KaneMapAppContext.createAppContext();

  global.KaneMapWorkspaceController.installWorkspaceController(ctx);
  global.KaneMapMapController.installMapController(ctx);
  global.KaneMapObservationController.installObservationController(ctx);
  global.KaneMapReviewController.installReviewController(ctx);
  global.KaneMapImportExportController.installImportExportController(ctx);
  global.KaneMapShortcutsController.installShortcutsController(ctx);

  function init() {
    ctx.setDefaultVisitDate();
    ctx.bindCanvasEvents();
    ctx.bindWorkspaceTabs();
    ctx.bindMapControlEvents();
    ctx.bindReviewEvents();
    ctx.bindImportExportEvents();
    ctx.bindKeyboardShortcuts();
    ctx.bindObservationEvents();
    window.addEventListener("resize", ctx.handleResize);
    ctx.handleResize();
    ctx.updateSelectedPanel();
    ctx.updateDesignatorPreview();
    ctx.updateRecordPanel();
    ctx.updateBuildingSummary();
    ctx.updateIdentitySummary();
    ctx.updateReviewUi();
    ctx.updateVisitSessionUi();
    ctx.updateFieldPlanUi();
    ctx.updateStorageStatus();
    ctx.updateViewAndChunkStatus();
  }

  init();
})(window);
