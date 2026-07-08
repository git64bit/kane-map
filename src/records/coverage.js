(function attachCoverage(global) {
  "use strict";

  const STATUS_LABELS = {
    all: "all buildings",
    recorded: "recorded",
    unrecorded: "unrecorded",
    verified: "verified",
    conflict: "conflict",
    "revisit-needed": "revisit needed",
    counted: "counted",
    observed: "observed"
  };

  function createCoverageModel(config) {
    const grid = config.grid;
    const buildings = config.buildings || [];
    const getRecords = config.getRecords;

    function build() {
      const records = getRecords();
      const recordsByBuilding = groupRecordsByBuilding(records);
      const summaryByBuilding = summarizeByBuilding(recordsByBuilding);
      const cellRows = summarizeCells(grid.cells, buildings, summaryByBuilding);
      const totals = summarizeTotals(buildings, records, summaryByBuilding);

      return {
        records,
        recordsByBuilding,
        summaryByBuilding,
        cellRows,
        totals
      };
    }

    return { build };
  }

  function groupRecordsByBuilding(records) {
    return records.reduce((groups, record) => {
      if (!record.buildingId) return groups;
      if (!groups[record.buildingId]) groups[record.buildingId] = [];
      groups[record.buildingId].push(record);
      return groups;
    }, {});
  }

  function summarizeByBuilding(recordsByBuilding) {
    return Object.fromEntries(Object.entries(recordsByBuilding).map(([buildingId, records]) => [
      buildingId,
      summarizeRecords(records)
    ]));
  }

  function summarizeRecords(records) {
    const sorted = records.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const latest = sorted[0] || {};
    const countVariants = [...new Set(records
      .map((record) => record.observedUnitCount)
      .filter((value) => value !== null && value !== undefined)
    )].sort((a, b) => a - b);

    const status = records.some((record) => record.visitStatus === "conflict") ? "conflict"
      : records.some((record) => record.visitStatus === "revisit-needed") ? "revisit-needed"
      : latest.visitStatus || "observed";

    return {
      recordCount: records.length,
      observedUnitCount: latest.observedUnitCount ?? null,
      confidence: latest.confidence || "unreviewed",
      status,
      latestUpdatedAt: latest.updatedAt || "",
      latestVisitDate: latest.visitDate || String(latest.createdAt || "").slice(0, 10),
      siteLabels: uniqueText(records.map((record) => record.siteLabel)),
      buildingAliases: uniqueText(records.map((record) => record.buildingAlias)),
      planPriority: latest.planPriority || "none",
      planAction: latest.planAction || "",
      countVariants
    };
  }

  function summarizeCells(cells, buildings, summaryByBuilding) {
    return cells.map((cell) => {
      const cellBuildings = buildings.filter((building) => building.cell === cell.code);
      const recorded = cellBuildings.filter((building) => summaryByBuilding[building.id]);
      const latestUnitTotal = recorded.reduce((sum, building) => {
        const count = summaryByBuilding[building.id].observedUnitCount;
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0);

      return {
        cellCode: cell.code,
        totalBuildings: cellBuildings.length,
        recordedBuildings: recorded.length,
        unrecordedBuildings: Math.max(0, cellBuildings.length - recorded.length),
        latestUnitTotal,
        verifiedBuildings: countStatus(recorded, summaryByBuilding, "verified"),
        revisitBuildings: countStatus(recorded, summaryByBuilding, "revisit-needed"),
        conflictBuildings: countStatus(recorded, summaryByBuilding, "conflict")
      };
    });
  }

  function countStatus(buildings, summaryByBuilding, status) {
    return buildings.filter((building) => summaryByBuilding[building.id].status === status).length;
  }

  function summarizeTotals(buildings, records, summaryByBuilding) {
    const recordedBuildings = buildings.filter((building) => summaryByBuilding[building.id]);
    const latestUnitTotal = recordedBuildings.reduce((sum, building) => {
      const count = summaryByBuilding[building.id].observedUnitCount;
      return sum + (Number.isFinite(count) ? count : 0);
    }, 0);

    return {
      totalBuildings: buildings.length,
      recordedBuildings: recordedBuildings.length,
      unrecordedBuildings: Math.max(0, buildings.length - recordedBuildings.length),
      latestUnitTotal,
      verifiedBuildings: countStatus(recordedBuildings, summaryByBuilding, "verified"),
      revisitBuildings: countStatus(recordedBuildings, summaryByBuilding, "revisit-needed"),
      conflictBuildings: countStatus(recordedBuildings, summaryByBuilding, "conflict"),
      recordCount: records.length
    };
  }

  function filterBuildingIds(buildings, summaryByBuilding, filter) {
    if (!filter || filter === "all") return null;

    return buildings
      .filter((building) => matchesFilter(building, summaryByBuilding[building.id], filter))
      .map((building) => building.id);
  }

  function matchesFilter(building, summary, filter) {
    if (filter === "unrecorded") return !summary;
    if (filter === "recorded") return Boolean(summary);
    if (!summary) return false;
    if (filter === "counted") return Number.isFinite(summary.observedUnitCount);
    return summary.status === filter;
  }

  function uniqueText(values) {
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).sort();
  }

  function labelForFilter(filter) {
    return STATUS_LABELS[filter] || filter || "all buildings";
  }

  global.KaneMapCoverage = {
    createCoverageModel,
    filterBuildingIds,
    labelForFilter
  };
})(window);
