(function attachRealBundleConfig(global) {
  "use strict";

  global.KaneMapRealBundleConfig = {
    enabledByDefault: false,
    manifestName: "chunk_manifest.json",
    defaultBundlePath: "processing/output/bundles/kane-map-chunked-prepared-20260709T094356Z",
    label: "Kane County production bundle",
    urlParameters: {
      source: ["data", "source", "mode"],
      bundle: ["bundle", "bundleRoot", "bundle-root"]
    },
    grid: { rows: 4, cols: 6, startNorth: 11, startEast: 5 },
    projectedBounds: { minX: 0, minY: 0, maxX: 1400, maxY: 900 },
    padding: 35
  };

  // Portable app bundles may place a generated portable_config.js beside index.html.
  // Keep this outside src/ so copying updated source files to USB does not reset the
  // packaged production-data default back to the source-repo demo default.
  if (global.document && !global.KaneMapPortableConfigLoadAttempted) {
    global.KaneMapPortableConfigLoadAttempted = true;
    global.document.write('<script src="portable_config.js"></' + 'script>');
  }
})(window);
