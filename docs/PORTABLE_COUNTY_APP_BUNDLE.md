# Portable county app bundle

Kane-Map has two separate outputs:

```text
GitHub repository
  code
  docs
  processing scripts

Processing-node generated output
  raw source data
  prepared data
  chunked data
  packaged county app folders
```

The portable county app bundle belongs to the second category.

It is produced on the processing node after county data has already been downloaded, prepared, chunked, validated, and packaged.

## Intended operating model

```text
processing node
  builds county app bundle

USB drive
  receives the generated county app folder

field computer
  runs the app locally from USB
```

The app must remain independent from GitHub-hosted data files. The large generated data files are not pushed to GitHub.

## County separation

Each county can later be processed and bundled as a separate application folder:

```text
kane-county-map-...
dupage-county-map-...
will-county-map-...
```

The processing scripts can reuse the same pattern while keeping county data outputs separate.

## Local HTTP clarification

If a local HTTP server is later needed, it is only a file-serving mechanism for browser security restrictions around `file://` access.

It is not:

```text
a backend
a cloud service
a database server
a hosted application
```

A later launcher step can decide how to handle Windows, Mac, and Linux/MATE.

## Generated output

The packaging script writes app bundles under:

```text
processing/output/apps/
```

That folder should remain ignored and local.
