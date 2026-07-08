# Source Acquisition

Batch 028 introduces source-acquisition planning for Kane-Map.

This is still a controlled planning layer. The processing node can now report candidate source URLs, but it does not automatically download, query, transform, or normalize production geometry.

## Operating rule

```text
Confirm source authority and reuse posture before production acquisition.
```

The processing workflow remains:

```text
source research
  -> source registry
  -> manual review
  -> controlled acquisition
  -> raw local files
  -> later transformation scripts
  -> prepared static browser data
```

## Why this step exists

The browser app is already offline-first and structurally ready for prepared static data. The next risk is not rendering. The next risk is importing real geometry too casually.

Kane-Map needs stable intake rules for:

- source authority
- source URL provenance
- file naming
- raw-file preservation
- format conversion
- licensing/reuse review
- county clipping
- layer meaning
- prepared-output validation

## Candidate source classes

The current registry tracks these source classes:

| Layer | Current role |
|---|---|
| `county_boundary` | clipping boundary and grid extent |
| `address_points` | address-location reference |
| `buildings` | red residential building geometry candidate |
| `roads` | white orientation-road geometry |
| `water` | blue pond/water orientation polygons |
| `forests` | green orientation polygons; deferred until source meaning is clearer |

## Do not confuse source with prepared output

Raw sources may be ZIP shapefiles, ArcGIS FeatureServer endpoints, GeoJSON files, or other formats.

Prepared Kane-Map output should eventually become simple static browser-consumable files.

```text
Raw source format != prepared browser format
```

Example:

```text
TIGER roads ZIP
  -> processing node
  -> normalized road features
  -> prepared Kane-Map chunk files
```

## New command

From `processing/`:

```bash
python scripts/show_source_urls.py
```

This prints candidate URLs and local targets.

It does not download anything.

## Current position

The registry now contains candidate URLs for several sources, but production use is not approved merely because a URL appears in the registry.

Before adding downloader scripts, confirm:

- the source is appropriate
- the source is stable enough
- the source's reuse posture is acceptable
- the local target filename is correct
- the layer meaning is correct for Kane-Map

## Next step

After source-acquisition planning is accepted, the next technical batch can add controlled download scripts that are still disabled or preview-first by default.
