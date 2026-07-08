# Prepare county boundary layer

The county boundary layer is the prepared Kane County clipping and orientation envelope.

The preparation step preserves the county polygon while reducing properties to a small Kane-Map-facing set:

```text
id
name
label
statefp
countyfp
geoid
aland
awater
source_index
```

The output file is:

```text
processing/output/prepared/county_boundary.json
```

This layer is small and should be prepared before heavier building or address outputs.
