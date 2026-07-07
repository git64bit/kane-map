(function registerRegionalOrientation(global) {
  "use strict";

  global.KaneMapChunkRegistry.register({
    id: "regional-orientation",
    label: "Shared regional orientation layers",
    cells: global.KaneMapDemoCatalog.chunks.find((chunk) => chunk.id === "regional-orientation").cells,

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

    buildings: []
  });
})(window);
