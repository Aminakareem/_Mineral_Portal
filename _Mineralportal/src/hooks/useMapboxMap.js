import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  categoryIconMap,
  categoryStyles,
  categoryDisplayNames,
  buildMineralTypeColorExpression,
  buildMineralTypeColorMap,
  computeBBox,
  disasterConfig,
  formatCoordinates,
  getCategoryMarkerStyle,
  normalizeCategory,
  typePalette,
  zoneConfig,
} from '../config/layers';
import { LANDSLIDE_REGIONS } from '../config/landslideData';
import { FLOOD_LAYER_IDS } from '../config/floodData';
import { createFilledIconImageData, MAP_ICON_NAMES } from '../utils/markerShapes';
import {
  addShakemapLayers,
  clearShakemapLayers,
  fitMapToShakemap,
  getEarthquakeEventId,
  hasShakemapType,
  loadShakemapData,
} from '../utils/shakemap';
import {
  addShakemapMineralImpactLayers,
  analyzeMineralShakemapImpact,
  clearShakemapMineralImpactLayers,
  SHAKEMAP_MINERAL_LAYER_IDS,
} from '../utils/shakemapMineralImpact';

const FOCUS_ZOOM = 11.5;

function setLandslideRegionVisibility(map, regionId, visible) {
  const layerId = `landslide-img-${regionId}`;
  if (map?.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

function placeLandslideLayersOnTop(map) {
  LANDSLIDE_REGIONS.forEach((region) => {
    const layerId = `landslide-img-${region.id}`;
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId);
    }
  });
}

function setupSelectionLayers(map) {
  if (!map.getSource('selection-point')) {
    map.addSource('selection-point', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (!map.getLayer('selection-pulse')) {
    map.addLayer({
      id: 'selection-pulse',
      type: 'circle',
      source: 'selection-point',
      paint: {
        'circle-radius': 30,
        'circle-color': '#ffffff',
        'circle-opacity': 0.14,
      },
    });
  }

  if (!map.getLayer('selection-ring')) {
    map.addLayer({
      id: 'selection-ring',
      type: 'circle',
      source: 'selection-point',
      paint: {
        'circle-radius': 18,
        'circle-color': 'transparent',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.95,
      },
    });
  }
}

function updateSelectionPoint(map, lng, lat) {
  const source = map.getSource('selection-point');
  if (!source) return;
  source.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {},
    }],
  });
}

function clearSelectionPoint(map) {
  const source = map.getSource('selection-point');
  if (!source) return;
  source.setData({ type: 'FeatureCollection', features: [] });
}

function setEarthquakeLayerVisible(map, visible) {
  if (map?.getLayer('disaster-earthquake-fill')) {
    map.setLayoutProperty('disaster-earthquake-fill', 'visibility', visible ? 'visible' : 'none');
  }
}

function setDisasterLayerVisibility(map, layerId, visible) {
  if (!map) return;
  if (map.getLayer(`${layerId}-fill`)) {
    map.setLayoutProperty(`${layerId}-fill`, 'visibility', visible ? 'visible' : 'none');
  }
  if (map.getLayer(`${layerId}-line`)) {
    map.setLayoutProperty(`${layerId}-line`, 'visibility', visible ? 'visible' : 'none');
  }
}

function createTypeColorGetter() {
  const mineralTypeColors = {};
  return {
    mineralTypeColors,
    initialize(colorMap = {}) {
      Object.keys(mineralTypeColors).forEach((key) => {
        delete mineralTypeColors[key];
      });
      Object.assign(mineralTypeColors, colorMap);
    },
    getTypeColor: (typeName) => {
      const key = String(typeName || 'Unknown').trim();
      if (!key) return '#64748b';
      if (mineralTypeColors[key]) return mineralTypeColors[key];
      const index = Object.keys(mineralTypeColors).length % typePalette.length;
      const color = typePalette[index];
      mineralTypeColors[key] = color;
      return color;
    },
  };
}

