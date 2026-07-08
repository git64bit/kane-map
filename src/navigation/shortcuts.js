(function attachShortcuts(global) {
  "use strict";

  const NUMBER_TABS = {
    "1": "map",
    "2": "observe",
    "3": "records",
    "4": "review",
    "5": "plan",
    "6": "export",
    "7": "project"
  };

  function createShortcutController(options) {
    const actions = options.actions || {};
    const statusEl = options.statusEl || null;

    function install(target) {
      target.addEventListener("keydown", handleKeydown);
    }

    function handleKeydown(event) {
      if (event.defaultPrevented) return;

      const key = event.key;
      const lower = key.toLowerCase();
      const editable = isEditableTarget(event.target);

      if (key === "Escape") {
        run(event, actions.escape, "Escape handled");
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "Enter") {
        run(event, actions.saveObservation, "Save shortcut");
        return;
      }

      if (editable || event.altKey || event.ctrlKey || event.metaKey) return;

      if (key === "/") {
        run(event, actions.focusSearch, "Search focused");
        return;
      }

      if (NUMBER_TABS[key]) {
        run(event, () => actions.switchTab && actions.switchTab(NUMBER_TABS[key]), `Tab ${key}`);
        return;
      }

      const keyActions = {
        c: [actions.copySelected, "Selected summary copied"],
        e: [actions.exportJson, "JSON export started"],
        n: [actions.nextBuilding, "Next visible building"],
        p: [actions.previousBuilding, "Previous visible building"],
        r: [actions.resetView, "View reset"],
        s: [actions.saveObservation, "Save shortcut"],
        x: [actions.clearForm, "Form cleared"]
      };

      const match = keyActions[lower];
      if (match) run(event, match[0], match[1]);
    }

    function run(event, action, fallbackMessage) {
      if (!action) return;
      event.preventDefault();
      const message = action() || fallbackMessage;
      setStatus(message);
    }

    function setStatus(message) {
      if (!statusEl || !message) return;
      statusEl.textContent = String(message);
      statusEl.title = "Keyboard shortcut status";
    }

    return { install, setStatus };
  }

  function isEditableTarget(target) {
    if (!target) return false;
    const tag = String(target.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return true;
    return Boolean(target.isContentEditable);
  }

  global.KaneMapShortcuts = {
    createShortcutController
  };
})(window);
