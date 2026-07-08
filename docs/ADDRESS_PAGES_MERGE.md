# Address Pages Merge

This batch adds a controlled merge step for Kane County address-point pages.

The paged ArcGIS download produced 110 GeoJSON page files under:

```text
processing/input/downloads/address_pages/
```

The merge script combines those page files into the staged raw source file:

```text
processing/input/raw/kane-address-points.geojson
```

The script is dry-run by default.

## Commands

Dry run:

```bash
python scripts/merge_address_pages.py
```

Execute and replace the earlier limited 2,000-feature raw file:

```bash
python scripts/merge_address_pages.py --execute --force
```

Then run:

```bash
python scripts/intake_sources.py
python scripts/inspect_raw_sources.py
```

Expected address-point total:

```text
219626
```

## Notes

The script writes a backup of the previous raw address-points file before replacing it when `--force` is used.

Report path:

```text
processing/output/reports/address_pages_merge_report.json
```
