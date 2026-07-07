(function attachDesignatorTools(global) {
  "use strict";

  function parseDesignators(text) {
    const raw = String(text || "");
    const tokens = raw
      .split(/[\n,;\t ]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map(normalizeToken);

    return dedupe(tokens);
  }

  function countDesignators(text) {
    return parseDesignators(text).length;
  }

  function compactPreview(text, maxItems = 8) {
    const designators = parseDesignators(text);
    if (!designators.length) return "No visible designators entered";

    const shown = designators.slice(0, maxItems).join(", ");
    const extra = designators.length > maxItems ? ` +${designators.length - maxItems} more` : "";
    return `${designators.length} parsed: ${shown}${extra}`;
  }

  function normalizeToken(token) {
    return token
      .replace(/[–—]/g, "-")
      .replace(/[^0-9A-Za-z.#_-]/g, "")
      .toUpperCase();
  }

  function dedupe(values) {
    const seen = new Set();
    const output = [];

    values.forEach((value) => {
      if (!value || seen.has(value)) return;
      seen.add(value);
      output.push(value);
    });

    return output;
  }

  global.KaneMapDesignators = {
    parseDesignators,
    countDesignators,
    compactPreview
  };
})(window);
