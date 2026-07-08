# Kane-Map

Kane-Map is a county-local residential mapping project for Kane County, Illinois.

The application is currently an offline-first browser prototype for field observation, residential-unit counting, planning, review, and export.

## Current status

The app is structurally stable enough to begin real-data planning.

It currently supports:

- direct `index.html` opening
- offline Canvas rendering
- local synthetic chunks
- building selection
- visible designator entry
- automatic unit counts
- local saved records
- edit/delete
- JSON backup/import
- CSV/TXT exports
- search/navigation
- coverage filters
- visit sessions
- field planning
- tabbed workspace
- keyboard shortcuts

## Real-data direction

The preferred real-data workflow is:

```text
Debian 12 or Debian 13 processing node
  -> Python virtual environment
  -> source-data intake
  -> geometry cleanup
  -> Kane-grid assignment
  -> static output files
  -> copy into local Kane-Map data folders
  -> offline browser rendering
```

This is preferred, not mandatory.

The core principle is:

```text
Heavy processing happens outside the browser.
Field use happens inside the browser.
The browser consumes prepared static data.
```

## Documentation

Start with:

```text
docs/README.md
docs/PROJECT_STATE.md
docs/CURRENT_ARCHITECTURE.md
docs/NEXT_STEPS.md
docs/REAL_DATA_PLAN.md
```

## Current next step

Prepare a data-adapter skeleton for future demo/production catalog support.

No real Kane County geometry should be imported until source and processing rules are approved.

