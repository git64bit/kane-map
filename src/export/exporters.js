(function attachExporters(global) {
  "use strict";

  function observationCsv(records) {
    const columns = [
      ["id", (record) => record.id],
      ["building_id", (record) => record.buildingId],
      ["building_label", (record) => record.buildingLabel],
      ["building_alias", (record) => record.buildingAlias],
      ["grid_cell", (record) => record.gridCell],
      ["visit_date", (record) => record.visitDate],
      ["field_session_id", (record) => record.fieldSessionId],
      ["plan_priority", (record) => record.planPriority],
      ["plan_action", (record) => record.planAction],
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
      ["plan_priority", (row) => row.summary ? row.summary.planPriority : ""],
      ["plan_action", (row) => row.summary ? row.summary.planAction : ""],
      ["site_labels", (row) => row.summary ? (row.summary.siteLabels || []).join(" | ") : ""],
      ["building_aliases", (row) => row.summary ? (row.summary.buildingAliases || []).join(" | ") : ""],
      ["latest_visit_date", (row) => row.summary ? row.summary.latestVisitDate : ""],
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

  function visitSessionCsv(visitSummary) {
    const columns = [
      ["session_id", (row) => row.sessionId],
      ["record_count", (row) => row.recordCount],
      ["building_count", (row) => row.buildingCount],
      ["unit_total", (row) => row.unitTotal],
      ["verified_count", (row) => row.verifiedCount],
      ["conflict_count", (row) => row.conflictCount],
      ["revisit_count", (row) => row.revisitCount],
      ["latest_updated_at", (row) => row.latestUpdatedAt]
    ];

    return csvFromRows(visitSummary.sessionRows || [], columns);
  }


  function fieldPlanCsv(planSummary) {
    const columns = [
      ["building_id", (row) => row.buildingId],
      ["building_label", (row) => row.buildingLabel],
      ["building_name", (row) => row.buildingName],
      ["grid_cell", (row) => row.gridCell],
      ["recorded", (row) => row.recorded ? "yes" : "no"],
      ["status", (row) => row.status],
      ["confidence", (row) => row.confidence],
      ["plan_priority", (row) => row.planPriority],
      ["plan_action", (row) => row.planAction],
      ["latest_unit_count", (row) => row.observedUnitCount === null ? "" : row.observedUnitCount],
      ["latest_visit_date", (row) => row.latestVisitDate],
      ["site_label", (row) => row.siteLabel],
      ["building_alias", (row) => row.buildingAlias]
    ];

    return csvFromRows(planSummary.filteredRows || [], columns);
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
    fieldPlanCsv,
    fieldReport,
    observationCsv,
    visitSessionCsv
  };
})(window);
