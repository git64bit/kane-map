(function kaneMapMapSectorSupport(global) {
  "use strict";

  const INSPECTION_GRID_ROWS = 16;
  const INSPECTION_GRID_COLS = 16;
  const FINE_GRID_ROWS = 8;
  const FINE_GRID_COLS = 8;

  const LAYER_SPECS = Object.freeze([
    { key: "roads", label: "Roads" },
    { key: "water", label: "Water" },
    { key: "buildings", label: "Building shapes" },
    { key: "addressPoints", label: "Address points" },
    { key: "labels", label: "Labels" }
  ]);

  function installLayerControls(ctx) {
    if (ctx.els.layerControlPanel) return;
    const section = ctx.els.zoomIn ? ctx.els.zoomIn.closest(".section") : null;
    if (!section) return;

    const panel = document.createElement("div");
    panel.className = "section map-layer-controls";
    panel.innerHTML = [
      `<h2>Detail layers</h2>`,
      `<p class="muted">Base view always shows county outline and Kane grid. Click a grid cell for its 16×16 area grid, then click an area cell for an 8×8 practical grid. Shift-click or use Mute selected sector to turn irrelevant sectors off.</p>`,
      `<div class="button-grid">`,
      `<button id="activateVisibleCells" type="button" class="secondary">Add visible cells</button>`,
      `<button id="clearInspectionCells" type="button" class="secondary">Clear inspection cells</button>`,
      `<button id="clearActiveCells" type="button" class="secondary">Clear active cells</button>`,
      `<button id="muteSelectedSector" type="button" class="secondary">Mute selected sector</button>`,
      `<button id="clearMutedSectors" type="button" class="secondary">Clear muted sectors</button>`,
      `</div>`,
      `<div class="layer-toggle-list">`,
      LAYER_SPECS.map((spec) => `
        <label class="layer-toggle-row">
          <input type="checkbox" data-map-layer="${spec.key}" /> ${spec.label}
        </label>
      `).join(""),
      `</div>`,
      `<div id="activeCellSummary" class="summary-box">Active cells: none</div>`
    ].join("");

    section.insertAdjacentElement("afterend", panel);
    ctx.els.layerControlPanel = panel;
    ctx.els.activeCellSummary = panel.querySelector("#activeCellSummary");
    ctx.els.activateVisibleCells = panel.querySelector("#activateVisibleCells");
    ctx.els.clearInspectionCells = panel.querySelector("#clearInspectionCells");
    ctx.els.clearActiveCells = panel.querySelector("#clearActiveCells");
    ctx.els.muteSelectedSector = panel.querySelector("#muteSelectedSector");
    ctx.els.clearMutedSectors = panel.querySelector("#clearMutedSectors");
    ctx.els.layerToggles = Array.from(panel.querySelectorAll("input[data-map-layer]"));

    ctx.els.activateVisibleCells.addEventListener("click", ctx.activateVisibleCells);
    ctx.els.clearInspectionCells.addEventListener("click", ctx.clearInspectionCells);
    ctx.els.clearActiveCells.addEventListener("click", ctx.clearActiveCells);
    ctx.els.muteSelectedSector.addEventListener("click", ctx.toggleSelectedSectorMuted);
    ctx.els.clearMutedSectors.addEventListener("click", ctx.clearMutedSectors);
    ctx.els.layerToggles.forEach((input) => {
      const key = input.getAttribute("data-map-layer");
      input.checked = Boolean(ctx.layerVisibility[key]);
      input.addEventListener("change", () => {
        ctx.layerVisibility[key] = input.checked;
        ctx.refreshMapData();
        ctx.updateViewAndChunkStatus();
      });
    });
  }

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
    const points = featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = boundsForPoints(points);
    const target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
    return makeInspectionGrid(parentCell, rows, cols).find((cell) => pointInCell(target, cell)) || null;
  }

  function fineCellForFeature(detailCell, feature, rows, cols, geometryKey) {
    const points = featurePoints(feature, geometryKey);
    if (!points.length) return null;
    const bounds = boundsForPoints(points);
    const target = [
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2
    ];
    return makeFineGrid(detailCell, rows, cols).find((cell) => pointInCell(target, cell)) || null;
  }

  function filterFeaturesByActiveCells(features, activeCells, geometryKey) {
    const input = Array.isArray(features) ? features : [];
    if (!input.length || !activeCells.length) return [];
    const activeCodes = new Set(activeCells.map((cell) => cell.code));
    return input.filter((feature) => featureBelongsToActiveCells(feature, activeCells, activeCodes, geometryKey));
  }

  function featureBelongsToActiveCells(feature, activeCells, activeCodes, geometryKey) {
    if (!feature) return false;

    const declaredCells = featureCellCodes(feature);
    if (declaredCells.length && declaredCells.some((code) => activeCodes.has(code))) return true;

    const points = featurePoints(feature, geometryKey);
    if (!points.length) return false;

    if (points.some((point) => activeCells.some((cell) => pointInCell(point, cell)))) return true;

    const bounds = boundsForPoints(points);
    return activeCells.some((cell) => boundsIntersect(bounds, cell));
  }

  function featureCellCodes(feature) {
    const output = [];
    [feature.cell, feature.cellCode, feature.gridCell, feature.grid_cell].forEach((code) => {
      if (typeof code === "string" && code) output.push(code);
    });
    if (Array.isArray(feature.cells)) {
      feature.cells.forEach((code) => {
        if (typeof code === "string" && code) output.push(code);
      });
    }
    return output;
  }

  function featurePoints(feature, geometryKey) {
    if (geometryKey === "point" && Array.isArray(feature.point)) return [feature.point];
    if (geometryKey === "path" && Array.isArray(feature.path)) return feature.path;
    if (geometryKey === "polygon" && Array.isArray(feature.polygon)) return feature.polygon;
    return [];
  }

  function pointInCell(point, cell) {
    return Array.isArray(point) && point.length >= 2 &&
      point[0] >= cell.minX && point[0] <= cell.maxX &&
      point[1] >= cell.minY && point[1] <= cell.maxY;
  }

  function boundsForPoints(points) {
    return points.reduce((bounds, point) => ({
      minX: Math.min(bounds.minX, point[0]),
      minY: Math.min(bounds.minY, point[1]),
      maxX: Math.max(bounds.maxX, point[0]),
      maxY: Math.max(bounds.maxY, point[1])
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  }

  function boundsIntersect(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
  }

  function polygonCenter(polygon) {
    if (!Array.isArray(polygon) || !polygon.length) return null;
    const xs = polygon.map((point) => point[0]);
    const ys = polygon.map((point) => point[1]);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2
    ];
  }


  global.KaneMapMapSectorSupport = {
    installLayerControls,
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
    filterFeaturesByActiveCells,
    featureBelongsToActiveCells,
    polygonCenter
  };
})(window);
