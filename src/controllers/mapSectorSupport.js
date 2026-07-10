(function kaneMapMapSectorSupport(global) {
  "use strict";

  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;
  const FINE_GRID_ROWS = 8;
  const FINE_GRID_COLS = 8;

  const controls = global.KaneMapMapSectorControls;
  const geometry = global.KaneMapMapGeometrySupport;

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
    return Boolean((ctx.activeFineCells && ctx.activeFineCells.length) || (ctx.mutedFineCells && ctx.mutedFineCells.length) || ctx.selectedFineCell);
  }

  function detailModeActive(ctx) {
    return Boolean((ctx.activeDetailCells && ctx.activeDetailCells.length) || (ctx.mutedDetailCells && ctx.mutedDetailCells.length) || ctx.selectedDetailCell);
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

  function detailGridCellsForDisplay(ctx) {
    const parentCodes = new Set();
    if (ctx.selected && ctx.selected.cell) parentCodes.add(ctx.selected.cell.code);
    ctx.activeDetailCells.forEach((cell) => parentCodes.add(cell.parentCode));
    ctx.mutedDetailCells.forEach((cell) => parentCodes.add(cell.parentCode));
    ctx.activeFineCells.forEach((cell) => parentCodes.add(cell.parentCode));
    ctx.mutedFineCells.forEach((cell) => parentCodes.add(cell.parentCode));
    if (ctx.selectedDetailCell) parentCodes.add(ctx.selectedDetailCell.parentCode);
    if (ctx.selectedFineCell) parentCodes.add(ctx.selectedFineCell.parentCode);
    return Array.from(parentCodes)
      .map((code) => ctx.cellForCode(code))
      .filter(Boolean)
      .flatMap((cell) => makeInspectionGrid(cell, ctx.detailGridRows || INSPECTION_GRID_ROWS, ctx.detailGridCols || INSPECTION_GRID_COLS));
  }

  function fineGridCellsForDisplay(ctx) {
    const detailCodes = new Set();
    if (ctx.selectedDetailCell) detailCodes.add(ctx.selectedDetailCell.code);
    if (ctx.selectedFineCell && ctx.selectedFineCell.detailParentCode) detailCodes.add(ctx.selectedFineCell.detailParentCode);
    ctx.activeFineCells.forEach((cell) => {
      if (cell.detailParentCode) detailCodes.add(cell.detailParentCode);
    });
    ctx.mutedFineCells.forEach((cell) => {
      if (cell.detailParentCode) detailCodes.add(cell.detailParentCode);
    });
    return Array.from(detailCodes)
      .map((code) => detailCellByCode(ctx, code))
      .filter(Boolean)
      .flatMap((cell) => makeFineGrid(cell, ctx.fineGridRows || FINE_GRID_ROWS, ctx.fineGridCols || FINE_GRID_COLS));
  }

  function detailCellByCode(ctx, code) {
    if (!code || typeof code !== "string") return null;
    const parsed = parseDetailCellCode(code);
    if (!parsed) return null;
    const parentCell = ctx.cellForCode(parsed.parentCode);
    if (!parentCell) return null;
    return makeInspectionGrid(parentCell, ctx.detailGridRows || INSPECTION_GRID_ROWS, ctx.detailGridCols || INSPECTION_GRID_COLS)
      .find((cell) => cell.code === code) || null;
  }

  function parseDetailCellCode(code) {
    const match = code.match(/^(.*):r(\d{2})c(\d{2})$/);
    if (!match) return null;
    return { parentCode: match[1], row: Number(match[2]) - 1, col: Number(match[3]) - 1 };
  }

  function makeInspectionGrid(parentCell, rows, cols) {
    const cells = [];
    const width = (parentCell.maxX - parentCell.minX) / cols;
    const height = (parentCell.maxY - parentCell.minY) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const minX = parentCell.minX + col * width;
        const maxX = col === cols - 1 ? parentCell.maxX : minX + width;
        const minY = parentCell.minY + row * height;
        const maxY = row === rows - 1 ? parentCell.maxY : minY + height;
        cells.push({
          code: `${parentCell.code}:r${pad2(row + 1)}c${pad2(col + 1)}`,
          parentCode: parentCell.code,
          level: "inspection",
          row,
          col,
          minX,
          minY,
          maxX,
          maxY,
          center: [(minX + maxX) / 2, (minY + maxY) / 2],
          polygon: [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]
        });
      }
    }
    return cells;
  }

  function makeFineGrid(detailCell, rows, cols) {
    const cells = [];
    const width = (detailCell.maxX - detailCell.minX) / cols;
    const height = (detailCell.maxY - detailCell.minY) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const minX = detailCell.minX + col * width;
        const maxX = col === cols - 1 ? detailCell.maxX : minX + width;
        const minY = detailCell.minY + row * height;
        const maxY = row === rows - 1 ? detailCell.maxY : minY + height;
        cells.push({
          code: `${detailCell.code}:f${pad2(row + 1)}c${pad2(col + 1)}`,
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
        });
      }
    }
    return cells;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function shortDetailCellCode(cell) {
    return cell && cell.code ? cell.code.replace(":r", ":").replace("c", "-") : "";
  }

  function shortFineCellCode(cell) {
    if (!cell || !cell.code) return "";
    return cell.code.replace(":r", ":").replace("c", "-").replace(":f", "→").replace("c", "-");
  }

  function detailCellForFeature(parentCell, feature, rows, cols, geometryKey) {
    const points = geometry.featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = geometry.boundsForPoints(points);
    const target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
    return makeInspectionGrid(parentCell, rows, cols).find((cell) => geometry.pointInCell(target, cell)) || null;
  }

  function fineCellForFeature(detailCell, feature, rows, cols, geometryKey) {
    const points = geometry.featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = geometry.boundsForPoints(points);
    const target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
    return makeFineGrid(detailCell, rows, cols).find((cell) => geometry.pointInCell(target, cell)) || null;
  }



  global.KaneMapMapSectorSupport = {
    installLayerControls: controls.installLayerControls,
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
    selectedSectorIsMuted,
    detailGridCellsForDisplay,
    fineGridCellsForDisplay,
    detailCellByCode,
    shortDetailCellCode,
    shortFineCellCode,
    detailCellForFeature,
    fineCellForFeature,
    filterFeaturesByActiveCells: geometry.filterFeaturesByActiveCells,
    featureBelongsToActiveCells: geometry.featureBelongsToActiveCells,
    polygonCenter: geometry.polygonCenter
  };
})(window);
