# Import Safety

Batch 014 adds a preview step before JSON import replaces the local Kane-Map field ledger.

## Why this exists

JSON is the full-fidelity backup and restore format. Earlier builds imported JSON immediately after file selection. That was workable for testing, but it was too easy to replace a local ledger accidentally.

The new flow is:

```text
Choose JSON file
Preview import
Review counts, warnings, and errors
Download current backup if needed
Confirm replace
```

## Import mode

The current import mode is still replace mode.

```text
incoming JSON records replace the local ledger
```

This is deliberate. Merge behavior is deferred because duplicate record IDs, edited records, and conflicting building observations need a clear rule before automated merging is safe.

## Preview checks

The preview checks:

- whether the JSON can be parsed
- whether it contains records or a records array
- how many current records would be replaced
- how many incoming records would be imported
- current versus incoming building count
- current versus incoming observed unit total
- current versus incoming verified record count
- current versus incoming conflict record count
- duplicate incoming record IDs
- incoming IDs that overlap current local IDs
- records that reference unknown buildings
- records that reference unknown grid cells
- records that violate fieldwork boundary flags

## Blocked imports

The import is blocked when:

- the JSON cannot be parsed
- the file does not contain importable records
- duplicate imported record IDs are detected
- fieldwork boundary flags indicate mailbox touching, mailbox opening, mail reading, or resident-name recording

## Warnings

Warnings do not block import. They indicate the user should review before replacing the local ledger.

Examples:

```text
records reference buildings not present in the current map data
records reference grid cells not present in the current grid
imported record IDs already exist locally
records do not identify a building
records do not identify a grid cell
```

## Backup rule

Before applying an import, use **Download backup** when the current local ledger matters.

JSON remains the restore format.

CSV and TXT are review formats only.

## Future work

Possible later improvements:

- merge import
- conflict preview
- duplicate detection by building, designator list, and timestamp
- import selected records only
- import into a separate project namespace
- side-by-side comparison of current and incoming records
