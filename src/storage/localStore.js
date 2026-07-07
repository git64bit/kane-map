(function attachLocalStore(global) {
  "use strict";

  const DEFAULT_STORAGE_KEY = "kane-map.local-observations.v4";
  const LEGACY_STORAGE_KEYS = [
    "kane-map.local-observations.v3",
    "kane-map.local-observations.v2"
  ];

  function createLocalObservationStore(options = {}) {
    const schema = global.KaneMapRecordSchema;
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    let records = [];
    let storageAvailable = testLocalStorage();

    loadFromBrowser();

    function snapshot() {
      return records.map((record) => ({ ...record, visibleDesignators: record.visibleDesignators.slice() }));
    }

    function addRecord(input) {
      const record = schema.createObservationRecord(input, schema.nextSequence(records));
      records.push(record);
      saveToBrowser();
      return { ...record, visibleDesignators: record.visibleDesignators.slice() };
    }

    function replaceAll(importedRecords) {
      records = importedRecords.map(schema.normalizeRecord);
      saveToBrowser();
      return snapshot();
    }

    function deleteRecord(recordId) {
      const before = records.length;
      records = records.filter((record) => record.id !== recordId);
      if (records.length !== before) saveToBrowser();
      return before !== records.length;
    }

    function recordsForBuilding(buildingId) {
      return snapshot().filter((record) => record.buildingId === buildingId);
    }

    function clear() {
      records = [];
      if (storageAvailable) {
        localStorage.removeItem(storageKey);
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      }
    }

    function exportJson() {
      return JSON.stringify(schema.createEnvelope(records), null, 2);
    }

    function importJson(text) {
      return replaceAll(schema.parseEnvelope(text));
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

    function storageStatus() {
      if (!storageAvailable) {
        return {
          available: false,
          label: "Storage unavailable",
          detail: "localStorage is blocked or unavailable. Export JSON before closing."
        };
      }

      return {
        available: true,
        label: "Storage: field ledger saved",
        detail: `${records.length} records saved under ${storageKey}`
      };
    }

    function loadFromBrowser() {
      if (!storageAvailable) return;

      const loaded = readEnvelope(storageKey) || readLegacyEnvelope();
      if (!loaded) return;

      records = loaded.map(schema.normalizeRecord);
      saveToBrowser();
    }

    function readLegacyEnvelope() {
      for (const key of LEGACY_STORAGE_KEYS) {
        const loaded = readEnvelope(key);
        if (loaded) return loaded;
      }
      return null;
    }

    function readEnvelope(key) {
      const text = localStorage.getItem(key);
      if (!text) return null;

      try {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.records)) return parsed.records;
      } catch (error) {
        console.warn(`Kane-Map could not load records from ${key}.`, error);
      }

      return null;
    }

    function saveToBrowser() {
      if (!storageAvailable) return;

      try {
        const envelope = schema.createEnvelope(records);
        localStorage.setItem(storageKey, JSON.stringify(envelope));
      } catch (error) {
        storageAvailable = false;
        console.warn("Kane-Map could not save local observation records.", error);
      }
    }

    return {
      addRecord,
      clear,
      deleteRecord,
      download,
      exportJson,
      importJson,
      recordsForBuilding,
      replaceAll,
      snapshot,
      storageStatus
    };
  }

  function testLocalStorage() {
    try {
      const key = "kane-map.local-storage-test";
      localStorage.setItem(key, "ok");
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  global.KaneMapLocalStore = {
    createLocalObservationStore
  };
})(window);
