# Tabbed Workspace

Batch 018 reorganizes the Kane-Map interface into task-focused workspace tabs.

The purpose is to reduce left-panel clutter without changing storage, schema, exports, map rendering, or offline behavior.

## Workspace tabs

The tab set is:

```text
Map
Observe
Records
Review
Plan
Export
Project
```

## Tab purposes

### Map

Contains orientation and navigation tools:

- legend
- selected grid cell and building details
- building summary
- identity summary
- view controls
- search

### Observe

Contains the field-entry form:

- visit date
- field session
- plan priority/action
- site label
- building alias
- entrance
- mailbox bank
- visible designators
- unit count
- confidence
- visit status
- access context
- notes

### Records

Contains saved local observations:

- record count
- selected-building-only filter
- edit/delete controls
- latest local record list

### Review

Contains coverage and status review:

- coverage summary
- review filter
- coverage by visible grid cell

### Plan

Contains fieldwork planning and visit-session review:

- visit-session summary
- visit-session rows
- field-plan summary
- active worklist filter
- field-plan rows

### Export

Contains record export/import tools:

- JSON backup
- CSV exports
- TXT field report
- JSON import preview
- backup before import
- replace local records

### Project

Contains project state and dangerous actions:

- offline-first status
- schema/documentation note
- clear saved records

## Persistent selected-building header

The workspace now keeps a compact selected-object header below the tabs.

Example:

```text
Selected: B20 · N14-E08 · King's Row Condos · 12 units · verified
```

This stays visible while switching tabs so the user can keep context while reviewing records, planning, or exporting.

## Design rule

The map remains visible at all times.

The left workspace changes task mode.

The data model does not change.
