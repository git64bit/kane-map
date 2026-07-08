# Address Points Paged Download

The initial address-point download returned 2,000 features, which is likely a page limit.

Use:

```bash
python scripts/download_address_points_paged.py
```

Then, if the dry run looks correct:

```bash
python scripts/download_address_points_paged.py --execute --force
```

After that, restage the address-points file and inspect raw sources again.
