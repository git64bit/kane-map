# Prepared Layer Inspection

Prepared layer inspection checks the browser-ready files in:

```text
processing/output/prepared/
```

The inspection script reports:

- prepared file names
- byte sizes
- feature counts
- geometry types
- property field names
- top-level `kane_map_layer` metadata
- sample property objects

## Command

```bash
PYTHONPATH=. python scripts/inspect_prepared_layers.py
```

## Single layer

```bash
PYTHONPATH=. python scripts/inspect_prepared_layers.py --layer roads
PYTHONPATH=. python scripts/inspect_prepared_layers.py --layer water
PYTHONPATH=. python scripts/inspect_prepared_layers.py --layer buildings
PYTHONPATH=. python scripts/inspect_prepared_layers.py --layer address_points
```

## Report

The script writes:

```text
processing/output/reports/prepared_layer_inspection_report.json
```

## Memory rule

The script does not use `json.load()` on full prepared layer files. It streams the `features` array feature by feature.

This keeps inspection usable on the current 1GB Debian processing node.
