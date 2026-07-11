import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gbDataPath = path.resolve(root, '..', 'gb-data.txt');
const mineralsPath = path.resolve(root, 'public', 'minerals.json');

const existing = JSON.parse(fs.readFileSync(mineralsPath, 'utf8'));
const existingTypeCategory = Object.fromEntries(
  existing.map((site) => [site.mineralType, site.category])
);

const portalAliases = {
  COPPER: 'Copper-Gold',
  CU: 'Copper-Gold',
  'CU/FE': 'Copper-Gold',
  GRANITE: 'Granite',
  GRAINTE: 'Granite',
  MARBLE: 'Onyx Marble',
  'GREEN MARBLE': 'Onyx Marble',
  ONYX: 'Onyx Marble',
  ONEYX: 'Onyx Marble',
  LEAD: 'Zinc-Lead',
  IRON: 'Iron Ore',
  'IRON ORE': 'Iron Ore',
  FE: 'Iron Ore',
  RUBY: 'Ruby',
  EMERALD: 'Emerald',
  EMRALD: 'Emerald',
  TOURMALINE: 'Tourmaline',
  TORMALINE: 'Tourmaline',
  COAL: 'Coal',
  'SOAP STONE': 'Soapstone/Talc',
  'SOAPSTONE/TALC': 'Soapstone/Talc',
  GYPSUM: 'Gypsum',
  BARITE: 'Barite',
  CHROMITE: 'Chromite',
  MANGANESE: 'Manganese',
  DOLOMITE: 'Dolomite',
  FELDSPAR: 'Feldspar',
  MAGNESITE: 'Magnesite',
  PHOSPHATE: 'Phosphate',
  'ROCK SALT': 'Rock Salt',
  'SILICA SAND': 'Silica Sand',
  BENTONITE: 'Bentonite',
  'CHINA CLAY': 'China Clay',
  'FIRE CLAY': 'Fire Clay',
  "FULLER'S EARTH": "Fuller's Earth",
  TOPAZ: 'Topaz',
  PERIDOT: 'Peridot',
  'ARAGONITE MARBLE': 'Aragonite Marble',
  'FOSSILIFEROUS RE-CRYSTALIZED LIMESTONE': 'Fossiliferous Re-Crystalized Limestone',
};

const newTypeCategories = {
  'Placer Gold': 'metallic',
  Gold: 'metallic',
  Crush: 'dimension_stones',
  Nephrite: 'gemstones',
  Mica: 'industrial',
  Antimony: 'metallic',
  Polymetallic: 'metallic',
  Aquamarine: 'gemstones',
  'K2 Stone': 'gemstones',
  Serpentine: 'dimension_stones',
  Quartz: 'industrial',
  'Lime Stone': 'dimension_stones',
  'Gravel Sand': 'industrial',
  Cobalt: 'metallic',
  Titanium: 'metallic',
  'Gem Stone': 'gemstones',
  Amazonite: 'gemstones',
  Grossular: 'gemstones',
  Arsenic: 'metallic',
  Calcite: 'industrial',
  Molybdenum: 'metallic',
  Potash: 'industrial',
  Nickel: 'metallic',
  Lithium: 'metallic',
  Pozzolan: 'industrial',
  Graphite: 'industrial',
  Marble: 'dimension_stones',
};

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function mapMineralType(rawMineral) {
  const key = normalizeKey(rawMineral);
  if (!key || key.includes('CANCEL')) return null;

  if (portalAliases[key]) {
    const mineralType = portalAliases[key];
    return {
      mineralType,
      category: existingTypeCategory[mineralType] || newTypeCategories[mineralType] || 'unknown',
    };
  }

  const customMap = {
    'PLACER GOLD': 'Placer Gold',
    GOLD: 'Gold',
    CRUSH: 'Crush',
    NEPHRITE: 'Nephrite',
    'NEPHRITE JADE': 'Nephrite',
    MICA: 'Mica',
    ANTIMONY: 'Antimony',
    'POLY METAL': 'Polymetallic',
    'POLY METALS': 'Polymetallic',
    POLYMETAL: 'Polymetallic',
    POLYMETALS: 'Polymetallic',
    AQUAMARINE: 'Aquamarine',
    AQUMARINE: 'Aquamarine',
    AQAMARINE: 'Aquamarine',
    AQAMARAINE: 'Aquamarine',
    'K2 NITE': 'K2 Stone',
    SERPENTINE: 'Serpentine',
    QUARTZ: 'Quartz',
    'LIME STONE': 'Lime Stone',
    'GRAVEL SAND': 'Gravel Sand',
    COBALT: 'Cobalt',
    TITANIUM: 'Titanium',
    'GEM STONE': 'Gem Stone',
    'GEMS STONE': 'Gem Stone',
    GEMS: 'Gem Stone',
    AMOZONITE: 'Amazonite',
    GROSSALAR: 'Grossular',
    ARSENIC: 'Arsenic',
    CALCITE: 'Calcite',
    MO: 'Molybdenum',
    MOLYBDENUM: 'Molybdenum',
    POTASH: 'Potash',
    NICKLE: 'Nickel',
    LITHIUM: 'Lithium',
    POOZALAN: 'Pozzolan',
    POZZALAN: 'Pozzolan',
    GRAPHITE: 'Graphite',
  };

  const mineralType = customMap[key] || titleCase(rawMineral);
  const category =
    existingTypeCategory[mineralType] ||
    newTypeCategories[mineralType] ||
    (mineralType.match(/gold|copper|lead|iron|nickel|cobalt|lithium|antimony|arsenic|molybdenum|metal/i)
      ? 'metallic'
      : mineralType.match(/marble|granite|crush|stone|serpentine|onyx|limestone/i)
        ? 'dimension_stones'
        : mineralType.match(/ruby|emerald|tourmaline|aquamarine|gem|jade|nephrite|topaz|peridot|k2/i)
          ? 'gemstones'
          : mineralType.match(/coal/i)
            ? 'fuels'
            : 'industrial');

  return { mineralType, category };
}

