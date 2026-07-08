# Kane-Map Project State

Last updated: 2026-07-08

## Current phase

Real-data planning.

The offline prototype is working and has been refactored into maintainable modules.

## Current stable checkpoints

- Offline Canvas renderer works.
- Browser-local persistence works.
- JSON export/import works.
- Import preview and safety checks work.
- Field ledger supports visible designators and unit counts.
- Record edit/delete works.
- Search works.
- Coverage filters work.
- CSV/TXT exports work.
- Tabbed workspace works.
- Keyboard shortcuts work.
- App controller refactor works.
- Renderer refactor works.
- CSS refactor works.
- Documentation index exists.

## Current architecture

```text
Static offline app
  -> direct index.html opening
  -> no server required
  -> no database required
  -> no package manager required
  -> localStorage for current ledger
  -> JSON backup/restore
  -> CSV/TXT review exports
```

## Preferred real-data processing architecture

```text
Debian 12 or Debian 13 processing node
  -> Python virtual environment
  -> source-data intake
  -> geometry normalization
  -> Kane-grid assignment
  -> static production files
  -> copy files into Kane-Map local data folder
```

This is preferred, not mandatory.

## Key principle

```text
Heavy processing happens outside the browser.
Field use happens inside the browser.
The browser consumes prepared static data.
```

## Data scale assumption

Kane County is not expected to require a permanent database server for single-user offline use.

The expected limiting factor is not raw record count. The limiting factors are:

- source provenance
- stable IDs
- geometry cleanup
- chunk generation
- data model discipline
- field-record safety

## Immediate next step

Add data-adapter code skeleton for demo vs production data catalogs without importing real data yet.

Suggested next batch:

```text
Batch 025 — data adapter skeleton
```

