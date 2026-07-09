# Next Steps

## Current checkpoint

Batch 060 corrects the portable production-data default so it no longer depends on rewriting a file under `src/`.

The source repository default remains demo mode:

```text
index.html -> demo mode
```

The generated portable app default is production/prepared mode through the generated root config file:

```text
portable_config.js
```

The generated config points to:

```text
data/kane-county
```

## Immediate verification after Batch 060

After this batch is applied and pulled to the Debian processing node, package and verify a new portable app.

Expected source-tree behavior:

```text
index.html                          -> demo mode
index.html?data=demo                -> demo mode
index.html?data=prepared&bundle=... -> production/prepared mode when served locally and bundle exists
```

Expected portable behavior after packaging:

```text
portable app with no query string -> Kane County production bundle
portable app with ?data=demo      -> demo mode override
```

Expected root generated file:

```text
portable_config.js
```

Expected USB testing rule:

```text
If src/ changes: copy src/
If styles/ changes: copy styles/
If index.html changes: copy index.html
If portable_config.js or packaging changes: copy/regenerate portable_config.js
Do not recopy data unless data/package format changes.
```

## Do not do next

Do not add generated county data to GitHub.

Do not introduce TrivialHTTP inside Batch 060.

Do not duplicate the oversized Kane-Map repository into county-map. The generic county-map project should be created cleanly after the package-format boundary is documented.

## Recommended next batches

```text
Batch 061 — county package format specification
Batch 062 — clean county-map source skeleton
Batch 063 — TrivialHTTP project/runtime specification
```
