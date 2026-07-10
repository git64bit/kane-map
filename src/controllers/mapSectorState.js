(function kaneMapMapSectorState(global) {
  "use strict";

  function toggleMainMute(ctx, cell) {
    if (!cell || !cell.code) return;
    if (mainCellMuted(ctx, cell.code)) {
      ctx.mutedCellCodes = ctx.mutedCellCodes.filter((code) => code !== cell.code);
      return;
    }
    ctx.mutedCellCodes = uniqueStrings(ctx.mutedCellCodes.concat(cell.code));
    ctx.activeCellCodes = ctx.activeCellCodes.filter((code) => code !== cell.code);
    ctx.activeDetailCells = ctx.activeDetailCells.filter((candidate) => candidate.parentCode !== cell.code);
    ctx.activeFineCells = ctx.activeFineCells.filter((candidate) => candidate.parentCode !== cell.code);
  }

  function toggleDetailMute(ctx, cell) {
    if (!cell || !cell.code) return;
    if (cellListHasCode(ctx.mutedDetailCells, cell.code)) {
      ctx.mutedDetailCells = removeCellByCode(ctx.mutedDetailCells, cell.code);
      return;
    }
    ctx.mutedDetailCells = addUniqueCell(ctx.mutedDetailCells, cell);
    ctx.activeDetailCells = removeCellByCode(ctx.activeDetailCells, cell.code);
    ctx.activeFineCells = ctx.activeFineCells.filter((candidate) => candidate.detailParentCode !== cell.code);
  }

  function toggleFineMute(ctx, cell) {
    if (!cell || !cell.code) return;
    if (cellListHasCode(ctx.mutedFineCells, cell.code)) {
      ctx.mutedFineCells = removeCellByCode(ctx.mutedFineCells, cell.code);
      return;
    }
    ctx.mutedFineCells = addUniqueCell(ctx.mutedFineCells, cell);
    ctx.activeFineCells = removeCellByCode(ctx.activeFineCells, cell.code);
  }

  function addUniqueCell(cells, cell) {
    const output = removeCellByCode(cells, cell.code);
    output.push(cell);
    return output;
  }

  function removeCellByCode(cells, code) {
    return (Array.isArray(cells) ? cells : []).filter((cell) => cell && cell.code !== code);
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value)));
  }

  function activeCellsForCodes(grid, cellCodes) {
    const wanted = new Set(Array.isArray(cellCodes) ? cellCodes : []);
    if (!wanted.size || !grid || !Array.isArray(grid.cells)) return [];
    return grid.cells.filter((cell) => wanted.has(cell.code));
  }

  function activeDataCellCodes(ctx) {
    const codes = new Set(effectiveMainCellCodes(ctx));
    effectiveDetailCells(ctx).forEach((cell) => {
      if (cell.parentCode) codes.add(cell.parentCode);
    });
    effectiveFineCells(ctx).forEach((cell) => {
      if (cell.parentCode) codes.add(cell.parentCode);
    });
    if (ctx.selectedDetailCell && !detailCellMuted(ctx, ctx.selectedDetailCell)) codes.add(ctx.selectedDetailCell.parentCode);
    if (ctx.selectedFineCell && !fineCellMuted(ctx, ctx.selectedFineCell)) codes.add(ctx.selectedFineCell.parentCode);
    return Array.from(codes);
  }

  function effectiveMainCellCodes(ctx) {
    const muted = new Set(Array.isArray(ctx.mutedCellCodes) ? ctx.mutedCellCodes : []);
    return (Array.isArray(ctx.activeCellCodes) ? ctx.activeCellCodes : []).filter((code) => !muted.has(code));
  }

  function effectiveDetailCells(ctx) {
    return (Array.isArray(ctx.activeDetailCells) ? ctx.activeDetailCells : []).filter((cell) => !detailCellMuted(ctx, cell));
  }

  function effectiveFineCells(ctx) {
    return (Array.isArray(ctx.activeFineCells) ? ctx.activeFineCells : []).filter((cell) => !fineCellMuted(ctx, cell));
  }

  function activeAreaClipCells(ctx, activeCells) {
    const fineCells = effectiveFineCells(ctx);
    const selectedFine = ctx.selectedFineCell && !fineCellMuted(ctx, ctx.selectedFineCell) ? ctx.selectedFineCell : null;
    if (fineCells.length) return fineCells;
    if (selectedFine) return [selectedFine];
    if (fineModeActive(ctx)) return [];

    const detailCells = effectiveDetailCells(ctx);
    const selectedDetail = ctx.selectedDetailCell && !detailCellMuted(ctx, ctx.selectedDetailCell) ? ctx.selectedDetailCell : null;
    if (detailCells.length) return detailCells;
    if (selectedDetail) return [selectedDetail];
    if (detailModeActive(ctx)) return [];

    return activeCells.filter((cell) => !mainCellMuted(ctx, cell.code));
  }

  function activeDetailClipCells(ctx) {
    const fineCells = effectiveFineCells(ctx);
    const selectedFine = ctx.selectedFineCell && !fineCellMuted(ctx, ctx.selectedFineCell) ? ctx.selectedFineCell : null;
    if (fineCells.length) return fineCells;
    if (selectedFine) return [selectedFine];
    return [];
  }

  function fineModeActive(ctx) {
    return Boolean((ctx.activeFineCells && ctx.activeFineCells.length) ||
      (ctx.mutedFineCells && ctx.mutedFineCells.length) ||
      ctx.selectedFineCell);
  }

  function detailModeActive(ctx) {
    return Boolean((ctx.activeDetailCells && ctx.activeDetailCells.length) ||
      (ctx.mutedDetailCells && ctx.mutedDetailCells.length) ||
      ctx.selectedDetailCell);
  }

  function mainCellMuted(ctx, code) {
    return Boolean(code && Array.isArray(ctx.mutedCellCodes) && ctx.mutedCellCodes.includes(code));
  }

  function detailCellMuted(ctx, cell) {
    if (!cell) return false;
    if (mainCellMuted(ctx, cell.parentCode)) return true;
    return cellListHasCode(ctx.mutedDetailCells, cell.code);
  }

  function fineCellMuted(ctx, cell) {
    if (!cell) return false;
    if (mainCellMuted(ctx, cell.parentCode)) return true;
    if (cell.detailParentCode && cellListHasCode(ctx.mutedDetailCells, cell.detailParentCode)) return true;
    return cellListHasCode(ctx.mutedFineCells, cell.code);
  }

  function cellListHasCode(cells, code) {
    return Boolean(code && Array.isArray(cells) && cells.some((cell) => cell && cell.code === code));
  }

  function mutedSectorCount(ctx) {
    return (ctx.mutedCellCodes ? ctx.mutedCellCodes.length : 0) +
      (ctx.mutedDetailCells ? ctx.mutedDetailCells.length : 0) +
      (ctx.mutedFineCells ? ctx.mutedFineCells.length : 0);
  }

  function selectedSectorIsMuted(ctx) {
    if (ctx.selectedFineCell) return fineCellMuted(ctx, ctx.selectedFineCell);
    if (ctx.selectedDetailCell) return detailCellMuted(ctx, ctx.selectedDetailCell);
    if (ctx.selected.cell) return mainCellMuted(ctx, ctx.selected.cell.code);
    return false;
  }

  global.KaneMapMapSectorState = {
    toggleMainMute,
    toggleDetailMute,
    toggleFineMute,
    activeCellsForCodes,
    activeDataCellCodes,
    effectiveMainCellCodes,
    effectiveDetailCells,
    effectiveFineCells,
    activeAreaClipCells,
    activeDetailClipCells,
    mutedSectorCount,
    selectedSectorIsMuted
  };
})(window);
