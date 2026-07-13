(function kaneMapImportExportController(global) {
  "use strict";
  function installImportExportController(ctx) {
    const storeFactory = global.KaneMapSectorStateStore;
    if (!storeFactory || typeof storeFactory.createSectorStateStore !== "function") {
      installUnavailableSectorStorage(ctx, "Sector-state storage module could not be loaded.");
      return;
    }
    let store;
    try {
      store = storeFactory.createSectorStateStore({ sectorCodes: ctx.allCellCodes });
    } catch (error) {
      const reason = error && error.message
        ? `Sector-state storage could not start: ${error.message}`
        : "Sector-state storage could not start.";
      installUnavailableSectorStorage(ctx, reason);
      return;
    }
    const state = {
      store,
      documents: {},
      signatures: {},
      dirtySectors: new Set(),
      pendingChanges: 0,
      autosaveThreshold: 10,
      lastLocalSaveAt: null,
      lastWriteAt: null,
      previousSector: null,
      observationQueued: false,
      writeQueue: Promise.resolve(),
      message: "",
      messageType: "",
      busy: false,
      suppressObservation: false,
      journalError: ""
    };
    ctx.sectorPersistence = state;
    loadBrowserJournal(ctx, state);
    wrapMapRefresh(ctx, state);
    ctx.bindImportExportEvents = function bindImportExportEvents() {
      const { els } = ctx;
      if (els.reconnectSectorStorage) {
        els.reconnectSectorStorage.textContent = "Reconnect storage";
        els.reconnectSectorStorage.addEventListener("click", () => connectProjectStorage(ctx, state));
      }
      if (els.saveSectorStateNow) els.saveSectorStateNow.addEventListener("click", () => ctx.saveSectorStateNow());
      if (els.autosaveThreshold) els.autosaveThreshold.addEventListener("change", () => changeThreshold(ctx, state));
      if (els.clearRecords) els.clearRecords.addEventListener("click", () => clearObservationRecords(ctx));
      ctx.updateSectorStorageUi();
      connectProjectStorage(ctx, state);
    };
    ctx.saveSectorStateNow = function saveSectorStateNow() {
      observeState(ctx, state);
      if (!state.store.isConnected()) {
        setMessage(state, "TrivialHTTP sector storage is not connected.", "warning");
        ctx.updateSectorStorageUi();
        return Promise.resolve(false);
      }
      if (!state.dirtySectors.size) {
        setMessage(state, "No sector changes are waiting to be saved.", "neutral");
        ctx.updateSectorStorageUi();
        return Promise.resolve(true);
      }
      return queueWrite(ctx, state, Array.from(state.dirtySectors), "Manual save complete.");
    };
    ctx.updateSectorStorageUi = function updateSectorStorageUi() {
      updateUi(ctx, state);
    };
    ctx.updateStorageStatus = function updateStorageStatus() {
      const status = ctx.store.storageStatus();
      if (ctx.els.storageStatus) {
        ctx.els.storageStatus.textContent = status.label;
        ctx.els.storageStatus.title = status.detail;
      }
    };
  }

  function installUnavailableSectorStorage(ctx, reason) {
    const message = reason || "Sector-state storage is unavailable.";
    console.error(`Kane-Map sector persistence disabled: ${message}`);
    ctx.sectorPersistence = null;
    ctx.bindImportExportEvents = function bindUnavailableSectorStorageEvents() {
      const { els } = ctx;
      if (els.clearRecords) {
        els.clearRecords.addEventListener("click", () => clearObservationRecords(ctx));
      }
      if (els.reconnectSectorStorage) els.reconnectSectorStorage.disabled = true;
      if (els.saveSectorStateNow) els.saveSectorStateNow.disabled = true;
      if (els.autosaveThreshold) els.autosaveThreshold.disabled = true;
      ctx.updateSectorStorageUi();
    };
    ctx.saveSectorStateNow = function saveUnavailableSectorStateNow() {
      ctx.updateSectorStorageUi();
      return Promise.resolve(false);
    };
    ctx.updateSectorStorageUi = function updateUnavailableSectorStorageUi() {
      const { els } = ctx;
      if (els.sectorCurrentStatus) els.sectorCurrentStatus.textContent = currentSectorCode(ctx) || "None selected";
      if (els.sectorFolderStatus) els.sectorFolderStatus.textContent = "project-data/sectors unavailable";
      if (els.sectorJournalStatus) els.sectorJournalStatus.textContent = "Disabled; map remains operational";
      if (els.sectorPendingStatus) els.sectorPendingStatus.textContent = "Not available";
      if (els.sectorLastWriteStatus) els.sectorLastWriteStatus.textContent = "No write attempted";
      if (els.sectorStorageMessage) {
        els.sectorStorageMessage.textContent = `${message} Kane-Map can still be used, but sector changes will not persist.`;
        els.sectorStorageMessage.dataset.status = "error";
      }
    };
    ctx.updateStorageStatus = function updateStorageStatus() {
      const status = ctx.store.storageStatus();
      if (ctx.els.storageStatus) {
        ctx.els.storageStatus.textContent = status.label;
        ctx.els.storageStatus.title = `${status.detail} Sector-state persistence is disabled.`;
      }
    };
  }

  function loadBrowserJournal(ctx, state) {
    const journal = state.store.loadJournal();
    state.documents = journal.sectors;
    state.autosaveThreshold = journal.autosaveThreshold;
    state.pendingChanges = journal.pendingChanges;
    state.dirtySectors = new Set(journal.dirtySectors);
    state.lastLocalSaveAt = journal.lastLocalSaveAt;
    applyDocuments(ctx, state.documents);
    state.documents = captureDocuments(ctx, state.documents, state.store);
    state.signatures = signaturesFor(state.documents, state.store);
    state.previousSector = currentSectorCode(ctx);
    ctx.refreshMapData();
  }

  function wrapMapRefresh(ctx, state) {
    const refreshMapData = ctx.refreshMapData;
    ctx.refreshMapData = function refreshMapDataWithPersistence() {
      const result = refreshMapData.apply(ctx, arguments);
      if (!state.suppressObservation) scheduleObservation(ctx, state);
      return result;
    };
  }

  function scheduleObservation(ctx, state) {
    if (state.observationQueued) return;
    state.observationQueued = true;
    const run = () => {
      state.observationQueued = false;
      observeState(ctx, state);
    };
    if (typeof global.queueMicrotask === "function") global.queueMicrotask(run);
    else Promise.resolve().then(run);
  }

  function observeState(ctx, state) {
    if (state.suppressObservation) return;
    const nextDocuments = captureDocuments(ctx, state.documents, state.store);
    const changed = [];
    const now = new Date().toISOString();
    state.store.sectorCodes().forEach((sector) => {
      const signature = state.store.stateSignature(nextDocuments[sector]);
      if (signature !== state.signatures[sector]) {
        nextDocuments[sector].updatedAt = now;
        changed.push(sector);
        state.dirtySectors.add(sector);
      }
    });
    if (changed.length) {
      state.pendingChanges += 1;
      state.documents = nextDocuments;
      state.signatures = signaturesFor(nextDocuments, state.store);
      const journalSaved = persistJournal(state);
      setMessage(
        state,
        journalSaved ? "Sector change saved to the browser journal." : state.journalError,
        journalSaved ? "success" : "error"
      );
    }

    const selectedSector = currentSectorCode(ctx);
    if (
      selectedSector !== state.previousSector &&
      state.previousSector &&
      state.dirtySectors.has(state.previousSector) &&
      state.store.isConnected()
    ) {
      queueWrite(ctx, state, [state.previousSector], `${state.previousSector} saved before sector change.`);
    }
    state.previousSector = selectedSector;

    if (
      changed.length &&
      state.pendingChanges >= state.autosaveThreshold &&
      state.store.isConnected()
    ) {
      queueWrite(ctx, state, Array.from(state.dirtySectors), "Autosave complete.");
    }
    if (ctx.updateSectorStorageUi) ctx.updateSectorStorageUi();
  }

  async function connectProjectStorage(ctx, state) {
    if (state.busy) return;
    observeState(ctx, state);
    const startingDocuments = cloneDocuments(state.documents, state.store);
    const startingSignatures = signaturesFor(startingDocuments, state.store);
    const pendingAtStart = state.pendingChanges;
    state.busy = true;
    setMessage(state, "Connecting TrivialHTTP storage and synchronizing 16 sector files…", "neutral");
    ctx.updateSectorStorageUi();
    try {
      const result = await state.store.connectServer(startingDocuments);
      const currentDocuments = captureDocuments(ctx, state.documents, state.store);
      const currentSignatures = signaturesFor(currentDocuments, state.store);
      const changedDuringSync = state.store.sectorCodes().filter(
        (sector) => currentSignatures[sector] !== startingSignatures[sector]
      );
      const mergedDocuments = Object.assign({}, result.documents);
      changedDuringSync.forEach((sector) => { mergedDocuments[sector] = currentDocuments[sector]; });

      state.suppressObservation = true;
      state.documents = mergedDocuments;
      applyDocuments(ctx, mergedDocuments);
      state.signatures = signaturesFor(mergedDocuments, state.store);
      state.dirtySectors = new Set(changedDuringSync);
      state.pendingChanges = changedDuringSync.length
        ? Math.max(1, state.pendingChanges - pendingAtStart)
        : 0;
      state.lastWriteAt = result.lastWriteAt;
      const journalSaved = persistJournal(state);
      ctx.refreshMapData();
      const folderMessage = changedDuringSync.length
        ? `TrivialHTTP storage connected. All 16 files synchronized; ${changedDuringSync.length} sector change remains pending.`
        : `TrivialHTTP storage connected. ${result.existingCount} existing files read; all 16 sector files synchronized.`;
      setMessage(
        state,
        journalSaved ? folderMessage : `${folderMessage} ${state.journalError}`,
        !journalSaved || changedDuringSync.length ? "warning" : "success"
      );
    } catch (error) {
      setMessage(state, error && error.message ? error.message : "TrivialHTTP sector storage could not be connected.", "error");
    } finally {
      state.suppressObservation = false;
      state.busy = false;
      ctx.updateSectorStorageUi();
    }
  }

  function changeThreshold(ctx, state) {
    if (!ctx.els.autosaveThreshold) return;
    state.autosaveThreshold = Number(ctx.els.autosaveThreshold.value) || 10;
    const journalSaved = persistJournal(state);
    setMessage(
      state,
      journalSaved
        ? `Autosave threshold set to ${state.autosaveThreshold} changes.`
        : state.journalError,
      journalSaved ? "success" : "error"
    );
    ctx.updateSectorStorageUi();
    if (
      state.pendingChanges >= state.autosaveThreshold &&
      state.dirtySectors.size &&
      state.store.isConnected()
    ) {
      queueWrite(ctx, state, Array.from(state.dirtySectors), "Autosave complete.");
    }
  }

  function queueWrite(ctx, state, sectors, successMessage) {
    const requested = Array.from(new Set(sectors)).filter((code) => state.dirtySectors.has(code));
    if (!requested.length) return Promise.resolve(true);
    state.busy = true;
    setMessage(state, `Saving ${requested.length} sector file${requested.length === 1 ? "" : "s"}…`, "neutral");
    ctx.updateSectorStorageUi();
    let savedSignatures = {};
    state.writeQueue = state.writeQueue
      .then(() => {
        const documents = {};
        requested.forEach((sector) => {
          documents[sector] = state.store.normalizeDocument(state.documents[sector], sector);
          savedSignatures[sector] = state.store.stateSignature(documents[sector]);
        });
        return state.store.writeDocuments(documents, requested);
      })
      .then((result) => {
        requested.forEach((sector) => {
          const currentSignature = state.store.stateSignature(state.documents[sector]);
          if (currentSignature === savedSignatures[sector]) state.dirtySectors.delete(sector);
        });
        if (!state.dirtySectors.size) state.pendingChanges = 0;
        state.lastWriteAt = result.lastWriteAt;
        const journalSaved = persistJournal(state);
        const writeMessage = state.dirtySectors.size
          ? "New changes remain pending after the write."
          : successMessage;
        setMessage(
          state,
          journalSaved ? writeMessage : `${writeMessage} ${state.journalError}`,
          !journalSaved || state.dirtySectors.size ? "warning" : "success"
        );
        return true;
      })
      .catch((error) => {
        setMessage(state, error && error.message ? error.message : "Sector files could not be saved.", "error");
        return false;
      })
      .finally(() => {
        state.busy = false;
        ctx.updateSectorStorageUi();
      });
    return state.writeQueue;
  }

  function captureDocuments(ctx, previousDocuments, store) {
    const documents = {};
    store.sectorCodes().forEach((sector) => {
      const previous = previousDocuments && previousDocuments[sector];
      const mainState = ctx.mutedCellCodes.includes(sector)
        ? "muted"
        : ctx.activeCellCodes.includes(sector) ? "active" : "undiscovered";
      documents[sector] = store.normalizeDocument({
        sector,
        updatedAt: previous && previous.updatedAt,
        state: {
          sector: mainState,
          inspection: {
            active: codesForSector(ctx.activeDetailCells, sector),
            muted: codesForSector(ctx.mutedDetailCells, sector)
          },
          practical: {
            active: codesForSector(ctx.activeFineCells, sector),
            muted: codesForSector(ctx.mutedFineCells, sector)
          }
        }
      }, sector);
    });
    return documents;
  }

  function applyDocuments(ctx, documents) {
    const activeMain = [];
    const mutedMain = [];
    const activeDetail = [];
    const mutedDetail = [];
    const activeFine = [];
    const mutedFine = [];
    Object.values(documents || {}).forEach((document) => {
      if (!document || !document.state) return;
      if (document.state.sector === "active") activeMain.push(document.sector);
      if (document.state.sector === "muted") mutedMain.push(document.sector);
      document.state.inspection.active.forEach((code) => addCell(activeDetail, detailCellByCode(ctx, code)));
      document.state.inspection.muted.forEach((code) => addCell(mutedDetail, detailCellByCode(ctx, code)));
      document.state.practical.active.forEach((code) => addCell(activeFine, fineCellByCode(ctx, code)));
      document.state.practical.muted.forEach((code) => addCell(mutedFine, fineCellByCode(ctx, code)));
    });
    ctx.activeCellCodes = activeMain;
    ctx.mutedCellCodes = mutedMain;
    ctx.activeDetailCells = activeDetail;
    ctx.mutedDetailCells = mutedDetail;
    ctx.activeFineCells = activeFine;
    ctx.mutedFineCells = mutedFine;
  }

  function detailCellByCode(ctx, code) {
    return global.KaneMapMapGridHierarchy.detailCellByCode(ctx, code);
  }

  function fineCellByCode(ctx, code) {
    const match = String(code || "").match(/^(.*):f(\d{2})c(\d{2})$/);
    if (!match) return null;
    const detailCell = detailCellByCode(ctx, match[1]);
    if (!detailCell) return null;
    const row = Number(match[2]) - 1;
    const col = Number(match[3]) - 1;
    if (row < 0 || row >= ctx.fineGridRows || col < 0 || col >= ctx.fineGridCols) return null;
    const width = (detailCell.maxX - detailCell.minX) / ctx.fineGridCols;
    const height = (detailCell.maxY - detailCell.minY) / ctx.fineGridRows;
    const minX = detailCell.minX + col * width;
    const minY = detailCell.minY + row * height;
    const maxX = col === ctx.fineGridCols - 1 ? detailCell.maxX : minX + width;
    const maxY = row === ctx.fineGridRows - 1 ? detailCell.maxY : minY + height;
    return {
      code,
      parentCode: detailCell.parentCode,
      detailParentCode: detailCell.code,
      level: "practical",
      row,
      col,
      minX,
      minY,
      maxX,
      maxY,
      center: [(minX + maxX) / 2, (minY + maxY) / 2],
      polygon: [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]
    };
  }

  function persistJournal(state) {
    if (!state.store.storageAvailable()) {
      state.journalError = "Browser journal is unavailable; connect the USB project folder before fieldwork.";
      return false;
    }
    try {
      const journal = state.store.saveJournal({
        autosaveThreshold: state.autosaveThreshold,
        pendingChanges: state.pendingChanges,
        dirtySectors: Array.from(state.dirtySectors),
        sectors: state.documents
      });
      state.autosaveThreshold = journal.autosaveThreshold;
      state.lastLocalSaveAt = journal.lastLocalSaveAt;
      state.journalError = "";
      return true;
    } catch (error) {
      state.journalError = error && error.message
        ? `Browser journal error: ${error.message}`
        : "Browser journal could not be saved.";
      return false;
    }
  }

  function cloneDocuments(documents, store) {
    const clone = {};
    store.sectorCodes().forEach((sector) => {
      clone[sector] = store.normalizeDocument(documents && documents[sector], sector);
    });
    return clone;
  }

  function updateUi(ctx, state) {
    const { els } = ctx;
    if (els.autosaveThreshold) els.autosaveThreshold.value = String(state.autosaveThreshold);
    if (els.sectorCurrentStatus) els.sectorCurrentStatus.textContent = currentSectorCode(ctx) || "None selected";
    if (els.sectorFolderStatus) els.sectorFolderStatus.textContent = state.store.isConnected()
      ? `${state.store.storageName()} · connected` : `${state.store.storageName()} · disconnected`;
    if (els.sectorJournalStatus) els.sectorJournalStatus.textContent = state.journalError
      ? state.journalError : state.store.storageAvailable()
        ? state.lastLocalSaveAt ? `Saved locally · ${formatTime(state.lastLocalSaveAt)}` : "Ready; no sector changes yet"
        : "Browser storage unavailable";
    if (els.sectorPendingStatus) els.sectorPendingStatus.textContent = `${state.pendingChanges} / ${state.autosaveThreshold} changes`;
    if (els.sectorLastWriteStatus) els.sectorLastWriteStatus.textContent = state.lastWriteAt
      ? `Successful · ${formatTime(state.lastWriteAt)}` : "No sector write this session";
    if (els.sectorStorageMessage) {
      els.sectorStorageMessage.textContent = state.message || defaultMessage(state);
      els.sectorStorageMessage.dataset.status = state.messageType || "neutral";
    }
    if (els.reconnectSectorStorage) els.reconnectSectorStorage.disabled = state.busy;
    if (els.saveSectorStateNow) els.saveSectorStateNow.disabled = state.busy || !state.store.isConnected() || !state.dirtySectors.size;
  }

  function defaultMessage(state) {
    if (!state.store.isConnected()) {
      return "TrivialHTTP storage is disconnected. Browser journaling remains active; use Reconnect storage after updating the server executable.";
    }
    return "Sector autosave is ready. Files are written under project-data/sectors.";
  }

  function clearObservationRecords(ctx) {
    if (!ctx.store.snapshot().length) return;
    const ok = confirm("Clear locally saved Kane-Map observation records from this browser?");
    if (!ok) return;
    ctx.stopEditing();
    ctx.store.clear();
    ctx.refreshRecordUi();
  }

  function signaturesFor(documents, store) {
    const signatures = {};
    store.sectorCodes().forEach((sector) => {
      signatures[sector] = store.stateSignature(documents[sector]);
    });
    return signatures;
  }

  function codesForSector(cells, sector) {
    return (Array.isArray(cells) ? cells : [])
      .filter((cell) => cell && cell.parentCode === sector && cell.code)
      .map((cell) => cell.code);
  }

  function addCell(target, cell) {
    if (cell && !target.some((candidate) => candidate.code === cell.code)) target.push(cell);
  }

  function currentSectorCode(ctx) {
    const code = ctx.selected && ctx.selected.cell && ctx.selected.cell.code;
    return ctx.allCellCodes.includes(code) ? code : null;
  }

  function setMessage(state, message, type) {
    state.message = message;
    state.messageType = type;
  }

  function formatTime(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleTimeString() : "unknown time";
  }

  global.KaneMapImportExportController = { installImportExportController };
})(window);
