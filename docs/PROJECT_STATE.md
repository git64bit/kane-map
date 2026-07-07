# Kane-Map Project State

Last updated: 2026-07-07

## Current phase

Phase 0 — Project memory.

The repository exists and is public.

The project currently needs documentation before application code.

## Current repository state

Known files:

```text
LICENSE
```

Planned first documentation files:

```text
README.md
ROADMAP.md
docs/PROJECT_STATE.md
```

## Project purpose

Kane-Map is a county-local residential mapping and field-observation tool for Kane County, Illinois.

The project is designed around a browser-rendered map with a Plus Code-like local grid, simple orientation layers, and residential building rectangles that can carry field observation records.

## Primary operational problem

Some HOAs and residential buildings do not expose unit numbers in normal public-facing records.

The project needs to help reconstruct residential unit counts by recording visible unit designators and observed building-level evidence.

Example visible designators:

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

The goal is to count addressable units per building or mailbox-bank service area.

## Hard boundary

The fieldwork model is visible observation only.

Do not:

* touch mailboxes
* open mailboxes
* insert anything into mailboxes
* remove anything from mailboxes
* read mail
* record resident names
* enter locked or restricted areas
* bypass access control
* treat an unlocked area as automatically lawful access

The useful observation is the visible unit designator, not resident identity and not mail content.

## Visual model

The working visual target is:

```text
dark gray background
thin wireframe grid
human-readable grid labels
red residential buildings
1, 2, and 3 story block heights
white roads
blue ponds
green forests
simple geometry
browser-side rendering
local cache for base geometry
network sync for points of interest
```

The concept image showed a dark technical dashboard with a local Kane grid and browser-rendered vector objects.

## Architecture direction

The base map should be locally renderable in the browser.

Use the network for:

* initial static data download
* data updates
* points of interest
* field-observation sync, if enabled later

Use local browser storage for:

* cached base geometry
* grid state
* field notes
* visit status
* observation records
* last viewed map position

Preferred storage split:

```text
CacheStorage  = static app assets and downloaded map bundles
IndexedDB     = local structured records and field observations
Memory        = currently visible render objects
Network       = POI and sync records
```

## Grid rule

The grid should stay short and human-readable.

Draft grid example:

```text
KANE-N12-E07
KANE-N12-E07-04
KANE-N12-E07-04-C3
```

The grid locates a place.

The address ledger records what was observed there.

The unit list must not be encoded directly into the public grid name.

## Data model direction

Expected entities:

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

A building may have one or more mailbox banks.

A grid cell may contain many buildings.

A building may have field observations from multiple visits.

## Development approach

Start simple.

The first technical prototype should use fake data.

Do not import real GIS data until the rendering model works.

The first prototype should prove:

* grid rendering
* grid labels
* red building extrusion
* 1 to 3 story height field
* roads
* ponds
* forests
* dark background
* browser-only interaction

## Immediate next step

Add the first documentation files:

```text
README.md
ROADMAP.md
docs/PROJECT_STATE.md
```

Then add the first browser-only prototype.
