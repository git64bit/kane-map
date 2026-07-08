(function attachVisitSessions(global) {
  "use strict";

  function summarize(records, buildings) {
    const safeRecords = Array.isArray(records) ? records : [];
    const knownBuildings = new Set((buildings || []).map((building) => building.id));
    const sessionRows = groupRows(safeRecords, sessionKeyForRecord, "sessionId");
    const dateRows = groupRows(safeRecords, dateKeyForRecord, "visitDate");
    const revisitRecords = safeRecords
      .filter((record) => record.visitStatus === "revisit-needed" || record.visitStatus === "conflict")
      .slice()
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return {
      totals: {
        records: safeRecords.length,
        visitDates: dateRows.length,
        sessions: sessionRows.length,
        buildings: new Set(safeRecords.map((record) => record.buildingId).filter(Boolean)).size,
        unknownMapBuildings: safeRecords.filter((record) => record.buildingId && !knownBuildings.has(record.buildingId)).length
      },
      sessionRows,
      dateRows,
      revisitRecords
    };
  }

  function rowsForBuilding(records, buildingId) {
    return (records || [])
      .filter((record) => record.buildingId === buildingId)
      .slice()
      .sort((a, b) => String(b.visitDate || b.updatedAt).localeCompare(String(a.visitDate || a.updatedAt)));
  }

  function groupRows(records, keyGetter, keyName) {
    const groups = new Map();

    records.forEach((record) => {
      const key = keyGetter(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });

    return Array.from(groups.entries()).map(([key, groupRecords]) => {
      const unitTotal = groupRecords.reduce((sum, record) => {
        const count = Number(record.observedUnitCount);
        return Number.isFinite(count) ? sum + count : sum;
      }, 0);

      return {
        [keyName]: key,
        recordCount: groupRecords.length,
        buildingCount: new Set(groupRecords.map((record) => record.buildingId).filter(Boolean)).size,
        unitTotal,
        verifiedCount: groupRecords.filter((record) => record.visitStatus === "verified").length,
        conflictCount: groupRecords.filter((record) => record.visitStatus === "conflict").length,
        revisitCount: groupRecords.filter((record) => record.visitStatus === "revisit-needed").length,
        latestUpdatedAt: groupRecords.map((record) => record.updatedAt || "").sort().pop() || ""
      };
    }).sort((a, b) => {
      const left = a.visitDate || a.latestUpdatedAt || a.sessionId;
      const right = b.visitDate || b.latestUpdatedAt || b.sessionId;
      return String(right).localeCompare(String(left));
    });
  }

  function sessionKeyForRecord(record) {
    return cleanText(record.fieldSessionId) || dateKeyForRecord(record) || "unspecified-session";
  }

  function dateKeyForRecord(record) {
    const raw = cleanText(record.visitDate) || String(record.createdAt || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "undated";
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function cleanText(value) {
    return String(value || "").trim();
  }

  global.KaneMapVisitSessions = {
    summarize,
    rowsForBuilding,
    today
  };
})(window);
