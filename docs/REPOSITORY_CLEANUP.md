# Repository cleanup

Kane-Map keeps code, documentation, and small scaffold files in Git.

Generated processing artifacts stay local:

- downloaded source files
- staged raw GeoJSON
- prepared browser JSON
- packaged bundles
- chunked browser data
- processing reports
- Python bytecode

## Why this matters

The processing node may create very large files. Those files are needed locally, but they should not be pushed to GitHub. The browser-facing data will be packaged separately from source control.

## Cleanup script

Use this from the processing directory:

```bash
PYTHONPATH=. python scripts/cleanup_tracked_artifacts.py
```

That performs a dry run and prints tracked generated files.

To untrack those files:

```bash
PYTHONPATH=. python scripts/cleanup_tracked_artifacts.py --execute
```

The execute mode uses `git rm --cached`. It removes generated files from Git tracking without deleting local working copies.

After execute mode, review:

```bash
git -C ~/kane-map status --short
```

Then commit and push the cleanup if the staged changes are correct.
