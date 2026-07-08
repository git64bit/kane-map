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
      return {
        sourceType: activeSource.sourceType,
        label: activeSource.label,
        dataVersion: activeSource.catalog.meta.dataVersion || "unknown",
        active: activeSource.active
      };
    }

    return {
      getActiveSource,
      getCatalog,
      getBounds,
      createFeatureStore,
      describe
    };
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
        label: preparedManifest.label || "Prepared Kane County geometry",
        catalog: preparedManifest.data,
        active: true
      };
    }

    return {
      sourceType: sources.DEMO,
      label: "Synthetic demo geometry",
      catalog: demoCatalog,
      active: true
    };
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

    return {
      allChunks,
      buildDataForCells,
      statusForCells
    };
  }

  function combinePreparedChunks(catalog, chunks) {
    return {
      meta: catalog.meta,
      roads: flatten(chunks, "roads"),
      water: flatten(chunks, "water"),
      forests: flatten(chunks, "forests"),
      buildings: flatten(chunks, "buildings")
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

  global.KaneMapDataAdapter = {
    createDataAdapter
  };
})(window);
