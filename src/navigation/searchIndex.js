(function attachSearchIndex(global) {
  "use strict";

  function createSearchIndex(options) {
    const grid = options.grid;
    const buildings = options.buildings || [];
    const getRecords = options.getRecords;

    function search(rawQuery) {
      const query = normalize(rawQuery);
      if (!query) return [];

      const results = [];
      searchCells(query, results);
      searchBuildings(query, results);
      searchRecords(query, results);
      return rankResults(results, query).slice(0, 16);
    }

    function coverage() {
      const records = getRecords();
      const latestByBuilding = new Map();
      records.forEach((record) => {
        const existing = latestByBuilding.get(record.buildingId);
        if (!existing || String(record.updatedAt).localeCompare(String(existing.updatedAt)) > 0) {
          latestByBuilding.set(record.buildingId, record);
        }
      });

      const latest = [...latestByBuilding.values()];
      const unitTotal = latest.reduce((sum, record) => (
        Number.isFinite(record.observedUnitCount) ? sum + record.observedUnitCount : sum
      ), 0);

      return {
        totalBuildings: buildings.length,
        recordedBuildings: latestByBuilding.size,
        unrecordedBuildings: Math.max(0, buildings.length - latestByBuilding.size),
        verifiedBuildings: latest.filter((record) => record.visitStatus === "verified").length,
        revisitBuildings: latest.filter((record) => record.visitStatus === "revisit-needed").length,
        conflictBuildings: latest.filter((record) => record.visitStatus === "conflict").length,
        latestUnitTotal: unitTotal,
        recordCount: records.length
      };
    }

    function searchCells(query, results) {
      grid.cells.forEach((cell) => {
        const haystack = normalize(cell.code);
        if (!haystack.includes(query)) return;
        results.push({
          type: "cell",
          id: cell.code,
          label: cell.code,
          detail: `Grid cell · row ${cell.row + 1}, column ${cell.col + 1}`,
          cellCode: cell.code,
          score: scoreText(haystack, query)
        });
      });
    }

    function searchBuildings(query, results) {
      buildings.forEach((building) => {
        const haystack = normalize([
          building.id,
          building.label,
          building.name,
          building.cell,
          `${building.stories} story`,
          `${building.stories} stories`
        ].join(" "));

        if (!haystack.includes(query)) return;
        results.push({
          type: "building",
          id: building.id,
          label: `${building.label} ${building.name}`,
          detail: `${building.cell} · ${building.stories} stor${building.stories === 1 ? "y" : "ies"}`,
          buildingId: building.id,
          cellCode: building.cell,
          score: scoreText(haystack, query)
        });
      });
    }

    function searchRecords(query, results) {
      getRecords().forEach((record) => {
        const designators = Array.isArray(record.visibleDesignators) ? record.visibleDesignators.join(" ") : "";
        const haystack = normalize([
          record.id,
          record.gridCell,
          record.buildingId,
          record.buildingLabel,
          record.buildingName,
          record.buildingAlias,
          record.visitDate,
          record.fieldSessionId,
          record.planPriority,
          record.planAction,
          record.siteLabel,
          record.entranceId,
          record.mailboxBankId,
          record.observedUnitCount,
          record.designatorPattern,
          designators,
          record.confidence,
          record.visitStatus,
          record.accessContext,
          record.notes
        ].join(" "));

        if (!haystack.includes(query)) return;
        results.push({
          type: "record",
          id: record.id,
          label: `${record.buildingLabel} ${record.buildingAlias || record.siteLabel || record.id}`,
          detail: `${record.gridCell} · ${countLabel(record)} · ${record.visitStatus}`,
          buildingId: record.buildingId,
          cellCode: record.gridCell,
          recordId: record.id,
          score: scoreText(haystack, query) + 5
        });
      });
    }

    return { search, coverage };
  }

  function countLabel(record) {
    return record.observedUnitCount === null ? "unknown count" : `${record.observedUnitCount} units`;
  }

  function rankResults(results, query) {
    return results.slice().sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.label).localeCompare(String(b.label));
    });
  }

  function scoreText(haystack, query) {
    if (haystack === query) return 100;
    if (haystack.startsWith(query)) return 80;
    if (haystack.includes(` ${query}`)) return 60;
    return 30;
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  global.KaneMapSearchIndex = {
    createSearchIndex
  };
})(window);
