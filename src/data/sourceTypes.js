(function attachSourceTypes(global) {
  "use strict";

  const SOURCES = Object.freeze({ DEMO: "demo", PREPARED: "prepared" });
  const PREPARED_ALIASES = Object.freeze(["prepared", "real", "chunked", "chunked-prepared", "production", "prod"]);
  const DEMO_ALIASES = Object.freeze(["demo", "synthetic", "sample"]);
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

  function configuredSourceParameterNames() {
    const config = global.KaneMapRealBundleConfig || {};
    const configured = config.urlParameters && Array.isArray(config.urlParameters.source)
      ? config.urlParameters.source
      : [];
    return configured.length ? configured : ["data", "source", "mode"];
  }

  function firstRequestedSource(params) {
    return configuredSourceParameterNames()
      .map((name) => params.get(name))
      .find((value) => value !== null && value !== undefined && String(value).trim() !== "");
  }

  function sourceFromLocation(locationObject) {
    const location = locationObject || global.location;
    const params = new URLSearchParams(location && location.search ? location.search : "");
    const requested = firstRequestedSource(params);

    if (requested) {
      const value = String(requested).trim().toLowerCase();
      if (PREPARED_ALIASES.includes(value)) return SOURCES.PREPARED;
      if (DEMO_ALIASES.includes(value)) return SOURCES.DEMO;
      return SOURCES.DEMO;
    }

    const config = global.KaneMapRealBundleConfig || {};
    return config.enabledByDefault ? SOURCES.PREPARED : SOURCES.DEMO;
  }

  global.KaneMapSourceTypes = {
    SOURCES,
    GEOMETRY_KEYS,
    isKnownSource,
    normalizeSourceType,
    sourceFromLocation
  };
})(window);
