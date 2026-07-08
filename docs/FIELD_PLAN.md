# Field Plan

Batch 017 adds a lightweight offline field-planning layer.

The field plan is not routing software and does not require GPS, a server, or a database. It is a local worklist derived from saved observation records, building status, and simple priority fields.

## Purpose

The map already records observations. The field plan helps decide what to do next.

It supports:

- marking a building as low, medium, high, or urgent priority
- recording a planned action note
- listing buildings that are unrecorded
- listing buildings with conflict or revisit-needed status
- exporting the current field plan as CSV
- jumping from a plan row to the building on the map

## New record fields

Observation records now include:

```text
planPriority
planAction
```

Allowed `planPriority` values:

```text
none
low
medium
high
urgent
```

Example `planAction` values:

```text
revisit south mailbox bank
verify unit count from exterior directory
compare with parcel record
check if building belongs to same HOA site
```

## Plan filters

The field-plan panel includes these filters:

```text
Active worklist
Priority only
Conflict / revisit
Unrecorded
All buildings
```

The default active worklist includes buildings that are:

- priority-marked
- conflict status
- revisit-needed status
- unrecorded

This keeps the worklist focused on unresolved fieldwork.

## Export rule

JSON remains the full-fidelity restore format.

CSV exports are review and planning formats.

The field-plan CSV is intended for printing, spreadsheet review, or temporary fieldwork sorting. It does not replace the JSON ledger.

## Offline boundary

The field plan remains local to the browser unless exported by the user.

No server, database, account, sync layer, or network connection is required.
