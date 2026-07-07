(function registerCentralTownhomes(global) {
  "use strict";

  const rect = global.KaneMapGeometry.rect;

  global.KaneMapChunkRegistry.register({
    id: "central-townhomes",
    label: "Central townhome buildings",
    cells: ["N11-E07", "N11-E08", "N12-E07", "N12-E08", "N13-E07", "N13-E08", "N14-E07", "N14-E08"],
    roads: [],
    water: [],
    forests: [],
    buildings: [
      { id: "B-006", label: "B06", name: "Central townhome row 1", cell: "N12-E07", stories: 2, polygon: rect(560, 235, 120, 35) },
      { id: "B-007", label: "B07", name: "Central townhome row 2", cell: "N12-E07", stories: 2, polygon: rect(610, 290, 35, 120) },
      { id: "B-008", label: "B08", name: "Central townhome row 3", cell: "N13-E07", stories: 3, polygon: rect(660, 515, 145, 42) },
      { id: "B-009", label: "B09", name: "Central townhome row 4", cell: "N13-E07", stories: 1, polygon: rect(525, 548, 62, 38) },
      { id: "B-010", label: "B10", name: "Central townhome row 5", cell: "N14-E07", stories: 2, polygon: rect(610, 705, 130, 38) },
      { id: "B-020", label: "B20", name: "South cluster 3", cell: "N14-E07", stories: 3, polygon: rect(720, 760, 128, 46) },
      { id: "B-021", label: "B21", name: "South cluster 4", cell: "N14-E08", stories: 2, polygon: rect(835, 715, 88, 42) }
    ]
  });
})(window);
