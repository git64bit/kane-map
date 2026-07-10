(function attachSectorStateStore(global) {
  "use strict";

  const FORMAT = "kane-map-sector-state";
  const JOURNAL_FORMAT = "kane-map-sector-journal";
  const VERSION = 1;
  const DEFAULT_STORAGE_KEY = "kane-map.sector-state.v1";
  const COUNTY = "Kane County, Illinois";
  const VALID_STATES = new Set(["undiscovered", "active", "muted"]);

  function createSectorStateStore(options = {}) {
    const sectorCodes = uniqueStrings(options.sectorCodes || []);
    const sectorSet = new Set(sectorCodes);
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    let directoryHandle = null;
    let lastWriteAt = null;
    const storageAvailable = testLocalStorage();

    function emptyDocument(sector) {
      if (!sectorSet.has(sector)) throw new Error(`Invalid Kane-Map sector: ${sector || "unknown"}`);
      return {
        format: FORMAT,
        version: VERSION,
        county: COUNTY,
        sector,
        updatedAt: null,
        state: {
          sector: "undiscovered",
          inspection: { active: [], muted: [] },
          practical: { active: [], muted: [] }
        }
      };
    }

    function normalizeDocument(input, expectedSector) {
      const sector = String(expectedSector || (input && input.sector) || "");
      if (!sectorSet.has(sector)) throw new Error(`Invalid Kane-Map sector: ${sector || "unknown"}`);
      const source = input && typeof input === "object" ? input : {};
      const state = source.state && typeof source.state === "object" ? source.state : {};
      const inspection = state.inspection && typeof state.inspection === "object" ? state.inspection : {};
      const practical = state.practical && typeof state.practical === "object" ? state.practical : {};
      const mutedInspection = validCodes(inspection.muted, sector, "inspection");
      const mutedPractical = validCodes(practical.muted, sector, "practical");
      const mutedInspectionSet = new Set(mutedInspection);
      const mutedPracticalSet = new Set(mutedPractical);
      const sectorState = VALID_STATES.has(state.sector) ? state.sector : "undiscovered";
      return {
        format: FORMAT,
        version: VERSION,
        county: COUNTY,
        sector,
        updatedAt: validTimestamp(source.updatedAt),
        state: {
          sector: sectorState,
          inspection: {
            active: validCodes(inspection.active, sector, "inspection")
              .filter((code) => !mutedInspectionSet.has(code)),
            muted: mutedInspection
          },
          practical: {
            active: validCodes(practical.active, sector, "practical")
              .filter((code) => !mutedPracticalSet.has(code)),
            muted: mutedPractical
          }
        }
      };
    }

    function stateSignature(document) {
      const normalized = normalizeDocument(document, document && document.sector);
      return JSON.stringify(normalized.state);
    }

    function loadJournal() {
      const fallback = defaultJournal();
      if (!storageAvailable) return fallback;
      try {
        const raw = global.localStorage.getItem(storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.format !== JOURNAL_FORMAT || parsed.version !== VERSION) return fallback;
        const documents = {};
        sectorCodes.forEach((sector) => {
          documents[sector] = normalizeDocument(parsed.sectors && parsed.sectors[sector], sector);
        });
        return {
          format: JOURNAL_FORMAT,
          version: VERSION,
          autosaveThreshold: normalizeThreshold(parsed.autosaveThreshold),
          pendingChanges: nonNegativeInteger(parsed.pendingChanges),
          dirtySectors: uniqueStrings(parsed.dirtySectors).filter((code) => sectorSet.has(code)),
          lastLocalSaveAt: validTimestamp(parsed.lastLocalSaveAt),
          sectors: documents
        };
      } catch (error) {
        console.warn("Kane-Map sector journal could not be loaded.", error);
        return fallback;
      }
    }

    function saveJournal(input) {
      const journal = input && typeof input === "object" ? input : {};
      const documents = {};
      sectorCodes.forEach((sector) => {
        documents[sector] = normalizeDocument(journal.sectors && journal.sectors[sector], sector);
      });
      const payload = {
        format: JOURNAL_FORMAT,
        version: VERSION,
        autosaveThreshold: normalizeThreshold(journal.autosaveThreshold),
        pendingChanges: nonNegativeInteger(journal.pendingChanges),
        dirtySectors: uniqueStrings(journal.dirtySectors).filter((code) => sectorSet.has(code)),
        lastLocalSaveAt: new Date().toISOString(),
        sectors: documents
      };
      if (storageAvailable) global.localStorage.setItem(storageKey, JSON.stringify(payload));
      return payload;
    }

    async function chooseDirectory(localDocuments) {
      if (typeof global.showDirectoryPicker !== "function") {
        throw new Error("Direct folder access is unavailable. Open Kane-Map in a Chromium browser through TrivialHTTP.");
      }
      const handle = await global.showDirectoryPicker({ mode: "readwrite" });
      await requireWritePermission(handle);
      const synchronized = await synchronizeDirectory(handle, localDocuments);
      directoryHandle = handle;
      return synchronized;
    }

    async function synchronizeDirectory(handle, localDocuments) {
      const merged = {};
      const existing = {};
      for (const sector of sectorCodes) {
        const fileDocument = await readOptionalDocument(handle, sector);
        existing[sector] = fileDocument;
        const localDocument = normalizeDocument(localDocuments && localDocuments[sector], sector);
        merged[sector] = newerDocument(localDocument, fileDocument);
      }
      for (const sector of sectorCodes) {
        await writeDocument(handle, merged[sector]);
      }
      lastWriteAt = new Date().toISOString();
      return {
        documents: merged,
        directoryName: handle.name || "Selected folder",
        lastWriteAt,
        existingCount: sectorCodes.filter((sector) => Boolean(existing[sector])).length
      };
    }

    async function writeDocuments(documents, requestedCodes) {
      if (!directoryHandle) throw new Error("Choose a project folder before saving sector files.");
      await requireWritePermission(directoryHandle);
      const codes = uniqueStrings(requestedCodes).filter((code) => sectorSet.has(code));
      for (const sector of codes) {
        await writeDocument(directoryHandle, normalizeDocument(documents && documents[sector], sector));
      }
      lastWriteAt = new Date().toISOString();
      return { written: codes.length, lastWriteAt };
    }

    async function readOptionalDocument(handle, sector) {
      let fileHandle;
      try {
        fileHandle = await handle.getFileHandle(fileName(sector));
      } catch (error) {
        if (error && error.name === "NotFoundError") return null;
        throw error;
      }
      const file = await fileHandle.getFile();
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        throw new Error(`${fileName(sector)} is not valid JSON.`);
      }
      if (!parsed || parsed.format !== FORMAT || parsed.version !== VERSION || parsed.sector !== sector) {
        throw new Error(`${fileName(sector)} is not a Kane-Map sector-state file for ${sector}.`);
      }
      return normalizeDocument(parsed, sector);
    }

    async function writeDocument(handle, document) {
      const fileHandle = await handle.getFileHandle(fileName(document.sector), { create: true });
      const writable = await fileHandle.createWritable();
      try {
        await writable.write(`${JSON.stringify(document, null, 2)}\n`);
      } finally {
        await writable.close();
      }
    }

    function defaultJournal() {
      const sectors = {};
      sectorCodes.forEach((sector) => { sectors[sector] = emptyDocument(sector); });
      return {
        format: JOURNAL_FORMAT,
        version: VERSION,
        autosaveThreshold: 10,
        pendingChanges: 0,
        dirtySectors: [],
        lastLocalSaveAt: null,
        sectors
      };
    }

    return {
      sectorCodes: () => sectorCodes.slice(),
      emptyDocument,
      normalizeDocument,
      stateSignature,
      loadJournal,
      saveJournal,
      chooseDirectory,
      writeDocuments,
      storageAvailable: () => storageAvailable,
      fileAccessSupported: () => typeof global.showDirectoryPicker === "function",
      hasDirectory: () => Boolean(directoryHandle),
      directoryName: () => directoryHandle ? (directoryHandle.name || "Selected folder") : null,
      lastWriteAt: () => lastWriteAt
    };
  }

  async function requireWritePermission(handle) {
    if (!handle) throw new Error("Project folder access was not granted.");
    const options = { mode: "readwrite" };
    if (handle.queryPermission && await handle.queryPermission(options) === "granted") return;
    if (handle.requestPermission && await handle.requestPermission(options) === "granted") return;
    throw new Error("Write permission for the project folder was not granted.");
  }

  function newerDocument(localDocument, fileDocument) {
    if (!fileDocument) return localDocument;
    const localTime = timestampValue(localDocument.updatedAt);
    const fileTime = timestampValue(fileDocument.updatedAt);
    return fileTime > localTime ? fileDocument : localDocument;
  }

  function validCodes(values, sector, level) {
    return uniqueStrings(values)
      .filter((code) => validCellCode(code, sector, level))
      .sort();
  }

  function validCellCode(code, sector, level) {
    const escaped = escapeRegExp(sector);
    const inspection = String(code).match(new RegExp(`^${escaped}:r(\\d{2})c(\\d{2})$`));
    if (level === "inspection") {
      return Boolean(inspection && inRange(inspection[1], 1, 16) && inRange(inspection[2], 1, 16));
    }
    const practical = String(code).match(
      new RegExp(`^${escaped}:r(\\d{2})c(\\d{2}):f(\\d{2})c(\\d{2})$`)
    );
    return Boolean(
      practical &&
      inRange(practical[1], 1, 16) &&
      inRange(practical[2], 1, 16) &&
      inRange(practical[3], 1, 8) &&
      inRange(practical[4], 1, 8)
    );
  }

  function inRange(value, minimum, maximum) {
    const number = Number(value);
    return Number.isInteger(number) && number >= minimum && number <= maximum;
  }

  function normalizeThreshold(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 10;
    const rounded = Math.round(number / 10) * 10;
    return Math.min(100, Math.max(10, rounded));
  }

  function nonNegativeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }

  function validTimestamp(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
  }

  function timestampValue(value) {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
      .filter((value) => typeof value === "string" && value)));
  }

  function fileName(sector) {
    return `${sector}.json`;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function testLocalStorage() {
    try {
      const key = "__kane_map_sector_store_test__";
      global.localStorage.setItem(key, "1");
      global.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  global.KaneMapSectorStateStore = { createSectorStateStore };
})(window);
