# Streaming Raw Inspection

Raw source inspection must not load large GeoJSON files fully into memory.

## Rule

Use streaming inspection for raw GeoJSON sources.

Do not use:

```python
json.load(file)
```

or:

```python
json.loads(path.read_text())
```

for large raw files.

## Current large file

The full Kane County address-points file may contain more than 200,000 features and can exceed 300 MB after page merging.

## What inspection reports

The inspection script reports:

- feature count
- geometry type counts
- property field names
- sample property records
- missing sources
- errors

## Command

```bash
python scripts/inspect_raw_sources.py
```

For one source:

```bash
python scripts/inspect_raw_sources.py --source kane-address-points
```
