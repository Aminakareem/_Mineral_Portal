const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;

const RISK_COLORS = {
  high: '#ef4444',
  moderate: '#f59e0b',
  low: '#60a5fa',
};

export const SHAKEMAP_MINERAL_SOURCE_ID = 'shakemap-mineral-impact';

export const SHAKEMAP_MINERAL_LAYER_IDS = {
  pulse: 'shakemap-mineral-impact-pulse',
  ring: 'shakemap-mineral-impact-ring',
  labels: 'shakemap-mineral-impact-labels',
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function flattenLineCoords(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return geometry.coordinates;
  if (geometry.type === 'MultiLineString') return geometry.coordinates.flat();
  return [];
}

function pointToSegmentDistanceKm(px, py, ax, ay, bx, by) {
  const latMid = ((ay + by) / 2) * DEG_TO_RAD;
  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos(latMid);

  const x = px * kmPerDegLon;
  const y = py * kmPerDegLat;
  const x1 = ax * kmPerDegLon;
  const y1 = ay * kmPerDegLat;
  const x2 = bx * kmPerDegLon;
  const y2 = by * kmPerDegLat;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(x - projX, y - projY);
}

function getBboxFromCoordinates(coordinates) {
  const lons = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);
  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

function pointInBbox(lon, lat, bbox, bufferDeg = 0.08) {
  return (
    lon >= bbox.minLon - bufferDeg &&
    lon <= bbox.maxLon + bufferDeg &&
    lat >= bbox.minLat - bufferDeg &&
    lat <= bbox.maxLat + bufferDeg
  );
}

function getContourRadiiByMmi(contours, epicenter) {
  const byMmi = {};
  const features = contours?.features || [];

  features.forEach((feature) => {
    const mmi = Number(feature.properties?.value);
    if (!Number.isFinite(mmi) || !epicenter) return;

    flattenLineCoords(feature.geometry).forEach(([lon, lat]) => {
      const distance = haversineKm(epicenter[1], epicenter[0], lat, lon);
      if (!byMmi[mmi]) byMmi[mmi] = [];
      byMmi[mmi].push(distance);
    });
  });

  const radii = {};
  Object.entries(byMmi).forEach(([mmi, distances]) => {
    distances.sort((a, b) => a - b);
    radii[Number(mmi)] = distances[Math.floor(distances.length / 2)];
  });

  return radii;
}

function nearestContourInfo(lon, lat, contours) {
  let minDist = Infinity;
  let nearestMmi = 0;

  (contours?.features || []).forEach((feature) => {
    const mmi = Number(feature.properties?.value);
    if (!Number.isFinite(mmi)) return;

    const segments = flattenLineCoords(feature.geometry);
    for (let i = 0; i < segments.length - 1; i += 1) {
      const [lonA, latA] = segments[i];
      const [lonB, latB] = segments[i + 1];
      const dist = pointToSegmentDistanceKm(lon, lat, lonA, latA, lonB, latB);
      if (dist < minDist) {
        minDist = dist;
        nearestMmi = mmi;
      }
    }
  });

  return { distKm: minDist, mmi: nearestMmi };
}

function estimateMmiAtPoint(lon, lat, epicenter, contourRadii, contours) {
  let estimated = 0;

  if (epicenter && Object.keys(contourRadii).length > 0) {
    const distEpic = haversineKm(epicenter[1], epicenter[0], lat, lon);
    const mmis = Object.keys(contourRadii)
      .map(Number)
      .sort((a, b) => b - a);

    for (const mmi of mmis) {
      if (distEpic <= contourRadii[mmi] * 1.18) {
        estimated = mmi;
        break;
      }
    }
  }

  const nearest = nearestContourInfo(lon, lat, contours);
  if (nearest.mmi > 0 && nearest.distKm < 35) {
    const contourEstimate = nearest.mmi * Math.exp(-nearest.distKm / 45);
    estimated = Math.max(estimated, contourEstimate);
  }

  return estimated;
}

export function mmiToRiskLevel(mmi) {
  if (mmi >= 6) return 'high';
  if (mmi >= 4.5) return 'moderate';
  if (mmi >= 3) return 'low';
  return null;
}

export function analyzeMineralShakemapImpact(mineralFeatures, contours, coordinates, epicenter) {
  if (!mineralFeatures?.length || !coordinates?.length) {
    return {
      affected: [],
      high: [],
      moderate: [],
      low: [],
      geojson: { type: 'FeatureCollection', features: [] },
      summary: { total: 0, high: 0, moderate: 0, low: 0 },
    };
  }

  const bbox = getBboxFromCoordinates(coordinates);
  const contourRadii = getContourRadiiByMmi(contours, epicenter);
  const affected = [];

  mineralFeatures.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    if (!pointInBbox(lon, lat, bbox)) return;

    const mmi = estimateMmiAtPoint(lon, lat, epicenter, contourRadii, contours);
    const risk = mmiToRiskLevel(mmi);
    if (!risk) return;

    const props = feature.properties || {};
    affected.push({
      id: props.id,
      name: props.name || props.mineralType || 'Unknown site',
      mineralType: props.mineralType || 'Unknown',
      province: props.province || '',
      category: props.category || '',
      risk,
      mmi: Number(mmi.toFixed(1)),
      coordinates: [lon, lat],
    });
  });

  affected.sort((a, b) => b.mmi - a.mmi || a.name.localeCompare(b.name));

  const high = affected.filter((item) => item.risk === 'high');
  const moderate = affected.filter((item) => item.risk === 'moderate');
  const low = affected.filter((item) => item.risk === 'low');

  const geojson = {
    type: 'FeatureCollection',
    features: affected.map((item) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: item.coordinates },
      properties: {
        id: item.id,
        name: item.name,
        mineralType: item.mineralType,
        risk: item.risk,
        mmi: item.mmi,
        color: RISK_COLORS[item.risk],
      },
    })),
  };

  return {
    affected,
    high,
    moderate,
    low,
    geojson,
    summary: {
      total: affected.length,
      high: high.length,
      moderate: moderate.length,
      low: low.length,
    },
  };
}

