(function bootKaneMap(global) {
  "use strict";

  const BATCH_LABEL = "UI: Batch 092R";

  function installControllers(ctx) {
    global.KaneMapWorkspaceController.installWorkspaceController(ctx);
    global.KaneMapMapController.installMapController(ctx);
    global.KaneMapMapSectorRecovery.installMapSectorRecovery(ctx);
    global.KaneMapObservationController.installObservationController(ctx);
    global.KaneMapReviewController.installReviewController(ctx);
    global.KaneMapImportExportController.installImportExportController(ctx);
    global.KaneMapShortcutsController.installShortcutsController(ctx);
  }

  function init(ctx, runtimeStatus) {
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
    runtimeStatus.updateRuntimeModeStatus(ctx);
    runtimeStatus.updateDataSourceStatus(ctx);
    runtimeStatus.updateDataSwitchStatus(ctx);
    runtimeStatus.updateUiBatchStatus();
  }

  function loadScriptOnce(src, globalName) {
    if (globalName && global[globalName]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-kane-runtime="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error(`Unable to load ${src}`)),
          { once: true }
        );
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.dataset.kaneRuntime = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });
  }

  let runtimeStatus = null;
  loadScriptOnce("src/app/runtimeStatus.js", "KaneMapRuntimeStatus")
    .then(() => {
      runtimeStatus = global.KaneMapRuntimeStatus.createRuntimeStatus(BATCH_LABEL);
      runtimeStatus.markBootPending();
      return Promise.all([
        loadScriptOnce("src/app/sectorDomain.js", "KaneMapSectorDomain"),
        loadScriptOnce("src/controllers/mapSectorControls.js", "KaneMapMapSectorControls"),
        loadScriptOnce("src/controllers/mapGeometrySupport.js", "KaneMapMapGeometrySupport"),
        loadScriptOnce("src/controllers/mapSectorState.js", "KaneMapMapSectorState"),
        loadScriptOnce("src/controllers/mapGridHierarchy.js", "KaneMapMapGridHierarchy"),
        loadScriptOnce("src/controllers/mapNavigationSupport.js", "KaneMapMapNavigationSupport"),
        loadScriptOnce("src/controllers/mapSectorRecovery.js", "KaneMapMapSectorRecovery"),
        loadScriptOnce("src/map/drawLayerSupport.js", "KaneMapDrawLayerSupport"),
        loadScriptOnce("src/map/drawGridLayers.js", "KaneMapDrawGridLayers"),
        loadScriptOnce("src/map/drawFeatureLayers.js", "KaneMapDrawFeatureLayers")
      ]);
    })
    .then(() => loadScriptOnce("src/controllers/mapSectorSupport.js", "KaneMapMapSectorSupport"))
    .then(() => global.KaneMapAppContext.createAppContext())
    .then((ctx) => {
      installControllers(ctx);
      init(ctx, runtimeStatus);
    })
    .catch((error) => {
      if (runtimeStatus) {
        runtimeStatus.showBootError(error);
        return;
      }
      console.error("Kane-Map boot failed before runtime status initialization", error);
    });
})(window);
