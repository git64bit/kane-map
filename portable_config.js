(function attachKaneMapPortableConfig(global) {
  "use strict";

  // Source-repository default. Portable app packaging overwrites this root file
  // with production bundle settings outside src/.
  global.KaneMapPortableConfig = global.KaneMapPortableConfig || {
    type: "kane-map-portable-config",
    role: "source-default-noop"
  };
})(window);
