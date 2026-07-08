(function kaneMapObservationController(global) {
  "use strict";

  function installObservationController(ctx) {
    const { els } = ctx;

    ctx.bindObservationEvents = function bindObservationEvents() {
      els.visibleDesignators.addEventListener("input", ctx.updateDesignatorPreview);
      els.showSelectedOnly.addEventListener("change", ctx.updateRecordPanel);
      els.cancelEdit.addEventListener("click", () => {
        ctx.stopEditing();
        ctx.clearObservationForm();
      });
      els.clearObservationFormButton.addEventListener("click", () => {
        ctx.stopEditing();
        ctx.clearObservationForm();
        ctx.setShortcutStatus("Form cleared");
      });
      els.recordList.addEventListener("click", ctx.handleRecordListClick);

      els.observationForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!ctx.selected.building) {
          alert("Select a building before adding or updating an observation.");
          return;
        }

        const input = ctx.buildRecordInput();
        if (ctx.editingRecordId) {
          const updated = ctx.store.updateRecord(ctx.editingRecordId, input);
          if (!updated) alert(`Could not update ${ctx.editingRecordId}.`);
        } else {
          ctx.store.addRecord(input);
        }

        ctx.stopEditing();
        ctx.clearObservationForm();
        ctx.refreshRecordUi();
      });
    };

    ctx.handleRecordListClick = function handleRecordListClick(event) {
      const editButton = event.target.closest("button[data-record-edit]");
      const deleteButton = event.target.closest("button[data-record-delete]");

      if (editButton) {
        ctx.startEditing(editButton.getAttribute("data-record-edit"));
        return;
      }

      if (!deleteButton) return;
      const recordId = deleteButton.getAttribute("data-record-delete");
      const ok = confirm(`Delete local observation record ${recordId}?`);
      if (!ok) return;
      if (ctx.editingRecordId === recordId) ctx.stopEditing();
      ctx.store.deleteRecord(recordId);
      ctx.refreshRecordUi();
    };

    ctx.buildRecordInput = function buildRecordInput() {
      const parsedDesignators = ctx.designators.parseDesignators(els.visibleDesignators.value);
      const observedUnitCount = ctx.resolveObservedUnitCount(els.unitCount.value, parsedDesignators);

      return {
        gridCell: ctx.selected.cell ? ctx.selected.cell.code : ctx.selected.building.cell,
        buildingId: ctx.selected.building.id,
        buildingLabel: ctx.selected.building.label,
        buildingName: ctx.selected.building.name,
        buildingAlias: els.buildingAlias.value.trim(),
        stories: ctx.selected.building.stories,
        visitDate: els.visitDate.value || global.KaneMapVisitSessions.today(),
        fieldSessionId: els.fieldSessionId.value.trim(),
        planPriority: els.planPriority.value,
        planAction: els.planAction.value.trim(),
        siteLabel: els.siteLabel.value.trim(),
        entranceId: els.entranceId.value.trim(),
        mailboxBankId: els.mailboxBankId.value.trim(),
        observedUnitCount,
        designatorPattern: els.designatorPattern.value.trim(),
        visibleDesignators: parsedDesignators,
        designatorRaw: els.visibleDesignators.value.trim(),
        confidence: els.confidence.value,
        visitStatus: els.visitStatus.value,
        accessContext: els.accessContext.value.trim(),
        notes: els.observationNotes.value.trim()
      };
    };

    ctx.startEditing = function startEditing(recordId) {
      const record = ctx.store.getRecord(recordId);
      if (!record) return;

      const building = ctx.findBuildingById(record.buildingId);
      if (building) {
        ctx.selected = { cell: ctx.cellForCode(record.gridCell || building.cell), building };
        ctx.renderer.setSelected(ctx.selected.building, ctx.selected.cell);
        ctx.updateSelectedPanel();
      }

      ctx.editingRecordId = record.id;
      els.observationFormTitle.textContent = "Edit observation";
      els.editModeNotice.hidden = false;
      els.saveObservation.textContent = "Update field observation";
      els.cancelEdit.hidden = false;

      els.visitDate.value = record.visitDate || global.KaneMapVisitSessions.today();
      els.fieldSessionId.value = record.fieldSessionId || "";
      els.planPriority.value = record.planPriority || "none";
      els.planAction.value = record.planAction || "";
      els.siteLabel.value = record.siteLabel || "";
      els.buildingAlias.value = record.buildingAlias || "";
      els.entranceId.value = record.entranceId || "";
      els.mailboxBankId.value = record.mailboxBankId || "";
      els.visibleDesignators.value = record.designatorRaw || record.visibleDesignators.join(", ");
      els.unitCount.value = record.observedUnitCount === null ? "" : String(record.observedUnitCount);
      els.designatorPattern.value = record.designatorPattern || "";
      els.confidence.value = record.confidence || "unreviewed";
      els.visitStatus.value = record.visitStatus || "observed";
      els.accessContext.value = record.accessContext || "";
      els.observationNotes.value = record.notes || "";
      ctx.updateDesignatorPreview();
      ctx.updateRecordPanel();
      ctx.switchWorkspaceTab("observe");
    };

    ctx.stopEditing = function stopEditing() {
      ctx.editingRecordId = null;
      els.observationFormTitle.textContent = "Offline observation";
      els.editModeNotice.hidden = true;
      els.saveObservation.textContent = "Add field observation";
      els.cancelEdit.hidden = true;
    };

    ctx.clearObservationForm = function clearObservationForm() {
      const keepVisitDate = els.visitDate.value || global.KaneMapVisitSessions.today();
      const keepSessionId = els.fieldSessionId.value;
      els.visitDate.value = keepVisitDate;
      els.fieldSessionId.value = keepSessionId;
      els.planPriority.value = "none";
      els.planAction.value = "";
      els.siteLabel.value = "";
      els.buildingAlias.value = "";
      els.entranceId.value = "";
      els.mailboxBankId.value = "";
      els.visibleDesignators.value = "";
      els.unitCount.value = "";
      els.designatorPattern.value = "";
      els.confidence.value = "unreviewed";
      els.visitStatus.value = "observed";
      els.accessContext.value = "";
      els.observationNotes.value = "";
      ctx.updateDesignatorPreview();
    };

    ctx.updateDesignatorPreview = function updateDesignatorPreview() {
      els.designatorPreview.textContent = ctx.designators.compactPreview(els.visibleDesignators.value);
    };

    ctx.updateRecordPanel = function updateRecordPanel() {
      let records = ctx.store.snapshot();
      els.recordCount.textContent = String(records.length);
      els.recordList.innerHTML = "";

      if (els.showSelectedOnly.checked && ctx.selected.building) {
        records = records.filter((record) => record.buildingId === ctx.selected.building.id);
      }

      records.slice(-12).reverse().forEach((record) => ctx.renderRecordItem(record));
    };

    ctx.renderRecordItem = function renderRecordItem(record) {
      const item = document.createElement("li");
      const count = record.observedUnitCount === null ? "unknown count" : `${record.observedUnitCount} units`;
      const date = record.updatedAt ? record.updatedAt.slice(0, 10) : "undated";
      const designatorText = ctx.formatDesignatorList(record);
      if (ctx.selected.building && record.buildingId === ctx.selected.building.id) item.classList.add("record-selected-building");
      if (ctx.editingRecordId === record.id) item.classList.add("record-selected-building");

      item.innerHTML = [
        `<div class="record-header"><strong>${ctx.escapeHtml(record.buildingLabel)}</strong>`,
        `<span class="record-actions">`,
        `<button type="button" data-record-edit="${ctx.escapeHtml(record.id)}">Edit</button>`,
        `<button type="button" data-record-delete="${ctx.escapeHtml(record.id)}">Delete</button>`,
        `</span></div>`,
        ` ${ctx.escapeHtml(record.gridCell)} · ${ctx.escapeHtml(count)}`,
        `<br><span class="muted">${ctx.escapeHtml(record.id)} · visit ${ctx.escapeHtml(record.visitDate || "undated")} · updated ${ctx.escapeHtml(date)}</span>`,
        `<br><span class="status-pill">${ctx.escapeHtml(record.visitStatus)} · ${ctx.escapeHtml(record.confidence)}</span>`,
        record.fieldSessionId ? `<br>Session: ${ctx.escapeHtml(record.fieldSessionId)}` : "",
        record.planPriority && record.planPriority !== "none" ? `<br>Plan: ${ctx.escapeHtml(record.planPriority)}${record.planAction ? " · " + ctx.escapeHtml(record.planAction) : ""}` : "",
        record.siteLabel ? `<br>Site: ${ctx.escapeHtml(record.siteLabel)}` : "",
        record.buildingAlias ? `<br>Alias: ${ctx.escapeHtml(record.buildingAlias)}` : "",
        record.mailboxBankId ? `<br>Mailbank: ${ctx.escapeHtml(record.mailboxBankId)}` : "",
        designatorText ? `<br>Designators: ${ctx.escapeHtml(designatorText)}` : "",
        record.notes ? `<br>${ctx.escapeHtml(record.notes)}` : ""
      ].join("");
      els.recordList.appendChild(item);
    };

    ctx.refreshRecordUi = function refreshRecordUi() {
      ctx.updateRecordPanel();
      ctx.updateBuildingSummary();
      ctx.updateIdentitySummary();
      ctx.updateReviewUi();
      ctx.updateVisitSessionUi();
      ctx.updateFieldPlanUi();
      ctx.handleNavigationSearch();
      ctx.updateStorageStatus();
      ctx.updateWorkspaceHeader();
    };

    ctx.resolveObservedUnitCount = function resolveObservedUnitCount(rawUnitCount, parsedDesignators) {
      const typed = String(rawUnitCount || "").trim();
      const typedNumber = Number(typed);

      if (typed !== "" && Number.isFinite(typedNumber) && typedNumber > 0) return Math.floor(typedNumber);
      if (parsedDesignators.length > 0) return parsedDesignators.length;
      if (typed !== "" && Number.isFinite(typedNumber) && typedNumber === 0) return 0;
      return null;
    };

    ctx.formatDesignatorList = function formatDesignatorList(record) {
      const values = Array.isArray(record.visibleDesignators) ? record.visibleDesignators : [];
      if (!values.length) return record.designatorPattern || "";

      const limit = 24;
      const shown = values.slice(0, limit).join(", ");
      const extra = values.length > limit ? ` +${values.length - limit} more` : "";
      return `${values.length} designators: ${shown}${extra}`;
    };

    ctx.setDefaultVisitDate = function setDefaultVisitDate() {
      if (els.visitDate && !els.visitDate.value) els.visitDate.value = global.KaneMapVisitSessions.today();
    };
  }

  global.KaneMapObservationController = { installObservationController };
})(window);
