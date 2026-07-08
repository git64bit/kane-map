# Source Registry

This directory contains source-acquisition metadata for Kane-Map processing.

Primary file:

```text
source_registry.json
```

Supporting notes:

```text
source_notes.md
```

The registry lists candidate source files and candidate source URLs. Batch 028 does not authorize automatic downloads. It only records acquisition targets and reporting information.

Use from `processing/`:

```bash
python scripts/list_sources.py
python scripts/show_source_urls.py
python scripts/validate_sources.py
```
