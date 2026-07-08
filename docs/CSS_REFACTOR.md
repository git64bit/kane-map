# CSS Refactor

Batch 022 split the single `styles/app.css` file into focused stylesheet files.

## Purpose

The UI had grown enough that one stylesheet was becoming a maintenance risk. This batch is a structural refactor only.

No intended changes were made to:

- JavaScript behavior
- storage schema
- local records
- imports
- exports
- rendering logic
- keyboard shortcuts
- fieldwork workflow

## Current stylesheet structure

```text
styles/
  app.css              compatibility marker only
  base.css             variables, reset, typography, small global utilities
  layout.css           app shell, map stage, canvas layout, section layout
  panels.css           floating panels, brand header, legend, selected summaries
  buttons.css          buttons, file buttons, button grids/stacks
  forms.css            observation form fields, form grids, notices, boundary box
  records.css          saved-record list, record actions, selected-record styling
  navigation.css       search UI and shortcut grid
  review.css           review filters, coverage rows, field-plan rows
  import-export.css    import preview and import comparison styles
  tabs.css             workspace tabs and persistent selected header
  status.css           footer status bar
```

## Loading model

`index.html` links the split stylesheets directly in dependency order.

Direct links were chosen instead of `@import` so browser developer tools show the owning file for each rule and so the load path stays simple for direct local `index.html` use.

## Compatibility note

`styles/app.css` remains in the repository as a short manifest/marker file because earlier documentation refers to it. The active page no longer depends on it.

## Test checklist

After applying this batch, test:

1. Open `index.html` directly.
2. Confirm the dark map, panels, tabs, forms, buttons, records, and status footer still look normal.
3. Switch every workspace tab.
4. Select a building.
5. Save/edit/delete a test observation.
6. Use search and keyboard shortcuts.
7. Export/import JSON.

If those pass, this refactor can be treated as a stable CSS checkpoint.
