(function attachDrawLayerSupport(global) {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clipToActiveCells(ctx, state, grid, worldToScreen) {
    const activeCells = activeClipCells(state, grid);
    if (!activeCells.length) return false;

    ctx.beginPath();
    activeCells.forEach((cell) => {
      const polygon = cell.polygon || [];
      if (!polygon.length) return;

      const first = worldToScreen(polygon[0]);
      ctx.moveTo(first[0], first[1]);

      for (let i = 1; i < polygon.length; i += 1) {
        const point = worldToScreen(polygon[i]);
        ctx.lineTo(point[0], point[1]);
      }

      ctx.closePath();
    });

    ctx.clip();
    return true;
  }

  function activeClipCells(state, grid) {
    const mutedMainCodes = new Set(Array.isArray(state.mutedCellCodes) ? state.mutedCellCodes : []);
    const mutedDetailCodes = new Set(Array.isArray(state.mutedDetailCellCodes) ? state.mutedDetailCellCodes : []);
    const mutedFineCodes = new Set(Array.isArray(state.mutedFineCellCodes) ? state.mutedFineCellCodes : []);

    const activeFineCells = Array.isArray(state.activeFineCells) ? state.activeFineCells : [];
    const unmutedFineCells = activeFineCells.filter((cell) => (
      !mutedMainCodes.has(cell.parentCode) &&
      !mutedDetailCodes.has(cell.detailParentCode) &&
      !mutedFineCodes.has(cell.code)
    ));

    if (unmutedFineCells.length || activeFineCells.length || mutedFineCodes.size) {
      return unmutedFineCells;
    }

    if (Array.isArray(state.fineGridCells) && state.fineGridCells.length) {
      return [];
    }

    const activeDetailCells = Array.isArray(state.activeDetailCells) ? state.activeDetailCells : [];
    const unmutedDetailCells = activeDetailCells.filter((cell) => (
      !mutedMainCodes.has(cell.parentCode) &&
      !mutedDetailCodes.has(cell.code)
    ));

    if (unmutedDetailCells.length || activeDetailCells.length || mutedDetailCodes.size) {
      return unmutedDetailCells;
    }

    const activeCodes = new Set(Array.isArray(state.activeCellCodes) ? state.activeCellCodes : []);
    if (!activeCodes.size || !grid || !Array.isArray(grid.cells)) return [];

    return grid.cells.filter((cell) => (
      activeCodes.has(cell.code) &&
      !mutedMainCodes.has(cell.code)
    ));
  }

  global.KaneMapDrawLayerSupport = {
    clamp,
    clipToActiveCells,
    activeClipCells
  };
})(window);