function placeImpactLayersOnTop(map) {
  Object.values(SHAKEMAP_MINERAL_LAYER_IDS).forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId);
    }
  });
}

export function clearShakemapMineralImpactLayers(map) {
  if (!map) return;

  Object.values(SHAKEMAP_MINERAL_LAYER_IDS).forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });

  if (map.getSource(SHAKEMAP_MINERAL_SOURCE_ID)) {
    map.removeSource(SHAKEMAP_MINERAL_SOURCE_ID);
  }
}

export function addShakemapMineralImpactLayers(map, impactResult) {
  if (!map) return;

  clearShakemapMineralImpactLayers(map);

  const data = impactResult?.geojson;
  if (!data?.features?.length) return;

  map.addSource(SHAKEMAP_MINERAL_SOURCE_ID, {
    type: 'geojson',
    data,
  });

  map.addLayer({
    id: SHAKEMAP_MINERAL_LAYER_IDS.pulse,
    type: 'circle',
    source: SHAKEMAP_MINERAL_SOURCE_ID,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4,
        ['match', ['get', 'risk'], 'high', 14, 'moderate', 11, 8],
        10,
        ['match', ['get', 'risk'], 'high', 28, 'moderate', 22, 16],
        14,
        ['match', ['get', 'risk'], 'high', 42, 'moderate', 34, 24],
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.22,
      'circle-blur': 0.35,
    },
  });

  map.addLayer({
    id: SHAKEMAP_MINERAL_LAYER_IDS.ring,
    type: 'circle',
    source: SHAKEMAP_MINERAL_SOURCE_ID,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4,
        ['match', ['get', 'risk'], 'high', 7, 'moderate', 6, 4],
        10,
        ['match', ['get', 'risk'], 'high', 14, 'moderate', 11, 7],
        14,
        ['match', ['get', 'risk'], 'high', 20, 'moderate', 16, 10],
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.95,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.9,
    },
  });

  map.addLayer({
    id: SHAKEMAP_MINERAL_LAYER_IDS.labels,
    type: 'symbol',
    source: SHAKEMAP_MINERAL_SOURCE_ID,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 10, 11, 14, 13],
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-max-width': 12,
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': ['get', 'color'],
      'text-halo-width': 1.5,
    },
  });

  placeImpactLayersOnTop(map);
}
