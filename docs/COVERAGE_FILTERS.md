# Coverage Filters

Batch 012 adds a review layer for fieldwork coverage.

The purpose is to make Kane-Map useful as the number of buildings and observations grows. Search finds one object. Coverage review answers a different question: what still needs attention?

## New UI

The right panel now includes a review filter below the local search section.

Available filters:

```text
all buildings
recorded buildings
unrecorded buildings
verified
conflict
revisit needed
counted
observed
```

When a filter is active, matching buildings remain visually prominent and non-matching buildings are dimmed. This is only a review display. It does not delete, hide, or modify records.

The footer shows the active review filter and the number of matching buildings.

## Coverage by grid cell

The right panel also shows coverage by visible grid cells.

Each row shows:

```text
grid cell
recorded buildings / total buildings
latest observed unit total
conflict count
revisit-needed count
```

Only visible cells are shown, so pan and zoom affect the review list.

## Design rule

Coverage is derived from saved local observation records.

The map geometry remains separate from the field ledger.

```text
building geometry + local observations -> coverage review
```

The current implementation does not permanently mark a building as verified in the geometry file. Verification status belongs to the local observation record and can be exported/imported as JSON.

## Conflict behavior

If any record for a building has visit status `conflict`, the building summary is treated as conflict.

If there is no conflict, but any record has visit status `revisit-needed`, the building summary is treated as revisit needed.

Otherwise, the latest record's visit status is used.

This makes conflict and revisit signals hard to miss.

## Current limitations

The coverage layer is currently based on demo geometry.

It is not yet a real Kane County coverage analysis.

Do not use coverage totals as real county totals until real building geometry is imported and validated.
