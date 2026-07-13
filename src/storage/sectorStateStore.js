(function attachSectorStateStore(global) {
  "use strict";

  const FORMAT = "kane-map-sector-state";
  const JOURNAL_FORMAT = "kane-map-sector-journal";
  const VERSION = 1;
  const DEFAULT_STORAGE_KEY = "kane-map.sector-state.v1";
  const COUNTY = "Kane County, Illinois";
  const API_ROOT = "/__kane_map/sector-state";
  const STORAGE_NAME = "project-data/sectors";
  const VALID_STATES = new Set(["undiscovered", "active", "muted"]);

  function createSectorStateStore(options = {}) {
    const sectorCodes = uniqueStrings(options.sectorCodes || []);
    const sectorSet = new Set(sectorCodes);
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    const storageAvailable = testLocalStorage();
    let connected = false;
    let lastWriteAt = null;

    function emptyDocument(sector) {
      requireSector(sectorSet, sector);
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
      requireSector(sectorSet, sector);
      const source = input && typeof input === "object" ? input : {};
      const state = source.state && typeof source.state === "object" ? source.state : {};
      const inspection = state.inspection && typeof state.inspection === "object" ? state.inspection : {};
      const practical = state.practical && typeof state.practical === "object" ? state.practical : {};
      const mutedInspection = validCodes(inspection.muted, sector, "inspection");
      const mutedPractical = validCodes(practical.muted, sector, "practical");
      const mutedInspectionSet = new Set(mutedInspection);
      const mutedPracticalSet = new Set(mutedPractical);
      return {
        format: FORMAT,
        version: VERSION,
        county: COUNTY,
        sector,
        updatedAt: validTimestamp(source.updatedAt),
        state: {
          sector: VALID_STATES.has(state.sector) ? state.sector : "undiscovered",
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
      return JSON.stringify(normalizeDocument(document, document && document.sector).state);
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

    function loadJournal() {
      const fallback = defaultJournal();
      if (!storageAvailable) return fallback;
      try {
        const raw = global.localStorage.getItem(storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.format !== JOURNAL_FORMAT || parsed.version !== VERSION) return fallback;
        const sectors = {};
        sectorCodes.forEach((sector) => {
          sectors[sector] = normalizeDocument(parsed.sectors && parsed.sectors[sector], sector);
        });
        return {
          format: JOURNAL_FORMAT,
          version: VERSION,
          autosaveThreshold: normalizeThreshold(parsed.autosaveThreshold),
          pendingChanges: nonNegativeInteger(parsed.pendingChanges),
          dirtySectors: uniqueStrings(parsed.dirtySectors).filter((code) => sectorSet.has(code)),
          lastLocalSaveAt: validTimestamp(parsed.lastLocalSaveAt),
          sectors
        };
      } catch (error) {
        console.warn("Kane-Map sector journal could not be loaded.", error);
        return fallback;
      }
    }

    function saveJournal(input) {
      const journal = input && typeof input === "object" ? input : {};
      const sectors = {};
      sectorCodes.forEach((sector) => {
        sectors[sector] = normalizeDocument(journal.sectors && journal.sectors[sector], sector);
      });
      const payload = {
        format: JOURNAL_FORMAT,
        version: VERSION,
        autosaveThreshold: normalizeThreshold(journal.autosaveThreshold),
        pendingChanges: nonNegativeInteger(journal.pendingChanges),
        dirtySectors: uniqueStrings(journal.dirtySectors).filter((code) => sectorSet.has(code)),
        lastLocalSaveAt: new Date().toISOString(),
        sectors
      };
      if (storageAvailable) global.localStorage.setItem(storageKey, JSON.stringify(payload));
      return payload;
    }

    async function connectServer(localDocuments) {
      connected = false;
      const health = await fetchJson(API_ROOT);
      if (!health || health.ok !== true || health.storage !== STORAGE_NAME || health.sectorCount !== sectorCodes.length) {
        throw new Error("The running TrivialHTTP server does not support Kane-Map sector storage.");
      }
      const merged = {};
      const existing = {};
      for (const sector of sectorCodes) {
        const fileDocument = await readOptionalDocument(sector);
        existing[sector] = fileDocument;
        const localDocument = normalizeDocument(localDocuments && localDocuments[sector], sector);
        merged[sector] = newerDocument(localDocument, fileDocument);
      }
      for (const sector of sectorCodes) await writeDocument(merged[sector]);
      connected = true;
      lastWriteAt = new Date().toISOString();
      return {
        documents: merged,
        storageName: STORAGE_NAME,
        lastWriteAt,
        existingCount: sectorCodes.filter((sector) => Boolean(existing[sector])).length
      };
    }

    async function writeDocuments(documents, requestedCodes) {
      if (!connected) throw new Error("TrivialHTTP sector storage is not connected.");
      const codes = uniqueStrings(requestedCodes).filter((code) => sectorSet.has(code));
      for (const sector of codes) {
        await writeDocument(normalizeDocument(documents && documents[sector], sector));
      }
      lastWriteAt = new Date().toISOString();
      return { written: codes.length, lastWriteAt };
    }

    async function readOptionalDocument(sector) {
      const response = await fetch(`${API_ROOT}/${fileName(sector)}`, { cache: "no-store" });
      if (response.status === 404) return null;
      if (!response.ok) throw await responseError(response, `${fileName(sector)} could not be read.`);
      let parsed;
      try {
        parsed = JSON.parse(await response.text());
      } catch (error) {
        throw new Error(`${fileName(sector)} is not valid JSON.`);
      }
      if (!parsed || parsed.format !== FORMAT || parsed.version !== VERSION || parsed.sector !== sector) {
        throw new Error(`${fileName(sector)} is not a Kane-Map sector-state file for ${sector}.`);
      }
      return normalizeDocument(parsed, sector);
    }

    async function writeDocument(document) {
      const response = await fetch(`${API_ROOT}/${fileName(document.sector)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: `${JSON.stringify(document, null, 2)}\n`,
        cache: "no-store"
      });
      if (!response.ok) throw await responseError(response, `${fileName(document.sector)} could not be written.`);
    }

    return {
      sectorCodes: () => sectorCodes.slice(),
      emptyDocument,
      normalizeDocument,
      stateSignature,
      loadJournal,
      saveJournal,
      connectServer,
      writeDocuments,
      storageAvailable: () => storageAvailable,
      isConnected: () => connected,
      storageName: () => STORAGE_NAME,
      lastWriteAt: () => lastWriteAt
    };
  }

  async function fetchJson(url) {
    let response;
    try {
      response = await fetch(url, { cache: "no-store" });
    } catch (error) {
      throw new Error("TrivialHTTP sector storage is unavailable. Start Kane-Map through the updated TrivialHTTP executable.");
    }
    if (!response.ok) throw await responseError(response, "TrivialHTTP sector storage is unavailable.");
    try {
      return await response.json();
    } catch (error) {
      throw new Error("TrivialHTTP returned an invalid sector-storage response.");
    }
  }

  async function responseError(response, fallback) {
    try {
      const payload = await response.json();
      return new Error(payload && payload.error ? payload.error : fallback);
    } catch (error) {
      return new Error(fallback);
    }
  }

  function requireSector(sectorSet, sector) {
    if (!sectorSet.has(sector)) throw new Error(`Invalid Kane-Map sector: ${sector || "unknown"}`);
  }

  function newerDocument(localDocument, fileDocument) {
    if (!fileDocument) return localDocument;
    return timestampValue(fileDocument.updatedAt) > timestampValue(localDocument.updatedAt)
      ? fileDocument
      : localDocument;
  }

  function validCodes(values, sector, level) {
    return uniqueStrings(values).filter((code) => validCellCode(code, sector, level)).sort();
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
      practical && inRange(practical[1], 1, 16) && inRange(practical[2], 1, 16) &&
      inRange(practical[3], 1, 8) && inRange(practical[4], 1, 8)
    );
  }

  function inRange(value, minimum, maximum) {
    const number = Number(value);
    return Number.isInteger(number) && number >= minimum && number <= maximum;
  }

  function normalizeThreshold(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 10;
    return Math.min(100, Math.max(10, Math.round(number / 10) * 10));
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
