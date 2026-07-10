(function attachSectorDomain(global) {
  "use strict";

  const REFERENCE_GRID = Object.freeze({
    rows: 4,
    cols: 6,
    startNorth: 11,
    startEast: 5
  });
  const NORTH_MIN = 11;
  const NORTH_MAX = 14;
  const EAST_MIN = 6;
  const EAST_MAX = 9;
  const sectorCodes = Object.freeze(buildSectorCodes());
  const sectorCodeSet = new Set(sectorCodes);

  function buildSectorCodes() {
    const codes = [];
    for (let north = NORTH_MIN; north <= NORTH_MAX; north += 1) {
      for (let east = EAST_MIN; east <= EAST_MAX; east += 1) {
        codes.push(`N${north}-E${String(east).padStart(2, "0")}`);
      }
    }
    return codes;
  }

  function isSectorCode(code) {
    return sectorCodeSet.has(String(code || ""));
  }

  function restrictGrid(referenceGrid) {
    if (!referenceGrid || !Array.isArray(referenceGrid.cells)) {
      throw new Error("Kane-Map sector domain requires a reference grid.");
    }
    return Object.assign({}, referenceGrid, {
      cells: referenceGrid.cells.filter((cell) => cell && isSectorCode(cell.code)),
      sectorCodes: sectorCodes.slice(),
      sectorCount: sectorCodes.length
    });
  }

  function restrictAssignedFeatures(sourceData) {
    const source = sourceData || {};
    return Object.assign({}, source, {
      buildings: filterByAssignedSector(source.buildings),
      addressPoints: filterByAssignedSector(source.addressPoints)
    });
  }

  function filterByAssignedSector(features) {
    if (!Array.isArray(features)) return [];
    return features.filter((feature) => feature && isSectorCode(feature.cell));
  }

  global.KaneMapSectorDomain = {
    referenceGrid: REFERENCE_GRID,
    sectorCodes: () => sectorCodes.slice(),
    isSectorCode,
    restrictGrid,
    restrictAssignedFeatures
  };
})(window);
