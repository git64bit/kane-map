# Offline-First Design

Kane-Map should be usable without internet access during fieldwork.

## Offline-first meaning

For this project, offline-first means:

- the map can open from local files
- the base renderer does not require a remote service
- field observations can be recorded without network access
- observations can be exported as JSON
- observations can be imported from JSON
- network sync is optional, not required

## Current offline mode

The current prototype uses:

```text
Canvas rendering
local JavaScript files
synthetic JavaScript data
in-memory observation records
JSON export/import
```

It does not use:

```text
CDN
remote server
remote database
local database
package manager
build process
```

## Why Canvas first

Canvas is not the final GIS answer, but it is the simplest way to prove the offline operating model.

Advantages:

- no third-party dependency
- direct `index.html` open works
- simple 2D drawing model
- cheap rendering for wireframes and polygons
- easy to understand after long pauses

Limitations:

- no built-in GIS projection
- no vector-tile system
- no native label collision handling
- no built-in layer picker
- no automatic hit-testing

## Future storage modes

Kane-Map can support multiple storage modes.

### JSON-only mode

Records exist in memory and are exported/imported as files.

This is the strictest no-database mode.

### Local browser database mode

Records are stored in IndexedDB.

This is still offline and local, but it is a browser-side database.

### Sync mode

Records can optionally sync to a server later.

This must remain optional.

## Runtime rule

The field runtime must not depend on:

- signal
- login
- server uptime
- remote database access
- remote tile servers

A server may help prepare and publish data bundles, but the field map should continue working after those bundles are downloaded.
