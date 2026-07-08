(function attachImportValidator(global) {
  "use strict";

  function previewObservationImport(text, currentRecords, context = {}) {
    const current = Array.isArray(currentRecords) ? currentRecords : [];
    const knownBuildingIds = new Set(context.knownBuildingIds || []);
    const knownCellCodes = new Set(context.knownCellCodes || []);
    const errors = [];
    const warnings = [];
    let records = [];

    try {
      records = global.KaneMapRecordSchema.parseEnvelope(String(text || ""));
    } catch (error) {
      return {
        ok: false,
        errors: [`JSON could not be imported: ${error.message}`],
        warnings,
        records: [],
        summary: makeSummary(current, [])
      };
    }

    if (!records.length) warnings.push("Import contains no observation records.");

    const duplicateIncomingIds = duplicates(records.map((record) => record.id));
    if (duplicateIncomingIds.length) {
      errors.push(`Import contains duplicate record IDs: ${duplicateIncomingIds.slice(0, 8).join(", ")}${duplicateIncomingIds.length > 8 ? "…" : ""}`);
    }

    const existingIds = new Set(current.map((record) => record.id));
    const overlappingIds = records.map((record) => record.id).filter((id) => existingIds.has(id));
    if (overlappingIds.length) {
      warnings.push(`${overlappingIds.length} imported record IDs already exist locally. Replace mode will replace the full local ledger.`);
    }

    const unknownBuildings = unique(records
      .map((record) => record.buildingId)
      .filter((id) => knownBuildingIds.size > 0 && !knownBuildingIds.has(id)));
    if (unknownBuildings.length) {
      warnings.push(`${unknownBuildings.length} records reference buildings not present in the current map data.`);
    }

    const unknownCells = unique(records
      .map((record) => record.gridCell)
      .filter((code) => knownCellCodes.size > 0 && !knownCellCodes.has(code)));
    if (unknownCells.length) {
      warnings.push(`${unknownCells.length} records reference grid cells not present in the current grid.`);
    }

    const safetyFlags = records.filter((record) => {
      return record.mailboxTouched || record.mailboxOpened || record.mailRead || record.residentNamesRecorded;
    });
    if (safetyFlags.length) {
      errors.push(`${safetyFlags.length} records violate Kane-Map fieldwork boundary flags.`);
    }

    const missingBuilding = records.filter((record) => !record.buildingId || record.buildingId === "unknown").length;
    if (missingBuilding) warnings.push(`${missingBuilding} records do not identify a building.`);

    const missingCell = records.filter((record) => !record.gridCell || record.gridCell === "unknown").length;
    if (missingCell) warnings.push(`${missingCell} records do not identify a grid cell.`);

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      records,
      summary: makeSummary(current, records)
    };
  }

  function makeSummary(current, incoming) {
    const currentUnits = unitTotal(current);
    const incomingUnits = unitTotal(incoming);
    return {
      currentCount: current.length,
      incomingCount: incoming.length,
      currentUnits,
      incomingUnits,
      currentBuildings: new Set(current.map((record) => record.buildingId)).size,
      incomingBuildings: new Set(incoming.map((record) => record.buildingId)).size,
      currentVerified: current.filter((record) => record.visitStatus === "verified").length,
      incomingVerified: incoming.filter((record) => record.visitStatus === "verified").length,
      currentConflicts: current.filter((record) => record.visitStatus === "conflict").length,
      incomingConflicts: incoming.filter((record) => record.visitStatus === "conflict").length
    };
  }

  function unitTotal(records) {
    return records.reduce((total, record) => {
      const count = Number(record.observedUnitCount);
      return Number.isFinite(count) ? total + count : total;
    }, 0);
  }

  function duplicates(values) {
    const seen = new Set();
    const repeated = new Set();
    values.forEach((value) => {
      if (!value) return;
      if (seen.has(value)) repeated.add(value);
      seen.add(value);
    });
    return Array.from(repeated).sort();
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort();
  }

  global.KaneMapImportValidator = {
    previewObservationImport
  };
})(window);
