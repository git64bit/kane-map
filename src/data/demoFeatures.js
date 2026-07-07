(function attachDemoFeatures(global) {
  "use strict";

  const rect = (cx, cy, width, height) => ([
    [cx - width / 2, cy - height / 2],
    [cx + width / 2, cy - height / 2],
    [cx + width / 2, cy + height / 2],
    [cx - width / 2, cy + height / 2]
  ]);

  global.KaneMapDemoFeatures = {
    meta: {
      name: "Kane-Map synthetic offline demo",
      coordinateSystem: "arbitrary local prototype units",
      bounds: { minX: 0, minY: 0, maxX: 1400, maxY: 900 }
    },

    roads: [
      { id: "R-31", name: "Route 31 proxy", width: 16, path: [[140, 120], [260, 190], [390, 250], [535, 345], [710, 445], [910, 540], [1260, 690]] },
      { id: "R-64", name: "Route 64 proxy", width: 18, path: [[80, 640], [255, 610], [460, 590], [710, 585], [960, 610], [1290, 650]] },
      { id: "R-A", name: "Subdivision loop A", width: 9, path: [[205, 270], [295, 230], [390, 260], [412, 350], [350, 420], [230, 405], [180, 330], [205, 270]] },
      { id: "R-B", name: "Subdivision loop B", width: 9, path: [[870, 240], [1000, 215], [1120, 275], [1100, 390], [975, 430], [860, 370], [870, 240]] },
      { id: "R-C", name: "Townhome drive", width: 8, path: [[575, 185], [590, 320], [600, 460], [615, 620], [625, 760]] },
      { id: "R-D", name: "East residential drive", width: 8, path: [[1030, 500], [1105, 525], [1170, 585], [1180, 705], [1110, 785]] },
      { id: "R-E", name: "West service drive", width: 7, path: [[110, 500], [215, 505], [315, 475], [420, 455], [520, 485]] }
    ],

    water: [
      { id: "W-01", name: "Northwest pond", polygon: [[95, 165], [150, 130], [222, 145], [240, 205], [195, 255], [112, 235]] },
      { id: "W-02", name: "Central pond", polygon: [[650, 340], [755, 300], [835, 350], [800, 445], [690, 455], [620, 400]] },
      { id: "W-03", name: "East lake", polygon: [[1110, 135], [1245, 120], [1320, 200], [1295, 310], [1170, 325], [1085, 245]] },
      { id: "W-04", name: "South retention pond", polygon: [[245, 705], [380, 660], [510, 720], [475, 825], [315, 845], [220, 780]] }
    ],

    forests: [
      { id: "F-01", name: "North wooded area", polygon: [[420, 85], [620, 60], [755, 135], [715, 245], [515, 255], [390, 180]] },
      { id: "F-02", name: "West forest preserve proxy", polygon: [[30, 475], [150, 430], [260, 500], [245, 700], [115, 820], [35, 760]] },
      { id: "F-03", name: "East wooded area", polygon: [[1210, 420], [1370, 380], [1400, 575], [1340, 795], [1200, 820], [1145, 650]] },
      { id: "F-04", name: "Central trees", polygon: [[720, 655], [875, 630], [980, 705], [950, 815], [760, 830], [685, 745]] }
    ],

    buildings: [
      { id: "B-001", label: "B01", name: "West HOA building 1", cell: "N12-E05", stories: 1, polygon: rect(275, 318, 62, 42) },
      { id: "B-002", label: "B02", name: "West HOA building 2", cell: "N12-E05", stories: 2, polygon: rect(345, 333, 72, 44) },
      { id: "B-003", label: "B03", name: "West HOA building 3", cell: "N12-E06", stories: 3, polygon: rect(335, 405, 92, 48) },
      { id: "B-004", label: "B04", name: "West HOA building 4", cell: "N13-E05", stories: 1, polygon: rect(235, 390, 60, 38) },
      { id: "B-005", label: "B05", name: "West HOA building 5", cell: "N13-E06", stories: 2, polygon: rect(410, 285, 78, 42) },

      { id: "B-006", label: "B06", name: "Central townhome row 1", cell: "N12-E07", stories: 2, polygon: rect(560, 235, 120, 35) },
      { id: "B-007", label: "B07", name: "Central townhome row 2", cell: "N12-E07", stories: 2, polygon: rect(610, 290, 35, 120) },
      { id: "B-008", label: "B08", name: "Central townhome row 3", cell: "N13-E07", stories: 3, polygon: rect(660, 515, 145, 42) },
      { id: "B-009", label: "B09", name: "Central townhome row 4", cell: "N13-E07", stories: 1, polygon: rect(525, 548, 62, 38) },
      { id: "B-010", label: "B10", name: "Central townhome row 5", cell: "N14-E07", stories: 2, polygon: rect(610, 705, 130, 38) },

      { id: "B-011", label: "B11", name: "East apartments north", cell: "N12-E09", stories: 3, polygon: rect(930, 265, 155, 55) },
      { id: "B-012", label: "B12", name: "East apartments west", cell: "N12-E09", stories: 3, polygon: rect(875, 355, 55, 130) },
      { id: "B-013", label: "B13", name: "East apartments south", cell: "N13-E09", stories: 3, polygon: rect(970, 425, 150, 50) },
      { id: "B-014", label: "B14", name: "East apartments east", cell: "N13-E10", stories: 2, polygon: rect(1085, 335, 56, 135) },
      { id: "B-015", label: "B15", name: "East detached 1", cell: "N13-E10", stories: 1, polygon: rect(1188, 538, 54, 38) },
      { id: "B-016", label: "B16", name: "East detached 2", cell: "N14-E10", stories: 1, polygon: rect(1160, 620, 58, 40) },
      { id: "B-017", label: "B17", name: "East detached 3", cell: "N14-E10", stories: 2, polygon: rect(1210, 705, 76, 42) },

      { id: "B-018", label: "B18", name: "South cluster 1", cell: "N14-E06", stories: 2, polygon: rect(390, 760, 84, 44) },
      { id: "B-019", label: "B19", name: "South cluster 2", cell: "N14-E06", stories: 1, polygon: rect(470, 800, 62, 38) },
      { id: "B-020", label: "B20", name: "South cluster 3", cell: "N14-E07", stories: 3, polygon: rect(720, 760, 128, 46) },
      { id: "B-021", label: "B21", name: "South cluster 4", cell: "N14-E08", stories: 2, polygon: rect(835, 715, 88, 42) }
    ]
  };
})(window);