export function useMapboxMap({
  isActive,
  showLandslideOnMap = false,
  onLandslideShown,
  productionMode = false,
  regionFilter = null,
  onMineralFeatureSelect,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const pakistanBboxRef = useRef(null);
  const categoryMapRef = useRef({});
  const mineralsFeaturesRef = useRef([]);
  const popupRef = useRef(null);
  const showShakemapRef = useRef(null);
  const activeShakemapEventIdRef = useRef(null);
  const lastEarthquakeFeatureRef = useRef(null);
  const earthquakeFullDataRef = useRef(null);
  const selectedEarthquakeFeatureRef = useRef(null);
  const disasterVisibilityRef = useRef({});
  const regionFilterRef = useRef(regionFilter);
  const onMineralFeatureSelectRef = useRef(onMineralFeatureSelect);
  const typeColorRef = useRef(createTypeColorGetter());

  const [layers, setLayers] = useState([]);
  const [mineralList, setMineralList] = useState([]);
  const [mineralsFeatures, setMineralsFeatures] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});
  const [selectedMineralType, setSelectedMineralType] = useState(null);
  const [zoneVisibility, setZoneVisibility] = useState(
    Object.fromEntries(Object.keys(zoneConfig).map((id) => [id, true]))
  );
  const [disasterVisibility, setDisasterVisibility] = useState(
    Object.fromEntries(Object.keys(disasterConfig).map((id) => [id, false]))
  );
  const [landslideVisibility, setLandslideVisibility] = useState(
    Object.fromEntries(LANDSLIDE_REGIONS.map((region) => [region.id, false]))
  );
  const [mapReady, setMapReady] = useState(false);

  const [eqStartDate, setEqStartDate] = useState('2025-01-01');
  const [eqEndDate, setEqEndDate] = useState('2026-12-31');
  const [eqMinMag, setEqMinMag] = useState(3.0);
  const [eqLoading, setEqLoading] = useState(false);
  const [eqCount, setEqCount] = useState(0);
  const [eqError, setEqError] = useState(null);
  const [shakemapLoading, setShakemapLoading] = useState(false);
  const [shakemapError, setShakemapError] = useState(null);
  const [activeShakemapEventId, setActiveShakemapEventId] = useState(null);
  const [shakemapMineralImpacts, setShakemapMineralImpacts] = useState(null);
  const shakemapImpactClickHandlerRef = useRef(null);

  useEffect(() => {
    disasterVisibilityRef.current = disasterVisibility;
  }, [disasterVisibility]);

  useEffect(() => {
    regionFilterRef.current = regionFilter;
  }, [regionFilter]);

  useEffect(() => {
    onMineralFeatureSelectRef.current = onMineralFeatureSelect;
  }, [onMineralFeatureSelect]);

  const clearProductionRegionLayers = useCallback((map) => {
    if (!map) return;
    ['production-region-fill', 'production-region-line'].forEach((layerId) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });
    if (map.getSource('production-region-highlight')) {
      map.removeSource('production-region-highlight');
    }
  }, []);

  const applyProductionRegion = useCallback((region) => {
    const map = mapRef.current;
    if (!map) return;

    clearProductionRegionLayers(map);
    if (!region?.bbox) return;
    map.fitBounds(region.bbox, { padding: 70, duration: 1200 });
  }, [clearProductionRegionLayers]);

  const clearProductionRegion = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    clearProductionRegionLayers(map);
    const bbox = pakistanBboxRef.current;
    if (bbox) {
      map.fitBounds(bbox, { padding: 50, duration: 1200 });
    }
  }, [clearProductionRegionLayers]);

  const applyProductionMineralSelection = useCallback((productionMineralName, portalType) => {
    const map = mapRef.current;
    const categoryMap = categoryMapRef.current;
    if (!map || !categoryMap) return;

    const province = regionFilterRef.current;

    Object.keys(categoryMap).forEach((catId) => {
      if (!map.getLayer(catId)) return;

      if (!province && !portalType) {
        map.setFilter(catId, ['==', ['get', 'category'], catId]);
      } else {
        const filters = [['==', ['get', 'category'], catId]];
        if (province) {
          filters.push(['==', ['get', 'province'], province]);
        }
        if (portalType) {
          filters.push(['==', ['get', 'mineralType'], portalType]);
        }
        map.setFilter(catId, ['all', ...filters]);
      }
      map.setLayoutProperty(catId, 'visibility', 'visible');
    });

    if (productionMineralName && portalType) {
      const match = mineralsFeaturesRef.current.find(
        (feature) => feature.properties?.mineralType === portalType
          && (!province || feature.properties?.province === province)
      );
      if (match) {
        const [lng, lat] = match.geometry.coordinates;
        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 8.5),
          duration: 1200,
          essential: true,
        });
      }
    }
  }, []);

  const updateEarthquakeDisplay = useCallback(() => {
    const map = mapRef.current;
    if (!map?.getLayer('disaster-earthquake-fill')) return;

    const layerEnabled = disasterVisibilityRef.current['disaster-earthquake'];
    if (!layerEnabled) {
      setEarthquakeLayerVisible(map, false);
      return;
    }

    if (activeShakemapEventIdRef.current) {
      setEarthquakeLayerVisible(map, false);
      return;
    }

    const source = map.getSource('earthquake-source');
    if (!source) return;

    if (selectedEarthquakeFeatureRef.current) {
      source.setData({
        type: 'FeatureCollection',
        features: [selectedEarthquakeFeatureRef.current],
      });
    } else if (earthquakeFullDataRef.current) {
      source.setData(earthquakeFullDataRef.current);
    }

    setEarthquakeLayerVisible(map, true);
  }, []);

  const ensureMapReady = useCallback(() => {
    const map = mapRef.current;
    if (map && map.loaded()) return Promise.resolve();
    return new Promise((resolve) => map.once('load', resolve));
  }, []);

  const loadCategoryIcons = useCallback(async (map) => {
    for (const iconName of MAP_ICON_NAMES) {
      if (map.hasImage(iconName)) continue;
      const imageData = createFilledIconImageData(iconName);
      if (imageData) {
        map.addImage(iconName, imageData, { sdf: true });
      }
    }
  }, []);

  const buildPopupHtml = useCallback((feature, categoryMap) => {
    const title = feature.properties.mineralType || feature.properties.name || 'Unknown Mineral';
    const categoryKey = feature.properties.category;
    const categoryLabel = categoryMap[categoryKey]?.name || categoryKey || 'Unknown Category';
    const province = feature.properties.province || 'Unknown';
    const district = feature.properties.district || '';
    const company = feature.properties.company || '';
    const areaSqKm = feature.properties.areaSqKm;
    const coords = feature.geometry.coordinates;
    const formattedCoords = formatCoordinates(coords[0], coords[1]);
    const accent = typeColorRef.current.getTypeColor(title) || categoryStyles[categoryKey] || '#10b981';

    return `
      <div class="popup-card" style="--popup-accent:${accent}">
        <div class="popup-accent-bar"></div>
        <div class="popup-header">
          <div>
            <div class="popup-title">${title}</div>
            <div class="popup-badge" style="background:${accent}22;color:${accent};border:1px solid ${accent}44;">${categoryLabel}</div>
          </div>
        </div>
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-map-pin"></i></span>
          <div class="popup-meta">
            <span class="label">Province</span>
            <span class="value">${province}</span>
          </div>
        </div>
        ${district ? `
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-map"></i></span>
          <div class="popup-meta">
            <span class="label">District</span>
            <span class="value">${district}</span>
          </div>
        </div>
        ` : ''}
        ${company ? `
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-building"></i></span>
          <div class="popup-meta">
            <span class="label">Company</span>
            <span class="value">${company}</span>
          </div>
        </div>
        ` : ''}
        ${areaSqKm != null && areaSqKm !== '' ? `
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-ruler-combined"></i></span>
          <div class="popup-meta">
            <span class="label">Area</span>
            <span class="value">${areaSqKm} sq km</span>
          </div>
        </div>
        ` : ''}
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-chart-line"></i></span>
          <div class="popup-meta">
            <span class="label">Category</span>
            <span class="value">${categoryLabel}</span>
          </div>
        </div>
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-location-crosshairs"></i></span>
          <div class="popup-meta">
            <span class="label">Coordinates</span>
            <span class="value">${formattedCoords}</span>
          </div>
        </div>
      </div>
    `;
  }, []);

  const focusOnFeature = useCallback((map, feature) => {
    if (!map || !feature?.geometry?.coordinates) return;
    const [lng, lat] = feature.geometry.coordinates;
    const categoryMap = categoryMapRef.current;

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      duration: 1400,
      essential: true,
      offset: [0, 60],
    });

    updateSelectionPoint(map, lng, lat);

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    popupRef.current = new mapboxgl.Popup({
      offset: 22,
      closeButton: true,
      closeOnClick: true,
      className: 'mapboxgl-popup mineral-popup',
      maxWidth: '340px',
    })
      .setLngLat([lng, lat])
      .setHTML(buildPopupHtml(feature, categoryMap))
      .addTo(map);

    const clickedMineral = feature.properties?.mineralType || feature.properties?.name || null;
    onMineralFeatureSelectRef.current?.(clickedMineral);

    popupRef.current.on('close', () => {
      popupRef.current = null;
    });
  }, [buildPopupHtml]);

  const flyToMineralType = useCallback((mineralType) => {
    const map = mapRef.current;
    const match = mineralsFeaturesRef.current.find(
      (f) => f.properties.mineralType === mineralType
    );
    if (match) focusOnFeature(map, match);
  }, [focusOnFeature]);

  const applyMineralTypeFilter = useCallback((selectedType) => {
    const map = mapRef.current;
    const categoryMap = categoryMapRef.current;
    if (!map || !categoryMap) return;

    Object.keys(categoryMap).forEach((catId) => {
      if (!map.getLayer(catId)) return;
      if (selectedType) {
        map.setFilter(catId, ['all', ['==', ['get', 'category'], catId], ['==', ['get', 'mineralType'], selectedType]]);
        map.setLayoutProperty(catId, 'visibility', 'visible');
      } else {
        map.setFilter(catId, ['==', ['get', 'category'], catId]);
      }
    });
  }, []);

  const initPortalLayers = useCallback(async (map) => {
    try {
      await loadCategoryIcons(map);

      const response = await fetch('/minerals.json');
      if (!response.ok) {
        throw new Error(`minerals.json fetch failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const categoryMap = {};
      const mineralTypeColorMap = buildMineralTypeColorMap(
        data.map((site) => site.mineralType || site.name)
      );
      typeColorRef.current.initialize(mineralTypeColorMap);
      const { getTypeColor } = typeColorRef.current;
      const mineralTypeColorExpression = buildMineralTypeColorExpression(mineralTypeColorMap);
      const getCategoryIcon = (cat) => categoryIconMap[cat] || 'circle';
      const features = [];

      data.forEach((site) => {
        const cat = normalizeCategory(site.category);
        const mName = String(site.mineralType || site.name || 'Unknown').trim();
        const mColor = getTypeColor(mName);
        const lon = Number(site.longitude);
        const lat = Number(site.latitude);
        if (Number.isNaN(lon) || Number.isNaN(lat)) return;

        if (!categoryMap[cat]) {
          categoryMap[cat] = {
            id: cat,
            name: categoryDisplayNames[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            count: 0,
            marker_color: categoryStyles[cat] || '#6b7280',
            visible: true,
            itemsMap: {},
          };
        }

        categoryMap[cat].count++;
        if (!categoryMap[cat].itemsMap[mName]) {
          categoryMap[cat].itemsMap[mName] = { count: 0, color: mColor };
        }
        categoryMap[cat].itemsMap[mName].count++;

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: {
            id: site.id,
            name: site.name,
            mineralType: mName,
            category: cat,
            province: site.province,
            district: site.district,
            company: site.company || '',
            areaSqKm: site.areaSqKm ?? null,
            description: site.description,
            status: site.status,
            icon: getCategoryIcon(cat),
            markerColor: mColor,
          },
        });
      });

      Object.keys(categoryMap).forEach((cat) => {
        const cm = categoryMap[cat];
        cm.items = Object.keys(cm.itemsMap || {}).map((name) => ({
          name,
          count: cm.itemsMap[name].count,
          color: cm.itemsMap[name].color,
        }));
      });

      const mineralGeo = { type: 'FeatureCollection', features };
      mineralsFeaturesRef.current = features;
      setMineralsFeatures(features);
      if (map.getSource('minerals')) {
        map.getSource('minerals').setData(mineralGeo);
      } else {
        map.addSource('minerals', { type: 'geojson', data: mineralGeo });
      }

      Object.keys(categoryMap).forEach((catId) => {
        if (map.getLayer(catId)) map.removeLayer(catId);
        map.addLayer({
          id: catId,
          type: 'symbol',
          source: 'minerals',
          filter: ['==', ['get', 'category'], catId],
          layout: {
            'icon-image': ['get', 'icon'],
            'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.1, 5, 0.16, 8, 0.3, 11, 0.45, 14, 0.7],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
          paint: {
            'icon-color': mineralTypeColorExpression,
            'icon-halo-width': 0,
          },
        });
        map.setLayoutProperty(catId, 'visibility', categoryMap[catId].visible ? 'visible' : 'none');
      });

      categoryMapRef.current = categoryMap;
      setupSelectionLayers(map);

      Object.keys(categoryMap).forEach((catId) => {
        if (!map.getLayer(catId)) return;
        map.on('click', catId, (event) => {
          if (event.clickHandled) return;
          event.clickHandled = true;
          const feature = event.features && event.features[0];
          if (!feature) return;
          focusOnFeature(map, feature);
        });

        map.on('mouseenter', catId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', catId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      const layersArr = Object.keys(categoryMap).map((k) => ({
        id: categoryMap[k].id,
        name: categoryMap[k].name,
        count: categoryMap[k].count,
        marker_style: getCategoryMarkerStyle(categoryMap[k].id),
        marker_color: categoryStyles[categoryMap[k].id] || '#6b7280',
        visible: categoryMap[k].visible,
        items: categoryMap[k].items || [],
      }));

      setLayers(layersArr);
      setLayerVisibility(Object.fromEntries(layersArr.map((l) => [l.id, l.visible])));

      const mineralCounts = {};
      const mineralToCategory = {};
      features.forEach((f) => {
        const mt = f.properties.mineralType || 'Unknown';
        mineralCounts[mt] = (mineralCounts[mt] || 0) + 1;
        if (!mineralToCategory[mt]) mineralToCategory[mt] = f.properties.category;
      });

      const list = Object.keys(mineralCounts)
        .map((k) => ({ name: k, count: mineralCounts[k], category: mineralToCategory[k] }))
        .sort((a, b) => b.count - a.count);

      setMineralList(list);
    } catch (error) {
      console.error('Critical System Initialization Error parsing minerals.json:', error);
    }
  }, [buildPopupHtml, focusOnFeature, loadCategoryIcons]);

  const loadMetallogenicZones = useCallback(async (map) => {
    for (const [zoneId, cfg] of Object.entries(zoneConfig)) {
      if (!cfg.file) continue;
      try {
        const resp = await fetch(cfg.file);
        if (!resp.ok) continue;
        const data = await resp.json();

        if (!map.getSource(zoneId)) {
          map.addSource(zoneId, { type: 'geojson', data });
        }

        if (!map.getLayer(`${zoneId}-fill`)) {
          map.addLayer({
            id: `${zoneId}-fill`,
            type: 'fill',
            source: zoneId,
            paint: {
              'fill-color': cfg.color,
              'fill-opacity': 0.35,
            },
          });
        }

        if (!map.getLayer(`${zoneId}-line`)) {
          map.addLayer({
            id: `${zoneId}-line`,
            type: 'line',
            source: zoneId,
            paint: {
              'line-color': cfg.color,
              'line-width': 1.5,
            },
          });
        }

        map.on('click', `${zoneId}-fill`, (e) => {
          if (e.clickHandled) return;
          e.clickHandled = true;
          const num = zoneId.replace('zone-', '');
          new mapboxgl.Popup({
            offset: 12,
            closeButton: true,
            maxWidth: '340px',
            className: 'mapboxgl-popup mineral-popup'
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="popup-card">
                <div class="popup-header">
                  <div>
                    <div class="popup-title">${cfg.name}</div>
                    <div class="popup-badge" style="background:${cfg.color}22;color:${cfg.color};">Zone ${num}</div>
                  </div>
                </div>
                <div class="popup-row">
                  <span class="popup-icon"><i class="fa-solid fa-mountain"></i></span>
                  <div class="popup-meta">
                    <span class="label">Metallogenic Zone</span>
                    <span class="value">${cfg.name}</span>
                  </div>
                </div>
                <div class="popup-row">
                  <span class="popup-icon"><i class="fa-solid fa-hashtag"></i></span>
                  <div class="popup-meta">
                    <span class="label">Zone Number</span>
                    <span class="value">${num} of 13</span>
                  </div>
                </div>
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', `${zoneId}-fill`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `${zoneId}-fill`, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        console.warn(`Zone ${zoneId} failed to load:`, err);
      }
    }
  }, []);

  const loadDisasterLayers = useCallback(async (map) => {
    for (const [layerId, cfg] of Object.entries(disasterConfig)) {
      if (!cfg.file) continue;
      try {
        const resp = await fetch(cfg.file);
        if (!resp.ok) continue;
        const data = await resp.json();
        const firstGeometryType = data?.features?.[0]?.geometry?.type || '';
        const isLineLayer = String(firstGeometryType).includes('LineString');
        const isPolygonLayer = String(firstGeometryType).includes('Polygon');

        if (!map.getSource(layerId)) {
          map.addSource(layerId, { type: 'geojson', data });
        }
        if (isPolygonLayer && !map.getLayer(`${layerId}-fill`)) {
          map.addLayer({
            id: `${layerId}-fill`,
            type: 'fill',
            source: layerId,
            layout: { visibility: 'none' },
            paint: { 'fill-color': cfg.color, 'fill-opacity': 0.45 },
          });
        }
        if (!map.getLayer(`${layerId}-line`)) {
          map.addLayer({
            id: `${layerId}-line`,
            type: 'line',
            source: layerId,
            layout: { visibility: 'none' },
            paint: { 'line-color': cfg.color, 'line-width': isLineLayer ? 2.2 : 1.2 },
          });
        }

        const interactiveLayerId = map.getLayer(`${layerId}-fill`) ? `${layerId}-fill` : `${layerId}-line`;
        map.on('click', interactiveLayerId, (e) => {
          new mapboxgl.Popup({ offset: 12, closeButton: true })
            .setLngLat(e.lngLat)
            .setHTML(`<div class="popup-card">
              <div class="popup-header"><div>
                <div class="popup-title">${cfg.name}</div>
                <div class="popup-badge" style="background:${cfg.color}22;color:${cfg.color};">Disaster Layer</div>
              </div></div>
              <div class="popup-row">
                <span class="popup-icon"><i class="fa-solid fa-location-crosshairs"></i></span>
                <div class="popup-meta">
                  <span class="label">Coordinates</span>
                  <span class="value">${e.lngLat.lat.toFixed(4)}°N, ${e.lngLat.lng.toFixed(4)}°E</span>
                </div>
              </div>
            </div>`)
            .addTo(map);
        });

        map.on('mouseenter', interactiveLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', interactiveLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        console.warn(`Disaster layer ${layerId} failed:`, err);
      }
    }

    for (const region of LANDSLIDE_REGIONS) {
      const sourceId = `landslide-img-${region.id}`;
      const layerId = `landslide-img-${region.id}`;
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'image',
            url: region.previewUrl,
            coordinates: region.coordinates,
          });
        }
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            layout: { visibility: 'none' },
            paint: {
              'raster-opacity': 0.96,
              'raster-fade-duration': 400,
              'raster-contrast': 0.22,
              'raster-saturation': 0.35,
              'raster-brightness-min': 0.12,
              'raster-brightness-max': 1,
            },
          });
        } else {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      } catch (err) {
        console.warn(`Landslide layer ${region.id} failed:`, err);
      }
    }

    placeLandslideLayersOnTop(map);
  }, []);

  const loadPakistanBoundary = useCallback(async (map) => {
    try {
      const resp = await fetch('/geoboundries.geojson');
      const pakistanData = await resp.json();

      map.addSource('pakistan-boundary', {
        type: 'geojson',
        data: pakistanData,
      });

      map.addLayer({
        id: 'pakistan-line',
        type: 'line',
        source: 'pakistan-boundary',
        layout: {},
        paint: {
          'line-color': '#2dd4bf',
          'line-width': 2,
          'line-opacity': 0.75,
        },
      });

      map.addLayer({
        id: 'pakistan-fill',
        type: 'fill',
        source: 'pakistan-boundary',
        paint: {
          'fill-color': 'rgba(45, 212, 191, 0.04)',
          'fill-outline-color': 'rgba(45, 212, 191, 0.35)',
        },
      });

      const bbox = computeBBox(pakistanData);
      if (bbox) {
        pakistanBboxRef.current = bbox;
        try {
          map.fitBounds(bbox, { padding: 40 });
        } catch (fitErr) {
          console.warn('fitBounds failed:', fitErr);
        }
      }
    } catch (e) {
      console.error('Failed to load geoboundries.geojson:', e);
    }
  }, []);

  const hideShakemap = useCallback(({ restoreAllEarthquakes = false } = {}) => {
    const map = mapRef.current;
    clearShakemapLayers(map);
    clearShakemapMineralImpactLayers(map);
    if (map && shakemapImpactClickHandlerRef.current) {
      Object.values(SHAKEMAP_MINERAL_LAYER_IDS).forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId, shakemapImpactClickHandlerRef.current);
          map.off('mouseenter', layerId, shakemapImpactClickHandlerRef.current.onEnter);
          map.off('mouseleave', layerId, shakemapImpactClickHandlerRef.current.onLeave);
        }
      });
      shakemapImpactClickHandlerRef.current = null;
    }
    activeShakemapEventIdRef.current = null;
    setActiveShakemapEventId(null);
    setShakemapMineralImpacts(null);
    setShakemapError(null);
    if (restoreAllEarthquakes) {
      selectedEarthquakeFeatureRef.current = null;
    }
    updateEarthquakeDisplay();
  }, [updateEarthquakeDisplay]);

  const buildEarthquakePopupHtml = useCallback((props, coords, eventId, shakemapAvailable) => {
    const timeStr = new Date(props.time).toLocaleString();
    const isActive = activeShakemapEventIdRef.current === eventId;
    const shakemapBtnLabel = shakemapLoading
      ? 'Loading ShakeMap...'
      : isActive
        ? 'Hide ShakeMap'
        : 'Show ShakeMap';
    const impacts = isActive ? shakemapMineralImpacts : null;
    const impactSummary = impacts?.summary;

    return `
      <div class="popup-card" style="--popup-accent:#ef4444">
        <div class="popup-accent-bar"></div>
        <div class="popup-header">
          <div>
            <div class="popup-title">${props.place || 'Unknown Location'}</div>
            <div class="popup-badge" style="background:#ef444422;color:#ef4444;border:1px solid #ef444444;">Magnitude ${props.mag} ${props.magType || ''}</div>
          </div>
        </div>
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-clock"></i></span>
          <div class="popup-meta">
            <span class="label">Time</span>
            <span class="value">${timeStr}</span>
          </div>
        </div>
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-location-crosshairs"></i></span>
          <div class="popup-meta">
            <span class="label">Coordinates & Depth</span>
            <span class="value">${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E (${coords[2] || 0} km depth)</span>
          </div>
        </div>
        ${props.mmi ? `
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-wave-square"></i></span>
          <div class="popup-meta">
            <span class="label">Max MMI (ShakeMap)</span>
            <span class="value">${Number(props.mmi).toFixed(1)}</span>
          </div>
        </div>
        ` : ''}
        ${props.sig ? `
        <div class="popup-row">
          <span class="popup-icon"><i class="fa-solid fa-circle-exclamation"></i></span>
          <div class="popup-meta">
            <span class="label">Significance / Felt Reports</span>
            <span class="value">${props.sig} pts / ${props.felt || 0} reports</span>
          </div>
        </div>
        ` : ''}
        ${shakemapAvailable ? `
        <button type="button" class="popup-shakemap-btn${isActive ? ' active' : ''}" data-event-id="${eventId}">
          <i class="fa-solid fa-map"></i> ${shakemapBtnLabel}
        </button>
        <p class="popup-shakemap-note">Live intensity contours from USGS ShakeMap</p>
        ` : `
        <p class="popup-shakemap-note unavailable">ShakeMap not published for this event yet.</p>
        `}
        ${impactSummary ? `
        <div class="popup-shakemap-impact">
          <div class="popup-shakemap-impact-title"><i class="fa-solid fa-gem"></i> Minerals in shaking zone</div>
          <div class="popup-shakemap-impact-stats">
            <span class="impact-stat high">${impactSummary.high} high</span>
            <span class="impact-stat moderate">${impactSummary.moderate} moderate</span>
            ${impactSummary.low ? `<span class="impact-stat low">${impactSummary.low} low</span>` : ''}
          </div>
          <p class="popup-shakemap-note">See Hazards panel for affected site names.</p>
        </div>
        ` : ''}
        ${shakemapError ? `<p class="popup-shakemap-error">${shakemapError}</p>` : ''}
        ${props.url ? `
        <div style="margin-top: 10px; text-align: right;">
          <a href="${props.url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: none; font-size: 0.75rem; font-weight: 600;">
            View on USGS Website <i class="fa-solid fa-up-right-from-square" style="font-size: 0.7rem; margin-left: 2px;"></i>
          </a>
        </div>
        ` : ''}
      </div>
    `;
  }, [shakemapError, shakemapLoading, shakemapMineralImpacts]);

  const attachShakemapButton = useCallback((popup, eventId) => {
    if (!popup || !eventId) return;
    const button = popup.getElement()?.querySelector('.popup-shakemap-btn');
    if (!button) return;

    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      showShakemapRef.current?.(eventId);
    };
  }, []);

  const refreshEarthquakePopup = useCallback((eventId) => {
    const feature = lastEarthquakeFeatureRef.current;
    if (!popupRef.current || !feature || getEarthquakeEventId(feature) !== eventId) return;

    const props = feature.properties;
    const coords = feature.geometry.coordinates;
    popupRef.current.setHTML(
      buildEarthquakePopupHtml(props, coords, eventId, hasShakemapType(feature))
    );
    attachShakemapButton(popupRef.current, eventId);
  }, [attachShakemapButton, buildEarthquakePopupHtml]);

  const bindShakemapImpactLayers = useCallback((map) => {
    if (!map) return;

    if (shakemapImpactClickHandlerRef.current) {
      Object.values(SHAKEMAP_MINERAL_LAYER_IDS).forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId, shakemapImpactClickHandlerRef.current);
          map.off('mouseenter', layerId, shakemapImpactClickHandlerRef.current.onEnter);
          map.off('mouseleave', layerId, shakemapImpactClickHandlerRef.current.onLeave);
        }
      });
    }

    const onClick = (event) => {
      if (event.clickHandled) return;
      event.clickHandled = true;
      const feature = event.features?.[0];
      if (!feature) return;
      focusOnFeature(map, feature);
    };

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    shakemapImpactClickHandlerRef.current = Object.assign(onClick, { onEnter, onLeave });

    Object.values(SHAKEMAP_MINERAL_LAYER_IDS).forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      map.on('click', layerId, onClick);
      map.on('mouseenter', layerId, onEnter);
      map.on('mouseleave', layerId, onLeave);
    });
  }, [focusOnFeature]);

  const selectAffectedMineral = useCallback((mineralId) => {
    const map = mapRef.current;
    const feature = mineralsFeaturesRef.current.find((item) => item.properties?.id === mineralId);
    if (map && feature) {
      focusOnFeature(map, feature);
    }
  }, [focusOnFeature]);

  const showShakemap = useCallback(async (eventId) => {
    const map = mapRef.current;
    if (!map || !eventId) return;

    if (activeShakemapEventIdRef.current === eventId) {
      hideShakemap();
      refreshEarthquakePopup(eventId);
      return;
    }

    setShakemapLoading(true);
    setShakemapError(null);
    setShakemapMineralImpacts(null);
    refreshEarthquakePopup(eventId);

    try {
      const shakemapData = await loadShakemapData(eventId);
      await addShakemapLayers(map, shakemapData);
      fitMapToShakemap(map, shakemapData.coordinates);

      const eqFeature = lastEarthquakeFeatureRef.current;
      const epicenter = eqFeature?.geometry?.coordinates
        ? [eqFeature.geometry.coordinates[0], eqFeature.geometry.coordinates[1]]
        : null;

      const impacts = analyzeMineralShakemapImpact(
        mineralsFeaturesRef.current,
        shakemapData.contours,
        shakemapData.coordinates,
        epicenter
      );

      addShakemapMineralImpactLayers(map, impacts);
      bindShakemapImpactLayers(map);

      activeShakemapEventIdRef.current = eventId;
      setActiveShakemapEventId(eventId);
      setShakemapMineralImpacts(impacts);
      setEarthquakeLayerVisible(map, false);

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    } catch (err) {
      console.error(err);
      setShakemapError(err.message || 'Failed to load ShakeMap.');
      hideShakemap();
    } finally {
      setShakemapLoading(false);
      if (activeShakemapEventIdRef.current !== eventId) {
        refreshEarthquakePopup(eventId);
      }
    }
  }, [bindShakemapImpactLayers, hideShakemap, refreshEarthquakePopup]);

  showShakemapRef.current = showShakemap;

  const openEarthquakePopup = useCallback((map, feature) => {
    const eventId = getEarthquakeEventId(feature);
    const switchingShakemap =
      activeShakemapEventIdRef.current && activeShakemapEventIdRef.current !== eventId;

    lastEarthquakeFeatureRef.current = feature;
    selectedEarthquakeFeatureRef.current = feature;

    if (switchingShakemap) {
      hideShakemap();
    }

    const props = feature.properties;
    const coords = feature.geometry.coordinates;
    const shakemapAvailable = hasShakemapType(feature);

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    updateEarthquakeDisplay();

    const popup = new mapboxgl.Popup({
      offset: 10,
      closeButton: true,
      maxWidth: '360px',
      className: 'mapboxgl-popup mineral-popup earthquake-popup',
    })
      .setLngLat(coords)
      .setHTML(buildEarthquakePopupHtml(props, coords, eventId, shakemapAvailable))
      .addTo(map);

    attachShakemapButton(popup, eventId);

    popup.on('close', () => {
      popupRef.current = null;
      if (!activeShakemapEventIdRef.current) {
        selectedEarthquakeFeatureRef.current = null;
      }
      updateEarthquakeDisplay();
    });

    popupRef.current = popup;
  }, [attachShakemapButton, buildEarthquakePopupHtml, hideShakemap, updateEarthquakeDisplay]);

  const fetchEarthquakes = useCallback(async (start, end, minMag) => {
    const map = mapRef.current;
    if (!map) return;

    setEqLoading(true);
    setEqError(null);

    try {
      // Afghanistan Bounding Box
      const minLat = 29.0;
      const maxLat = 39.0;
      const minLng = 60.0;
      const maxLng = 75.0;

      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}&minmagnitude=${minMag}&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLng}&maxlongitude=${maxLng}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        const firstLine = errorText.split('\n')[0] || `HTTP Error ${response.status}`;
        throw new Error(firstLine);
      }
      const data = await response.json();
      setEqCount(data.features?.length || 0);
      earthquakeFullDataRef.current = data;
      selectedEarthquakeFeatureRef.current = null;

      if (map.getSource('earthquake-source')) {
        map.getSource('earthquake-source').setData(data);
      } else {
        map.addSource('earthquake-source', {
          type: 'geojson',
          data,
        });
      }

      if (!map.getLayer('disaster-earthquake-fill')) {
        map.addLayer({
          id: 'disaster-earthquake-fill',
          type: 'circle',
          source: 'earthquake-source',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'mag'],
              1, 2,
              3, 3.5,
              5, 6,
              7, 9,
              9, 13
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'mag'],
              1, '#fef08a',
              3, '#fed7aa',
              5, '#f97316',
              7, '#ef4444',
              9, '#7f1d1d'
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9,
          }
        });

        map.on('click', 'disaster-earthquake-fill', (e) => {
          if (e.clickHandled) return;
          e.clickHandled = true;
          const feature = e.features?.[0];
          if (!feature) return;
          openEarthquakePopup(map, feature);
        });

        map.on('mouseenter', 'disaster-earthquake-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'disaster-earthquake-fill', () => {
          map.getCanvas().style.cursor = '';
        });
      } else {
        const radiusExpr = [
          'interpolate',
          ['linear'],
          ['get', 'mag'],
          1, 2,
          3, 3.5,
          5, 6,
          7, 9,
          9, 13,
        ];
        map.setPaintProperty('disaster-earthquake-fill', 'circle-radius', radiusExpr);
        map.setPaintProperty('disaster-earthquake-fill', 'circle-stroke-width', 1);
      }

      updateEarthquakeDisplay();
    } catch (err) {
      console.error(err);
      setEqError(err.message || 'Failed to fetch earthquake data');
    } finally {
      setEqLoading(false);
    }
  }, [openEarthquakePopup, updateEarthquakeDisplay]);

  useEffect(() => {
    if (mapReady && disasterVisibility['disaster-earthquake']) {
      fetchEarthquakes(eqStartDate, eqEndDate, eqMinMag);
    } else if (mapReady && mapRef.current?.getLayer('disaster-earthquake-fill')) {
      mapRef.current.setLayoutProperty('disaster-earthquake-fill', 'visibility', 'none');
      selectedEarthquakeFeatureRef.current = null;
      hideShakemap();
    }
  }, [mapReady, disasterVisibility['disaster-earthquake'], eqStartDate, eqEndDate, eqMinMag, fetchEarthquakes, hideShakemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    Object.entries(disasterConfig).forEach(([layerId, cfg]) => {
      if (!cfg.file) return;
      const visible = Boolean(disasterVisibility[layerId]);
      setDisasterLayerVisibility(map, layerId, visible);
    });
  }, [mapReady, disasterVisibility]);

  useEffect(() => {
    if (!mapReady || !productionMode) return;
    applyProductionMineralSelection(null, null);
  }, [mapReady, productionMode, regionFilter, applyProductionMineralSelection]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [69.3451, 30.3753],
      zoom: 5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right');

    map.on('style.load', () => {
      if (typeof map.setFog === 'function') {
        map.setFog({
          color: 'rgb(6, 10, 18)',
          'high-color': 'rgb(14, 22, 38)',
          'horizon-blend': 0.08,
          'space-color': 'rgb(4, 7, 15)',
          'star-intensity': 0.15,
        });
      }
    });

    map.on('load', async () => {
      await loadPakistanBoundary(map);
      await initPortalLayers(map);
      await loadMetallogenicZones(map);
      await loadDisasterLayers(map);
      if (map.getLayer('selection-pulse')) {
        map.moveLayer('selection-pulse');
        map.moveLayer('selection-ring');
      }
      placeLandslideLayersOnTop(map);
      setMapReady(true);
      requestAnimationFrame(() => {
        map.resize();
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initPortalLayers, loadDisasterLayers, loadMetallogenicZones, loadPakistanBoundary]);

  useEffect(() => {
    if (isActive && mapRef.current) {
      mapRef.current.resize();
    }
  }, [isActive]);

  useEffect(() => {
    applyMineralTypeFilter(selectedMineralType);
  }, [selectedMineralType, applyMineralTypeFilter, layers]);

  const toggleDropdown = (groupId) => {
    setOpenGroups((prev) => {
      const isOpen = !!prev[groupId];
      return isOpen ? {} : { [groupId]: true };
    });
  };

  const toggleLayerVisibility = (groupId) => {
    const map = mapRef.current;
    const nextVisible = !layerVisibility[groupId];

    setLayerVisibility((prev) => ({ ...prev, [groupId]: nextVisible }));

    if (map && map.getLayer(groupId)) {
      map.setLayoutProperty(groupId, 'visibility', nextVisible ? 'visible' : 'none');
    }
  };

  const selectMineralType = (mineralType) => {
    if (mineralType === null) {
      setSelectedMineralType(null);
      return;
    }
    setSelectedMineralType((prev) => {
      const next = prev === mineralType ? null : mineralType;
      if (next) flyToMineralType(next);
      return next;
    });
  };

  const clearSelection = useCallback(() => {
    setSelectedMineralType(null);
    const map = mapRef.current;
    if (map) clearSelectionPoint(map);
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, []);

  const zoomIn = () => mapRef.current?.zoomIn({ duration: 350 });
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 350 });
  const nudgeZoom = useCallback((delta, offsetX = 0) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      zoom: Math.max(3.5, map.getZoom() + delta),
      offset: [offsetX, 0],
      duration: 700,
      essential: true,
    });
  }, []);
  const resetNorth = () => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 600 });
  const resetMapView = () => {
    const map = mapRef.current;
    const bbox = pakistanBboxRef.current;
    clearSelection();
    if (map && bbox) {
      map.fitBounds(bbox, { padding: 60, duration: 1000 });
    } else if (map) {
      map.flyTo({ center: [69.3451, 30.3753], zoom: 5, duration: 1000 });
    }
  };

  const toggleFullscreen = () => {
    const el = mapContainerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const toggleAllLayers = (status) => {
    const map = mapRef.current;
    const categoryMap = categoryMapRef.current;
    setSelectedMineralType(null);

    setLayerVisibility((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((id) => {
        next[id] = status;
      });
      return next;
    });

    setZoneVisibility((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((id) => {
        next[id] = status;
      });
      return next;
    });

    setDisasterVisibility((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((id) => {
        next[id] = status;
      });
      return next;
    });

    if (categoryMap && map) {
      Object.keys(categoryMap).forEach((catId) => {
        if (map.getLayer(catId)) {
          map.setLayoutProperty(catId, 'visibility', status ? 'visible' : 'none');
          if (status) {
            map.setFilter(catId, ['==', ['get', 'category'], catId]);
          }
        }
      });
    }

    Object.keys(zoneConfig).forEach((zoneId) => {
      if (map?.getLayer(`${zoneId}-fill`)) {
        map.setLayoutProperty(`${zoneId}-fill`, 'visibility', status ? 'visible' : 'none');
        map.setLayoutProperty(`${zoneId}-line`, 'visibility', status ? 'visible' : 'none');
      }
    });

    Object.keys(disasterConfig).forEach((layerId) => {
      setDisasterLayerVisibility(map, layerId, status);
    });
  };

  const toggleLandslideRegion = (regionId) => {
    const map = mapRef.current;
    const nextVisible = !landslideVisibility[regionId];
    setLandslideVisibility((prev) => ({ ...prev, [regionId]: nextVisible }));
    setLandslideRegionVisibility(map, regionId, nextVisible);
    placeLandslideLayersOnTop(map);
  };

  const toggleAllLandslide = useCallback((status) => {
    const map = mapRef.current;
    setLandslideVisibility(Object.fromEntries(LANDSLIDE_REGIONS.map((region) => [region.id, status])));
    LANDSLIDE_REGIONS.forEach((region) => {
      setLandslideRegionVisibility(map, region.id, status);
    });
    placeLandslideLayersOnTop(map);
  }, []);

  useEffect(() => {
    if (!isActive || !showLandslideOnMap || !mapReady) return;
    toggleAllLandslide(true);
    onLandslideShown?.();
  }, [isActive, showLandslideOnMap, mapReady, toggleAllLandslide, onLandslideShown]);

  const toggleZone = (zoneId) => {
    const map = mapRef.current;
    const nextVisible = !zoneVisibility[zoneId];
    setZoneVisibility((prev) => ({ ...prev, [zoneId]: nextVisible }));

    if (map?.getLayer(`${zoneId}-fill`)) {
      map.setLayoutProperty(`${zoneId}-fill`, 'visibility', nextVisible ? 'visible' : 'none');
      map.setLayoutProperty(`${zoneId}-line`, 'visibility', nextVisible ? 'visible' : 'none');
    }
  };

  const toggleAllZones = (status) => {
    const map = mapRef.current;
    setZoneVisibility(Object.fromEntries(Object.keys(zoneConfig).map((id) => [id, status])));

    Object.keys(zoneConfig).forEach((zoneId) => {
      if (map?.getLayer(`${zoneId}-fill`)) {
        map.setLayoutProperty(`${zoneId}-fill`, 'visibility', status ? 'visible' : 'none');
        map.setLayoutProperty(`${zoneId}-line`, 'visibility', status ? 'visible' : 'none');
      }
    });
  };

  const toggleDisasterLayer = (layerId) => {
    const map = mapRef.current;
    const nextVisible = !disasterVisibility[layerId];
    setDisasterVisibility((prev) => ({ ...prev, [layerId]: nextVisible }));

    if (map?.getLayer(`${layerId}-fill`)) {
      setDisasterLayerVisibility(map, layerId, nextVisible);
    } else if (map?.getLayer(`${layerId}-line`)) {
      setDisasterLayerVisibility(map, layerId, nextVisible);
    }
  };

  const toggleAllDisaster = (status) => {
    const map = mapRef.current;
    setDisasterVisibility(Object.fromEntries(Object.keys(disasterConfig).map((id) => [id, status])));

    Object.keys(disasterConfig).forEach((layerId) => {
      setDisasterLayerVisibility(map, layerId, status);
    });
  };

  const toggleAllFloods = (status) => {
    const map = mapRef.current;
    setDisasterVisibility((prev) => {
      const next = { ...prev };
      FLOOD_LAYER_IDS.forEach((id) => {
        next[id] = status;
      });
      return next;
    });

    FLOOD_LAYER_IDS.forEach((layerId) => {
      if (map?.getLayer(`${layerId}-fill`)) {
        map.setLayoutProperty(`${layerId}-fill`, 'visibility', status ? 'visible' : 'none');
        map.setLayoutProperty(`${layerId}-line`, 'visibility', status ? 'visible' : 'none');
      }
    });
  };

  const getTypeColor = (typeName) => typeColorRef.current.getTypeColor(typeName);

  const activeLayerCount = layers.filter((l) => layerVisibility[l.id]).length;
  const activeZoneCount = Object.values(zoneVisibility).filter(Boolean).length;
  const totalSites = mineralList.reduce((sum, m) => sum + m.count, 0);
  const visibleSites = layers.reduce(
    (sum, layer) => sum + (layerVisibility[layer.id] ? layer.count : 0),
    0
  );

  return {
    mapContainerRef,
    mapReady,
    layers,
    mineralList,
    mineralsFeatures,
    openGroups,
    layerVisibility,
    selectedMineralType,
    zoneVisibility,
    disasterVisibility,
    landslideVisibility,
    activeLayerCount,
    activeZoneCount,
    totalSites,
    visibleSites,
    categoryMap: categoryMapRef.current,
    getTypeColor,
    toggleDropdown,
    toggleLayerVisibility,
    selectMineralType,
    clearSelection,
    toggleAllLayers,
    toggleZone,
    toggleAllZones,
    toggleDisasterLayer,
    toggleAllDisaster,
    toggleAllFloods,
    toggleLandslideRegion,
    toggleAllLandslide,
    zoomIn,
    zoomOut,
    nudgeZoom,
    resetNorth,
    resetMapView,
    toggleFullscreen,
    eqStartDate,
    eqEndDate,
    eqMinMag,
    eqLoading,
    eqCount,
    eqError,
    setEqStartDate,
    setEqEndDate,
    setEqMinMag,
    shakemapLoading,
    activeShakemapEventId,
    shakemapMineralImpacts,
    hideShakemap,
    selectAffectedMineral,
    applyProductionRegion,
    applyProductionMineralSelection,
    clearProductionRegion,
  };
}
