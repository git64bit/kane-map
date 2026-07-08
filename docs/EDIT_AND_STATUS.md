# Edit and Status Overlay

Batch 010 adds two fieldwork workflow improvements.

## Edit saved observations

Saved local observation records can now be edited in place.

Use this when:

- a unit count was entered incorrectly
- visible designators were incomplete
- confidence should be changed
- visit status should move from `observed` to `verified`
- notes need correction
- an address/site label needs refinement

Editing preserves the original record ID and creation date. The record receives a new `updatedAt` timestamp.

## Selected-building filter

The Offline records panel now includes a `selected building only` checkbox.

When enabled, the record list shows only records attached to the currently selected building.

This is useful when a grid cell contains several buildings or when repeat visits create multiple records.

## Building status markers

Buildings with saved records now display a small status marker on the map.

The marker shows the latest observed unit count when available.

Marker status priority:

```text
conflict
revisit-needed
latest visit status
```

This means a building with any conflict record remains visually flagged until the conflict is corrected or deleted.

## Schema change

The local record schema moved from v4 to v5.

The browser migrates older local records from:

```text
kane-map.local-observations.v4
kane-map.local-observations.v3
kane-map.local-observations.v2
```

to:

```text
kane-map.local-observations.v5
```

JSON export/import remains the backup and portability mechanism.
