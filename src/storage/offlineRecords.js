(function attachOfflineRecords(global) {
  "use strict";

  function createOfflineRecordStore() {
    let records = [];
    let nextId = 1;

    function snapshot() {
      return records.map((record) => ({ ...record }));
    }

    function addRecord(input) {
      const now = new Date().toISOString();
      const record = {
        id: `OBS-${String(nextId).padStart(4, "0")}`,
        createdAt: now,
        gridCell: input.gridCell || "unknown",
        buildingId: input.buildingId || "unknown",
        buildingLabel: input.buildingLabel || "unknown",
        stories: input.stories || null,
        observedUnitCount: Number.isFinite(input.observedUnitCount) ? input.observedUnitCount : null,
        designatorPattern: input.designatorPattern || "",
        notes: input.notes || "",
        observationMethod: "visible designators only",
        mailboxTouched: false,
        mailboxOpened: false,
        mailRead: false,
        residentNamesRecorded: false,
        source: "offline browser session"
      };

      nextId += 1;
      records.push(record);
      return record;
    }

    function clear() {
      records = [];
      nextId = 1;
    }

    function exportJson() {
      return JSON.stringify({
        format: "kane-map-offline-observations",
        version: 1,
        exportedAt: new Date().toISOString(),
        records: snapshot()
      }, null, 2);
    }

    function importJson(text) {
      const parsed = JSON.parse(text);
      const imported = Array.isArray(parsed) ? parsed : parsed.records;

      if (!Array.isArray(imported)) {
        throw new Error("Imported JSON must contain an array or a records array.");
      }

      records = imported.map((record, index) => ({
        id: record.id || `OBS-${String(index + 1).padStart(4, "0")}`,
        createdAt: record.createdAt || new Date().toISOString(),
        gridCell: record.gridCell || "unknown",
        buildingId: record.buildingId || "unknown",
        buildingLabel: record.buildingLabel || "unknown",
        stories: record.stories || null,
        observedUnitCount: Number.isFinite(Number(record.observedUnitCount))
          ? Number(record.observedUnitCount)
          : null,
        designatorPattern: record.designatorPattern || "",
        notes: record.notes || "",
        observationMethod: record.observationMethod || "visible designators only",
        mailboxTouched: Boolean(record.mailboxTouched),
        mailboxOpened: Boolean(record.mailboxOpened),
        mailRead: Boolean(record.mailRead),
        residentNamesRecorded: Boolean(record.residentNamesRecorded),
        source: record.source || "imported JSON"
      }));

      nextId = records.length + 1;
      return snapshot();
    }

    function download(filename, text) {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    return {
      addRecord,
      clear,
      snapshot,
      exportJson,
      importJson,
      download
    };
  }

  global.KaneMapOfflineRecords = {
    createOfflineRecordStore
  };
})(window);
