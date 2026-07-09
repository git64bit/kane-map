# Batch 063 — TrivialHTTP project skeleton

## Purpose

Start TrivialHTTP as its own source directory in the Kane-Map repository.

The immediate reason is Kane-Map production data loading. The UI switch now proves that production mode asks the browser to fetch:

```text
data/kane-county/chunk_manifest.json
```

When the app is opened through `file://`, current browsers block that fetch. TrivialHTTP supplies only a local HTTP file-access mechanism.

## Added

```text
trivialhttp/README.md
trivialhttp/SPEC.md
trivialhttp/src/trivialhttp.c
trivialhttp/scripts/build-linux.sh
trivialhttp/scripts/build-macos.sh
trivialhttp/scripts/build-windows-mingw.sh
trivialhttp/examples/kane-map/README.md
```

## Boundary

This batch does not change:

```text
src/
styles/
index.html
processing/
data files
packaged app output
```

It does not repackage the app and does not touch generated data.

## Pilot command

From the root of a Kane-Map USB app folder:

```bash
trivialhttp --root . --open "/index.html?data=prepared&bundle=data/kane-county"
```

## Design target

TrivialHTTP is designed for locked-down Windows first:

```text
standalone .exe
no Python
no Node
no admin rights
no service install
no registry writes
bind only 127.0.0.1
GET/HEAD only
serve only the launch/root folder
```

Linux and macOS build scripts are included for development convenience.


## Revision note

This archive revision fixes the MinGW Windows build by moving standard C headers outside the platform-specific include branch and limiting MSVC-only pragma comments to MSVC builds.
