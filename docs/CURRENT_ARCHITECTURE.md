# Current Architecture

Last updated: 2026-07-08

Kane-Map currently follows an offline-first, browser-only architecture.

The application runs as a static web page. It can be opened directly from `index.html` without a remote server, package manager, build step, CDN, or database server.

## Architecture summary

```text
Static files on disk
  ├── index.html
  ├── styles/*.css
  ├── src/**/*.js
  └── src/data/chunks/*.js

Browser runtime
  ├── Canvas renderer
  ├── local synthetic geometry chunks
  ├── generated Kane-style grid
  ├── localStorage field ledger
  ├── JSON import/export
  ├── CSV/TXT review exports
  └── keyboard/search/review/plan workflows
```

## Runtime model

The current app does not require:

```text
remote server
remote database
CDN
npm
bundler
build step
online basemap
tile server
login
sync service
```

The current app does use:

```text
browser Canvas
ES modules
localStorage
local JavaScript geometry chunks
JSON export/import
CSV/TXT file downloads
```

## Why Canvas is used now

The first MapLibre concept proved the visual direction, but the current implementation intentionally uses a pure Canvas renderer.

Reasons:

```text
true direct-file offline use
no vendored megabyte library yet
no local server requirement
small codebase
full control over simplified polygons
simple path toward fieldwork-specific rendering
```

MapLibre, PMTiles, or vector tiles may still be appropriate later for larger real-data rendering, but the current Canvas renderer is the correct simple base for this prototype stage.

## Data strategy

The app currently uses synthetic local data chunks.

Current data strategy:

```text
Grid cells        generated locally
Roads            local chunk geometry
Ponds/water      local chunk geometry
Forests          local chunk geometry
Buildings        local chunk geometry
Observations     localStorage + JSON export
Reports          CSV/TXT export
```

Future real-data strategy:

```text
County boundary       prepared from public GIS/source data
Building footprints   imported/generated/cleaned externally
Roads/water/forest    imported and simplified externally
Chunks                generated as static local bundles
Field observations    remain local/exportable first
Sync                  optional later
```

## Server-assisted, not server-dependent

The preferred long-term model is:

```text
server-assisted preparation
offline-first operation
```

A future proxy/server layer is useful for:

```text
public data ingestion
format conversion
geometry simplification
county clipping
bundle generation
versioning
optional sync
optional public distribution
```

But field use should remain able to work without the server once the local data bundle is present.

## Record model

The field ledger currently records observations attached to map buildings.

Conceptual layers:

```text
Kane grid cell
  └── building geometry
        └── site/building identity
              └── observation record
                    └── visible designators and count
```

Core principle:

```text
The grid names places.
The field ledger records observations.
The unit list does not become part of the public grid code.
```

## Fieldwork boundary

The current record schema includes explicit flags that reinforce the project boundary.

The project does not require and does not authorize:

```text
touching mailboxes
opening mailboxes
inserting anything into mailboxes
removing anything from mailboxes
reading mail
recording resident names
bypassing locked or restricted areas
```

The useful observation is visible unit designators and related building/site context.

## Current UI structure

The left workspace is organized into task tabs:

```text
Map
Observe
Records
Review
Plan
Export
Project
```

A persistent selected-object header remains visible across tabs.

This structure should be preserved. New features should usually be assigned to an existing tab before creating another tab.

## Current persistence model

Records are currently saved in `localStorage`.

JSON export is the portable backup and restore format.

CSV and TXT are review/report formats, not restore formats.

Rule:

```text
JSON restores the ledger.
CSV reviews the ledger.
TXT summarizes the ledger.
```

## Current code organization

The large original application file was split into controllers.

The renderer was split into focused map modules.

The CSS was split into focused style files.

This makes the project structurally ready for the next major stage: real-data preparation planning.

## Current constraints to preserve

Preserve these unless a deliberate architecture decision changes them:

```text
open index.html directly
no required server
no required package manager
no required build step
small source files
JSON backup/restore
fieldwork boundary flags
offline-first operation
```

## What should not be added casually

Do not add these without an explicit project decision:

```text
remote-only basemap
mandatory login
mandatory online sync
server database dependency
large framework dependency
build tool dependency
mailbox/resident identity capture
```
