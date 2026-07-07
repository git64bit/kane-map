# Record Management

Batch 009 adds the first record-management layer for the local field ledger.

## Purpose

Field observations can contain mistakes. The app must support correction without requiring the user to clear every local record.

The current correction workflow is intentionally conservative:

```text
delete the bad local record
create a corrected replacement record
export JSON if a backup is needed
```

Full edit-in-place is deferred until the field ledger has a stable source/conflict model.

## Current capabilities

- delete one local observation record
- keep all other local records intact
- refresh record totals after deletion
- refresh storage status after deletion
- highlight records that belong to the currently selected building
- show a selected-building summary panel

## Selected-building summary

When a building is selected, the summary panel shows:

- building label
- number of saved observations for the building
- latest observed unit count
- latest visit status
- latest confidence
- warning highlight for `conflict` or `revisit-needed`

This is a fieldwork convenience. It is not a legal conclusion and does not replace source records.

## Delete behavior

The delete button removes one record from browser-local storage.

It does not alter:

- exported JSON backups already saved by the user
- static geometry
- grid data
- building definitions
- any future remote or archival layer

## Why edit-in-place is not first

Deletion is safer than editing at this stage because an edit-in-place workflow raises questions that should be designed deliberately:

- should the original observation be preserved?
- should corrections create a new version?
- should conflict records reference both old and new values?
- should exported files keep history?
- should a future audit trail treat edits differently from deletions?

For now, Kane-Map keeps the workflow simple:

```text
bad observation → delete → enter corrected observation
```

## Current storage version

The storage schema remains version 4.

Batch 009 changes record management behavior, not the exported record format.
