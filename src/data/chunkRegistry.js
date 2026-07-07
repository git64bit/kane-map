(function attachChunkRegistry(global) {
  "use strict";

  const registeredChunks = [];

  function register(chunk) {
    if (!chunk || !chunk.id) {
      throw new Error("Kane-Map data chunk requires an id.");
    }
    registeredChunks.push(normalizeChunk(chunk));
  }

  function createFeatureStore(catalog) {
    const chunks = registeredChunks.slice();

    function allChunks() {
      return chunks.slice();
    }

    function selectChunksForCells(cellCodes) {
      const wanted = new Set(cellCodes || []);
      if (!wanted.size) return chunks.slice();

      return chunks.filter((chunk) => (
        chunk.cells.some((cellCode) => wanted.has(cellCode))
      ));
    }

    function buildDataForCells(cellCodes) {
      return combineChunks(catalog, selectChunksForCells(cellCodes));
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

  function combineChunks(catalog, chunks) {
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

  function normalizeChunk(chunk) {
    return {
      id: chunk.id,
      label: chunk.label || chunk.id,
      cells: Array.isArray(chunk.cells) ? chunk.cells.slice() : [],
      roads: Array.isArray(chunk.roads) ? chunk.roads.slice() : [],
      water: Array.isArray(chunk.water) ? chunk.water.slice() : [],
      forests: Array.isArray(chunk.forests) ? chunk.forests.slice() : [],
      buildings: Array.isArray(chunk.buildings) ? chunk.buildings.slice() : []
    };
  }

  global.KaneMapChunkRegistry = {
    register,
    createFeatureStore
  };
})(window);
