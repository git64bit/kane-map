(function kaneMapAppContext(global) {
  "use strict";

  const DEFAULT_LAYER_VISIBILITY = Object.freeze({
    roads: false,
    water: false,
    forests: false,
    buildings: false,
    addressPoints: false
  });

  async function createAppContext() {
    await ensureDomReferences();

    const sourcePreference = global.KaneMapSourceTypes.sourceFromLocation
      ? global.KaneMapSourceTypes.sourceFromLocation(global.location)
      : global.KaneMapSourceTypes.SOURCES.DEMO;
    const dataAdapterFactory = global.KaneMapDataAdapter.createDataAdapterAsync
      || global.KaneMapDataAdapter.createDataAdapter;
    const dataAdapter = await dataAdapterFactory({
      sourcePreference,
      demoCatalog: global.KaneMapDemoCatalog,
      chunkRegistry: global.KaneMapChunkRegistry,
      preparedManifest: global.KaneMapPreparedDataManifest
    });
    const catalog = dataAdapter.getCatalog();
    const sectorDomain = global.KaneMapSectorDomain;
    if (!sectorDomain) throw new Error("Kane-Map sector domain is unavailable.");
    const referenceGrid = global.KaneMapGrid.makeKaneGrid(
      dataAdapter.getBounds(),
      sectorDomain.referenceGrid
    );
    const grid = sectorDomain.restrictGrid(referenceGrid);
    const featureStore = dataAdapter.createFeatureStore();
    const allCellCodes = sectorDomain.sectorCodes();
    const fullInitialData = sectorDomain.restrictAssignedFeatures(
      featureStore.buildDataForCells(allCellCodes)
    );
    const baseMapData = baseMapOnlyData(fullInitialData);
    const allBuildings = fullInitialData.buildings;
    const store = global.KaneMapLocalStore.createLocalObservationStore();
    const canvas = document.getElementById("mapCanvas");
    const layerVisibility = Object.assign({}, DEFAULT_LAYER_VISIBILITY);
    const renderer = global.KaneMapRenderer.createRenderer(canvas, baseMapData, grid);
    renderer.setMapLayerState(layerVisibility, []);
    const totalChunkCount = featureStore.statusForCells(allCellCodes).total;

    const ctx = {
      global,
      dataAdapter,
      dataSource: dataAdapter.describe(),
      catalog,
      grid,
      featureStore,
      allCellCodes,
      allBuildings,
      fullInitialData,
      baseMapData,
      totalChunkCount,
      layerVisibility,
      activeCellCodes: [],
      mutedCellCodes: [],
      activeDetailCells: [],
      mutedDetailCells: [],
      selectedDetailCell: null,
      detailGridCells: [],
      detailGridRows: 16,
      detailGridCols: 16,
      activeFineCells: [],
      mutedFineCells: [],
      selectedFineCell: null,
      fineGridCells: [],
      fineGridRows: 8,
      fineGridCols: 8,
      store,
      canvas,
      renderer,
      designators: global.KaneMapDesignators,
      els: global.KaneMapDomReferences.createDomReferences(),
      selected: { cell: null, building: null },
      visibleCellCodes: [],
      editingRecordId: null,
      shortcutController: null
    };

    ctx.searchIndex = global.KaneMapSearchIndex.createSearchIndex({
      grid,
      buildings: allBuildings,
      getRecords: () => store.snapshot()
    });
    ctx.coverageModel = global.KaneMapCoverage.createCoverageModel({
      grid,
      buildings: allBuildings,
      getRecords: () => store.snapshot()
    });
    ctx.siteIdentityModel = global.KaneMapSiteIdentity.createSiteIdentityModel({
      getRecords: () => store.snapshot()
    });
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

  function ensureDomReferences() {
    if (global.KaneMapDomReferences) return Promise.resolve();

    const src = "src/app/domReferences.js";
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-kane-runtime="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.dataset.kaneRuntime = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function baseMapOnlyData(sourceData) {
    return {
      meta: sourceData.meta,
      roads: [],
      water: [],
      forests: [],
      buildings: [],
      addressPoints: [],
      countyBoundary: Array.isArray(sourceData.countyBoundary) ? sourceData.countyBoundary : []
    };
  }

  global.KaneMapAppContext = { createAppContext };
})(window);
