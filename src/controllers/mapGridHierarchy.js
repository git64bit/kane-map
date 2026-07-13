(function kaneMapMapGridHierarchy(global) {
  "use strict";

  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;
  const FINE_GRID_ROWS = 8;
  const FINE_GRID_COLS = 8;
  const geometry = global.KaneMapMapGeometrySupport;

  function detailGridCellsForDisplay(ctx) {
    const parentCode = selectedParentCode(ctx);
    if (!parentCode) return [];

    const parentCell = ctx.cellForCode(parentCode);
    if (!parentCell) return [];

    return makeInspectionGrid(
      parentCell,
      ctx.detailGridRows || INSPECTION_GRID_ROWS,
      ctx.detailGridCols || INSPECTION_GRID_COLS
    );
  }

  function fineGridCellsForDisplay(ctx) {
    const detailCell = selectedDetailForDisplay(ctx);
    if (!detailCell) return [];

    return makeFineGrid(
      detailCell,
      ctx.fineGridRows || FINE_GRID_ROWS,
      ctx.fineGridCols || FINE_GRID_COLS
    );
  }

  function selectedParentCode(ctx) {
    if (ctx.selectedFineCell && ctx.selectedFineCell.parentCode) {
      return ctx.selectedFineCell.parentCode;
    }
    if (ctx.selectedDetailCell && ctx.selectedDetailCell.parentCode) {
      return ctx.selectedDetailCell.parentCode;
    }
    if (ctx.selected && ctx.selected.cell && ctx.selected.cell.code) {
      return ctx.selected.cell.code;
    }
    return null;
  }

  function selectedDetailForDisplay(ctx) {
    if (ctx.selectedFineCell && ctx.selectedFineCell.detailParentCode) {
      return detailCellByCode(ctx, ctx.selectedFineCell.detailParentCode);
    }
    return ctx.selectedDetailCell || null;
  }

  function detailCellByCode(ctx, code) {
    if (!code || typeof code !== "string") return null;
    const parsed = parseDetailCellCode(code);
    if (!parsed) return null;

    const parentCell = ctx.cellForCode(parsed.parentCode);
    if (!parentCell) return null;

    return makeInspectionGrid(
      parentCell,
      ctx.detailGridRows || INSPECTION_GRID_ROWS,
      ctx.detailGridCols || INSPECTION_GRID_COLS
    ).find((cell) => cell.code === code) || null;
  }

  function parseDetailCellCode(code) {
    const match = code.match(/^(.*):r(\d{2})c(\d{2})$/);
    if (!match) return null;
    return {
      parentCode: match[1],
      row: Number(match[2]) - 1,
      col: Number(match[3]) - 1
    };
  }

  function makeInspectionGrid(parentCell, rows, cols) {
    return makeChildGrid(parentCell, rows, cols, (row, col, bounds) => ({
      code: `${parentCell.code}:r${pad2(row + 1)}c${pad2(col + 1)}`,
      parentCode: parentCell.code,
      level: "inspection",
      row,
      col,
      ...bounds
    }));
  }

  function makeFineGrid(detailCell, rows, cols) {
    return makeChildGrid(detailCell, rows, cols, (row, col, bounds) => ({
      code: `${detailCell.code}:f${pad2(row + 1)}c${pad2(col + 1)}`,
      parentCode: detailCell.parentCode,
      detailParentCode: detailCell.code,
      level: "practical",
      row,
      col,
      ...bounds
    }));
  }

  function makeChildGrid(parentCell, rows, cols, createCell) {
    const cells = [];
    const width = (parentCell.maxX - parentCell.minX) / cols;
    const height = (parentCell.maxY - parentCell.minY) / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const minX = parentCell.minX + col * width;
        const maxX = col === cols - 1 ? parentCell.maxX : minX + width;
        const minY = parentCell.minY + row * height;
        const maxY = row === rows - 1 ? parentCell.maxY : minY + height;
        const bounds = {
          minX,
          minY,
          maxX,
          maxY,
          center: [(minX + maxX) / 2, (minY + maxY) / 2],
          polygon: [
            [minX, minY],
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY]
          ]
        };
        cells.push(createCell(row, col, bounds));
      }
    }

    return cells;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function detailCellForFeature(parentCell, feature, rows, cols, geometryKey) {
    const target = featureCenter(feature, geometryKey);
    if (!target) return null;
    return makeInspectionGrid(parentCell, rows, cols)
      .find((cell) => geometry.pointInCell(target, cell)) || null;
  }

  function fineCellForFeature(detailCell, feature, rows, cols, geometryKey) {
    const target = featureCenter(feature, geometryKey);
    if (!target) return null;
    return makeFineGrid(detailCell, rows, cols)
      .find((cell) => geometry.pointInCell(target, cell)) || null;
  }

  function featureCenter(feature, geometryKey) {
    const points = geometry.featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = geometry.boundsForPoints(points);
    return [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
  }

  global.KaneMapMapGridHierarchy = {
    detailGridCellsForDisplay,
    fineGridCellsForDisplay,
    detailCellByCode,
    detailCellForFeature,
    fineCellForFeature
  };
})(window);
