(function attachRealBundleConfig(global) {
  "use strict";

  global.KaneMapRealBundleConfig = {
    enabledByDefault: false,
    manifestName: "chunk_manifest.json",
    defaultBundlePath: "processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z",
    urlParameters: {
      source: ["data", "source", "mode"],
      bundle: ["bundle", "bundleRoot", "bundle-root"]
    },
    grid: {
      rows: 4,
      cols: 6,
      startNorth: 11,
      startEast: 5
    },
    projectedBounds: {
      minX: 0,
      minY: 0,
      maxX: 1400,
      maxY: 900
    },
    padding: 35
  };
})(window);
