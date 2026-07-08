(function attachExporters(global) {
  "use strict";

  function observationCsv(records) {
    const columns = [
      ["id", (record) => record.id],
      ["building_id", (record) => record.buildingId],
      ["building_label", (record) => record.buildingLabel],
      ["grid_cell", (record) => record.gridCell],
      ["site_label", (record) => record.siteLabel],
      ["entrance_id", (record) => record.entranceId],
      ["mailbox_bank_id", (record) => record.mailboxBankId],
      ["observed_unit_count", (record) => record.observedUnitCount],
      ["visible_designators", (record) => (record.visibleDesignators || []).join(" | ")],
      ["confidence", (record) => record.confidence],
      ["visit_status", (record) => record.visitStatus],
      ["access_context", (record) => record.accessContext],
      ["notes", (record) => record.notes],
      ["updated_at", (record) => record.updatedAt],
      ["boundary", boundaryText]
    ];

    return csvFromRows(records, columns);
  }

  function buildingSummaryCsv(buildings, coverage) {
    const columns = [
      ["building_id", (row) => row.building.id],
      ["building_label", (row) => row.building.label],
      ["building_name", (row) => row.building.name],
      ["grid_cell", (row) => row.building.cell],
      ["stories", (row) => row.building.stories],
      ["record_count", (row) => row.summary ? row.summary.recordCount : 0],
      ["latest_unit_count", (row) => row.summary ? row.summary.observedUnitCount : ""],
      ["status", (row) => row.summary ? row.summary.status : "unrecorded"],
      ["confidence", (row) => row.summary ? row.summary.confidence : ""],
      ["count_variants", (row) => row.summary ? row.summary.countVariants.join(" | ") : ""],
      ["latest_updated_at", (row) => row.summary ? row.summary.latestUpdatedAt : ""]
    ];

    const rows = buildings.map((building) => ({
      building,
      summary: coverage.summaryByBuilding[building.id] || null
    }));

    return csvFromRows(rows, columns);
  }

  function fieldReport(coverage) {
    const totals = coverage.totals;
    const lines = [
      "Kane-Map Fieldwork Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "Coverage",
      `Buildings with records: ${totals.recordedBuildings}/${totals.totalBuildings}`,
      `Unrecorded buildings: ${totals.unrecordedBuildings}`,
      `Latest observed units: ${totals.latestUnitTotal}`,
      `Verified buildings: ${totals.verifiedBuildings}`,
      `Conflict buildings: ${totals.conflictBuildings}`,
      `Revisit-needed buildings: ${totals.revisitBuildings}`,
      `Saved observation records: ${totals.recordCount}`,
      "",
      "Grid cells"
    ];

    coverage.cellRows
      .filter((row) => row.totalBuildings > 0)
      .forEach((row) => {
        lines.push(`${row.cellCode}: ${row.recordedBuildings}/${row.totalBuildings} recorded, ${row.latestUnitTotal} units, ${row.conflictBuildings} conflict, ${row.revisitBuildings} revisit`);
      });

    lines.push("", "Fieldwork boundary", "No mailbox touched. No mailbox opened. No mail read. No resident names recorded.");
    return `${lines.join("\n")}\n`;
  }

  function csvFromRows(rows, columns) {
    const header = columns.map(([name]) => csvCell(name)).join(",");
    const body = rows.map((row) => columns
      .map(([, getter]) => csvCell(getter(row)))
      .join(","));
    return [header, ...body].join("\n") + "\n";
  }

  function csvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  }

  function boundaryText(record) {
    return [
      record.mailboxTouched === false ? "no mailbox touched" : "mailbox touch unknown",
      record.mailboxOpened === false ? "no mailbox opened" : "mailbox open unknown",
      record.mailRead === false ? "no mail read" : "mail reading unknown",
      record.residentNamesRecorded === false ? "no resident names" : "resident-name status unknown"
    ].join("; ");
  }

  global.KaneMapExporters = {
    buildingSummaryCsv,
    fieldReport,
    observationCsv
  };
})(window);
