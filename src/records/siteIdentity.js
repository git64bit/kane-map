(function attachSiteIdentity(global) {
  "use strict";

  function createSiteIdentityModel(options) {
    const getRecords = options.getRecords;

    function analyzeBuilding(buildingId) {
      const records = getRecords().filter((record) => record.buildingId === buildingId);
      const labels = uniqueText(records.map((record) => record.siteLabel));
      const aliases = uniqueText(records.map((record) => record.buildingAlias));
      const mailbanks = uniqueText(records.map((record) => record.mailboxBankId));
      const entrances = uniqueText(records.map((record) => record.entranceId));
      const warnings = [];

      if (labels.length > 1) warnings.push(`Multiple site labels: ${labels.join(" / ")}`);
      if (aliases.length > 1) warnings.push(`Multiple building aliases: ${aliases.join(" / ")}`);
      if (duplicateDesignatorSets(records).length) warnings.push("Duplicate visible-designator set recorded for this building.");

      return { records, labels, aliases, mailbanks, entrances, warnings };
    }

    function globalWarnings() {
      const records = getRecords();
      const warnings = [];
      const siteMap = groupedBuildings(records, "siteLabel");
      const aliasMap = groupedBuildings(records, "buildingAlias");

      siteMap.forEach((buildingIds, label) => {
        if (label && buildingIds.size > 1) warnings.push(`Site label \"${label}\" appears on ${buildingIds.size} buildings.`);
      });
      aliasMap.forEach((buildingIds, alias) => {
        if (alias && buildingIds.size > 1) warnings.push(`Building alias \"${alias}\" appears on ${buildingIds.size} buildings.`);
      });

      return warnings;
    }

    return { analyzeBuilding, globalWarnings };
  }

  function duplicateDesignatorSets(records) {
    const seen = new Set();
    const duplicates = [];
    records.forEach((record) => {
      const values = Array.isArray(record.visibleDesignators) ? record.visibleDesignators : [];
      if (!values.length) return;
      const key = values.join("|");
      if (seen.has(key)) duplicates.push(key);
      seen.add(key);
    });
    return duplicates;
  }

  function groupedBuildings(records, field) {
    const map = new Map();
    records.forEach((record) => {
      const key = String(record[field] || "").trim();
      if (!key) return;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(record.buildingId);
    });
    return map;
  }

  function uniqueText(values) {
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).sort();
  }

  global.KaneMapSiteIdentity = { createSiteIdentityModel };
})(window);
