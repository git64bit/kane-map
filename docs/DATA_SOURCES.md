# Data Sources

Status: planning document.

This document lists candidate source classes for real Kane-Map geometry. It does not approve any source for production import by itself.

Every source must be reviewed for authority, freshness, license/reuse terms, geometry quality, and fitness for Kane-Map's field-observation purpose.

## Source priority

Preferred source order:

```text
1. Kane County official GIS / map services
2. Municipal or township official GIS sources inside Kane County
3. Illinois or federal public datasets
4. Open public datasets with clear provenance
5. Derived/manual geometry created specifically for Kane-Map
```

The app should preserve source provenance even when geometry is simplified or converted.

## Known official Kane County GIS references

Kane County publishes a county maps page that links to informational maps and GIS interactive maps. The county states that its GIS maps can be used to search by address, parcel, district, polling place, forest preserve, municipality, or county facility.

Candidate official county references include:

- Kane County Maps page
- Kane County GIS-Technology Department page
- Kane County PublicGIS/KaneGIS map viewer
- Kane County ArcGIS-hosted layers where publicly accessible

The Kane County GIS-Technology Department describes GIS as connecting data to a map and notes that the county uses Esri software to manage GIS, document data, create software applications, and publish maps.

## Known address point service

A publicly visible ArcGIS REST service exists for Kane County address points:

```text
KaneCo_IL_AddressPoints (FeatureServer)
```

The service description says it is intended to locate every known address location in Kane County, Illinois. Its metadata says the layer was rebuilt from the original address point layer in 2018 and cleaned up afterward to support an E-911 friendly and scalable structure.

This source may be a strong candidate for address-point reference, but it is not automatically enough for HOA unit reconstruction. It may not expose every unit designator needed for building-level unit counts.

## Federal candidate source: Census TIGER/Line

The U.S. Census Bureau publishes TIGER/Line shapefiles. TIGER/Line data can help with county boundary, roads, census geography, and statistical geography.

Census TIGER/Line should not be treated as parcel authority, HOA authority, or address-unit authority. The data.gov metadata warns that TIGER/Line boundary information is for statistical purposes and does not determine jurisdictional authority, rights of ownership, entitlement, or legal land descriptions.

## Candidate layer types

Kane-Map should evaluate the following layer classes:

```text
county boundary
municipal boundaries
township boundaries
road centerlines
water polygons
forest / land-cover polygons
parcel boundaries
building footprints
address points
condo index or condominium references
subdivision names
HOA or association references if available from public records
```

## Source review checklist

Before import, record:

```text
source_name
source_owner
source_url
source_type
access_date
publication_date_or_update_date
license_or_reuse_statement
coordinate_reference_system
geometry_type
attribute_fields
record_count
known_limitations
approved_for_import: yes/no
review_notes
```

## Authority rule

Kane-Map must not blur the difference between source types.

Examples:

```text
address point != confirmed unit count
parcel boundary != building footprint
building footprint != HOA boundary
mailbox designator observation != postal authority
HOA disclosure != field verification
```

Each record should retain its source and confidence.

## Production-source threshold

A source should not move from candidate to production unless:

- the source can be downloaded or queried repeatably
- the source terms permit the intended use or the risk is documented
- the geometry can be normalized
- the source can be versioned
- records can be traced back to source identity
- derived output can be regenerated from raw input

## Manual geometry

Manual or field-created geometry is acceptable when official geometry is missing or unsuitable.

Manual geometry must be labeled as such.

Manual geometry should use statuses such as:

```text
manual-candidate
manual-observed
manual-adjusted
source-conflict
needs-review
```

Manual geometry should not be silently mixed with official source geometry.

