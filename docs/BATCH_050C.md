# Batch 050C — Building Chunking Simple Fix

This corrective batch replaces the faulty custom streaming parser used by the building chunking module.

The prepared buildings layer is about 76 MB, which is acceptable to load for this step on the current node. The replacement chunker uses ordinary JSON loading, writes smaller building chunk files, and updates the existing chunk manifest.

No browser behavior changes.
