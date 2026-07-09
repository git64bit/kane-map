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
    "buildings",
    "addressPoints",
    "countyBoundary"
  ]);

  function isKnownSource(sourceType) {
    return Object.values(SOURCES).includes(sourceType);
  }

  function normalizeSourceType(sourceType) {
    return isKnownSource(sourceType) ? sourceType : SOURCES.DEMO;
  }

  function sourceFromLocation(locationObject) {
    const location = locationObject || global.location;
    if (!location || !location.search) return SOURCES.DEMO;

    const params = new URLSearchParams(location.search);
    const requested = String(
      params.get("data") ||
      params.get("source") ||
      params.get("mode") ||
      ""
    ).trim().toLowerCase();

    if (["prepared", "real", "chunked", "chunked-prepared"].includes(requested)) {
      return SOURCES.PREPARED;
    }
    return SOURCES.DEMO;
  }

  global.KaneMapSourceTypes = {
    SOURCES,
    GEOMETRY_KEYS,
    isKnownSource,
    normalizeSourceType,
    sourceFromLocation
  };
})(window);
