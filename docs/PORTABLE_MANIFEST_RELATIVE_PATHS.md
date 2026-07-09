# Portable Manifest Relative Paths

The portable county application is generated on the processing node, but it must not depend on the processing node after it is copied to USB.

## Rule

The portable app manifest may describe where data lives inside the app bundle, but it must not contain absolute paths such as:

```text
/home/kaneproc/kane-map/processing/...
```

## Correct portable dependency

The browser app should load county data from the relative path:

```text
data/kane-county
```

The chunk manifest and layer chunks are copied under that directory.

## Source bundle metadata

The source bundle name may be recorded for traceability, but the full source path is intentionally omitted.

```json
{
  "data_path": "data/kane-county",
  "source_data_bundle_name": "kane-map-chunked-prepared-...",
  "source_data_bundle_role": "processing-node-source-only"
}
```

## Deployment meaning

The generated app folder can be copied to USB as a self-contained county app. A launcher or minimal local file server may still be needed for browser file-loading rules, but that launcher should serve files from inside the copied app folder only.
