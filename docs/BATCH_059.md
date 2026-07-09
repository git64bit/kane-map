# Batch 059 — Explicit Production Data Mode

## Purpose

Make the Kane-Map data-source behavior explicit before the county-map and TrivialHTTP split.

## Changes

```text
src/data/sourceTypes.js
src/data/adapter.js
src/app.js
docs/PROJECT_STATE.md
docs/NEXT_STEPS.md
docs/BROWSER_REAL_DATA_LOADER.md
```

## Runtime rules

```text
source repo default: demo
portable app default: production/prepared after packaging config rewrite
?data=demo: force demo
?data=prepared: force prepared/production
```

## Production failure rule

Prepared/production mode no longer silently falls back to demo data. If production data is requested and unavailable, the app reports a visible production-data-unavailable boot status.

## Not included

```text
TrivialHTTP
Windows .exe
Mac/Linux launchers
frozen browser
county-map repo creation
lazy loading rewrite
```
