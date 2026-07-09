(function attachChunkedBundleLoader(global) {
  "use strict";

  const FLAT_PREPARED_LAYERS = Object.freeze([
    { layer: "county_boundary", path: "county_boundary.json" },
    { layer: "roads", path: "roads.json" },
    { layer: "water", path: "water.json" },
    { layer: "buildings", path: "buildings.json" },
    { layer: "address_points", path: "address_points.json" }
  ]);

  function requestedPreparedMode(config, locationObject) {
    const location = locationObject || global.location;
    const params = new URLSearchParams(location && location.search ? location.search : "");
    const names = (config.urlParameters && config.urlParameters.source) || [];
    const value = names.map((name) => params.get(name)).find(Boolean);
    if (!value) return Boolean(config.enabledByDefault);
    return ["prepared", "real", "chunked", "chunked-prepared", "production", "prod"].includes(String(value).toLowerCase());
  }

  function requestedBundleRoot(config, locationObject) {
    const location = locationObject || global.location;
    const params = new URLSearchParams(location && location.search ? location.search : "");
    const names = (config.urlParameters && config.urlParameters.bundle) || [];
    const value = names.map((name) => params.get(name)).find(Boolean);
    return stripTrailingSlash(value || config.defaultBundlePath || "");
  }

  function requestedBundleFormat(config, locationObject) {
    const location = locationObject || global.location;
    const params = new URLSearchParams(location && location.search ? location.search : "");
    const names = (config.urlParameters && config.urlParameters.format) || ["format", "bundleFormat", "bundle-format"];
    const value = names.map((name) => params.get(name)).find(Boolean);
    return String(value || config.defaultBundleFormat || "chunked").trim().toLowerCase();
  }

  async function loadFromLocation(options) {
    const config = Object.assign({}, global.KaneMapRealBundleConfig || {}, options || {});
    if (!requestedPreparedMode(config, global.location)) {
      return { active: false, reason: "prepared data mode not requested" };
    }

    const bundleRoot = requestedBundleRoot(config, global.location);
    if (!bundleRoot) {
      return { active: false, error: "prepared bundle root is not configured" };
    }

    const bundleFormat = requestedBundleFormat(config, global.location);
    try {
      if (isFlatPreparedFormat(bundleFormat)) {
        return await loadFlatPreparedBundle(bundleRoot, config);
      }
      return await loadChunkedBundle(bundleRoot, config);
    } catch (error) {
      console.warn("Kane-Map prepared bundle load failed", error);
      return {
        active: false,
        error: error && error.message ? error.message : String(error),
        bundleRoot
      };
    }
  }

  async function loadBundle(bundleRoot, config) {
    const finalConfig = Object.assign({}, global.KaneMapRealBundleConfig || {}, config || {});
    const bundleFormat = String(finalConfig.defaultBundleFormat || "chunked").trim().toLowerCase();
    if (isFlatPreparedFormat(bundleFormat)) {
      return loadFlatPreparedBundle(bundleRoot, finalConfig);
    }
    return loadChunkedBundle(bundleRoot, finalConfig);
  }

  function isFlatPreparedFormat(value) {
    return ["flat-prepared", "flat", "prepared-json"].includes(String(value || "").trim().toLowerCase());
  }

  async function loadChunkedBundle(bundleRoot, config) {
    const manifestName = config.manifestName || "chunk_manifest.json";
    const manifest = await fetchJson(joinUrl(bundleRoot, manifestName));
    const layers = Array.isArray(manifest.layers) ? manifest.layers : [];
    const rawChunks = [];
    const rawBounds = createEmptyBounds();

    for (const layer of layers) {
      const layerName = String(layer.layer || layer.name || "");
      const chunks = Array.isArray(layer.chunks) ? layer.chunks : [];
      for (const chunkEntry of chunks) {
        const chunkPath = joinUrl(bundleRoot, chunkEntry.path || chunkFileName(layerName, chunkEntry));
        const collection = await fetchJson(chunkPath);
        const features = Array.isArray(collection.features) ? collection.features : [];
        features.forEach((feature) => expandBoundsWithFeature(rawBounds, feature));
        rawChunks.push({ layerName, chunkEntry, collection, features });
        await yieldToBrowser();
      }
    }

    if (!isCompleteBounds(rawBounds)) {
      throw new Error("Prepared bundle has no usable feature coordinates.");
    }

    const projection = createProjection(rawBounds, config.projectedBounds, Number(config.padding || 0));
    const gridSpec = config.grid || {};
    const projectedBounds = projection.bounds;
    const catalogChunks = [];
    for (const chunk of rawChunks) {
      catalogChunks.push(convertChunk(chunk, projection, gridSpec));
      await yieldToBrowser();
    }

    return {
      active: true,
      label: config.label || "Kane County production bundle",
      bundleRoot,
      manifest,
      data: {
        meta: {
          name: manifest.name || "Kane County prepared chunked bundle",
          coordinateSystem: "projected browser-local units from prepared GeoJSON",
          sourceCoordinateSystem: "prepared GeoJSON coordinate pairs",
          dataMode: "local static chunked prepared bundle",
          dataVersion: manifest.generated_at || "chunked-prepared-local",
          status: "loaded",
          bundleRoot,
          totalLayers: manifest.total_layers || layers.length,
          totalChunks: manifest.total_chunks || catalogChunks.length,
          totalFeatures: manifest.total_features || countFeatures(rawChunks),
          totalBytes: manifest.total_bytes,
          rawBounds: rawBoundsToArray(rawBounds),
          bounds: projectedBounds
        },
        chunks: catalogChunks
      }
    };
  }

  async function loadFlatPreparedBundle(bundleRoot, config) {
    const rawChunks = [];
    const rawBounds = createEmptyBounds();
    const featureChunkSize = positiveInteger(config.flatPreparedChunkSize, 5000);
    const yieldEvery = positiveInteger(config.flatPreparedYieldEvery, 2500);
    let totalFeatures = 0;

    for (const layer of FLAT_PREPARED_LAYERS) {
      const collection = await fetchJson(joinUrl(bundleRoot, layer.path));
      const features = Array.isArray(collection.features) ? collection.features : [];
      await expandBoundsWithFeatures(rawBounds, features, yieldEvery);
      totalFeatures += features.length;
      splitFlatLayerFeatures(rawChunks, layer.layer, layer.path, features, featureChunkSize);
      await yieldToBrowser();
    }

    if (!isCompleteBounds(rawBounds)) {
      throw new Error("Prepared JSON files have no usable feature coordinates.");
    }

    const projection = createProjection(rawBounds, config.projectedBounds, Number(config.padding || 0));
    const gridSpec = config.grid || {};
    const projectedBounds = projection.bounds;
    const catalogChunks = [];

    for (const chunk of rawChunks) {
      catalogChunks.push(convertChunk(chunk, projection, gridSpec));
      await yieldToBrowser();
    }

    return {
      active: true,
      label: config.label || "Kane County prepared JSON files",
      bundleRoot,
      manifest: {
        format: "flat-prepared",
        browser_chunking: "feature-count",
        flat_prepared_chunk_size: featureChunkSize,
        total_layers: FLAT_PREPARED_LAYERS.length,
        total_chunks: catalogChunks.length,
        total_features: totalFeatures,
        layers: FLAT_PREPARED_LAYERS.map((layer) => ({
          layer: layer.layer,
          path: layer.path,
          feature_count: rawChunks
            .filter((chunk) => chunk.layerName === layer.layer)
            .reduce((total, chunk) => total + chunk.features.length, 0),
          chunks: rawChunks.filter((chunk) => chunk.layerName === layer.layer).length
        }))
      },
      data: {
        meta: {
          name: "Kane County prepared JSON files",
          coordinateSystem: "projected browser-local units from prepared GeoJSON",
          sourceCoordinateSystem: "prepared GeoJSON coordinate pairs",
          dataMode: "local static flat prepared JSON files, browser-chunked",
          dataVersion: "flat-prepared-local-browser-chunked",
          status: "loaded",
          bundleRoot,
          totalLayers: FLAT_PREPARED_LAYERS.length,
          totalChunks: catalogChunks.length,
          totalFeatures,
          rawBounds: rawBoundsToArray(rawBounds),
          bounds: projectedBounds
        },
        chunks: catalogChunks
      }
    };
  }

  function splitFlatLayerFeatures(output, layerName, path, features, featureChunkSize) {
    if (!features.length) {
      output.push({
        layerName,
        chunkEntry: {
          chunk_index: 1,
          path,
          feature_count: 0,
          format: "flat-prepared-slice",
          feature_start: 0,
          feature_end: 0
        },
        features: []
      });
      return;
    }

    for (let start = 0, index = 1; start < features.length; start += featureChunkSize, index += 1) {
      const end = Math.min(features.length, start + featureChunkSize);
      output.push({
        layerName,
        chunkEntry: {
          chunk_index: index,
          path,
          feature_count: end - start,
          format: "flat-prepared-slice",
          feature_start: start,
          feature_end: end
        },
        features: features.slice(start, end)
      });
    }
  }

  async function expandBoundsWithFeatures(bounds, features, yieldEvery) {
    for (let index = 0; index < features.length; index += 1) {
      expandBoundsWithFeature(bounds, features[index]);
      if (index > 0 && index % yieldEvery === 0) {
        await yieldToBrowser();
      }
    }
  }

  function countFeatures(rawChunks) {
    return rawChunks.reduce((total, chunk) => total + (Array.isArray(chunk.features) ? chunk.features.length : 0), 0);
  }

  function convertChunk(chunk, projection, gridSpec) {
    const converted = {
      id: chunkId(chunk),
      label: chunkLabel(chunk),
      cells: [],
      roads: [],
      water: [],
      forests: [],
      buildings: [],
      addressPoints: [],
      countyBoundary: []
    };
    const featureBounds = createEmptyBounds();

    chunk.features.forEach((feature, index) => {
      const convertedFeatures = convertFeature(chunk.layerName, feature, projection, chunkIndexId(chunk, index));
      convertedFeatures.forEach((item) => appendConvertedFeature(converted, chunk.layerName, item));
      expandBoundsWithFeature(featureBounds, feature);
    });

    converted.cells = cellsForRawBounds(featureBounds, projection, gridSpec);
    if (!converted.cells.length) converted.cells = allGridCells(gridSpec);
    return converted;
  }

  function convertFeature(layerName, feature, projection, id) {
    const props = feature.properties || {};
    const geometry = feature.geometry || {};
    const sourceId = String(feature.id || props.id || props.source_id || id);
    if (layerName === "roads") return convertRoad(feature, props, geometry, projection, sourceId);
    if (layerName === "water") return convertArea(feature, props, geometry, projection, sourceId, "water");
    if (layerName === "county_boundary") return convertArea(feature, props, geometry, projection, sourceId, "countyBoundary");
    if (layerName === "buildings") return convertBuilding(feature, props, geometry, projection, sourceId);
    if (layerName === "address_points") return convertAddressPoint(feature, props, geometry, projection, sourceId);
    return [];
  }

  function convertRoad(feature, props, geometry, projection, id) {
    const paths = linePaths(geometry.coordinates, geometry.type);
    return paths.map((path, index) => ({
      id: paths.length > 1 ? `${id}-${index + 1}` : id,
      name: cleanLabel(props.name || props.fullname || id),
      width: roadWidth(props),
      path: path.map((point) => projectPoint(projection, point))
    })).filter((road) => road.path.length >= 2);
  }

  function convertArea(feature, props, geometry, projection, id, targetType) {
    const rings = polygonRings(geometry.coordinates, geometry.type);
    return rings.map((ring, index) => ({
      id: rings.length > 1 ? `${id}-${index + 1}` : id,
      name: cleanLabel(props.name || props.label || id),
      polygon: ring.map((point) => projectPoint(projection, point)),
      targetType
    })).filter((area) => area.polygon.length >= 3);
  }

  function convertBuilding(feature, props, geometry, projection, id) {
    const rings = polygonRings(geometry.coordinates, geometry.type);
    return rings.map((ring, index) => {
      const polygon = ring.map((point) => projectPoint(projection, point));
      const center = centroid(polygon);
      const cell = cellForProjectedPoint(center, projection.bounds, projection.gridSpec);
      const label = props.label || props.common_name || props.name || id;
      return {
        id: rings.length > 1 ? `${id}-${index + 1}` : id,
        label: cleanLabel(label),
        name: cleanLabel(props.common_name || props.name || ""),
        stories: storyEstimate(props),
        cell,
        polygon
      };
    }).filter((building) => building.polygon.length >= 3);
  }

  function convertAddressPoint(feature, props, geometry, projection, id) {
    if (geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) return [];
    const point = projectPoint(projection, geometry.coordinates);
    return [{
      id,
      address: cleanLabel(props.address || props.complete_address || props.fire_addr || props.common_name || id),
      cell: cellForProjectedPoint(point, projection.bounds, projection.gridSpec),
      point
    }];
  }

  function appendConvertedFeature(chunk, layerName, item) {
    if (layerName === "roads") chunk.roads.push(item);
    else if (layerName === "water") chunk.water.push(item);
    else if (layerName === "county_boundary") chunk.countyBoundary.push(item);
    else if (layerName === "buildings") chunk.buildings.push(item);
    else if (layerName === "address_points") chunk.addressPoints.push(item);
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
      return response.json();
    });
  }

  function joinUrl(root, path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${stripTrailingSlash(root)}/${String(path || "").replace(/^\/+/, "")}`;
  }

  function stripTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function chunkFileName(layerName, entry) {
    const index = Number(entry.chunk_index || entry.index || 1);
    return `layers/${layerName}/${layerName}_${String(index).padStart(6, "0")}.json`;
  }

  function chunkId(chunk) {
    const entry = chunk.chunkEntry || {};
    if (entry.format === "flat-prepared-slice") {
      return `${chunk.layerName}-flat-${String(entry.chunk_index || 1).padStart(6, "0")}`;
    }
    if (entry.path && !entry.path.includes("/")) return `${chunk.layerName}-flat`;
    return `${chunk.layerName}-${String(entry.chunk_index || 1).padStart(6, "0")}`;
  }

  function chunkIndexId(chunk, index) {
    const entry = chunk.chunkEntry || {};
    if (entry.format === "flat-prepared-slice") {
      return `${chunk.layerName}-${Number(entry.feature_start || 0) + index + 1}`;
    }
    return `${chunk.layerName}-${index + 1}`;
  }

  function chunkLabel(chunk) {
    const entry = chunk.chunkEntry || {};
    if (entry.format === "flat-prepared-slice") {
      return `${chunk.layerName} prepared JSON ${entry.chunk_index || 1}`;
    }
    if (entry.path && !entry.path.includes("/")) return `${chunk.layerName} prepared JSON`;
    return `${chunk.layerName} chunk ${entry.chunk_index || 1}`;
  }

  function cleanLabel(value) {
    return String(value || "").trim();
  }

  function roadWidth(props) {
    const routeType = String(props.route_type || props.mtfcc || "").toLowerCase();
    if (routeType.includes("interstate")) return 14;
    if (routeType.includes("state") || routeType.includes("us")) return 11;
    return 6;
  }

  function storyEstimate(props) {
    const raw = Number(props.story_estimate || props.stories || 1);
    if (!Number.isFinite(raw) || raw < 1) return 1;
    return Math.max(1, Math.min(6, Math.round(raw)));
  }

  function linePaths(coordinates, type) {
    if (type === "LineString" && Array.isArray(coordinates)) return [coordinates];
    if (type === "MultiLineString" && Array.isArray(coordinates)) return coordinates;
    return [];
  }

  function polygonRings(coordinates, type) {
    if (type === "Polygon" && Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
      return [coordinates[0]];
    }
    if (type === "MultiPolygon" && Array.isArray(coordinates)) {
      return coordinates
        .map((polygon) => Array.isArray(polygon) ? polygon[0] : null)
        .filter((ring) => Array.isArray(ring));
    }
    return [];
  }

  function createProjection(rawBounds, targetBounds, padding) {
    const target = targetBounds || { minX: 0, minY: 0, maxX: 1400, maxY: 900 };
    const rawWidth = Math.max(Number.EPSILON, rawBounds.maxX - rawBounds.minX);
    const rawHeight = Math.max(Number.EPSILON, rawBounds.maxY - rawBounds.minY);
    const targetWidth = Math.max(1, target.maxX - target.minX - padding * 2);
    const targetHeight = Math.max(1, target.maxY - target.minY - padding * 2);
    const scale = Math.min(targetWidth / rawWidth, targetHeight / rawHeight);
    const usedWidth = rawWidth * scale;
    const usedHeight = rawHeight * scale;
    const offsetX = target.minX + (target.maxX - target.minX - usedWidth) / 2;
    const offsetY = target.minY + (target.maxY - target.minY - usedHeight) / 2;
    const bounds = { minX: target.minX, minY: target.minY, maxX: target.maxX, maxY: target.maxY };
    const gridSpec = Object.assign({ rows: 4, cols: 6, startNorth: 11, startEast: 5 }, (global.KaneMapRealBundleConfig || {}).grid || {});
    return { rawBounds, scale, offsetX, offsetY, bounds, gridSpec };
  }

  function projectPoint(projection, point) {
    return [
      projection.offsetX + (Number(point[0]) - projection.rawBounds.minX) * projection.scale,
      projection.offsetY + (projection.rawBounds.maxY - Number(point[1])) * projection.scale
    ];
  }

  function createEmptyBounds() {
    return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  }

  function isCompleteBounds(bounds) {
    return Number.isFinite(bounds.minX) && Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxX) && Number.isFinite(bounds.maxY);
  }

  function expandBounds(bounds, x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  }

  function expandBoundsWithFeature(bounds, feature) {
    const geometry = feature && feature.geometry ? feature.geometry : {};
    walkCoordinates(geometry.coordinates, (point) => expandBounds(bounds, Number(point[0]), Number(point[1])));
  }

  function walkCoordinates(value, callback) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      callback(value);
      return;
    }
    value.forEach((item) => walkCoordinates(item, callback));
  }

  function rawBoundsToArray(bounds) {
    return [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY];
  }

  function cellsForRawBounds(rawBounds, projection, gridSpec) {
    if (!isCompleteBounds(rawBounds)) return [];
    const sw = projectPoint(projection, [rawBounds.minX, rawBounds.minY]);
    const ne = projectPoint(projection, [rawBounds.maxX, rawBounds.maxY]);
    const bbox = {
      minX: Math.min(sw[0], ne[0]),
      minY: Math.min(sw[1], ne[1]),
      maxX: Math.max(sw[0], ne[0]),
      maxY: Math.max(sw[1], ne[1])
    };
    return allGridCells(gridSpec).filter((code) => cellIntersects(code, bbox, projection.bounds, gridSpec));
  }

  function cellIntersects(code, bbox, bounds, gridSpec) {
    const cell = cellBounds(code, bounds, gridSpec);
    return cell.minX <= bbox.maxX && cell.maxX >= bbox.minX && cell.minY <= bbox.maxY && cell.maxY >= bbox.minY;
  }

  function cellForProjectedPoint(point, bounds, gridSpec) {
    const rows = Number(gridSpec.rows || 4);
    const cols = Number(gridSpec.cols || 6);
    const startNorth = Number(gridSpec.startNorth || 11);
    const startEast = Number(gridSpec.startEast || 5);
    const col = clamp(Math.floor(((point[0] - bounds.minX) / (bounds.maxX - bounds.minX)) * cols), 0, cols - 1);
    const row = clamp(Math.floor(((point[1] - bounds.minY) / (bounds.maxY - bounds.minY)) * rows), 0, rows - 1);
    return `N${startNorth + row}-E${String(startEast + col).padStart(2, "0")}`;
  }

  function cellBounds(code, bounds, gridSpec) {
    const parsed = /^N(\d+)-E(\d+)$/.exec(code);
    const rows = Number(gridSpec.rows || 4);
    const cols = Number(gridSpec.cols || 6);
    const startNorth = Number(gridSpec.startNorth || 11);
    const startEast = Number(gridSpec.startEast || 5);
    const row = parsed ? Number(parsed[1]) - startNorth : 0;
    const col = parsed ? Number(parsed[2]) - startEast : 0;
    const cellWidth = (bounds.maxX - bounds.minX) / cols;
    const cellHeight = (bounds.maxY - bounds.minY) / rows;
    return {
      minX: bounds.minX + col * cellWidth,
      minY: bounds.minY + row * cellHeight,
      maxX: bounds.minX + (col + 1) * cellWidth,
      maxY: bounds.minY + (row + 1) * cellHeight
    };
  }

  function allGridCells(gridSpec) {
    const rows = Number(gridSpec.rows || 4);
    const cols = Number(gridSpec.cols || 6);
    const startNorth = Number(gridSpec.startNorth || 11);
    const startEast = Number(gridSpec.startEast || 5);
    const cells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        cells.push(`N${startNorth + row}-E${String(startEast + col).padStart(2, "0")}`);
      }
    }
    return cells;
  }

  function centroid(polygon) {
    if (!polygon.length) return [0, 0];
    const sum = polygon.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
    return [sum[0] / polygon.length, sum[1] / polygon.length];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function positiveInteger(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 1) return fallback;
    return Math.floor(number);
  }

  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  global.KaneMapChunkedBundleLoader = { loadFromLocation, loadBundle };
})(window);
