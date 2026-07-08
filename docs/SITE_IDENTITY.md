# Site Identity Layer

Batch 015 adds a small identity layer for field records.

The goal is to separate three things that are easy to confuse during fieldwork:

```text
map building ID      = synthetic or imported geometry identifier, such as B20
site label           = observed or working place name, such as King's Row Condos
building alias       = local building description, such as North Building or Building 2
```

The map building ID is the anchor used by the app.

The site label and building alias are field notes attached to observation records. They are not treated as official names unless a later source record confirms them.

## Why this matters

HOA and condominium buildings may use names, phases, mailbox-bank designators, entrance labels, or address ranges inconsistently. A field record should preserve what was observed without overwriting the map object identity.

Example:

```text
B20
Grid: N14-E08
Site label: King's Row Condos
Building alias: East building
Mailbox bank: M01
Visible designators: 101, 102, 103, 104
```

This lets Kane-Map answer both questions:

```text
Where is the map object?
What did the field observation call it?
```

## Identity checks

The selected-building panel now summarizes:

- site labels used on that building
- building aliases used on that building
- entrance IDs
- mailbox-bank IDs
- warnings when multiple labels or aliases appear on the same building
- warnings when the same site label or alias appears across multiple buildings

These warnings are diagnostic hints, not errors.

A repeated site label across buildings may be correct for a multi-building condominium site. A repeated designator set may indicate a duplicate entry. The app flags the condition so the user can review it.

## Storage

Observation schema version is now v6.

New field:

```text
buildingAlias
```

Older records migrate automatically. If the field is missing, it becomes an empty string.

## Export and search

The observation CSV now includes `building_alias`.

The building summary CSV includes observed site labels and building aliases when available.

Navigation search includes building aliases, so a local name such as `north building` can find the relevant saved record.
