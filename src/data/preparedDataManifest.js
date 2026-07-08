(function attachPreparedDataManifest(global) {
  "use strict";

  global.KaneMapPreparedDataManifest = {
    active: false,
    sourceType: "prepared",
    label: "Prepared Kane County geometry",
    preferredProcessing: {
      operatingSystem: "Debian 12 or Debian 13",
      runtime: "Python virtual environment",
      outputs: ["CSV", "JSON", "JavaScript chunks", "other static flat formats"]
    },
    data: global.KaneMapRealDataPlaceholder,
    expectedLayers: [
      "grid",
      "buildings",
      "roads",
      "water",
      "forests",
      "metadata"
    ]
  };
})(window);
