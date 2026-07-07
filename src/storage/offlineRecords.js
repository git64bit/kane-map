(function attachDeprecatedOfflineRecords(global) {
  "use strict";

  // Deprecated compatibility wrapper from Batch 004.
  // Batch 005 uses src/storage/recordSchema.js and src/storage/localStore.js.
  // This file is intentionally not loaded by index.html.

  function createOfflineRecordStore() {
    if (global.KaneMapLocalStore) {
      return global.KaneMapLocalStore.createLocalObservationStore();
    }

    throw new Error(
      "KaneMapOfflineRecords is deprecated. Load recordSchema.js and localStore.js instead."
    );
  }

  global.KaneMapOfflineRecords = {
    createOfflineRecordStore
  };
})(window);