function polygonCentroid(geo) {
  const match = String(geo || '').match(/POLYGON\s*\(\(([^)]+)\)\)/i);
  if (!match) return null;

  const pairs = match[1]
    .split(',')
    .map((part) => part.trim().split(/\s+/).map(Number))
    .filter((coords) => coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1]));

  if (!pairs.length) return null;

  const totals = pairs.reduce(
    (acc, [lon, lat]) => {
      acc.lon += lon;
      acc.lat += lat;
      return acc;
    },
    { lon: 0, lat: 0 }
  );

  return {
    longitude: Number((totals.lon / pairs.length).toFixed(6)),
    latitude: Number((totals.lat / pairs.length).toFixed(6)),
  };
}

function loadCompanyPolygons() {
  const text = fs.readFileSync(gbDataPath, 'utf8');
  const start = text.indexOf('var companyPolygons = ');
  if (start < 0) throw new Error('companyPolygons block not found in gb-data.txt');

  const fn = new Function(`${text.slice(start)}; return companyPolygons;`);
  return fn();
}

const polygons = loadCompanyPolygons();
const withoutGb = existing.filter((site) => !String(site.id).startsWith('gb-'));
const gbSites = [];
const seen = new Set();

for (const group of polygons) {
  const record = group?.[0];
  if (!record) continue;

  const mapped = mapMineralType(record.mineral);
  if (!mapped) continue;

  const district = titleCase(record.district);
  const company = String(record.company_name || '').trim();
  const area = Number(record.area);
  const coords = polygonCentroid(record.geo);
  if (!coords || !company) continue;

  const dedupeKey = [
    mapped.mineralType,
    company.toUpperCase(),
    district.toUpperCase(),
    coords.latitude.toFixed(4),
    coords.longitude.toFixed(4),
  ].join('|');

  if (seen.has(dedupeKey)) continue;
  seen.add(dedupeKey);

  const siteIndex = gbSites.length + 1;
  const id = `gb-${slugify(mapped.mineralType)}-${siteIndex}`;

  gbSites.push({
    id,
    name: `${mapped.mineralType} - ${district}`,
    mineralType: mapped.mineralType,
    category: mapped.category,
    latitude: coords.latitude,
    longitude: coords.longitude,
    province: 'Gilgit-Baltistan',
    district,
    company,
    areaSqKm: Number.isFinite(area) ? area : null,
    description: `Gilgit-Baltistan mineral site. Company: ${company}. Area: ${Number.isFinite(area) ? `${area} sq km` : 'N/A'}.`,
    status: 'active',
  });
}

const merged = [...withoutGb, ...gbSites].sort((a, b) => {
  if (a.province !== b.province) return a.province.localeCompare(b.province);
  if (a.mineralType !== b.mineralType) return a.mineralType.localeCompare(b.mineralType);
  return a.name.localeCompare(b.name);
});

fs.writeFileSync(mineralsPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.resolve(root, 'minerals.json'), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

const typeSummary = [...new Set(gbSites.map((site) => site.mineralType))].sort();
console.log(`Imported ${gbSites.length} Gilgit-Baltistan mineral sites.`);
console.log(`Total minerals in portal: ${merged.length}`);
console.log('GB mineral types:');
typeSummary.forEach((type) => console.log(`- ${type}`));
