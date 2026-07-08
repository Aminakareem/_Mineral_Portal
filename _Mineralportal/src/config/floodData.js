/** Flood layers converted from `flood layers/` shapefiles → public/flood-layers/*.geojson */
const FLOOD_COLORS = [
  '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#06b6d4',
  '#0891b2', '#6366f1', '#8b5cf6', '#0ea5e9', '#14b8a6',
];

export const FLOOD_LAYERS = [
  { year: 2010, name: 'Flood Extent 2010', file: '/flood-layers/flood_2010.geojson' },
  { year: 2011, name: 'Flood Extent 2011', file: '/flood-layers/flood_2011.geojson' },
  { year: 2012, name: 'Flood Extent 2012', file: '/flood-layers/flood_2012.geojson' },
  { year: 2013, name: 'Flood Extent 2013', file: '/flood-layers/flood_2013.geojson' },
  { year: 2014, name: 'Flood Extent 2014', file: '/flood-layers/flood_2014.geojson' },
  { year: 2015, name: 'Flood Extent 2015', file: '/flood-layers/flood_2015.geojson' },
  { year: 2022, name: 'Flood Extent 2022', file: '/flood-layers/flood_2022.geojson' },
  { year: 2023, name: 'Flood Extent 2023', file: '/flood-layers/flood_2023.geojson' },
  { year: 2024, name: 'Flood Extent 2024', file: '/flood-layers/flood_2024.geojson' },
  { year: 2025, name: 'Flood Extent 2025', file: '/flood_extend.geojson' },
].map((layer, index) => ({
  id: `disaster-flood-${layer.year}`,
  year: layer.year,
  name: layer.name,
  file: layer.file,
  color: FLOOD_COLORS[index % FLOOD_COLORS.length],
  icon: 'fa-water',
  group: 'flood',
}));

export const FLOOD_LAYER_IDS = FLOOD_LAYERS.map((layer) => layer.id);
