# Kane-Map Data Model

Last updated: 2026-07-07

## Purpose

This document defines the early Kane-Map data model.

The model must support a county-local grid, building rectangles, and field observations used for residential address and unit-count reconstruction.

## Core rule

```text
Kane-Map names places.
The address ledger records observations.
The unit list never becomes part of the public grid code.
```

## Main entities

The expected entities are:

```text
grid_cell
site
building
entrance
mailbox_bank
visible_designator
observation_event
source_record
conflict_record
```

## Entity relationships

```text
grid_cell
  └── site
        └── building
              ├── entrance
              └── mailbox_bank
                    └── visible_designator

building
  └── observation_event

site / building / observation_event
  └── source_record

site / building / observation_event
  └── conflict_record
```

A grid cell may contain many sites.

A site may contain many buildings.

A building may have many entrances.

A building may have many mailbox banks.

A mailbox bank may expose many visible designators.

A building may have many observations over time.

## grid_cell

A `grid_cell` is the local Kane-Map navigational unit.

Example code:

```text
KANE-N12-E07
KANE-N12-E07-04
KANE-N12-E07-04-C3
```

Draft fields:

```text
id
code
level
parent_code
geometry
centroid_lat
centroid_lon
plus_code
h3_index
created_at
updated_at
```

Notes:

- `code` must be human-readable.
- `geometry` may be generated rather than stored in early versions.
- `plus_code` and `h3_index` are cross-references, not the public-facing name.

## site

A `site` is a place being tracked, such as a residential complex, parcel cluster, HOA building group, or addressable development area.

Draft fields:

```text
id
grid_cell_code
site_label
site_address
municipality
township
parcel_ids
hoa_name
source_status
geometry
created_at
updated_at
```

Notes:

- A site may not have a reliable public address at first.
- `site_label` can be a working name until a better source is found.

## building

A `building` is a residential structure or structure-like footprint on the map.

Draft fields:

```text
id
site_id
grid_cell_code
building_label
building_number
geometry
estimated_stories
height_meters
residential_type
source_status
observation_status
created_at
updated_at
```

Allowed `estimated_stories` values for the first version:

```text
1
2
3
unknown
```

Suggested `residential_type` values:

```text
single_family
attached_townhome
condo
apartment
mixed_residential
unknown
```

Suggested `observation_status` values:

```text
candidate
located
observed
counted
pattern_inferred
verified
conflict
revisit_needed
```

## entrance

An `entrance` identifies an observed or inferred access point associated with a building.

Draft fields:

```text
id
building_id
entrance_label
location_hint
geometry
access_context
observed_at
notes
```

Suggested `access_context` values:

```text
public_sidewalk
open_common_area
visible_from_exterior
restricted
unknown
```

## mailbox_bank

A `mailbox_bank` identifies a visible group of mailbox designators associated with a building or site.

Draft fields:

```text
id
building_id
entrance_id
mailbox_bank_label
location_hint
access_context
visible_designator_count
observed_unit_count
pattern_summary
confidence
observed_at
notes
```

Notes:

- Do not record resident names.
- Do not record mail content.
- Do not record anything from inside a mailbox.
- The useful data is the visible unit designator pattern and count.

## visible_designator

A `visible_designator` is an observed unit-like label such as `100A`, `100B`, `1A`, or `2B`.

Draft fields:

```text
id
mailbox_bank_id
designator_text
normalized_designator
sequence_group
pattern_type
observed_at
confidence
notes
```

Suggested `pattern_type` values:

```text
number
letter
number_letter
letter_number
floor_unit
range
unknown
```

Examples:

```text
100A -> number_letter
100B -> number_letter
1A   -> number_letter
2B   -> number_letter
101  -> number
A    -> letter
```

## observation_event

An `observation_event` records a field visit or source review.

Draft fields:

```text
id
observed_object_type
observed_object_id
observation_date
observation_method
observer_label
access_context
mailbox_touched
mailbox_opened
mail_read
item_inserted
resident_names_recorded
photo_taken
confidence
summary
notes
created_at
updated_at
```

Required hard-boundary fields:

```text
mailbox_touched: false
mailbox_opened: false
mail_read: false
item_inserted: false
resident_names_recorded: false
```

Suggested `observation_method` values:

```text
visible_mailbox_designators
visible_building_exterior
public_record_review
map_review
parcel_review
hoa_document_review
unknown
```

Suggested `photo_taken` values:

```text
no
exterior_only
mailbox_bank_exterior_only
unknown
```

## source_record

A `source_record` tracks where information came from.

Draft fields:

```text
id
related_object_type
related_object_id
source_type
source_name
source_url
source_date
retrieved_at
source_summary
reliability
notes
```

Suggested `source_type` values:

```text
field_observation
county_gis
parcel_record
municipal_record
hoa_record
public_document
manual_entry
unknown
```

## conflict_record

A `conflict_record` tracks disagreement between sources.

Example:

```text
HOA says 24 units.
Field mailbox designators show 28 visible designators.
Parcel structure suggests 4 buildings.
Status: conflict.
```

Draft fields:

```text
id
related_object_type
related_object_id
conflict_type
claim_a
claim_a_source_id
claim_b
claim_b_source_id
status
resolution_summary
created_at
updated_at
```

Suggested `conflict_type` values:

```text
unit_count_mismatch
address_mismatch
building_count_mismatch
boundary_mismatch
source_authority_mismatch
unknown
```

Suggested `status` values:

```text
open
under_review
resolved
revisit_needed
archived
```

## Confidence values

Use a small controlled vocabulary first:

```text
high
medium
low
unknown
```

A later version can add numeric scoring.

## Visit statuses

Suggested visit statuses:

```text
not_started
candidate
located
observed
counted
verified
conflict
revisit_needed
blocked
not_applicable
```

## Public/private split

Not every field should become public.

Likely public or shareable:

```text
grid cell
building footprint
estimated stories
observation status
unit count summary
source category
confidence
conflict flag
```

Likely private/local unless intentionally published:

```text
raw visit notes
observer identity
precise visit timing
photos
uncertain access notes
sync queue
local draft records
```

Never collect:

```text
resident names from mailboxes
mail content
inside-mailbox information
mailbox contents
keys or access-control information
```

## Minimal first demo data

The first browser prototype can use synthetic records like this:

```json
{
  "id": "bldg-demo-001",
  "grid_cell_code": "KANE-N12-E07",
  "building_label": "B01",
  "estimated_stories": 2,
  "height_meters": 8,
  "observation_status": "candidate"
}
```

No real field observations are required for the first prototype.
