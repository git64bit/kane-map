# Kane-Map

Kane-Map is a county-local residential mapping project for Kane County, Illinois.

The purpose is to create a browser-rendered navigational map that helps fieldwork, civic recordkeeping, and address reconstruction where ordinary public-facing sources do not expose the needed residential unit detail.

## Current build

This batch introduces a pure offline Canvas prototype.

It requires:

- no CDN
- no server
- no database
- no build step
- no package manager
- no internet connection after download

Open `index.html` directly in a browser.

## What the prototype does

The prototype renders synthetic map data:

- dark gray background
- local Kane-style grid labels
- red 1, 2, and 3 story residential blocks
- white roads
- blue ponds
- green forest polygons
- pan, zoom, rotate, and reset controls
- click selection for grid cells and buildings
- in-memory observation records
- JSON export/import for field observations

The current geometry is synthetic. No real Kane County GIS data has been imported yet.

## Core rule

The grid names places.

The observation ledger records field evidence.

The unit list never becomes part of the public grid code.

## Fieldwork boundary

The fieldwork model is visible observation only.

Do not:

- touch mailboxes
- open mailboxes
- insert anything into mailboxes
- remove anything from mailboxes
- read mail
- record resident names
- bypass locked or restricted access
- treat an unlocked area as automatically lawful access

The useful observation is the visible unit designator pattern and count, not resident identity and not mail content.

## Architecture direction

Kane-Map should be offline-first and server-assisted later.

The browser should be able to run the map locally.

A future server/proxy layer may help with:

- importing public GIS data
- cleaning geometry
- clipping to Kane County
- generating static map bundles
- publishing versioned releases
- optional sync

Field use should not depend on network signal, login, uptime, or a remote database.

## Start here after a pause

Read:

1. `docs/PROJECT_STATE.md`
2. `ROADMAP.md`
3. `docs/OFFLINE_FIRST.md`
4. `docs/PROXY_LAYER.md`
