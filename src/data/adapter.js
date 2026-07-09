(function attachDataAdapter(global) {
  "use strict";

  function createDataAdapter(options) {
    const sourceTypes = global.KaneMapSourceTypes;
    const requestedSource = sourceTypes.normalizeSourceType(options && options.sourcePreference);
    const preparedManifest = options && options.preparedManifest;
    const demoCatalog = options && options.demoCatalog;
    const chunkRegistry = options && options.chunkRegistry;
    const activeSource = chooseActiveSource(requestedSource, preparedManifest, demoCatalog);

    function getActiveSource() {
      return activeSource;
    }

    function getCatalog() {
      return activeSource.catalog;
    }

    function getBounds() {
      return activeSource.catalog.meta.bounds;
    }

    function createFeatureStore() {
      if (activeSource.sourceType === sourceTypes.SOURCES.DEMO) {
        return chunkRegistry.createFeatureStore(activeSource.catalog);
      }
      return createPreparedFeatureStore(activeSource.catalog);
    }

    function describe() {
      const stats = describeCatalogStats(activeSource.catalog);
      return Object.assign({}, stats, {
        sourceType: activeSource.sourceType,
        label: activeSource.label,
        dataVersion: activeSource.catalog.meta.dataVersion || "unknown",
        active: activeSource.active,
        loadError: activeSource.loadError || ""
      });
    }

    return { getActiveSource, getCatalog, getBounds, createFeatureStore, describe };
  }

  async function createDataAdapterAsync(options) {
    const sourceTypes = global.KaneMapSourceTypes;
    const requestedSource = sourceTypes.normalizeSourceType(options && options.sourcePreference);
    const finalOptions = Object.assign({}, options || {}, { sourcePreference: requestedSource });

    if (requestedSource === sourceTypes.SOURCES.PREPARED && global.KaneMapChunkedBundleLoader) {
      const loaded = await global.KaneMapChunkedBundleLoader.loadFromLocation();
      if (loaded && loaded.active && loaded.data) {
        finalOptions.preparedManifest = {
          active: true,
          sourceType: sourceTypes.SOURCES.PREPARED,
          label: loaded.label || "Kane County production bundle",
          data: loaded.data
        };
      } else {
        finalOptions.preparedManifest = {
          active: false,
          loadError: loadFailureMessage(loaded),
          bundleRoot: loaded && loaded.bundleRoot ? loaded.bundleRoot : ""
        };
      }
    }

    return createDataAdapter(finalOptions);
  }

  function chooseActiveSource(requestedSource, preparedManifest, demoCatalog) {
    const sources = global.KaneMapSourceTypes.SOURCES;
    const preparedIsAvailable = Boolean(
      requestedSource === sources.PREPARED &&
      preparedManifest &&
      preparedManifest.active &&
      preparedManifest.data &&
      Array.isArray(preparedManifest.data.chunks)
    );

    if (preparedIsAvailable) {
      return {
        sourceType: sources.PREPARED,
        label: preparedManifest.label || "Kane County production bundle",
        catalog: preparedManifest.data,
        active: true
      };
    }

    if (requestedSource === sources.PREPARED) {
      const reason = preparedManifest && preparedManifest.loadError
        ? preparedManifest.loadError
        : "production data bundle was requested but could not be loaded";
      throw new Error(`Production data unavailable: ${reason}`);
    }

    return {
      sourceType: sources.DEMO,
      label: "Synthetic demo geometry",
      catalog: demoCatalog,
      active: true,
      loadError: ""
    };
  }

  function loadFailureMessage(loaded) {
    if (!loaded) return "production data loader did not return a result";
    if (loaded.error) return loaded.error;
    if (loaded.reason) return loaded.reason;
    return "production data unavailable";
  }

  function describeCatalogStats(catalog) {
    const meta = catalog && catalog.meta ? catalog.meta : {};
    const chunks = catalog && Array.isArray(catalog.chunks) ? catalog.chunks : [];
    return {
      bundleRoot: meta.bundleRoot || "",
      totalLayers: numberOrNull(meta.totalLayers),
      totalChunks: numberOrNull(meta.totalChunks) || chunks.length,
      totalFeatures: numberOrNull(meta.totalFeatures),
      totalBytes: numberOrNull(meta.totalBytes),
      dataMode: meta.dataMode || "",
      status: meta.status || ""
    };
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function createPreparedFeatureStore(catalog) {
    const chunks = Array.isArray(catalog.chunks) ? catalog.chunks.slice() : [];

    function allChunks() {
      return chunks.slice();
    }

    function selectChunksForCells(cellCodes) {
      const wanted = new Set(cellCodes || []);
      if (!wanted.size) return chunks.slice();
      return chunks.filter((chunk) => (chunk.cells || []).some((cellCode) => wanted.has(cellCode)));
    }

    function buildDataForCells(cellCodes) {
      return combinePreparedChunks(catalog, selectChunksForCells(cellCodes));
    }

    function statusForCells(cellCodes) {
      const selected = selectChunksForCells(cellCodes);
      return {
        selected: selected.length,
        total: chunks.length,
        ids: selected.map((chunk) => chunk.id)
      };
    }

    return { allChunks, buildDataForCells, statusForCells };
  }

  function combinePreparedChunks(catalog, chunks) {
    return {
      meta: catalog.meta,
      roads: flatten(chunks, "roads"),
      water: flatten(chunks, "water"),
      forests: flatten(chunks, "forests"),
      buildings: flatten(chunks, "buildings"),
      addressPoints: flatten(chunks, "addressPoints"),
      countyBoundary: flatten(chunks, "countyBoundary")
    };
  }

  function flatten(chunks, key) {
    const output = [];
    const seen = new Set();
    chunks.forEach((chunk) => {
      (chunk[key] || []).forEach((feature) => {
        const id = feature && feature.id ? feature.id : `${key}-${output.length}`;
        if (seen.has(id)) return;
        seen.add(id);
        output.push(feature);
      });
    });
    return output;
  }

  global.KaneMapDataAdapter = { createDataAdapter, createDataAdapterAsync };
})(window);
