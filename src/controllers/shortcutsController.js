(function kaneMapShortcutsController(global) {
  "use strict";

  function installShortcutsController(ctx) {
    const { els } = ctx;

    ctx.bindKeyboardShortcuts = function bindKeyboardShortcuts() {
      ctx.shortcutController = global.KaneMapShortcuts.createShortcutController({
        statusEl: els.shortcutStatus,
        actions: {
          focusSearch: ctx.focusSearch,
          resetView: ctx.resetViewShortcut,
          saveObservation: ctx.saveObservationShortcut,
          nextBuilding: () => ctx.goToAdjacentBuilding(1),
          previousBuilding: () => ctx.goToAdjacentBuilding(-1),
          exportJson: ctx.exportJsonShortcut,
          copySelected: ctx.copySelectedSummary,
          clearForm: ctx.clearFormShortcut,
          escape: ctx.escapeShortcut,
          switchTab: ctx.switchWorkspaceTab
        }
      });
      ctx.shortcutController.install(window);
    };

    ctx.focusSearch = function focusSearch() {
      ctx.switchWorkspaceTab("map");
      els.navSearch.focus();
      els.navSearch.select();
      return "Search focused";
    };

    ctx.resetViewShortcut = function resetViewShortcut() {
      ctx.changeView(() => ctx.renderer.resetView());
      return "View reset";
    };

    ctx.saveObservationShortcut = function saveObservationShortcut() {
      if (!ctx.selected.building) {
        ctx.switchWorkspaceTab("observe");
        return "Select a building before saving";
      }
      if (!ctx.observationFormHasContent()) {
        ctx.switchWorkspaceTab("observe");
        return "Nothing to save yet";
      }
      const wasEditing = Boolean(ctx.editingRecordId);
      ctx.switchWorkspaceTab("observe");
      els.observationForm.requestSubmit();
      return wasEditing ? "Observation updated" : "Observation saved";
    };

    ctx.exportJsonShortcut = function exportJsonShortcut() {
      ctx.store.download(`kane-map-observations-${ctx.dateStamp()}.json`, ctx.store.exportJson());
      return "JSON export started";
    };

    ctx.clearFormShortcut = function clearFormShortcut() {
      ctx.stopEditing();
      ctx.clearObservationForm();
      ctx.switchWorkspaceTab("observe");
      return "Form cleared";
    };

    ctx.escapeShortcut = function escapeShortcut() {
      const active = document.activeElement;
      if (ctx.editingRecordId) {
        ctx.stopEditing();
        ctx.clearObservationForm();
        return "Edit cancelled";
      }
      if (els.navSearch.value.trim()) {
        els.navSearch.value = "";
        ctx.renderSearchResults([]);
        return "Search cleared";
      }
      if (active && active !== document.body && active.blur) {
        active.blur();
        return "Input blurred";
      }
      return "Escape handled";
    };

    ctx.observationFormHasContent = function observationFormHasContent() {
      return Boolean(
        els.siteLabel.value.trim() ||
        els.buildingAlias.value.trim() ||
        els.entranceId.value.trim() ||
        els.mailboxBankId.value.trim() ||
        els.visibleDesignators.value.trim() ||
        els.unitCount.value.trim() ||
        els.designatorPattern.value.trim() ||
        els.accessContext.value.trim() ||
        els.observationNotes.value.trim() ||
        els.planAction.value.trim() ||
        els.planPriority.value !== "none" ||
        els.confidence.value !== "unreviewed" ||
        els.visitStatus.value !== "observed"
      );
    };

    ctx.setShortcutStatus = function setShortcutStatus(message) {
      if (ctx.shortcutController) ctx.shortcutController.setStatus(message);
      else if (els.shortcutStatus) els.shortcutStatus.textContent = message;
    };
  }

  global.KaneMapShortcutsController = { installShortcutsController };
})(window);
