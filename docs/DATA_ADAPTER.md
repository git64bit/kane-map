# Data Adapter

Batch 025 adds the first data adapter skeleton.

The purpose is to keep the renderer, search, review, and field-ledger code independent from the origin of the map geometry.

The app should ask for geometry by role:

```text
buildings
roads
water
forests
grid bounds
metadata
```

The adapter decides whether that geometry comes from the current synthetic demo chunks or from prepared Kane County production data later.

## Current active source

The active source remains:

```text
Synthetic demo geometry
```

No real Kane County geometry is bundled yet.

## Future prepared source

The future prepared source is represented by:

```text
src/data/preparedDataManifest.js
src/data/realDataPlaceholder.js
```

These files are placeholders. They document the shape of the future prepared-data path without replacing the demo map.

## Files added

```text
src/data/sourceTypes.js
src/data/realDataPlaceholder.js
src/data/preparedDataManifest.js
src/data/adapter.js
```

## Source modes

```text
demo       current synthetic local chunks
prepared   future generated Kane County chunks
```

## Rule

```text
The renderer should not care whether geometry came from demo chunks or prepared Kane County data.
```

The same rule should apply to search, review filters, record summaries, and export helpers.

## Preferred production path

The preferred production path remains:

```text
Debian 12 or 13 processing node
Python virtual environment
source-data intake and cleanup
Kane-grid assignment
static output generation
copy prepared outputs to local drive or repo
browser consumes prepared static files offline
```

This is a preference, not a hard project dependency.

## What this batch does not do

This batch does not:

- import real GIS data
- change the storage schema
- change saved observations
- change export formats
- add a server
- add a database
- require a package manager
- require a build step

## Later conversion point

When real prepared chunks exist, the intended switch point is in:

```text
src/app/context.js
```

Current line of intent:

```text
sourcePreference: KaneMapSourceTypes.SOURCES.DEMO
```

Future prepared-data test:

```text
sourcePreference: KaneMapSourceTypes.SOURCES.PREPARED
```

That switch should only happen after the prepared-data manifest points to valid static chunks.
