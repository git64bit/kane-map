# Batch 036B — Address Points Paged Downloader

This batch corrects Batch 036 by explicitly adding the address-points paged downloader files.

It adds a dry-run-first script for the Kane County address-point ArcGIS FeatureServer.

The script writes to:

```text
processing/input/downloads/kane-address-points.geojson
```

It does not change browser code.
