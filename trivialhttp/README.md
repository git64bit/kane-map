# TrivialHTTP

TrivialHTTP is a minimal local-only server for USB/browser applications. Its first pilot use is Kane-Map production data loading and sector-state persistence.

Kane-Map loads prepared geometry through normal browser `fetch()` requests. TrivialHTTP also provides one tightly restricted write surface so the browser can maintain the 16 Kane-Map sector files without depending on Windows drive letters, macOS volume paths, or browser folder permissions.

TrivialHTTP is not a hosted service, a database, a general backend, or internet infrastructure.

## Baseline rule

Design for the most locked-down ordinary Windows case:

```text
no Python
no Node
no installed local server
no package manager
no admin rights
no service installation
no registry writes
no browser setting changes
```

The Windows target is a shipped `.exe`. Linux and macOS may use native builds from the same C source.

## Pilot command

From the root of a Kane-Map USB app folder:

```bash
trivialhttp --root . --open "/index.html?data=prepared&bundle=data/kane-county"
```

The browser opens on a loopback URL:

```text
http://127.0.0.1:<port>/index.html?data=prepared&bundle=data/kane-county
```

## Core behavior

TrivialHTTP:

- binds only to `127.0.0.1`
- serves only files under the selected root folder
- serves `index.html` for `/`
- accepts `GET` and `HEAD` for static files
- blocks parent traversal and absolute-path attempts
- rejects symlinks and reparse points where practical
- opens the default browser unless `--no-open` is used

Kane-Map sector persistence is the only write exception:

```text
GET  /__kane_map/sector-state
GET  /__kane_map/sector-state/N11-E06.json
PUT  /__kane_map/sector-state/N11-E06.json
```

Only `N11` through `N14` and `E06` through `E09` are accepted. Files are written beneath the application root:

```text
project-data/sectors/
```

Writes use a temporary file followed by replacement of the destination file. Arbitrary filenames and arbitrary write paths are not exposed.

## Source layout

```text
trivialhttp/src/trivialhttp.c
trivialhttp/src/platform.c
trivialhttp/src/http.c
trivialhttp/src/sector_storage.c
trivialhttp/src/trivialhttp.h
```

Build helpers are in `trivialhttp/scripts/`.
