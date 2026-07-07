(function registerEastApartments(global) {
  "use strict";

  const rect = global.KaneMapGeometry.rect;

  global.KaneMapChunkRegistry.register({
    id: "east-apartments",
    label: "East apartment buildings",
    cells: ["N11-E09", "N11-E10", "N12-E09", "N12-E10", "N13-E09", "N13-E10", "N14-E09", "N14-E10"],
    roads: [],
    water: [],
    forests: [],
    buildings: [
      { id: "B-011", label: "B11", name: "East apartments north", cell: "N12-E09", stories: 3, polygon: rect(930, 265, 155, 55) },
      { id: "B-012", label: "B12", name: "East apartments west", cell: "N12-E09", stories: 3, polygon: rect(875, 355, 55, 130) },
      { id: "B-013", label: "B13", name: "East apartments south", cell: "N13-E09", stories: 3, polygon: rect(970, 425, 150, 50) },
      { id: "B-014", label: "B14", name: "East apartments east", cell: "N13-E10", stories: 2, polygon: rect(1085, 335, 56, 135) },
      { id: "B-015", label: "B15", name: "East detached 1", cell: "N13-E10", stories: 1, polygon: rect(1188, 538, 54, 38) },
      { id: "B-016", label: "B16", name: "East detached 2", cell: "N14-E10", stories: 1, polygon: rect(1160, 620, 58, 40) },
      { id: "B-017", label: "B17", name: "East detached 3", cell: "N14-E10", stories: 2, polygon: rect(1210, 705, 76, 42) }
    ]
  });
})(window);
