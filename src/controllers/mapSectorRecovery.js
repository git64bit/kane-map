(function kaneMapMapSectorRecovery(global) {
  "use strict";

  function installMapSectorRecovery(ctx) {
    const bindMapControlEvents = ctx.bindMapControlEvents;
    const updateLayerControlStatus = ctx.updateLayerControlStatus;

    ctx.returnSelectedFineCellToUndiscovered = function returnSelectedFineCellToUndiscovered() {
      const fineCell = ctx.selectedFineCell;
      if (!fineCell || !fineCell.code) return;

      ctx.activeFineCells = removeCellByCode(ctx.activeFineCells, fineCell.code);
      ctx.mutedFineCells = removeCellByCode(ctx.mutedFineCells, fineCell.code);
      ctx.selectedFineCell = null;
      ctx.selected = {
        cell: ctx.selected.cell,
        building: null
      };

      ctx.renderer.setSelected(
        null,
        ctx.selected.cell,
        ctx.selectedDetailCell,
        null
      );

      ctx.refreshMapData();
      ctx.updateSelectedPanel();
      ctx.updateRecordPanel();
      ctx.updateViewAndChunkStatus();
    };

    ctx.bindMapControlEvents = function bindMapControlEventsWithRecovery() {
      bindMapControlEvents();
      installRecoveryControl(ctx);
      ctx.updateLayerControlStatus();
    };

    ctx.updateLayerControlStatus = function updateLayerControlStatusWithRecovery() {
      updateLayerControlStatus();
      updateRecoveryControl(ctx);
    };
  }

  function installRecoveryControl(ctx) {
    if (ctx.els.returnSelectedFineCell) return;

    const muteButton = ctx.els.muteSelectedSector;
    const buttonGrid = muteButton ? muteButton.parentElement : null;
    if (!buttonGrid) return;

    const button = document.createElement("button");
    button.id = "returnSelectedFineCell";
    button.type = "button";
    button.className = "secondary";
    button.textContent = "Return practical cell to undiscovered";
    button.title = "Remove the selected 8×8 practical cell from both Active and Muted state.";
    button.addEventListener("click", ctx.returnSelectedFineCellToUndiscovered);

    muteButton.insertAdjacentElement("afterend", button);
    ctx.els.returnSelectedFineCell = button;
  }

  function updateRecoveryControl(ctx) {
    const button = ctx.els.returnSelectedFineCell;
    if (!button) return;

    const selectedCode = ctx.selectedFineCell && ctx.selectedFineCell.code;
    const classified = selectedCode && (
      cellListHasCode(ctx.activeFineCells, selectedCode) ||
      cellListHasCode(ctx.mutedFineCells, selectedCode)
    );

    button.disabled = !classified;
  }

  function removeCellByCode(cells, code) {
    return (Array.isArray(cells) ? cells : [])
      .filter((cell) => cell && cell.code !== code);
  }

  function cellListHasCode(cells, code) {
    return Boolean(
      code &&
      Array.isArray(cells) &&
      cells.some((cell) => cell && cell.code === code)
    );
  }

  global.KaneMapMapSectorRecovery = {
    installMapSectorRecovery
  };
})(window);
