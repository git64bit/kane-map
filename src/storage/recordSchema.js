(function attachRecordSchema(global) {
  "use strict";

  const FORMAT = "kane-map-offline-observations";
  const VERSION = 2;
  const RECORD_PREFIX = "OBS";

  function createObservationRecord(input, sequenceNumber) {
    const now = new Date().toISOString();
    return normalizeRecord({
      id: makeRecordId(sequenceNumber),
      schemaVersion: VERSION,
      createdAt: now,
      updatedAt: now,
      gridCell: input.gridCell,
      buildingId: input.buildingId,
      buildingLabel: input.buildingLabel,
      stories: input.stories,
      observedUnitCount: input.observedUnitCount,
      designatorPattern: input.designatorPattern,
      notes: input.notes,
      confidence: input.confidence || "unreviewed",
      visitStatus: input.visitStatus || "observed",
      observationMethod: "visible designators only",
      mailboxTouched: false,
      mailboxOpened: false,
      mailRead: false,
      residentNamesRecorded: false,
      source: "local browser storage"
    });
  }

  function normalizeRecord(record) {
    const now = new Date().toISOString();
    const unitCount = normalizeUnitCount(record.observedUnitCount);

    return {
      id: String(record.id || makeRecordId(1)),
      schemaVersion: Number(record.schemaVersion || VERSION),
      createdAt: String(record.createdAt || now),
      updatedAt: String(record.updatedAt || record.createdAt || now),
      gridCell: cleanText(record.gridCell, "unknown"),
      buildingId: cleanText(record.buildingId, "unknown"),
      buildingLabel: cleanText(record.buildingLabel, "unknown"),
      stories: normalizeStories(record.stories),
      observedUnitCount: unitCount,
      designatorPattern: cleanText(record.designatorPattern, ""),
      notes: cleanText(record.notes, ""),
      confidence: cleanText(record.confidence, "unreviewed"),
      visitStatus: cleanText(record.visitStatus, "observed"),
      observationMethod: cleanText(record.observationMethod, "visible designators only"),
      mailboxTouched: Boolean(record.mailboxTouched),
      mailboxOpened: Boolean(record.mailboxOpened),
      mailRead: Boolean(record.mailRead),
      residentNamesRecorded: Boolean(record.residentNamesRecorded),
      source: cleanText(record.source, "local browser storage")
    };
  }

  function createEnvelope(records) {
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      records: records.map(normalizeRecord)
    };
  }

  function parseEnvelope(text) {
    const parsed = JSON.parse(text);
    const imported = Array.isArray(parsed) ? parsed : parsed.records;

    if (!Array.isArray(imported)) {
      throw new Error("Imported JSON must contain an array or a records array.");
    }

    return imported.map(normalizeRecord);
  }

  function makeRecordId(sequenceNumber) {
    return `${RECORD_PREFIX}-${String(sequenceNumber || 1).padStart(6, "0")}`;
  }

  function nextSequence(records) {
    const highest = records.reduce((max, record) => {
      const id = String(record.id || "");
      const match = id.match(/(\d+)$/);
      if (!match) return max;
      return Math.max(max, Number(match[1]));
    }, 0);

    return highest + 1;
  }

  function cleanText(value, fallback) {
    const text = value === null || value === undefined ? "" : String(value).trim();
    return text || fallback;
  }

  function normalizeUnitCount(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
  }

  function normalizeStories(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
  }

  global.KaneMapRecordSchema = {
    FORMAT,
    VERSION,
    createObservationRecord,
    normalizeRecord,
    createEnvelope,
    parseEnvelope,
    makeRecordId,
    nextSequence
  };
})(window);
