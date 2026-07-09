# Kane-Map pilot launch

From the root of a copied Kane-Map app folder, TrivialHTTP should launch production data with:

```bash
trivialhttp --root . --open "/index.html?data=prepared&bundle=data/kane-county"
```

This should open:

```text
http://127.0.0.1:<port>/index.html?data=prepared&bundle=data/kane-county
```

Expected footer after production data loads:

```text
Runtime: production data active
Data: Kane County production bundle
Load: Layers 5 · Chunks 85 · Features 396,005
```
