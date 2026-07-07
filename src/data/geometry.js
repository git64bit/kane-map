(function attachGeometry(global) {
  "use strict";

  function rect(cx, cy, width, height) {
    return [
      [cx - width / 2, cy - height / 2],
      [cx + width / 2, cy - height / 2],
      [cx + width / 2, cy + height / 2],
      [cx - width / 2, cy + height / 2]
    ];
  }

  global.KaneMapGeometry = {
    rect
  };
})(window);
