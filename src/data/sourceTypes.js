(function attachSourceTypes(global) {
  "use strict";

  const SOURCES = Object.freeze({
    DEMO: "demo",
    PREPARED: "prepared"
  });

  const GEOMETRY_KEYS = Object.freeze([
    "roads",
    "water",
    "forests",
    "buildings"
  ]);

  function isKnownSource(sourceType) {
    return Object.values(SOURCES).includes(sourceType);
  }

  function normalizeSourceType(sourceType) {
    return isKnownSource(sourceType) ? sourceType : SOURCES.DEMO;
  }

  global.KaneMapSourceTypes = {
    SOURCES,
    GEOMETRY_KEYS,
    isKnownSource,
    normalizeSourceType
  };
})(window);
