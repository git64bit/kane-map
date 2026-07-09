# Batch 051 — Repository cleanup

Purpose:

- strengthen ignore rules for generated processing data
- prevent future accidental commits of Python bytecode and prepared/chunked data
- add a repository cleanup script for tracked generated artifacts

This batch does not delete files by zip extraction. Git deletions must be staged by running the cleanup script with `--execute`.

Expected current issue:

- `processing/kane_map_processing/__pycache__/building_chunking.cpython-313.pyc`
- `processing/scripts/__pycache__/chunk_buildings_layer.cpython-313.pyc`

The script also checks for other generated files that should not be tracked.
