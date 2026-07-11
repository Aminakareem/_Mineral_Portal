import { normalizeCategory, categoryDisplayNames, categoryStyles } from '../config/layers';

const FISCAL_YEARS = ['2015-16', '2016-17', '2017-18', '2018-19', '2019-20', '2020-21', '2021-22'];

export const PRODUCTION_MINERAL_ALIASES = {
  'Bauxite Iron': 'Iron Ore',
  'China Clay': 'China Clay',
  "Fuller's Earth": "Fuller's Earth",
  Granite: 'Granite',
  Coal: 'Coal',
  'Iron Ore': 'Iron Ore',
  'Silica Sand': 'Silica Sand',
  Marble: 'Onyx Marble',
  Dolomite: 'Dolomite',
  Limestone: 'Fossiliferous Re-Crystalized Limestone',
  'Ordinary Sand': 'Silica Sand',
  'Clay (Shale)': 'Fire Clay',
  Clay: 'Fire Clay',
  Gravel: 'Silica Sand',
  'Rati/Bajri': 'Silica Sand',
  Mouram: 'Silica Sand',
  Chalk: 'Dolomite',
  Laterite: 'Iron Ore',
  'Lake Salt': 'Rock Salt',
  Trona: 'Rock Salt',
};

export function mapProductionMineralToPortalType(productionName) {
  return PRODUCTION_MINERAL_ALIASES[productionName] || productionName;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export async function loadProductionDataset(filePath) {
  if (!filePath) return [];

  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to load production data: ${filePath}`);
  }

  const text = await response.text();
  const lines = text.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const yearColumns = header.slice(1);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const mineral = cells[0];
    const values = {};

    yearColumns.forEach((year, index) => {
      const raw = cells[index + 1];
      values[year] = raw === '' || raw == null ? 0 : Number(raw) || 0;
    });

    return {
      mineral,
      portalType: mapProductionMineralToPortalType(mineral),
      values,
      series: yearColumns.map((year) => ({
        year,
        value: values[year] || 0,
      })),
    };
  });
}

export function getProductionSeries(dataset, mineralName) {
  const entry = dataset.find((item) => item.mineral === mineralName);
  return entry?.series || [];
}

export function getAnnualProductionSeries(dataset) {
  if (!dataset?.length) return [];

  return FISCAL_YEARS.map((year) => ({
    year,
    value: dataset.reduce((sum, item) => sum + (item.values?.[year] || 0), 0),
  }));
}

export function buildProductionMineralList(dataset) {
  return dataset
    .map((item) => ({
      name: item.mineral,
      portalType: item.portalType,
      count: 1,
      category: inferProductionCategory(item.mineral),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function inferProductionCategory(mineralName) {
  const portalType = mapProductionMineralToPortalType(mineralName);
  const lower = `${mineralName} ${portalType}`.toLowerCase();

  if (lower.includes('ruby') || lower.includes('emerald') || lower.includes('gem')) {
    return 'gemstones';
  }
  if (lower.includes('coal')) return 'fuels';
  if (
    lower.includes('iron') ||
    lower.includes('copper') ||
    lower.includes('lead') ||
    lower.includes('zinc') ||
    lower.includes('bauxite')
  ) {
    return 'metallic';
  }
  if (
    lower.includes('marble') ||
    lower.includes('granite') ||
    lower.includes('limestone') ||
    lower.includes('chalk') ||
    lower.includes('gravel') ||
    lower.includes('sand') ||
    lower.includes('bajri') ||
    lower.includes('mouram')
  ) {
    return 'dimension_stones';
  }
  return 'industrial';
}

export function buildProductionLayers(dataset, getTypeColor) {
  const groups = {};

  dataset.forEach((item) => {
    const category = normalizeCategory(inferProductionCategory(item.mineral));
    if (!groups[category]) {
      groups[category] = {
        itemsMap: {},
        count: 0,
      };
    }
    groups[category].count += 1;
    if (!groups[category].itemsMap[item.mineral]) {
      groups[category].itemsMap[item.mineral] = {
        count: 1,
        color: getTypeColor(item.portalType || item.mineral),
        portalType: item.portalType,
      };
    }
  });

  return Object.entries(groups).map(([category, group]) => ({
    id: category,
    name: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    count: group.count,
    items: Object.keys(group.itemsMap).map((name) => ({
      name,
      count: group.itemsMap[name].count,
      color: group.itemsMap[name].color,
      portalType: group.itemsMap[name].portalType,
    })),
  }));
}

export function buildRegionMapLayers(features, province, getTypeColor) {
  const groups = {};

  features.forEach((feature) => {
    const props = feature.properties || {};
    if (province && props.province !== province) return;

    const category = normalizeCategory(props.category);
    const mineralName = String(props.mineralType || props.name || 'Unknown').trim();

    if (!groups[category]) {
      groups[category] = { itemsMap: {}, count: 0 };
    }

    groups[category].count += 1;
    if (!groups[category].itemsMap[mineralName]) {
      groups[category].itemsMap[mineralName] = {
        count: 0,
        color: getTypeColor(mineralName),
        portalType: mineralName,
      };
    }
    groups[category].itemsMap[mineralName].count += 1;
  });

  return Object.entries(groups).map(([category, group]) => ({
    id: category,
    name: categoryDisplayNames[category] || category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    count: group.count,
    items: Object.keys(group.itemsMap)
      .map((name) => ({
        name,
        count: group.itemsMap[name].count,
        color: group.itemsMap[name].color,
        portalType: group.itemsMap[name].portalType,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export function buildRegionMapMineralList(features, province) {
  const counts = {};

  features.forEach((feature) => {
    const props = feature.properties || {};
    if (province && props.province !== province) return;

    const mineralName = String(props.mineralType || props.name || 'Unknown').trim();
    if (!counts[mineralName]) {
      counts[mineralName] = {
        name: mineralName,
        portalType: mineralName,
        count: 0,
        category: normalizeCategory(props.category),
      };
    }
    counts[mineralName].count += 1;
  });

  return Object.values(counts).sort((a, b) => a.name.localeCompare(b.name));
}

export function findProductionMineralName(portalType, dataset) {
  if (!portalType || !dataset?.length) return null;

  const direct = dataset.find((item) => item.mineral === portalType);
  if (direct) return direct.mineral;

  const viaAlias = dataset.find(
    (item) => mapProductionMineralToPortalType(item.mineral) === portalType
  );
  return viaAlias?.mineral || null;
}

export { FISCAL_YEARS };
