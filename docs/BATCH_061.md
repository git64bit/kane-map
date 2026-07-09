# Batch 061 — explicit portable config boot loading

## Purpose

Batch 061 corrects the Batch 060 portable-config wiring so the runtime behavior is visible and does not depend on `document.write()` from `src/data/realBundleConfig.js`.

## Changes

- `src/app.js` now explicitly attempts to load root `portable_config.js` before creating the app context.
- The footer shows a pending state while data configuration is resolving:
  - `Runtime: resolving data config`
  - `Data: resolving`
  - `Load: pending`
- `src/data/realBundleConfig.js` remains the source-repository demo-safe default and no longer attempts to inject the portable config itself.

## Expected visible results

Source repo or USB without generated portable config:

```text
Runtime: source demo default
Data: Demo
Load: Chunks 4
```

Packaged USB app with generated `portable_config.js` and data served through local HTTP:

```text
Runtime: production data active
Data: Kane County production bundle
Load: Layers 5 · Chunks 85 · Features 396,005
```

Packaged USB app with generated `portable_config.js` but browser blocks local `file://` JSON loading:

```text
Render: boot failed
Data: Production data unavailable
Load: unavailable
```

That last case is expected until TrivialHTTP or an equivalent local file-serving runtime is available.

## USB testing note

This batch changes `src/` only. For USB testing, copy the updated `src/` folder to the USB app. Keep the generated root `portable_config.js` from the packaged app.
