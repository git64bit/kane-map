(function registerWestNeighborhood(global) {
  "use strict";

  const rect = global.KaneMapGeometry.rect;
  global.KaneMapChunkRegistry.register({
    id: "west-neighborhood",
    label: "West neighborhood buildings",
    cells: ["N11-E06", "N12-E06", "N13-E06", "N14-E06"],
    roads: [],
    water: [],
    forests: [],
    buildings: [
      {
        id: "B-003",
        label: "B03",
        name: "West HOA building 3",
        cell: "N12-E06",
        stories: 3,
        polygon: rect(335, 405, 92, 48)
      },
      {
        id: "B-005",
        label: "B05",
        name: "West HOA building 5",
        cell: "N13-E06",
        stories: 2,
        polygon: rect(410, 285, 78, 42)
      },
      {
        id: "B-018",
        label: "B18",
        name: "South cluster 1",
        cell: "N14-E06",
        stories: 2,
        polygon: rect(390, 760, 84, 44)
      },
      {
        id: "B-019",
        label: "B19",
        name: "South cluster 2",
        cell: "N14-E06",
        stories: 1,
        polygon: rect(470, 800, 62, 38)
      }
    ]
  });
})(window);
