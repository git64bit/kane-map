# Kane-Map Fieldwork Rules

Last updated: 2026-07-07

## Purpose

Kane-Map includes a field-observation use case for reconstructing residential address and unit-count information where public or HOA-facing sources are incomplete.

This document defines the project boundary for that fieldwork.

## Core rule

Visible observation only.

The goal is to observe building-level and unit-designator evidence from lawful vantage points without touching, opening, reading, entering, or interfering with anything.

## Mailbox boundary

Do not:

- touch mailboxes
- open mailboxes
- insert anything into mailboxes
- remove anything from mailboxes
- read mail
- photograph mail contents
- record resident names from mailboxes
- infer resident identities from mailboxes
- disturb mailbox areas

The useful data is the visible unit designator, such as:

```text
100A
100B
100C
100D
```

or:

```text
1A
1B
2A
2B
```

The project is interested in unit count and designator pattern, not resident identity.

## Access boundary

Do not assume that an unlocked or open-looking area is automatically lawful to enter.

Do not:

- bypass locked doors
- bypass gates
- enter restricted areas
- ignore posted signs
- follow residents through controlled access points
- enter areas marked private, staff-only, restricted, or similar
- remain after being asked to leave

Acceptable observation contexts may include:

```text
public sidewalk
public road
open common area where lawful access is clear
visible exterior building labels
visible exterior mailbox-bank labels
publicly accessible lobby or vestibule, where lawful access is clear
```

If access is unclear, mark the record as `revisit_needed` or `blocked`.

## Observation target

Kane-Map fieldwork should observe:

- building footprint or apparent building group
- estimated number of residential stories
- visible address numbers
- visible unit designator patterns
- visible mailbox-bank designator count
- entrance relationship, if visible
- conflict between field observation and source records

Kane-Map fieldwork should not observe or collect:

- resident names
- mail content
- personal correspondence
- license plates unless there is a separate documented reason
- faces or resident activity
- private behavior
- access codes
- door codes
- keys
- package labels

## Photos

The safest default is no photo.

If photos are used later, preferred categories are:

```text
no
exterior_only
mailbox_bank_exterior_only
```

Photos should avoid:

- resident names
- mail content
- package labels
- people
- private interior details
- unnecessary identifying details

The first version of Kane-Map does not require photo collection.

## Observation event record

Every field observation should be recorded as an event.

Draft required fields:

```text
observation_date
observation_method
access_context
mailbox_touched
mailbox_opened
mail_read
item_inserted
resident_names_recorded
confidence
summary
```

Hard-boundary values should normally be:

```text
mailbox_touched: false
mailbox_opened: false
mail_read: false
item_inserted: false
resident_names_recorded: false
```

## Confidence levels

Use simple confidence values first:

```text
high
medium
low
unknown
```

Examples:

```text
high
  All visible designators were clear and countable.

medium
  Most designators were visible, but part of the bank was obstructed.

low
  Building was identified, but unit count was inferred or incomplete.

unknown
  Candidate record only. No field observation yet.
```

## Status labels

Use status labels to avoid overstating certainty.

```text
candidate
  Known or suspected from map or source review, not yet visited.

located
  Building or site found.

observed
  Relevant visible evidence was observed.

counted
  Visible unit designators were counted.

pattern_inferred
  A likely sequence was inferred from partial visible labels.

verified
  Field observation matches another source.

conflict
  Sources disagree.

revisit_needed
  Observation was incomplete, uncertain, or access was unclear.

blocked
  Field observation should not continue under current access conditions.
```

## Conflict records

Conflicts are useful and should be preserved.

Example:

```text
Source A: HOA material says 24 units.
Source B: field-visible designators show 28 unit labels.
Status: conflict.
Next step: find additional public source or revisit.
```

Do not force premature resolution.

A conflict is a diagnostic record, not an accusation.

## Field note style

Field notes should be factual and restrained.

Use:

```text
Visible designators appeared to run from 100A through 100H.
Eight labels were visible on mailbox bank M01.
No mailboxes were touched or opened.
No resident names were recorded.
```

Avoid:

```text
They are hiding units.
This HOA is dishonest.
The residents are probably ...
```

Kane-Map records visible evidence and source conflict. It does not need speculation.

## Publication boundary

Not every field note should be public.

Before publishing or syncing any observation, separate:

```text
public summary
local working note
private uncertainty note
source record
conflict record
```

Public-facing summaries should minimize personal detail.

## Fieldwork rule summary

```text
Observe visible designators.
Count units.
Record source and confidence.
Do not touch mailboxes.
Do not read mail.
Do not record resident names.
Do not bypass access.
Do not overstate certainty.
```
