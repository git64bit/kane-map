(function attachRealBundleConfig(global) {
  "use strict";

  global.KaneMapRealBundleConfig = {
    enabledByDefault: false,
    manifestName: "chunk_manifest.json",
    defaultBundlePath: "processing/output/prepared",
    defaultPortableBundlePath: "processing/output/prepared",
    label: "Kane County prepared JSON files",
    urlParameters: {
      source: ["data", "source", "mode"],
      bundle: ["bundle", "bundleRoot", "bundle-root"]
    },
    preparedLayerFiles: {
      county_boundary: "county_boundary.json",
      roads: "roads.json",
      water: "water.json",
      buildings: "buildings.json",
      address_points: "address_points.json"
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
