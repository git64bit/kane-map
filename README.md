# Kane-Map

Kane-Map is an offline-first residential mapping and field-observation project for Kane County, Illinois.

The project creates a browser-rendered civic navigation map with a Kane-style local grid, simple orientation geometry, and a field ledger for residential building observations.

## Current status

Kane-Map is currently a working offline prototype.

It can be opened directly from `index.html` without a remote server, CDN, package manager, build step, or database server.

Current capabilities include:

```text
Canvas-rendered map
Kane-style grid
chunked local synthetic geometry
red residential building blocks
roads, ponds, and forests
building selection
field observations
visible designator parsing
unit counts
record edit/delete
local persistence
JSON backup/restore
CSV/TXT exports
search
coverage filters
field planning
visit sessions
keyboard shortcuts
tabbed workspace
```

## Quick start

Download or clone the repository, then open:

```text
index.html
```

No build step is required.

## Documentation

Start here:

```text
docs/README.md
```

Then read:

```text
docs/PROJECT_STATE.md
docs/NEXT_STEPS.md
docs/CURRENT_ARCHITECTURE.md
docs/FILE_MAP.md
```

## Design rule

```text
The grid names places.
The field ledger records observations.
The unit list does not become part of the public grid code.
```

## Fieldwork boundary

Kane-Map is based on visible observation only.

The project does not require and does not authorize:

```text
touching mailboxes
opening mailboxes
inserting anything into mailboxes
removing anything from mailboxes
reading mail
recording resident names
bypassing locked or restricted access
```

## Architecture direction

The long-term architecture is:

```text
server-assisted for data preparation
offline-first for field operation
```

A future proxy/server layer may help prepare and version geometry data, but field use should remain able to operate from local files and local records.
