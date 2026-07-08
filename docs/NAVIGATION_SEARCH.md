# Navigation Search

Batch 011 adds an offline navigation and search layer.

The purpose is to make Kane-Map usable after the number of grid cells, buildings, and saved observations grows beyond what can be managed visually.

## What can be searched

The search box can match local data only. It does not use a server or network request.

Current searchable fields include:

- grid cell code, such as `N14-E08`
- building label, such as `B20`
- building name
- building story count
- saved observation ID
- site label or address note
- entrance ID
- mailbox bank ID
- visible unit designators
- observed unit count
- visit status
- confidence
- access context
- notes

Examples:

```text
B20
N14-E08
verified
revisit
King's Row
301
12 units
```

## Jump behavior

Selecting a search result recenters the canvas.

- A grid result jumps to the grid cell.
- A building result jumps to the building and selects it.
- A saved-record result jumps to the record's building.

This is still fully offline. The app builds the search index from local grid cells, local chunked geometry, and local observation records.

## Coverage summary

The right panel now includes a coverage summary:

```text
recorded buildings / total buildings
latest observed unit total
verified / revisit / conflict counts
saved observation record count
```

The summary uses the latest saved record per building for the latest observed unit total.

## Limits

This is not full-text indexing yet. It is a simple in-memory scan over currently available local records and all locally registered demo buildings.

For the current offline prototype, this is correct. A heavier search index should wait until the real Kane County data model is larger and more stable.
