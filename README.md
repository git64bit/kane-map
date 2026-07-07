# Kane-Map

Kane-Map is a county-local residential mapping project for Kane County, Illinois.

The purpose is to create a browser-rendered navigational map that helps fieldwork, civic recordkeeping, and address reconstruction where ordinary public-facing sources do not expose the needed residential unit detail.

The project is not intended to replace official GIS, parcel records, postal records, municipal records, or emergency-service addressing systems. Kane-Map is a working civic navigation and observation layer that can cross-reference those sources.

## Core idea

Kane-Map combines:

* a Plus Code-like local grid for human navigation
* simple browser-rendered vector geometry
* red residential building blocks with 1, 2, or 3 story height indicators
* white roads
* blue ponds and water features
* green forests and wooded areas
* dark gray background for contrast
* local cache for base map data
* online sync for points of interest and field observations

The long-term goal is an offline-first map where the base geometry can be downloaded, cached, and rendered locally in the user's browser, while dynamic points of interest and observation records can sync through the network.

## Primary use case

The first operational use case is residential address and unit-count reconstruction.

Some HOAs and residential complexes do not expose unit numbers clearly in public-facing sources. Kane-Map is intended to help record field observations such as:

* building footprint
* building height, estimated as 1, 2, or 3 residential stories
* visible unit designator patterns
* observed unit count
* source of observation
* confidence level
* revisit status
* conflict between field observations and other records

The project explicitly separates map location from address/unit evidence.

The grid names places.

The field ledger records observations.

The unit list does not become part of the public grid code.

## Fieldwork boundary

The address-reconstruction use case is based on visible observation only.

The project does not require and does not authorize:

* touching mailboxes
* opening mailboxes
* inserting anything into mailboxes
* removing anything from mailboxes
* reading mail
* recording resident names
* bypassing locked or restricted access
* entering private or restricted areas without lawful authority

The intended observation is limited to visible designators such as `100A`, `100B`, `1A`, `1B`, or similar labels visible from an open common area or other lawful vantage point.

## Working architecture

The intended architecture is:

```text
Internet server
  ├── static map bundles
  ├── downloaded vector arrays or tiles
  ├── POI API
  ├── field-observation sync API
  └── optional authentication later

Browser workstation
  ├── MapLibre or similar WebGL renderer
  ├── local Kane grid generator
  ├── cached base geometry
  ├── IndexedDB observation ledger
  ├── offline-first field notes
  └── online sync for changed records
```

The base map should be cheap to render: wireframe grid, simple polygons, line geometry, and low-height building extrusions.

## Development rule

This project should remain easy to resume after long pauses.

Every major change should update:

* `docs/PROJECT_STATE.md`
* `ROADMAP.md`, if the next step changes
* relevant documentation near the code

When returning to the project after a gap, read `docs/PROJECT_STATE.md` first.

## Current status

The project is in the documentation and prototype stage.

No real Kane County data has been imported yet.

The first technical target is a browser-only prototype using synthetic data.
