(function attachFieldPlan(global) {
  "use strict";

  const PRIORITY_LABELS = {
    none: "No plan priority",
    low: "Low priority",
    medium: "Medium priority",
    high: "High priority",
    urgent: "Urgent"
  };

  const PRIORITY_SCORE = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
  };

  const STATUS_SCORE = {
    conflict: 4,
    "revisit-needed": 3,
    unrecorded: 2,
    "pattern-inferred": 2,
    observed: 1,
    counted: 1,
    verified: 0
  };

  function summarize(buildings, coverage, records, options = {}) {
    const rows = buildRows(buildings, coverage, records);
    const filteredRows = filterRows(rows, options.filter || "active");
    const visibleCells = new Set(options.visibleCellCodes || []);
    const visibleRows = visibleCells.size
      ? filteredRows.filter((row) => visibleCells.has(row.gridCell))
      : filteredRows;

    return {
      rows,
      filteredRows,
      visibleRows,
      totals: summarizeTotals(rows)
    };
  }

  function buildRows(buildings, coverage, records) {
    const latestRecordByBuilding = latestRecords(records);
    const summaryByBuilding = coverage.summaryByBuilding || {};

    return buildings.map((building) => {
      const summary = summaryByBuilding[building.id] || null;
      const latest = latestRecordByBuilding[building.id] || null;
      const status = summary ? summary.status : "unrecorded";
      const priority = normalizePriority(latest ? latest.planPriority : "none");
      const action = cleanText(latest ? latest.planAction : "");
      const unitCount = summary && Number.isFinite(summary.observedUnitCount)
        ? summary.observedUnitCount
        : null;

      return {
        buildingId: building.id,
        buildingLabel: building.label,
        buildingName: building.name,
        gridCell: building.cell,
        stories: building.stories,
        recorded: Boolean(summary),
        recordCount: summary ? summary.recordCount : 0,
        latestVisitDate: summary ? summary.latestVisitDate : "",
        latestUpdatedAt: summary ? summary.latestUpdatedAt : "",
        status,
        confidence: summary ? summary.confidence : "",
        observedUnitCount: unitCount,
        planPriority: priority,
        planAction: action,
        siteLabel: latest ? latest.siteLabel : "",
        buildingAlias: latest ? latest.buildingAlias : "",
        rank: rankRow(status, priority, action)
      };
    }).sort(compareRows);
  }

  function latestRecords(records) {
    return records.reduce((index, record) => {
      if (!record.buildingId) return index;
      const existing = index[record.buildingId];
      if (!existing || String(record.updatedAt || "").localeCompare(String(existing.updatedAt || "")) > 0) {
        index[record.buildingId] = record;
      }
      return index;
    }, {});
  }

  function filterRows(rows, filter) {
    if (filter === "all") return rows;
    if (filter === "priority") return rows.filter((row) => row.planPriority !== "none");
    if (filter === "unrecorded") return rows.filter((row) => !row.recorded);
    if (filter === "follow-up") return rows.filter((row) => row.status === "conflict" || row.status === "revisit-needed");

    return rows.filter((row) => (
      row.planPriority !== "none" ||
      row.status === "conflict" ||
      row.status === "revisit-needed" ||
      !row.recorded
    ));
  }

  function summarizeTotals(rows) {
    return rows.reduce((totals, row) => {
      totals.totalBuildings += 1;
      if (row.recorded) totals.recordedBuildings += 1;
      else totals.unrecordedBuildings += 1;
      if (row.planPriority !== "none") totals.priorityBuildings += 1;
      if (row.status === "conflict") totals.conflictBuildings += 1;
      if (row.status === "revisit-needed") totals.revisitBuildings += 1;
      if (row.planPriority === "urgent" || row.planPriority === "high") totals.highPriorityBuildings += 1;
      return totals;
    }, {
      totalBuildings: 0,
      recordedBuildings: 0,
      unrecordedBuildings: 0,
      priorityBuildings: 0,
      highPriorityBuildings: 0,
      conflictBuildings: 0,
      revisitBuildings: 0
    });
  }

  function rankRow(status, priority, action) {
    const priorityScore = PRIORITY_SCORE[priority] || 0;
    const statusScore = STATUS_SCORE[status] || 0;
    const actionScore = action ? 0.5 : 0;
    return priorityScore * 10 + statusScore + actionScore;
  }

  function compareRows(a, b) {
    return b.rank - a.rank || a.gridCell.localeCompare(b.gridCell) || a.buildingLabel.localeCompare(b.buildingLabel);
  }

  function normalizePriority(value) {
    const text = cleanText(value || "none").toLowerCase();
    return PRIORITY_LABELS[text] ? text : "none";
  }

  function labelForPriority(value) {
    return PRIORITY_LABELS[normalizePriority(value)];
  }

  function cleanText(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  global.KaneMapFieldPlan = {
    labelForPriority,
    normalizePriority,
    summarize
  };
})(window);
