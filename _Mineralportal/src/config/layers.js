import { FLOOD_LAYERS } from './floodData';

const floodDisasterConfig = Object.fromEntries(
  FLOOD_LAYERS.map((layer) => [layer.id, { name: layer.name, color: layer.color, file: layer.file }])
);

export const zoneConfig = {
  'zone-01': { name: 'Korakoram Block', color: '#ef4444', file: '/metallogeniczones/fixR1.geojson' },
  'zone-02': { name: 'Kohistan Magmati Arc', color: '#f97316', file: '/metallogeniczones/fixR2.geojson' },
  'zone-03': { name: 'Hazara Fold & Thrust Belt', color: '#eab308', file: '/metallogeniczones/fixR3.geojson' },
  'zone-04': { name: 'Salt Range Kalachitta Ranges', color: '#22c55e', file: '/metallogeniczones/fixR4.geojson' },
  'zone-05': { name: 'Indian Shield', color: '#06b6d4', file: '/metallogeniczones/fixR5.geojson' },
  'zone-06': { name: 'Sulaiman Fold & Thrust Belt', color: '#8b5cf6', file: '/metallogeniczones/fixR6.geojson' },
  'zone-07': { name: 'Kirthar Fold & Thrust Belt', color: '#ec4899', file: '/metallogeniczones/fixR7.geojson' },
  'zone-08': { name: 'Axial Belt', color: '#14b8a6', file: '/metallogeniczones/fixR8.geojson' },
  'zone-09': { name: 'Lasbela-Khuzdar Ophiolite Belt', color: '#64748b', file: '/metallogeniczones/fixR9.geojson' },
  'zone-10': { name: 'Chaman-Ornach Nal Fault Zone', color: '#f43f5e', file: '/metallogeniczones/fixR10.geojson' },
  'zone-11': { name: 'Chagai Magmatic Arc', color: '#0ea5e9', file: '/metallogeniczones/fixR11.geojson' },
  'zone-12': { name: 'Makran Accretionary Prism', color: '#a855f7', file: '/metallogeniczones/fixR12.geojson' },
  'zone-13': { name: 'Rann of Kutch Zone', color: '#10b981', file: '/metallogeniczones/fixR13.geojson' },
};

export const disasterConfig = {
  ...floodDisasterConfig,
  'disaster-earthquake': { name: 'Earthquake Zones', color: '#ef4444', file: null },
  'disaster-faultline': { name: 'Fault Lines', color: '#ef4444', file: '/faultlines/pak-faultlines.json' },
};

export const METALLOGENIC_ZONES = [
  { id: 'zone-01', num: '01', name: 'Korakoram Block', color: '#ef4444' },
  { id: 'zone-02', num: '02', name: 'Kohistan Magmati Arc', color: '#f97316' },
  { id: 'zone-03', num: '03', name: 'Hazara Fold & Thrust Belt', color: '#eab308' },
  { id: 'zone-04', num: '04', name: 'Salt Range Kalachitta Ranges', color: '#22c55e' },
  { id: 'zone-05', num: '05', name: 'Indian Shield', color: '#06b6d4' },
  { id: 'zone-06', num: '06', name: 'Sulaiman Fold & Thrust Belt', color: '#8b5cf6' },
  { id: 'zone-07', num: '07', name: 'Kirthar Fold & Thrust Belt', color: '#ec4899' },
  { id: 'zone-08', num: '08', name: 'Axial Belt', color: '#14b8a6' },
  { id: 'zone-09', num: '09', name: 'Lasbela-Khuzdar Ophiolite Belt', color: '#64748b' },
  { id: 'zone-10', num: '10', name: 'Chaman-Ornach Nal Fault Zone', color: '#f43f5e' },
  { id: 'zone-11', num: '11', name: 'Chagai Magmatic Arc', color: '#0ea5e9' },
  { id: 'zone-12', num: '12', name: 'Makran Accretionary Prism', color: '#a855f7' },
  { id: 'zone-13', num: '13', name: 'Rann of Kutch Zone', color: '#10b981' },
];

export const DISASTER_LAYERS = [
  ...FLOOD_LAYERS.map((layer) => ({
    id: layer.id,
    name: layer.name,
    color: layer.color,
    icon: layer.icon,
    group: 'flood',
  })),
  { id: 'disaster-earthquake', name: 'Earthquake Zones', color: '#ef4444', icon: 'fa-house-crack', group: 'earthquake' },
  { id: 'disaster-faultline', name: 'Fault Lines', color: '#ef4444', icon: 'fa-lines-leaning', group: 'earthquake' },
];

export const categoryStyles = {
  metallic_minerals: '#f97316',
  dimension_stones: '#f59e0b',
  chemical_fertilizer: '#22c55e',
  gemstones: '#ef4444',
  fuels: '#f97316',
  unknown: '#64748b',
};

export const categoryDisplayNames = {
  metallic_minerals: 'Metallic Minerals',
  dimension_stones: 'Dimension Stones',
  chemical_fertilizer: 'Chemical, Fertilizer & Industrial',
  gemstones: 'Gemstones',
  fuels: 'Fuels',
  unknown: 'Unknown',
};

export const categoryIconMap = {
  metallic_minerals: 'circle',
  dimension_stones: 'square',
  chemical_fertilizer: 'triangle',
  gemstones: 'star',
  fuels: 'pill',
  unknown: 'circle',
};

export const typePalette = ['#f97316', '#22c55e', '#2563eb', '#db2777', '#eab308', '#14b8a6', '#a855f7', '#f43f5e', '#0f766e', '#4b5563'];

export function normalizeCategory(cat) {
  const s = (cat || '').toString().toLowerCase().trim();
  if (!s) return 'unknown';
  if (s.includes('gem') || s.includes('precious')) return 'gemstones';
  if (s.includes('metallic') || s.includes('metal')) return 'metallic_minerals';
  if (s.includes('dimension') || s.includes('stone')) return 'dimension_stones';
  if (s.includes('chemical') || s.includes('fertilizer') || s.includes('industrial')) return 'chemical_fertilizer';
  if (s.includes('fuel') || s.includes('gas') || s.includes('coal') || s.includes('oil')) return 'fuels';
  return 'unknown';
}

export function getCategoryMarkerStyle(catId) {
  if (catId === 'gemstones') return 'marker-star';
  if (catId === 'dimension_stones') return 'marker-square';
  if (catId === 'chemical_fertilizer') return 'marker-triangle';
  if (catId === 'fuels') return 'marker-pill';
  return 'marker-circle';
}

export function formatCoordinates(lng, lat) {
  const format = (value, isLon) => {
    const abs = Math.abs(value).toFixed(4);
    const direction = isLon ? (value >= 0 ? 'E' : 'W') : (value >= 0 ? 'N' : 'S');
    return `${abs}°${direction}`;
  };
  return `${format(lat, false)}, ${format(lng, true)}`;
}

export function computeBBox(geo) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const walkCoords = (coords) => {
    if (typeof coords[0] === 'number') {
      const x = coords[0];
      const y = coords[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      return;
    }
    coords.forEach((c) => walkCoords(c));
  };

  geo.features.forEach((f) => {
    const g = f.geometry;
    if (g && g.coordinates) walkCoords(g.coordinates);
  });

  if (minX !== Infinity) return [[minX, minY], [maxX, maxY]];
  return null;
}
