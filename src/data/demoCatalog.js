(function attachDemoCatalog(global) {
  "use strict";

  global.KaneMapDemoCatalog = {
    meta: {
      name: "Kane-Map synthetic offline chunked demo",
      coordinateSystem: "arbitrary local prototype units",
      bounds: { minX: 0, minY: 0, maxX: 1400, maxY: 900 },
      dataMode: "local JavaScript chunks",
      dataVersion: "demo-006"
    },

    chunks: [
      {
        id: "west-neighborhood",
        label: "West neighborhood demo chunk",
        cells: ["N11-E05", "N11-E06", "N12-E05", "N12-E06", "N13-E05", "N13-E06", "N14-E05", "N14-E06"]
      },
      {
        id: "central-townhomes",
        label: "Central townhome demo chunk",
        cells: ["N11-E07", "N11-E08", "N12-E07", "N12-E08", "N13-E07", "N13-E08", "N14-E07", "N14-E08"]
      },
      {
        id: "east-apartments",
        label: "East apartment demo chunk",
        cells: ["N11-E09", "N11-E10", "N12-E09", "N12-E10", "N13-E09", "N13-E10", "N14-E09", "N14-E10"]
      },
      {
        id: "regional-orientation",
        label: "Shared road/water/forest orientation chunk",
        cells: [
          "N11-E05", "N11-E06", "N11-E07", "N11-E08", "N11-E09", "N11-E10",
          "N12-E05", "N12-E06", "N12-E07", "N12-E08", "N12-E09", "N12-E10",
          "N13-E05", "N13-E06", "N13-E07", "N13-E08", "N13-E09", "N13-E10",
          "N14-E05", "N14-E06", "N14-E07", "N14-E08", "N14-E09", "N14-E10"
        ]
      }
    ]
  };
})(window);
