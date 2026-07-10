(function kaneMapRuntimeStatus(global) {
  "use strict";

  const PRODUCTION_BUNDLE_ROOT = "processing/output/prepared";

  function createRuntimeStatus(batchLabel) {
    function showBootError(error) {
      console.error("Kane-Map boot failed", error);
      const status = document.getElementById("renderStatus");
      if (status) status.textContent = "Render: boot failed";
      const message = error && error.message ? error.message : "Boot failed";
      const chunkStatus = document.getElementById("chunkStatus");
      if (chunkStatus) chunkStatus.textContent = message;
      const runtimeStatus = ensureRuntimeStatusSpan();
      if (runtimeStatus) runtimeStatus.textContent = bootErrorRuntimeLabel();
      const sourceStatus = ensureFooterStatusSpan("dataSourceStatus");
      if (sourceStatus) sourceStatus.textContent = dataUnavailableLabel(message);
      const loadStatus = ensureFooterStatusSpan("dataLoadStatus");
      if (loadStatus) loadStatus.textContent = "Load: unavailable";
      updateDataSwitchStatus(null);
      updateUiBatchStatus();
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

    function updateUiBatchStatus() {
      const element = ensureFooterStatusSpan("uiBatchStatus");
      if (element) element.textContent = batchLabel;
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

    function updateDataSwitchStatus(ctx) {
      const element = ensureFooterStatusSpan("dataSwitchStatus");
      if (!element) return;
      const dataSource = ctx && ctx.dataSource ? ctx.dataSource : null;
      const active = dataSource && dataSource.sourceType === "prepared" ? "production" : "demo";
      element.textContent = "";
      element.appendChild(document.createTextNode("Switch: "));
      element.appendChild(modeLink("Demo", "demo", active === "demo"));
      element.appendChild(document.createTextNode(" | "));
      element.appendChild(modeLink("Production", "production", active === "production"));
    }

    function modeLink(label, mode, active) {
      const link = document.createElement("a");
      link.href = modeUrl(mode);
      link.textContent = active ? `${label} active` : label;
      link.title = mode === "production"
        ? "Open Kane County production data using processing/output/prepared"
        : "Open synthetic demo data";
      return link;
    }

    function modeUrl(mode) {
      const url = new URL(global.location.href);
      if (mode === "production") {
        url.searchParams.set("data", "prepared");
        url.searchParams.set("bundle", productionBundleRoot());
        url.searchParams.set("format", "flat-prepared");
      } else {
        url.searchParams.set("data", "demo");
        ["bundle", "bundleRoot", "bundle-root", "format", "bundleFormat", "bundle-format"]
          .forEach((name) => url.searchParams.delete(name));
      }
      return url.href;
    }

    function productionBundleRoot() {
      const config = global.KaneMapRealBundleConfig || {};
      return config.defaultPortableBundlePath || PRODUCTION_BUNDLE_ROOT;
    }

    function runtimeModeLabel(dataSource) {
      if (dataSource && dataSource.sourceType === "prepared") return "Runtime: production data active";
      if (requestedPreparedMode()) return "Runtime: production requested";
      if (requestedDemoMode()) return "Runtime: demo forced by URL";
      const config = global.KaneMapRealBundleConfig || {};
      return config.enabledByDefault ? "Runtime: production default" : "Runtime: source demo default";
    }

    function bootErrorRuntimeLabel() {
      if (requestedPreparedMode()) return "Runtime: production requested";
      if (requestedDemoMode()) return "Runtime: demo forced by URL";
      const config = global.KaneMapRealBundleConfig || {};
      return config.enabledByDefault ? "Runtime: production default" : "Runtime: source demo default";
    }

    function requestedPreparedMode() {
      const value = requestedDataMode();
      return ["prepared", "real", "chunked", "chunked-prepared", "production", "prod"].includes(value);
    }

    function requestedDemoMode() {
      const value = requestedDataMode();
      return ["demo", "synthetic", "sample"].includes(value);
    }

    function requestedDataMode() {
      const params = new URLSearchParams(global.location && global.location.search ? global.location.search : "");
      const config = global.KaneMapRealBundleConfig || {};
      const names = config.urlParameters && Array.isArray(config.urlParameters.source)
        ? config.urlParameters.source
        : ["data", "source", "mode"];
      for (const name of names) {
        const value = params.get(name);
        if (value !== null && value !== undefined && String(value).trim() !== "") {
          return String(value).trim().toLowerCase();
        }
      }
      return "";
    }

    function sourceLabel(dataSource) {
      if (!dataSource) return "Data: unknown";
      if (dataSource.sourceType === "prepared") {
        return `Data: ${dataSource.label || "Kane County prepared JSON files"}`;
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

    function markBootPending() {
      const runtimeStatus = ensureRuntimeStatusSpan();
      if (runtimeStatus) runtimeStatus.textContent = "Runtime: resolving data mode";
      const sourceStatus = ensureFooterStatusSpan("dataSourceStatus");
      if (sourceStatus) sourceStatus.textContent = "Data: resolving";
      const loadStatus = ensureFooterStatusSpan("dataLoadStatus");
      if (loadStatus) loadStatus.textContent = "Load: pending";
      updateDataSwitchStatus(null);
      updateUiBatchStatus();
    }

    return {
      markBootPending,
      showBootError,
      updateDataSourceStatus,
      updateRuntimeModeStatus,
      updateDataSwitchStatus,
      updateUiBatchStatus
    };
  }

  global.KaneMapRuntimeStatus = {
    createRuntimeStatus
  };
})(window);
