(function attachRealDataPlaceholder(global) {
  "use strict";

  global.KaneMapRealDataPlaceholder = {
    meta: {
      name: "Prepared Kane County data placeholder",
      coordinateSystem: "prepared local Kane-Grid units",
      bounds: { minX: 0, minY: 0, maxX: 1400, maxY: 900 },
      dataMode: "prepared static chunks",
      dataVersion: "real-data-placeholder-001",
      status: "placeholder",
      note: "Prepared production geometry is not bundled yet. Demo data remains the active source."
    },
    chunks: []
  };
})(window);
