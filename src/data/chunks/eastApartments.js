(function registerEastApartments(global) {
  "use strict";

  const rect = global.KaneMapGeometry.rect;
  global.KaneMapChunkRegistry.register({
    id: "east-apartments",
    label: "East apartment buildings",
    cells: ["N11-E09", "N12-E09", "N13-E09", "N14-E09"],
    roads: [],
    water: [],
    forests: [],
    buildings: [
      {
        id: "B-011",
        label: "B11",
        name: "East apartments north",
        cell: "N12-E09",
        stories: 3,
        polygon: rect(930, 265, 155, 55)
      },
      {
        id: "B-012",
        label: "B12",
        name: "East apartments west",
        cell: "N12-E09",
        stories: 3,
        polygon: rect(875, 355, 55, 130)
      },
      {
        id: "B-013",
        label: "B13",
        name: "East apartments south",
        cell: "N13-E09",
        stories: 3,
        polygon: rect(970, 425, 150, 50)
      }
    ]
  });
})(window);
