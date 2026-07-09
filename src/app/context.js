(function kaneMapAppContext(global) {
  "use strict";

  function createDomReferences() {
    return {
      selectedCell: document.getElementById("selectedCell"),
      selectedBuilding: document.getElementById("selectedBuilding"),
      selectedStories: document.getElementById("selectedStories"),
      buildingSummary: document.getElementById("buildingSummary"),
      identitySummary: document.getElementById("identitySummary"),
      observationForm: document.getElementById("observationForm"),
      observationFormTitle: document.getElementById("observationFormTitle"),
      editModeNotice: document.getElementById("editModeNotice"),
      saveObservation: document.getElementById("saveObservation"),
      cancelEdit: document.getElementById("cancelEdit"),
      clearObservationFormButton: document.getElementById("clearObservationFormButton"),
      visitDate: document.getElementById("visitDate"),
      fieldSessionId: document.getElementById("fieldSessionId"),
      planPriority: document.getElementById("planPriority"),
      planAction: document.getElementById("planAction"),
      siteLabel: document.getElementById("siteLabel"),
      buildingAlias: document.getElementById("buildingAlias"),
      entranceId: document.getElementById("entranceId"),
      mailboxBankId: document.getElementById("mailboxBankId"),
      visibleDesignators: document.getElementById("visibleDesignators"),
      designatorPreview: document.getElementById("designatorPreview"),
      unitCount: document.getElementById("unitCount"),
      designatorPattern: document.getElementById("designatorPattern"),
      confidence: document.getElementById("confidence"),
      visitStatus: document.getElementById("visitStatus"),
      accessContext: document.getElementById("accessContext"),
      observationNotes: document.getElementById("observationNotes"),
      showSelectedOnly: document.getElementById("showSelectedOnly"),
      recordCount: document.getElementById("recordCount"),
      recordList: document.getElementById("recordList"),
      storageStatus: document.getElementById("storageStatus"),
      viewStatus: document.getElementById("viewStatus"),
      chunkStatus: document.getElementById("chunkStatus"),
      visibleCellStatus: document.getElementById("visibleCellStatus"),
      reviewFilterStatus: document.getElementById("reviewFilterStatus"),
      visitStatusSummary: document.getElementById("visitStatusSummary"),
      zoomIn: document.getElementById("zoomIn"),
      zoomOut: document.getElementById("zoomOut"),
      rotateLeft: document.getElementById("rotateLeft"),
      rotateRight: document.getElementById("rotateRight"),
      prevBuilding: document.getElementById("prevBuilding"),
      nextBuilding: document.getElementById("nextBuilding"),
      resetView: document.getElementById("resetView"),
      copySelection: document.getElementById("copySelection"),
      navSearch: document.getElementById("navSearch"),
      clearSearch: document.getElementById("clearSearch"),
      searchResults: document.getElementById("searchResults"),
      coverageSummary: document.getElementById("coverageSummary"),
      statusFilter: document.getElementById("statusFilter"),
      coverageByCell: document.getElementById("coverageByCell"),
      visitSessionSummary: document.getElementById("visitSessionSummary"),
      fieldPlanSummary: document.getElementById("fieldPlanSummary"),
      planFilter: document.getElementById("planFilter"),
      fieldPlanRows: document.getElementById("fieldPlanRows"),
      planStatusSummary: document.getElementById("planStatusSummary"),
      shortcutStatus: document.getElementById("shortcutStatus"),
      visitSessionRows: document.getElementById("visitSessionRows"),
      exportRecords: document.getElementById("exportRecords"),
      exportObservationCsv: document.getElementById("exportObservationCsv"),
      exportBuildingCsv: document.getElementById("exportBuildingCsv"),
      exportFieldReport: document.getElementById("exportFieldReport"),
      exportVisitCsv: document.getElementById("exportVisitCsv"),
      exportPlanCsv: document.getElementById("exportPlanCsv"),
      importRecords: document.getElementById("importRecords"),
      importPreview: document.getElementById("importPreview"),
      importActions: document.getElementById("importActions"),
      confirmImport: document.getElementById("confirmImport"),
      cancelImport: document.getElementById("cancelImport"),
      downloadBackupBeforeImport: document.getElementById("downloadBackupBeforeImport"),
      clearRecords: document.getElementById("clearRecords"),
      workspaceTabs: Array.from(document.querySelectorAll(".workspace-tab")),
      workspacePanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
      selectedWorkspaceHeader: document.getElementById("selectedWorkspaceHeader")
    };
  }

  async function createAppContext() {
    const sourcePreference = global.KaneMapSourceTypes.sourceFromLocation
      ? global.KaneMapSourceTypes.sourceFromLocation(global.location)
      : global.KaneMapSourceTypes.SOURCES.DEMO;
    const dataAdapterFactory = global.KaneMapDataAdapter.createDataAdapterAsync || global.KaneMapDataAdapter.createDataAdapter;
    const dataAdapter = await dataAdapterFactory({
      sourcePreference,
      demoCatalog: global.KaneMapDemoCatalog,
      chunkRegistry: global.KaneMapChunkRegistry,
      preparedManifest: global.KaneMapPreparedDataManifest
    });
    const catalog = dataAdapter.getCatalog();
    const grid = global.KaneMapGrid.makeKaneGrid(dataAdapter.getBounds(), { rows: 4, cols: 6, startNorth: 11, startEast: 5 });
    const featureStore = dataAdapter.createFeatureStore();
    const allCellCodes = grid.cells.map((cell) => cell.code);
    const initialData = featureStore.buildDataForCells(allCellCodes);
    const allBuildings = initialData.buildings;
    const store = global.KaneMapLocalStore.createLocalObservationStore();
    const canvas = document.getElementById("mapCanvas");
    const renderer = global.KaneMapRenderer.createRenderer(canvas, initialData, grid);
    const ctx = {
      global,
      dataAdapter,
      dataSource: dataAdapter.describe(),
      catalog,
      grid,
      featureStore,
      allCellCodes,
      allBuildings,
      store,
      canvas,
      renderer,
      designators: global.KaneMapDesignators,
      els: createDomReferences(),
      selected: { cell: null, building: null },
      visibleCellCodes: [],
      editingRecordId: null,
      pendingImport: null,
      shortcutController: null
    };

    ctx.searchIndex = global.KaneMapSearchIndex.createSearchIndex({ grid, buildings: allBuildings, getRecords: () => store.snapshot() });
    ctx.coverageModel = global.KaneMapCoverage.createCoverageModel({ grid, buildings: allBuildings, getRecords: () => store.snapshot() });
    ctx.siteIdentityModel = global.KaneMapSiteIdentity.createSiteIdentityModel({ getRecords: () => store.snapshot() });
    ctx.findBuildingById = (buildingId) => allBuildings.find((building) => building.id === buildingId) || null;
    ctx.cellForCode = (code) => grid.cells.find((cell) => cell.code === code) || null;
    ctx.pointerPosition = (event) => {
      const rect = canvas.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    };
    ctx.escapeHtml = global.KaneMapDomUtils.escapeHtml;
    ctx.dateStamp = global.KaneMapDomUtils.dateStamp;
    ctx.copyText = global.KaneMapDomUtils.copyText;
    return ctx;
  }

  global.KaneMapAppContext = { createAppContext };
})(window);
