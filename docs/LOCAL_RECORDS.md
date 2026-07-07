# Local Records

Kane-Map stores observation records locally in the user's browser.

This is not a remote database and does not require a server.

## Current storage mode

Batch 005 uses `localStorage` for simple durable browser-local storage.

The app also supports JSON export/import so records can be backed up, moved, reviewed, or archived outside the browser.

## What persists

The following records persist after the browser is closed and reopened:

- selected building observations
- observed unit count
- visible designator pattern
- notes
- grid cell
- building ID and label
- story count
- fieldwork boundary flags
- creation date
- schema version

The current storage key is:

```text
kane-map.local-observations.v2
```

## What does not persist yet

The following items are not saved yet:

- last map position
- zoom level
- rotation/bearing
- selected building
- selected grid cell
- imported real geometry
- user preferences

Those can be added later.

## Record envelope

Exports use an envelope format:

```json
{
  "format": "kane-map-offline-observations",
  "version": 2,
  "exportedAt": "2026-07-07T00:00:00.000Z",
  "records": []
}
```

The envelope makes the file easier to validate and migrate later.

## Observation record shape

A current observation record looks like this:

```json
{
  "id": "OBS-000001",
  "schemaVersion": 2,
  "createdAt": "2026-07-07T00:00:00.000Z",
  "updatedAt": "2026-07-07T00:00:00.000Z",
  "gridCell": "N12-E07",
  "buildingId": "B04",
  "buildingLabel": "B04",
  "stories": 3,
  "observedUnitCount": 12,
  "designatorPattern": "100A–100L",
  "notes": "Visible designators only.",
  "confidence": "unreviewed",
  "visitStatus": "observed",
  "observationMethod": "visible designators only",
  "mailboxTouched": false,
  "mailboxOpened": false,
  "mailRead": false,
  "residentNamesRecorded": false,
  "source": "local browser storage"
}
```

## Fieldwork boundary fields

Every record includes explicit negative boundary fields:

```text
mailboxTouched: false
mailboxOpened: false
mailRead: false
residentNamesRecorded: false
```

These are not decorative. They preserve the operating rule that Kane-Map records visible unit-designator evidence, not mail content and not resident identity.

## Why localStorage first

`localStorage` is simple and works when `index.html` is opened directly from the filesystem.

It is acceptable for early prototype records.

It is not the final storage choice for large datasets.

Later storage options:

```text
localStorage  = simple settings and small record sets
IndexedDB     = larger local observation ledger
JSON files    = portable backup and review format
static bundles = base geometry and tile-like chunks
```

## Important limitation

Browser-local storage is tied to the browser and origin.

A record saved in one browser may not appear in another browser.

A record saved from a local file path may not appear if the file path changes significantly.

The safe rule is:

```text
Export JSON before changing machines, browsers, or project folders.
```

## Recovery rule

If local storage fails or is blocked, the app should still run.

In that case, records may only exist during the session and should be exported manually before closing the page.
