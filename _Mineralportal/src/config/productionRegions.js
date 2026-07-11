export const PRODUCTION_REGIONS = [
  {
    id: 'sindh',
    name: 'Sindh',
    province: 'Sindh',
    color: '#22c55e',
    bbox: [[66.0, 23.55], [71.35, 28.75]],
    productionDataFile: '/data/sindh_minerals_production_wide.csv',
  },
  {
    id: 'punjab',
    name: 'Punjab',
    province: 'Punjab',
    color: '#3b82f6',
    bbox: [[70.05, 27.65], [75.55, 34.05]],
    productionDataFile: null,
  },
  {
    id: 'balochistan',
    name: 'Balochistan',
    province: 'Balochistan',
    color: '#f97316',
    bbox: [[60.0, 24.0], [70.25, 32.55]],
    productionDataFile: null,
  },
  {
    id: 'kp',
    name: 'Khyber Pakhtunkhwa',
    province: 'Khyber Pakhtunkhwa',
    color: '#a855f7',
    bbox: [[70.0, 31.85], [74.5, 37.1]],
    productionDataFile: null,
  },
  {
    id: 'gb',
    name: 'Gilgit-Baltistan',
    province: 'Gilgit-Baltistan',
    color: '#14b8a6',
    bbox: [[72.4, 34.55], [77.05, 37.15]],
    productionDataFile: null,
  },
];

export function getProductionRegion(id) {
  return PRODUCTION_REGIONS.find((region) => region.id === id) || null;
}

export function bboxToPolygon(bbox) {
  const [[minLon, minLat], [maxLon, maxLat]] = bbox;
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat],
      ]],
    },
    properties: {},
  };
}
