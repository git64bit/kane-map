# TrivialHTTP v0 pilot specification

## Purpose

TrivialHTTP exists to let static browser applications consume local JSON/data packages through normal HTTP semantics when opened from USB or another local folder.

The Kane-Map pilot proved the need: selecting production data makes the browser request `data/kane-county/chunk_manifest.json`, but `file://` blocks the request.

## Non-goals

TrivialHTTP does not provide:

- remote access
- internet access
- authentication
- database behavior
- county-data processing
- API routes
- write endpoints
- file upload
- directory listing
- installed service behavior

## Runtime behavior

Default behavior:

```text
root: current directory
bind: 127.0.0.1
port: 0, meaning choose an available local port
open: /
methods: GET, HEAD
writes: none
```

Kane-Map production pilot behavior:

```text
root: USB app folder
open: /index.html?data=prepared&bundle=data/kane-county
```

## Request handling

Allowed:

```text
GET /index.html
HEAD /index.html
GET /src/app.js
GET /data/kane-county/chunk_manifest.json
GET /data/kane-county/<layer>/<chunk>.json
```

Rejected:

```text
POST, PUT, DELETE, PATCH
../ traversal
absolute path attempts
Windows drive path attempts
missing files
directories
symlinks / reparse points where the platform exposes them
```

## MIME types

The pilot server hardcodes a small static extension map for:

```text
html, js, css, json, txt, md, csv, svg, png, jpg, jpeg, gif, webp, ico, wasm, map
```

Unknown files are served as:

```text
application/octet-stream
```

## Windows target

The Windows artifact should be a standalone `.exe` with no external runtime dependency.

It should not require:

```text
Python
Node.js
PowerShell
administrator rights
service installation
registry writes
```

If Windows policy blocks arbitrary executables from USB, that is an execution-policy problem outside TrivialHTTP's control. TrivialHTTP should still avoid adding avoidable Windows friction.

## Project boundary

TrivialHTTP should remain generic. County-map-specific launch behavior belongs in wrapper configuration, command lines, shortcuts, or a later viewer shell.
