# Batch 067 — Browser-chunk flat prepared production loading

## Purpose

This batch fixes the current browser-runtime bottleneck without changing the processing workflow or generated data location.

The current production UI points at:

```text
processing/output/prepared
```

with:

```text
format=flat-prepared
```

That path contains the five prepared JSON layer files. The previous flat-prepared loader could reach those files through TrivialHTTP, but it treated each entire layer as one giant runtime chunk. On Kane County data, that forces very large conversion work at boot.

## Changed files

```text
src/data/chunkedBundleLoader.js
src/data/realBundleConfig.js
src/app/context.js
src/app.js
```

## Runtime changes

The flat-prepared loader now:

- keeps `processing/output/prepared` as the production path
- loads the same five prepared JSON files
- splits flat layer feature arrays into browser-side runtime chunks
- yields back to the browser between large conversion batches
- reports the resulting chunk count through the existing load status

The app context also stops building the all-cell data twice during boot.

## Expected UI result

After copying `src/` to the USB app and reloading through TrivialHTTP, the footer should show:

```text
UI: Batch 067
```

After switching to Production, the expected target is still:

```text
index.html?data=prepared&bundle=processing%2Foutput%2Fprepared&format=flat-prepared
```

If the browser completes the load, the status should show production active, with a larger browser-side chunk count than 5.
