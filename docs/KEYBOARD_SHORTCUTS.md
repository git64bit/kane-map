# Keyboard Shortcuts

Batch 019 adds keyboard and fieldwork-speed controls without changing the local record schema.

The goal is to reduce pointer travel during field observation while preserving the offline-first architecture.

## Shortcut table

| Shortcut | Action |
|---|---|
| `/` | Focus navigation search and switch to the Map tab |
| `1` | Open Map tab |
| `2` | Open Observe tab |
| `3` | Open Records tab |
| `4` | Open Review tab |
| `5` | Open Plan tab |
| `6` | Open Export tab |
| `7` | Open Project tab |
| `N` | Select next visible building |
| `P` | Select previous visible building |
| `S` | Save the current observation when the form has content |
| `Ctrl+Enter` / `Cmd+Enter` | Save the current observation while typing in a form field |
| `X` | Clear the observation form without changing saved records |
| `C` | Copy the selected building or grid-cell summary |
| `E` | Export the full JSON backup |
| `R` | Reset map view |
| `Esc` | Cancel edit mode, clear search, or blur the active input |

## Typing rule

Plain-letter shortcuts are ignored while the user is typing in text inputs, textareas, or select boxes.

Exceptions:

- `Esc` remains active.
- `Ctrl+Enter` / `Cmd+Enter` can save from inside the form.

This prevents unit designators, notes, and site labels from being intercepted as commands.

## Save safety

The `S` shortcut will not create an empty observation from only the default visit date.

At least one meaningful field must be present, such as:

- site label
- building alias
- entrance
- mailbox bank
- visible designators
- unit count
- designator pattern
- access context
- notes
- planned action
- non-default priority, confidence, or visit status

## Next / previous building

`N` and `P` navigate through buildings in the visible cells.

They respect the active Review filter. For example, if the Review tab filter is set to `revisit-needed`, next/previous navigation cycles through visible buildings matching that filter.

## Copy selected summary

`C` copies a compact summary suitable for notes or external logs.

Example:

```text
Building: B20
Grid cell: N14-E08
Site: King's Row Condos
Stories: 3
Observed units: 12
Status: verified
```

The copy operation uses the browser clipboard when available and a textarea fallback otherwise.

## Design note

This batch does not add a server, database, package manager, build step, or external dependency.
