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
    updateRuntimeModeStatus(ctx);
    updateDataSourceStatus(ctx);
  }

  function showBootError(error) {
    console.error("Kane-Map boot failed", error);
    const status = document.getElementById("renderStatus");
    if (status) status.textContent = "Render: boot failed";
    const message = error && error.message ? error.message : "Boot failed";
    const chunkStatus = document.getElementById("chunkStatus");
    if (chunkStatus) chunkStatus.textContent = message;
    updateRuntimeModeStatus(null);
    const sourceStatus = ensureFooterStatusSpan("dataSourceStatus");
    if (sourceStatus) sourceStatus.textContent = dataUnavailableLabel(message);
    const loadStatus = ensureFooterStatusSpan("dataLoadStatus");
    if (loadStatus) loadStatus.textContent = "Load: unavailable";
  }

  function updateDataSourceStatus(ctx) {
    const sourceStatus = ensureFooterStatusSpan("dataSourceStatus");
    if (sourceStatus) sourceStatus.textContent = sourceLabel(ctx && ctx.dataSource);

    const loadStatus = ensureFooterStatusSpan("dataLoadStatus");
    if (loadStatus) loadStatus.textContent = sourceLoadLabel(ctx && ctx.dataSource);
  }

  function updateRuntimeModeStatus(ctx) {
    const runtimeStatus = ensureRuntimeStatusSpan();
    if (runtimeStatus) runtimeStatus.textContent = runtimeModeLabel(ctx && ctx.dataSource);
  }

  function ensureRuntimeStatusSpan() {
    let element = document.getElementById("runtimeModeStatus");
    if (element) return element;
    const footer = document.querySelector(".status-bar");
    if (!footer) return null;
    const spans = Array.from(footer.querySelectorAll("span"));
    element = spans.find((span) => /demo mode by default/i.test(span.textContent || ""));
    if (!element) {
      element = document.createElement("span");
      footer.appendChild(element);
    }
    element.id = "runtimeModeStatus";
    return element;
  }

  function ensureFooterStatusSpan(id) {
    let element = document.getElementById(id);
    if (element) return element;
    const footer = document.querySelector(".status-bar");
    if (!footer) return null;
    element = document.createElement("span");
    element.id = id;
    footer.appendChild(element);
    return element;
  }

  function runtimeModeLabel(dataSource) {
    const config = global.KaneMapRealBundleConfig || {};
    const portable = global.KaneMapPortableConfig || {};
    if (dataSource && dataSource.sourceType === "prepared") return "Runtime: production data active";
    if (config.enabledByDefault && portable.role === "portable-production-default") {
      return "Runtime: portable production default";
    }
    if (config.enabledByDefault) return "Runtime: production default";
    return "Runtime: source demo default";
  }

  function sourceLabel(dataSource) {
    if (!dataSource) return "Data: unknown";
    if (dataSource.sourceType === "prepared") {
      return `Data: ${dataSource.label || "Kane County production bundle"}`;
    }
    return "Data: Demo";
  }

  function dataUnavailableLabel(message) {
    if (/production data unavailable/i.test(message || "")) {
      return "Data: Production data unavailable";
    }
    return "Data: unavailable";
  }

  function sourceLoadLabel(dataSource) {
    if (!dataSource) return "Load: unavailable";
    const parts = [];
    if (dataSource.totalLayers) parts.push(`Layers ${formatNumber(dataSource.totalLayers)}`);
    if (dataSource.totalChunks) parts.push(`Chunks ${formatNumber(dataSource.totalChunks)}`);
    if (dataSource.totalFeatures) parts.push(`Features ${formatNumber(dataSource.totalFeatures)}`);
    if (!parts.length && dataSource.dataVersion) parts.push(`Version ${dataSource.dataVersion}`);
    return parts.length ? `Load: ${parts.join(" · ")}` : "Load: ready";
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    return number.toLocaleString("en-US");
  }

  Promise.resolve(global.KaneMapAppContext.createAppContext())
    .then((ctx) => {
      installControllers(ctx);
      init(ctx);
    })
    .catch(showBootError);
})(window);
