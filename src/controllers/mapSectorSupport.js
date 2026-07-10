(function kaneMapMapSectorSupport(global) {
  "use strict";

  const controls = global.KaneMapMapSectorControls;
  const geometry = global.KaneMapMapGeometrySupport;
  const sectorState = global.KaneMapMapSectorState;
  const gridHierarchy = global.KaneMapMapGridHierarchy;

  global.KaneMapMapSectorSupport = {
    installLayerControls: controls.installLayerControls,
    toggleMainMute: sectorState.toggleMainMute,
    toggleDetailMute: sectorState.toggleDetailMute,
    toggleFineMute: sectorState.toggleFineMute,
    activeCellsForCodes: sectorState.activeCellsForCodes,
    activeDataCellCodes: sectorState.activeDataCellCodes,
    effectiveMainCellCodes: sectorState.effectiveMainCellCodes,
    effectiveDetailCells: sectorState.effectiveDetailCells,
    effectiveFineCells: sectorState.effectiveFineCells,
    activeAreaClipCells: sectorState.activeAreaClipCells,
    activeDetailClipCells: sectorState.activeDetailClipCells,
    mutedSectorCount: sectorState.mutedSectorCount,
    selectedSectorIsMuted: sectorState.selectedSectorIsMuted,
    detailGridCellsForDisplay: gridHierarchy.detailGridCellsForDisplay,
    fineGridCellsForDisplay: gridHierarchy.fineGridCellsForDisplay,
    detailCellByCode: gridHierarchy.detailCellByCode,
    detailCellForFeature: gridHierarchy.detailCellForFeature,
    fineCellForFeature: gridHierarchy.fineCellForFeature,
    filterFeaturesByActiveCells: geometry.filterFeaturesByActiveCells,
    featureBelongsToActiveCells: geometry.featureBelongsToActiveCells,
    polygonCenter: geometry.polygonCenter
  };
})(window);
