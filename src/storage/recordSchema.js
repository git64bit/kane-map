(function attachRecordSchema(global) {
  "use strict";

  const FORMAT = "kane-map-observation-records";
  const VERSION = 5;
  const RECORD_PREFIX = "KMO";

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
      buildingName: input.buildingName,
      stories: input.stories,
      siteLabel: input.siteLabel,
      entranceId: input.entranceId,
      mailboxBankId: input.mailboxBankId,
      observedUnitCount: input.observedUnitCount,
      designatorPattern: input.designatorPattern,
      designatorRaw: input.designatorRaw,
      visibleDesignators: input.visibleDesignators,
      confidence: input.confidence || "unreviewed",
      visitStatus: input.visitStatus || "observed",
      accessContext: input.accessContext,
      notes: input.notes,
      observationMethod: "visible designators only",
      mailboxTouched: false,
      mailboxOpened: false,
      mailRead: false,
      residentNamesRecorded: false,
      source: "local browser storage"
    });
  }

  function updateObservationRecord(existing, input) {
    const base = normalizeRecord(existing);
    const now = new Date().toISOString();

    return normalizeRecord({
      ...base,
      updatedAt: now,
      gridCell: input.gridCell,
      buildingId: input.buildingId,
      buildingLabel: input.buildingLabel,
      buildingName: input.buildingName,
      stories: input.stories,
      siteLabel: input.siteLabel,
      entranceId: input.entranceId,
      mailboxBankId: input.mailboxBankId,
      observedUnitCount: input.observedUnitCount,
      designatorPattern: input.designatorPattern,
      designatorRaw: input.designatorRaw,
      visibleDesignators: input.visibleDesignators,
      confidence: input.confidence || base.confidence,
      visitStatus: input.visitStatus || base.visitStatus,
      accessContext: input.accessContext,
      notes: input.notes
    });
  }

  function normalizeRecord(record) {
    const now = new Date().toISOString();
    const normalizedDesignators = normalizeDesignators(record.visibleDesignators);
    const unitCount = normalizeUnitCount(record.observedUnitCount, normalizedDesignators);

    return {
      id: String(record.id || makeRecordId(1)),
      schemaVersion: VERSION,
      createdAt: String(record.createdAt || now),
      updatedAt: String(record.updatedAt || record.createdAt || now),
      gridCell: cleanText(record.gridCell, "unknown"),
      buildingId: cleanText(record.buildingId, "unknown"),
      buildingLabel: cleanText(record.buildingLabel, "unknown"),
      buildingName: cleanText(record.buildingName, ""),
      stories: normalizeStories(record.stories),
      siteLabel: cleanText(record.siteLabel, ""),
      entranceId: cleanText(record.entranceId, ""),
      mailboxBankId: cleanText(record.mailboxBankId, ""),
      observedUnitCount: unitCount,
      designatorPattern: cleanText(record.designatorPattern, ""),
      designatorRaw: cleanText(record.designatorRaw, ""),
      visibleDesignators: normalizedDesignators,
      confidence: cleanText(record.confidence, "unreviewed"),
      visitStatus: cleanText(record.visitStatus, "observed"),
      accessContext: cleanText(record.accessContext, ""),
      notes: cleanText(record.notes, ""),
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

  function normalizeUnitCount(value, designators) {
    const designatorCount = Array.isArray(designators) ? designators.length : 0;

    if (designatorCount > 0) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) return designatorCount;
      return Math.floor(number);
    }

    if (value === null || value === undefined || value === "") return null;

    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
  }

  function normalizeStories(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
  }

  function normalizeDesignators(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const output = [];

    value.forEach((item) => {
      const text = cleanText(item, "").toUpperCase();
      if (!text || seen.has(text)) return;
      seen.add(text);
      output.push(text);
    });

    return output;
  }

  global.KaneMapRecordSchema = {
    FORMAT,
    VERSION,
    createObservationRecord,
    updateObservationRecord,
    normalizeRecord,
    createEnvelope,
    parseEnvelope,
    makeRecordId,
    nextSequence
  };
})(window);
