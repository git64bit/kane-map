# Next Steps

## Current checkpoint

Batch 059 clarifies the runtime data-source boundary for the Kane County pilot.

The source repository default is demo mode. The generated portable app default is production/prepared mode after packaging rewrites `src/data/realBundleConfig.js` to point at the relative bundle path:

```text
data/kane-county
```

## Immediate verification after Batch 059

After this batch is applied and pulled to the Debian processing node, verify that the source tree still opens in demo mode and that the generated portable app can still be packaged and verified.

Expected browser behavior:

```text
index.html                         -> demo mode
index.html?data=demo               -> demo mode
index.html?data=prepared&bundle=... -> production/prepared mode when served locally and bundle exists
```

Expected portable behavior after packaging:

```text
portable app with no query string  -> Kane County production bundle
portable app with ?data=demo       -> demo mode override
```

## Do not do next

Do not add generated county data to GitHub.

Do not introduce TrivialHTTP inside Batch 059.

Do not duplicate the oversized Kane-Map repository into county-map. The generic county-map project should be created cleanly after the package-format boundary is documented.

## Recommended next batches

```text
Batch 060 — county package format specification
Batch 061 — clean county-map source skeleton
Batch 062 — TrivialHTTP project/runtime specification
```
