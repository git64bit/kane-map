# Batch 060 — Portable Config and Status-Bar Cleanup

## Purpose

Batch 060 corrects the production-default wiring introduced in Batch 059.

Batch 059 made prepared/production failures visible and added data-source status, but the generated portable app still depended on rewriting `src/data/realBundleConfig.js`. That created a testing problem: copying a refreshed `src/` folder to the USB app reset the portable default back to the source-repository demo default.

## Changes

```text
src/data/realBundleConfig.js
portable_config.js
src/app.js
processing/kane_map_processing/portable_app_package.py
docs/PROJECT_STATE.md
docs/NEXT_STEPS.md
docs/BROWSER_REAL_DATA_LOADER.md
docs/BATCH_060.md
```

## Runtime config boundary

The source repository remains demo-safe by default.

The generated portable app now writes production defaults to a root file outside `src/`:

```text
portable_config.js
```

The source runtime config attempts to load that optional root file during startup. This keeps USB testing simple:

```text
copy src/ when browser code changes
copy styles/ when styles change
copy portable_config.js only when packaging/runtime config changes
```

## Status bar cleanup

The stale hardcoded footer label:

```text
Demo mode by default · prepared mode by URL
```

is now replaced at runtime with a maintained status value such as:

```text
Runtime: source demo default
Runtime: portable production default
Runtime: production data active
```

The data-load status now includes a stable prefix:

```text
Load: Layers ... · Chunks ... · Features ...
```

## Not included

This batch does not introduce TrivialHTTP, a Windows `.exe`, a frozen browser, or the generic `county-map` project.
