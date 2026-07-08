# Visit Sessions

Batch 016 adds a visit/session layer to the offline field ledger.

## Purpose

Kane-Map needs to track more than building-level observations. It also needs to answer:

```text
When was this place visited?
Which buildings were covered during the same field session?
Which records still need follow-up?
How much work was completed on a given date?
```

The visit/session layer keeps those answers inside the same offline JSON ledger.

## New fields

Each observation record now includes:

```text
visitDate
fieldSessionId
```

`visitDate` is a plain date, such as:

```text
2026-07-07
```

`fieldSessionId` is user-controlled. Suggested examples:

```text
2026-07-07-AM
2026-07-07-KINGS-ROW
AURORA-WEST-01
```

If no session ID is entered, Kane-Map groups the record by visit date.

## Local behavior

The visit date defaults to today.

After saving a record, Kane-Map keeps the same visit date and session ID in the form. This supports repeated entries during the same field session.

## Visit summary

The right panel now includes a Visit Sessions section showing:

- total records
- buildings covered
- number of visit dates
- number of sessions
- follow-up records
- recent session rows

The footer also displays:

```text
Visits: X days / Y sessions
```

## Export

Batch 016 adds:

```text
Export visit CSV
```

This export summarizes each session by:

- session ID
- record count
- building count
- unit total
- verified count
- conflict count
- revisit count
- latest updated timestamp

JSON remains the full-fidelity restore format.

CSV remains a review/reporting format.

## Schema migration

The observation schema moves to version 7.

Older records are migrated by assigning `visitDate` from the existing creation timestamp when available. `fieldSessionId` remains blank unless already present in imported data.

## Boundary

The visit/session layer does not change the fieldwork boundary.

The record remains limited to visible observation only:

```text
No mailbox touched.
No mailbox opened.
No mail read.
No resident names recorded.
```
