# TrivialHTTP v0.2 pilot specification

## Purpose

TrivialHTTP lets a static browser application consume prepared local data through normal HTTP semantics when launched from USB or another local folder.

For Kane-Map, it also supplies a narrowly scoped sector-state endpoint. This removes dependence on operating-system mount paths and browser directory permissions while keeping all writes inside the Kane-Map application root.

## Non-goals

TrivialHTTP does not provide:

- remote access
- internet access
- authentication
- database behavior
- county-data processing
- directory listing
- arbitrary file upload
- arbitrary API routes
- installed service behavior

## Runtime behavior

```text
root: current directory
bind: 127.0.0.1
port: 0, meaning choose an available local port
open: /
static methods: GET, HEAD
sector methods: GET, HEAD, PUT
```

## Static request handling

Allowed examples:

```text
GET /index.html
HEAD /index.html
GET /src/app.js
GET /data/kane-county/chunk_manifest.json
```

Rejected examples:

```text
POST, PUT, DELETE, PATCH on static paths
../ traversal
absolute path attempts
Windows drive path attempts
missing files
directories
symlinks / reparse points
```

## Kane-Map sector endpoint

Health and storage identity:

```text
GET /__kane_map/sector-state
```

Sector files:

```text
GET  /__kane_map/sector-state/<sector>.json
HEAD /__kane_map/sector-state/<sector>.json
PUT  /__kane_map/sector-state/<sector>.json
```

Valid sector names are exactly:

```text
N11-E06 through N11-E09
N12-E06 through N12-E09
N13-E06 through N13-E09
N14-E06 through N14-E09
```

The endpoint maps only to:

```text
<root>/project-data/sectors/<sector>.json
```

Sector request bodies are limited to 2 MiB and must identify the Kane-Map sector-state format and matching sector. Writes are completed through a temporary file and then replace the destination file.

## MIME types

The static server hardcodes a small extension map for HTML, JavaScript, CSS, JSON, text, CSV, SVG, common raster images, ICO, WASM, and source maps. Unknown files use `application/octet-stream`.

## Windows target

The Windows artifact should be a standalone `.exe` with no external runtime dependency. It should not require Python, Node.js, PowerShell, administrator rights, service installation, or registry writes.
