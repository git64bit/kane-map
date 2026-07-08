# Source registry

`source_registry.json` lists expected public-data sources and their local file paths.

The registry does not download data. It only tells the processing scripts what source files are expected and how they should be classified.

Run from `processing/`:

```bash
python scripts/list_sources.py
python scripts/validate_sources.py
python scripts/intake_sources.py
```

At Batch 027, all source files are optional placeholders. Later batches can mark specific sources as required once an import path is proven.

