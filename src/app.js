(function bootKaneMap(global) {
  "use strict";

  function installControllers(ctx) {
    global.KaneMapWorkspaceController.installWorkspaceController(ctx);
    global.KaneMapMapController.installMapController(ctx);
    global.KaneMapObservationController.installObservationController(ctx);
    global.KaneMapReviewController.installReviewController(ctx);
    global.KaneMapImportExportController.installImportExportController(ctx);
    global.KaneMapShortcutsController.installShortcutsController(ctx);
  }

  function init(ctx) {
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

  function showBootError(error) {
    console.error("Kane-Map boot failed", error);
    const status = document.getElementById("renderStatus");
    if (status) status.textContent = "Render: boot failed";
    const chunkStatus = document.getElementById("chunkStatus");
    if (chunkStatus) chunkStatus.textContent = error && error.message ? error.message : "Boot failed";
  }

  Promise.resolve(global.KaneMapAppContext.createAppContext())
    .then((ctx) => {
      installControllers(ctx);
      init(ctx);
    })
    .catch(showBootError);
})(window);
