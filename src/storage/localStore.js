(function attachLocalStore(global) {
  "use strict";

  const DEFAULT_STORAGE_KEY = "kane-map.local-observations.v2";

  function createLocalObservationStore(options = {}) {
    const schema = global.KaneMapRecordSchema;
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    let records = [];
    let storageAvailable = testLocalStorage();

    loadFromBrowser();

    function snapshot() {
      return records.map((record) => ({ ...record }));
    }

    function addRecord(input) {
      const record = schema.createObservationRecord(input, schema.nextSequence(records));
      records.push(record);
      saveToBrowser();
      return { ...record };
    }

    function replaceAll(importedRecords) {
      records = importedRecords.map(schema.normalizeRecord);
      saveToBrowser();
      return snapshot();
    }

    function clear() {
      records = [];
      if (storageAvailable) {
        localStorage.removeItem(storageKey);
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
        label: "Storage: local saved",
        detail: `${records.length} records saved under ${storageKey}`
      };
    }

    function loadFromBrowser() {
      if (!storageAvailable) return;

      const text = localStorage.getItem(storageKey);
      if (!text) return;

      try {
        const parsed = JSON.parse(text);
        const imported = parsed && Array.isArray(parsed.records) ? parsed.records : [];
        records = imported.map(schema.normalizeRecord);
      } catch (error) {
        console.warn("Kane-Map could not load local observation records.", error);
        records = [];
      }
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
      download,
      exportJson,
      importJson,
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
