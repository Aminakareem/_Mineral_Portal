/**
 * Convert shapefiles in ../flood layers/ to GeoJSON in public/flood-layers/
 * Run: node scripts/convert-flood-layers.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import shp, { combine, parseShp, parseDbf } from 'shpjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(ROOT, '..', 'flood layers');
const OUT_DIR = path.resolve(ROOT, 'public', 'flood-layers');

const FLOOD_SHAPEFILES = [
  { year: 2010, shp: 'G15_Flood_Inundation_2010_SUPARCO.shp', name: 'Flood Extent 2010' },
  { year: 2011, shp: 'G16_Flood_Inundation_2011_SUPARCO_P.shp', name: 'Flood Extent 2011' },
  { year: 2012, shp: 'G17_Flood_Inundation_2012_SUPARCO_P.shp', name: 'Flood Extent 2012' },
  { year: 2013, shp: 'G18_Flood_Inundation_2013_SUPARCO_P.shp', name: 'Flood Extent 2013' },
  { year: 2014, shp: 'G19_Flood_Inundation_2014_SUPARCO_P.shp', name: 'Flood Extent 2014' },
  { year: 2015, shp: 'G20_Flood_Inundation_2015_NDMA_GIS_Team_P.shp', name: 'Flood Extent 2015' },
  { year: 2022, shp: '2022flood_P.shp', name: 'Flood Extent 2022' },
  { year: 2023, shp: 'VIIRS_20230726_20230730_FloodExtent_PAK.shp', name: 'Flood Extent 2023 (VIIRS)' },
  { year: 2024, shp: 'VIIRS_20240420_20240424_MaximumFloodExtent_Pakistan_P.shp', name: 'Flood Extent 2024 (VIIRS)' },
];

async function shapefileToGeoJson(shpPath) {
  const base = shpPath.replace(/\.shp$/i, '');
  const shpBuffer = await readFile(`${base}.shp`);
  const dbfBuffer = await readFile(`${base}.dbf`);
  let prj;
  try {
    prj = await readFile(`${base}.prj`, 'utf8');
  } catch {
    prj = undefined;
  }
  const geometries = parseShp(shpBuffer, prj);
  const properties = parseDbf(dbfBuffer);
  return combine([geometries, properties]);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const entry of FLOOD_SHAPEFILES) {
    const shpPath = path.join(SOURCE_DIR, entry.shp);
    const outName = `flood_${entry.year}.geojson`;
    const outPath = path.join(OUT_DIR, outName);

    try {
      console.log(`Converting ${entry.shp}...`);
      const geojson = await shapefileToGeoJson(shpPath);
      const featureCount = geojson.features?.length ?? 0;
      await writeFile(outPath, JSON.stringify(geojson));
      const sizeMb = (await readFile(outPath)).length / (1024 * 1024);
      console.log(`  -> ${outName} (${featureCount} features, ${sizeMb.toFixed(2)} MB)`);
      manifest.push({ ...entry, file: `/flood-layers/${outName}`, featureCount, sizeMb });
    } catch (err) {
      console.error(`  FAILED ${entry.shp}:`, err.message);
    }
  }

  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
