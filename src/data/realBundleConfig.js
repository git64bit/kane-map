(function attachRealBundleConfig(global) {
  "use strict";

  global.KaneMapRealBundleConfig = {
    enabledByDefault: false,
    manifestName: "chunk_manifest.json",
    defaultBundlePath: "processing/output/prepared",
    defaultPortableBundlePath: "processing/output/prepared",
    defaultBundleFormat: "flat-prepared",
    label: "Kane County prepared JSON files",
    urlParameters: {
      source: ["data", "source", "mode"],
      bundle: ["bundle", "bundleRoot", "bundle-root"],
      format: ["format", "bundleFormat", "bundle-format"]
    },
    grid: { rows: 4, cols: 6, startNorth: 11, startEast: 5 },
    projectedBounds: { minX: 0, minY: 0, maxX: 1400, maxY: 900 },
    padding: 35
  };
})(window);
