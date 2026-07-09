(function attachRenderer(global) {
  "use strict";

  const viewport = global.KaneMapViewport;
  const drawLayers = global.KaneMapDrawLayers;
  const hitTester = global.KaneMapHitTest;
  const primitives = global.KaneMapDrawPrimitives;

  function createRenderer(canvas, initialData, grid) {
    const ctx = canvas.getContext("2d");
    const bounds = initialData.meta.bounds;
    let data = initialData;
    const state = {
      width: 0,
      height: 0,
      zoom: 0.72,
      bearing: -18,
      pitchScale: 0.76,
      offsetX: 0,
      offsetY: 18,
      selectedBuildingId: null,
      selectedCellCode: null,
      selectedDetailCellCode: null,
      activeCellCodes: [],
      activeDetailCellCodes: [],
      activeDetailCells: [],
      detailGridCells: [],
      layerVisibility: {
        roads: false,
        water: false,
        forests: false,
        buildings: false,
        addressPoints: false,
        labels: false
      },
      recordSummaryByBuilding: {},
      buildingFilterIds: null,
      dragging: false,
      lastPointer: null
    };

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      state.width = Math.max(1, Math.floor(rect.width));
      state.height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(state.width * ratio);
      canvas.height = Math.floor(state.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      render();
    }

    function render() {
      if (!ctx) return;
      drawLayers.drawMap(ctx, state, bounds, data, grid);
    }

    function setData(nextData) {
      data = nextData;
      render();
    }

    function setMapLayerState(layerVisibility, activeCellCodes, detailState) {
      const detail = detailState || {};
      state.layerVisibility = Object.assign({}, state.layerVisibility, layerVisibility || {});
      state.activeCellCodes = Array.isArray(activeCellCodes) ? activeCellCodes.slice() : [];
      state.activeDetailCells = Array.isArray(detail.activeDetailCells) ? detail.activeDetailCells.slice() : [];
      state.activeDetailCellCodes = state.activeDetailCells.map((cell) => cell.code);
      state.detailGridCells = Array.isArray(detail.detailGridCells) ? detail.detailGridCells.slice() : [];
      state.selectedDetailCellCode = detail.selectedDetailCell ? detail.selectedDetailCell.code : null;
      render();
    }

    function visibleWorldBounds() {
      return viewport.visibleWorldBounds(state, bounds);
    }

    function centerOnWorldPoint(point) {
      viewport.centerOnWorldPoint(state, bounds, point);
      render();
    }

    function centerOnPolygon(polygon) {
      centerOnWorldPoint(primitives.centroid(polygon));
    }

    function zoomBy(factor) {
      viewport.zoomBy(state, factor);
      render();
    }

    function rotateBy(degrees) {
      viewport.rotateBy(state, degrees);
      render();
    }

    function resetView() {
      viewport.resetView(state);
      render();
    }

    function setSelected(building, cell, detailCell) {
      state.selectedBuildingId = building ? building.id : null;
      state.selectedCellCode = cell ? cell.code : null;
      state.selectedDetailCellCode = detailCell ? detailCell.code : null;
      render();
    }

    function setBuildingRecordSummary(summaryByBuilding) {
      state.recordSummaryByBuilding = summaryByBuilding || {};
      render();
    }

    function setBuildingFilter(buildingIds) {
      state.buildingFilterIds = Array.isArray(buildingIds) ? new Set(buildingIds) : null;
      render();
    }

    function hitTest(screenPoint) {
      return hitTester.hitTest(data, grid, state, bounds, screenPoint);
    }

    function beginDrag(point) {
      state.dragging = true;
      state.lastPointer = point;
      canvas.classList.add("dragging");
    }

    function dragTo(point) {
      if (!state.dragging || !state.lastPointer) return;
      state.offsetX += point[0] - state.lastPointer[0];
      state.offsetY += point[1] - state.lastPointer[1];
      state.lastPointer = point;
      render();
    }

    function endDrag() {
      state.dragging = false;
      state.lastPointer = null;
      canvas.classList.remove("dragging");
    }

    return {
      state,
      resize,
      render,
      setData,
      setMapLayerState,
      visibleWorldBounds,
      zoomBy,
      rotateBy,
      resetView,
      setSelected,
      setBuildingRecordSummary,
      setBuildingFilter,
      centerOnWorldPoint,
      centerOnPolygon,
      hitTest,
      beginDrag,
      dragTo,
      endDrag
    };
  }

  global.KaneMapRenderer = { createRenderer };
})(window);
