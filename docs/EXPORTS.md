# Exports

Kane-Map keeps JSON as the full-fidelity backup format and adds CSV/TXT exports for review work.

## Export JSON

Use JSON when preserving or moving the complete local field ledger.

JSON includes:

- schema version
- record IDs
- timestamps
- building references
- grid cells
- visible designators
- unit counts
- notes
- fieldwork-boundary flags

JSON is the format to use before moving browsers, clearing local records, or archiving the working ledger.

## Export observation CSV

Use observation CSV when reviewing every saved observation record in a spreadsheet.

One row equals one saved observation record.

Typical columns include:

```text
id
building_id
building_label
grid_cell
site_label
entrance_id
mailbox_bank_id
observed_unit_count
visible_designators
confidence
visit_status
access_context
notes
updated_at
boundary
```

The CSV is intentionally flat. It is not the canonical backup format.

## Export building CSV

Use building CSV when reviewing the latest known state of each building.

One row equals one building in the current local dataset.

The building CSV includes recorded and unrecorded buildings. This makes it useful for coverage checks.

Typical columns include:

```text
building_id
building_label
building_name
grid_cell
stories
record_count
latest_unit_count
status
confidence
count_variants
latest_updated_at
```

## Export field report

Use the field report for a compact text summary.

The report includes:

- generated timestamp
- recorded/unrecorded building count
- latest observed unit total
- verified/conflict/revisit totals
- grid-cell coverage rows
- fieldwork boundary statement

The report is meant for quick review, not data restore.

## Current rule

```text
JSON restores the ledger.
CSV reviews the ledger.
TXT summarizes the ledger.
```
