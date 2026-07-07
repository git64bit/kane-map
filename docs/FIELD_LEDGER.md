# Field Ledger

Batch 007 introduced the first structured field-observation ledger. Batch 008 fixes designator count handling and record-list display.

The ledger is still fully offline. Records are saved in the browser through `localStorage` and can be exported or imported as JSON. No server, network database, login, package manager, or build step is required.

## Purpose

The ledger exists to support residential address and unit-count reconstruction.

A map object answers:

```text
Where is this building or site?
```

A field ledger record answers:

```text
What was visibly observed at this building or mailbox-bank service area?
```

The Kane grid remains short and navigational. Unit designators do not become part of the public grid code.

## Record fields

Current observation records include:

```text
gridCell
buildingId
buildingLabel
buildingName
stories
siteLabel
entranceId
mailboxBankId
observedUnitCount
designatorPattern
designatorRaw
visibleDesignators
confidence
visitStatus
accessContext
notes
observationMethod
mailboxTouched
mailboxOpened
mailRead
residentNamesRecorded
source
```

## Visible designators

The form accepts visible designators as comma-, space-, semicolon-, tab-, or line-separated values.

Example:

```text
100A, 100B, 100C, 100D
```

The browser parses these into a normalized deduplicated list:

```text
100A
100B
100C
100D
```

If the observed unit count is left blank, Kane-Map uses the parsed designator count as the observed unit count. If visible designators exist, an accidental `0` count does not override them; the parsed designator count is used.

## Status values

Current visit-status values:

```text
observed
counted
pattern-inferred
verified
conflict
revisit-needed
```

Current confidence values:

```text
unreviewed
low
medium
high
```

## Fieldwork boundary flags

Every generated record preserves these negative boundary flags:

```text
mailboxTouched: false
mailboxOpened: false
mailRead: false
residentNamesRecorded: false
```

These are not decorative. They are part of the record discipline.

## Storage migration

Batch 008 updates the record schema to version 4.

The app saves to:

```text
kane-map.local-observations.v4
```

It also attempts to migrate earlier local records from:

```text
kane-map.local-observations.v3
kane-map.local-observations.v2
```

Batch 008 also corrects inconsistent older records where visible designators exist but the stored unit count is `0`. In that case, the visible-designator count becomes the observed unit count during normalization.

Exported JSON is the portability and backup format.

## Next likely improvement

The next improvement should add edit/delete for individual records, not only clear-all.
