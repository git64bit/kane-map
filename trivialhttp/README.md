# TrivialHTTP

TrivialHTTP is a minimal local-only static file server for USB/browser applications.

Its first pilot use is Kane-Map production data loading. Kane-Map can run its demo mode from `file://`, but production mode loads `data/kane-county/chunk_manifest.json` and chunk JSON files with browser `fetch()`. Current browsers block that from `file://`. TrivialHTTP supplies only the missing local HTTP file-access mechanism.

TrivialHTTP is not a backend, not a hosted service, not a database, and not internet infrastructure.

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

The Windows target is a shipped `.exe`.

Linux and macOS may use scripts during early development, but the same small server core should remain usable there too.

## Pilot command

From the root of a Kane-Map USB app folder:

```bash
trivialhttp --root . --open "/index.html?data=prepared&bundle=data/kane-county"
```

Expected browser URL:

```text
http://127.0.0.1:<port>/index.html?data=prepared&bundle=data/kane-county
```

## Core behavior

TrivialHTTP should:

- bind only to `127.0.0.1`
- serve only files under the selected root folder
- serve `index.html` for `/`
- accept only `GET` and `HEAD`
- block parent traversal such as `../`
- reject symlinks / reparse points where practical
- write no files by default
- open the default browser unless `--no-open` is used

## Current status

This directory starts the TrivialHTTP project as source inside the Kane-Map repo. It is intentionally separate from:

- `src/` browser UI code
- `processing/` data-processing code
- generated county data

The server source is in:

```text
trivialhttp/src/trivialhttp.c
```

Build helpers are in:

```text
trivialhttp/scripts/
```


## Revision note

This archive revision fixes the MinGW Windows build by moving standard C headers outside the platform-specific include branch and limiting MSVC-only pragma comments to MSVC builds.
