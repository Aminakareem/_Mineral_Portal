const DETAIL_URL = (eventId) =>
  `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${eventId}.geojson`;

let activeOverlayBlobUrl = null;

export function getEarthquakeEventId(feature) {
  if (!feature) return null;

  if (feature.id != null && feature.id !== '') {
    return String(feature.id);
  }

  const props = feature.properties || {};

  if (props.net && props.code) {
    return `${props.net}${props.code}`;
  }

  if (props.detail) {
    const match = String(props.detail).match(/eventid=([^&]+)/i);
    if (match) return match[1];
  }

  if (props.url) {
    const match = String(props.url).match(/eventpage\/([a-z0-9]+)/i);
    if (match) return match[1];
  }

  if (props.ids) {
    const part = String(props.ids)
      .split(',')
      .map((id) => id.trim())
      .find((id) => /^us[a-z0-9]+$/i.test(id));
    if (part) return part;
  }

  return null;
}

export function hasShakemapType(feature) {
  const types = feature?.properties?.types || '';
  return String(types).includes('shakemap');
}

export async function fetchShakemapContents(eventId) {
  const response = await fetch(DETAIL_URL(eventId));
  if (!response.ok) {
    throw new Error('Could not load earthquake details from USGS.');
  }

  const detail = await response.json();
  const shakemaps = detail.properties?.products?.shakemap;
  if (!shakemaps?.length) {
    return null;
  }

  const product =
    shakemaps.find((item) => item.status === 'UPDATE') ||
    shakemaps[shakemaps.length - 1];

  return product.contents || null;
}

function parseWorldFile(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => parseFloat(line));

  return {
    pixelWidth: lines[0],
    pixelHeight: lines[3],
    upperLeftX: lines[4],
    upperLeftY: lines[5],
  };
}

async function getPngDimensions(buffer) {
  const view = new DataView(buffer);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

async function getIntensityOverlayCoordinates(imageUrl, worldFileUrl) {
  const [imageResponse, worldResponse] = await Promise.all([
    fetch(imageUrl),
    fetch(worldFileUrl),
  ]);

  if (!imageResponse.ok) {
    throw new Error('Could not load ShakeMap intensity image.');
  }
  if (!worldResponse.ok) {
    throw new Error('Could not load ShakeMap georeference data.');
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const { width, height } = await getPngDimensions(imageBuffer);
  const world = parseWorldFile(await worldResponse.text());
  const { pixelWidth, pixelHeight, upperLeftX, upperLeftY } = world;

  return {
    coordinates: [
      [upperLeftX, upperLeftY],
      [upperLeftX + width * pixelWidth, upperLeftY],
      [upperLeftX + width * pixelWidth, upperLeftY + height * pixelHeight],
      [upperLeftX, upperLeftY + height * pixelHeight],
    ],
    imageBuffer,
  };
}

export async function loadShakemapData(eventId) {
  const contents = await fetchShakemapContents(eventId);
  if (!contents) {
    throw new Error('No ShakeMap is available for this earthquake.');
  }

  const overlayUrl = contents['download/intensity_overlay.png']?.url;
  const worldUrl = contents['download/intensity_overlay.pngw']?.url;
  const contourUrl =
    contents['download/cont_mmi.json']?.url ||
    contents['download/cont_mi.json']?.url;

  if (!overlayUrl || !worldUrl || !contourUrl) {
    throw new Error('ShakeMap intensity files are incomplete for this earthquake.');
  }

  const [overlayData, contourResponse] = await Promise.all([
    getIntensityOverlayCoordinates(overlayUrl, worldUrl),
    fetch(contourUrl),
  ]);

  if (!contourResponse.ok) {
    throw new Error('Could not load ShakeMap contour data.');
  }

  const contours = await contourResponse.json();
  const overlayBlobUrl = URL.createObjectURL(
    new Blob([overlayData.imageBuffer], { type: 'image/png' })
  );

  return {
    overlayBlobUrl,
    coordinates: overlayData.coordinates,
    contours,
  };
}

export const SHAKEMAP_SOURCE_IDS = {
  image: 'shakemap-intensity',
  contours: 'shakemap-contours',
};

export const SHAKEMAP_LAYER_IDS = {
  image: 'shakemap-intensity-raster',
  contours: 'shakemap-contour-lines',
};

function revokeOverlayBlobUrl() {
  if (activeOverlayBlobUrl) {
    URL.revokeObjectURL(activeOverlayBlobUrl);
    activeOverlayBlobUrl = null;
  }
}

export function clearShakemapLayers(map) {
  if (!map) return;

  Object.values(SHAKEMAP_LAYER_IDS).forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });

  Object.values(SHAKEMAP_SOURCE_IDS).forEach((sourceId) => {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });

  revokeOverlayBlobUrl();
}

function placeShakemapLayersOnTop(map) {
  Object.values(SHAKEMAP_LAYER_IDS).forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId);
    }
  });
}

function waitForSourceReady(map, sourceId) {
  if (map.isSourceLoaded(sourceId)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      map.off('sourcedata', onSourceData);
      map.off('error', onError);
      reject(new Error('ShakeMap overlay timed out while loading.'));
    }, 20000);

    const onSourceData = (event) => {
      if (event.sourceId === sourceId && map.isSourceLoaded(sourceId)) {
        window.clearTimeout(timeout);
        map.off('sourcedata', onSourceData);
        map.off('error', onError);
        resolve();
      }
    };

    const onError = (event) => {
      if (event?.sourceId === sourceId) {
        window.clearTimeout(timeout);
        map.off('sourcedata', onSourceData);
        map.off('error', onError);
        reject(new Error('ShakeMap overlay failed to render on the map.'));
      }
    };

    map.on('sourcedata', onSourceData);
    map.on('error', onError);
  });
}

export async function addShakemapLayers(map, { overlayBlobUrl, coordinates, contours }) {
  clearShakemapLayers(map);
  activeOverlayBlobUrl = overlayBlobUrl;

  map.addSource(SHAKEMAP_SOURCE_IDS.image, {
    type: 'image',
    url: overlayBlobUrl,
    coordinates,
  });

  map.addLayer({
    id: SHAKEMAP_LAYER_IDS.image,
    type: 'raster',
    source: SHAKEMAP_SOURCE_IDS.image,
    paint: {
      'raster-opacity': 0.78,
      'raster-fade-duration': 0,
    },
  });

  map.addSource(SHAKEMAP_SOURCE_IDS.contours, {
    type: 'geojson',
    data: contours,
  });

  map.addLayer({
    id: SHAKEMAP_LAYER_IDS.contours,
    type: 'line',
    source: SHAKEMAP_SOURCE_IDS.contours,
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#ffffff'],
      'line-width': ['interpolate', ['linear'], ['coalesce', ['get', 'weight'], 2], 1, 2, 3, 4],
      'line-opacity': 1,
    },
  });

  placeShakemapLayersOnTop(map);
  await waitForSourceReady(map, SHAKEMAP_SOURCE_IDS.image);
  placeShakemapLayersOnTop(map);
}

export function fitMapToShakemap(map, coordinates) {
  if (!map || !coordinates?.length) return;
  const lons = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);
  map.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    { padding: 60, duration: 1200 }
  );
}
