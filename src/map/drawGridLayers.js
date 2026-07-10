(function attachDrawGridLayers(global) {
  "use strict";

  const FINE_GRID_LABEL_ZOOM = 8.0;

  function drawBackground(ctx, state) {
    const config = global.KaneMapRendererConfig;
    ctx.fillStyle = config.COLORS.background;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawCountyBoundary(ctx, data, worldToScreen) {
    const primitives = global.KaneMapDrawPrimitives;
    const boundaries = Array.isArray(data.countyBoundary) ? data.countyBoundary : [];
    if (!boundaries.length) return;

    ctx.save();
    boundaries.forEach((feature) => {
      primitives.pathPolygon(ctx, worldToScreen, feature.polygon);
      ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 233, 168, 0.95)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawGrid(ctx, state, grid, worldToScreen) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
    const activeCells = new Set(Array.isArray(state.activeCellCodes) ? state.activeCellCodes : []);
    const mutedCells = new Set(Array.isArray(state.mutedCellCodes) ? state.mutedCellCodes : []);

    ctx.save();
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    grid.cells.forEach((cell) => {
      const selected = cell.code === state.selectedCellCode;
      const active = activeCells.has(cell.code);
      const muted = mutedCells.has(cell.code);
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active && !muted) {
        ctx.fillStyle = "rgba(255, 233, 168, 0.08)";
        ctx.fill();
      } else if (muted) {
        ctx.fillStyle = "rgba(90, 96, 101, 0.18)";
        ctx.fill();
      }
      ctx.strokeStyle = muted ? "rgba(160, 168, 176, 0.56)" : selected ? config.COLORS.selected : active ? "rgba(255, 233, 168, 0.82)" : config.COLORS.grid;
      ctx.lineWidth = selected ? 2.4 : active ? 1.8 : muted ? 1.4 : 1;
      ctx.stroke();

      const [x, y] = worldToScreen(cell.center);
      ctx.lineWidth = 4;
      ctx.strokeStyle = config.COLORS.labelHalo;
      ctx.strokeText(cell.code, x, y);
      ctx.fillStyle = muted ? "rgba(180, 188, 196, 0.82)" : active || selected ? config.COLORS.selected : config.COLORS.gridText;
      ctx.fillText(cell.code, x, y);
    });

    ctx.restore();
  }

  function drawInspectionGrid(ctx, state, worldToScreen) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
    const cells = Array.isArray(state.detailGridCells) ? state.detailGridCells : [];
    if (!cells.length) return;

    const activeDetailCells = new Set(Array.isArray(state.activeDetailCellCodes) ? state.activeDetailCellCodes : []);
    const mutedDetailCells = new Set(Array.isArray(state.mutedDetailCellCodes) ? state.mutedDetailCellCodes : []);
    const selectedDetailCellCode = state.selectedDetailCellCode || null;
    const drawLabels = state.zoom >= 5.8;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 10px system-ui, sans-serif";

    cells.forEach((cell) => {
      const active = activeDetailCells.has(cell.code);
      const muted = mutedDetailCells.has(cell.code);
      const selected = selectedDetailCellCode === cell.code;
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active && !muted) {
        ctx.fillStyle = "rgba(89, 168, 255, 0.12)";
        ctx.fill();
      } else if (muted) {
        ctx.fillStyle = "rgba(90, 96, 101, 0.20)";
        ctx.fill();
      }
      ctx.strokeStyle = muted ? "rgba(165, 174, 184, 0.62)" : selected ? "rgba(255, 244, 191, 0.95)" : active ? "rgba(89, 168, 255, 0.82)" : "rgba(120, 190, 255, 0.34)";
      ctx.lineWidth = selected ? 2 : active ? 1.4 : muted ? 1.2 : 0.75;
      ctx.stroke();

      if (drawLabels || selected || active || muted) {
        const [x, y] = worldToScreen(cell.center);
        const label = cellLabel(cell);
        ctx.lineWidth = 3;
        ctx.strokeStyle = config.COLORS.labelHalo;
        ctx.strokeText(label, x, y);
        ctx.fillStyle = muted ? "rgba(185, 192, 200, 0.9)" : selected || active ? "#fff4bf" : "rgba(174, 213, 255, 0.9)";
        ctx.fillText(label, x, y);
      }
    });

    ctx.restore();
  }

  function drawFineGrid(ctx, state, worldToScreen) {
    const config = global.KaneMapRendererConfig;
    const primitives = global.KaneMapDrawPrimitives;
    const cells = Array.isArray(state.fineGridCells) ? state.fineGridCells : [];
    if (!cells.length) return;

    const activeFineCells = new Set(Array.isArray(state.activeFineCellCodes) ? state.activeFineCellCodes : []);
    const mutedFineCells = new Set(Array.isArray(state.mutedFineCellCodes) ? state.mutedFineCellCodes : []);
    const selectedFineCellCode = state.selectedFineCellCode || null;
    const drawLabels = state.zoom >= FINE_GRID_LABEL_ZOOM;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 9px system-ui, sans-serif";

    cells.forEach((cell) => {
      const active = activeFineCells.has(cell.code);
      const muted = mutedFineCells.has(cell.code);
      const selected = selectedFineCellCode === cell.code;
      primitives.pathPolygon(ctx, worldToScreen, cell.polygon);
      if (active && !muted) {
        ctx.fillStyle = "rgba(255, 233, 168, 0.11)";
        ctx.fill();
      } else if (muted) {
        ctx.fillStyle = "rgba(92, 98, 104, 0.24)";
        ctx.fill();
      }
      ctx.strokeStyle = muted ? "rgba(178, 186, 194, 0.72)" : selected ? "rgba(255, 244, 191, 0.98)" : active ? "rgba(255, 233, 168, 0.86)" : "rgba(170, 215, 255, 0.28)";
      ctx.lineWidth = selected ? 1.7 : active ? 1.1 : muted ? 1.0 : 0.55;
      ctx.stroke();

      if (drawLabels || selected || active || muted) {
        const [x, y] = worldToScreen(cell.center);
        const label = cellLabel(cell);
        ctx.lineWidth = 3;
        ctx.strokeStyle = config.COLORS.labelHalo;
        ctx.strokeText(label, x, y);
        ctx.fillStyle = muted ? "rgba(190, 198, 206, 0.92)" : selected || active ? "#fff4bf" : "rgba(190, 225, 255, 0.9)";
        ctx.fillText(label, x, y);
      }
    });

    ctx.restore();
  }

  function cellLabel(cell) {
    const row = Number.isFinite(cell.row) ? cell.row + 1 : "?";
    const col = Number.isFinite(cell.col) ? cell.col + 1 : "?";
    return `${row}-${col}`;
  }

  global.KaneMapDrawGridLayers = {
    drawBackground,
    drawCountyBoundary,
    drawGrid,
    drawInspectionGrid,
    drawFineGrid
  };
})(window);
