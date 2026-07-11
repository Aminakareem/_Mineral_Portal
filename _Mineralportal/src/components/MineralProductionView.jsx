import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProductionRegion } from '../config/productionRegions';
import { useMapboxMap } from '../hooks/useMapboxMap';
import AnnualProductionChart from './AnnualProductionChart';
import MapControls from './MapControls';
import MapStatsBar from './MapStatsBar';
import MetallogenicZonesToggle from './MetallogenicZonesToggle';
import ProductionChart from './ProductionChart';
import ProductionSidebar from './ProductionSidebar';
import SearchPanel from './SearchPanel';
import {
  buildRegionMapLayers,
  buildRegionMapMineralList,
  findProductionMineralName,
  getProductionSeries,
  loadProductionDataset,
} from '../utils/productionData';

const SINDH_PRODUCTION_FILE = '/data/sindh_minerals_production_wide.csv';

export default function MineralProductionView({ isActive, activeRegionId, onRegionChange }) {
  const [productionDataset, setProductionDataset] = useState([]);
  const [selectedMineral, setSelectedMineral] = useState(null);
  const [selectedAnnualMineral, setSelectedAnnualMineral] = useState(null);
  const [annualChartOpen, setAnnualChartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const prevRegionIdRef = useRef(activeRegionId);
  const annualZoomAppliedRef = useRef(false);

  const activeRegion = useMemo(
    () => (activeRegionId ? getProductionRegion(activeRegionId) : null),
    [activeRegionId]
  );

  const handleMapMineralSelect = useCallback((mineralName) => {
    if (!mineralName) return;
    setSelectedMineral(mineralName);
    setSelectedAnnualMineral(null);
    setAnnualChartOpen(false);
  }, []);

  const {
    mapContainerRef,
    mapReady,
    layers,
    mineralList,
    mineralsFeatures,
    openGroups,
    layerVisibility,
    activeLayerCount,
    activeZoneCount,
    totalSites,
    visibleSites,
    categoryMap,
    getTypeColor,
    toggleDropdown,
    toggleLayerVisibility,
    toggleAllLayers,
    toggleAllZones,
    zoomIn,
    zoomOut,
    nudgeZoom,
    resetNorth,
    resetMapView,
    toggleFullscreen,
    applyProductionRegion,
    applyProductionMineralSelection,
    clearProductionRegion,
  } = useMapboxMap({
    isActive,
    productionMode: true,
    regionFilter: activeRegion?.province || null,
    onMineralFeatureSelect: handleMapMineralSelect,
  });

  const zonesVisible = activeZoneCount > 0;

  useEffect(() => {
    let cancelled = false;

    loadProductionDataset(SINDH_PRODUCTION_FILE)
      .then((dataset) => {
        if (!cancelled) setProductionDataset(dataset);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    if (activeRegion) {
      applyProductionRegion(activeRegion);
    } else {
      clearProductionRegion();
    }
  }, [mapReady, activeRegion, applyProductionRegion, clearProductionRegion]);

  useEffect(() => {
    if (prevRegionIdRef.current === activeRegionId) return;
    prevRegionIdRef.current = activeRegionId;

    setSelectedMineral(null);
    setSelectedAnnualMineral(null);
    if (!mapReady) return;
    applyProductionMineralSelection(null, null);
  }, [activeRegionId, mapReady, applyProductionMineralSelection]);

  useEffect(() => {
    if (!mapReady) return;
    applyProductionMineralSelection(selectedMineral, selectedMineral);
  }, [mapReady, selectedMineral, applyProductionMineralSelection]);

  useEffect(() => {
    if (!mapReady) return;

    if (annualChartOpen && !annualZoomAppliedRef.current) {
      if (!activeRegion) {
        clearProductionRegion();
      }
      nudgeZoom(-1.2, -340);
      annualZoomAppliedRef.current = true;
      return;
    }

    if (!annualChartOpen && annualZoomAppliedRef.current) {
      nudgeZoom(1.2, 340);
      annualZoomAppliedRef.current = false;
      if (activeRegion) {
        applyProductionRegion(activeRegion);
      }
    }
  }, [
    annualChartOpen,
    mapReady,
    nudgeZoom,
    activeRegion,
    clearProductionRegion,
    applyProductionRegion,
  ]);

  const displayLayers = useMemo(() => {
    if (!activeRegion || mineralsFeatures.length === 0) return layers;
    return buildRegionMapLayers(mineralsFeatures, activeRegion.province, getTypeColor);
  }, [activeRegion, mineralsFeatures, layers, getTypeColor]);

  const displayMineralList = useMemo(() => {
    if (!activeRegion || mineralsFeatures.length === 0) return mineralList;
    return buildRegionMapMineralList(mineralsFeatures, activeRegion.province);
  }, [activeRegion, mineralsFeatures, mineralList]);

  const regionSiteCount = useMemo(
    () => displayMineralList.reduce((sum, item) => sum + item.count, 0),
    [displayMineralList]
  );

  const productionMineralName = useMemo(
    () => findProductionMineralName(selectedMineral, productionDataset),
    [selectedMineral, productionDataset]
  );

  const chartSeries = useMemo(
    () => getProductionSeries(productionDataset, productionMineralName),
    [productionDataset, productionMineralName]
  );

  const showMineralChart = Boolean(selectedMineral && productionMineralName && !annualChartOpen);
  const chartRegionName = activeRegion?.name || 'Sindh';

  const chartAccent = selectedMineral
    ? getTypeColor(selectedMineral)
    : activeRegion?.color || '#22c55e';

  const handleSelectMineral = useCallback((mineralName) => {
    if (mineralName === null) {
      setSelectedMineral(null);
      setSelectedAnnualMineral(null);
      return;
    }
    setSelectedMineral((prev) => (prev === mineralName ? null : mineralName));
    setSelectedAnnualMineral(null);
    setAnnualChartOpen(false);
  }, []);

  const handleAnnualLineSelect = useCallback((portalType, mineralName) => {
    setSelectedMineral(portalType);
    setSelectedAnnualMineral(mineralName);
  }, []);

  const handleClearMineral = useCallback(() => {
    setSelectedMineral(null);
    setSelectedAnnualMineral(null);
  }, []);

  const handleToggleAnnualChart = useCallback(() => {
    setAnnualChartOpen((open) => {
      const next = !open;
      if (next) {
        setSelectedMineral(null);
        setSelectedAnnualMineral(null);
      }
      return next;
    });
  }, []);

  const handleToggleZones = useCallback(() => {
    toggleAllZones(!zonesVisible);
  }, [toggleAllZones, zonesVisible]);

  return (
    <div className="map-viewport production-viewport">
      <div id="production-map" ref={mapContainerRef} />
      <div className="map-vignette" aria-hidden="true" />

      {!mapReady && (
        <div className="map-loading">
          <div className="map-loading-brand">
            <div className="map-loading-spinner" />
            <div className="map-loading-logo">NMIP</div>
          </div>
          <span>Loading production intelligence…</span>
          <div className="map-loading-bar">
            <div className="map-loading-bar-fill" />
          </div>
        </div>
      )}

      <div className={`map-left-stack${sidebarOpen ? '' : ' is-collapsed'}`}>
        <div className={`map-left-panel${sidebarOpen ? '' : ' is-hidden'}`}>
          <MapStatsBar
            activeTab="layers"
            totalSites={activeRegion ? regionSiteCount : totalSites}
            visibleSites={visibleSites}
            mineralTypes={displayMineralList.length}
            visibleZones={activeZoneCount}
            activeLayerCount={activeLayerCount}
            visibleHazards={0}
            visibleFloodCount={0}
            totalFloodLayers={0}
            visibleLandslideRegions={0}
            mapReady={mapReady}
          />
          <ProductionSidebar
            layers={displayLayers}
            openGroups={openGroups}
            layerVisibility={layerVisibility}
            activeLayerCount={activeLayerCount}
            selectedMineralType={selectedMineral}
            onToggleDropdown={toggleDropdown}
            onToggleVisibility={toggleLayerVisibility}
            onSelectMineral={handleSelectMineral}
            onToggleAll={toggleAllLayers}
            annualChartOpen={annualChartOpen}
            onToggleAnnualChart={handleToggleAnnualChart}
          />
        </div>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true">
            {sidebarOpen ? '‹' : '›'}
          </span>
        </button>
      </div>

      <div className="map-right-stack production-right-stack">
        <SearchPanel
          mineralList={displayMineralList}
          categoryMap={categoryMap}
          getTypeColor={getTypeColor}
          onSelectMineral={handleSelectMineral}
        />

        {annualChartOpen ? (
          <AnnualProductionChart
            dataset={productionDataset}
            getTypeColor={getTypeColor}
            regionName={chartRegionName}
            selectedMineralName={selectedAnnualMineral}
            onSelectMineral={handleAnnualLineSelect}
            onClose={handleToggleAnnualChart}
          />
        ) : (
          showMineralChart && (
            <ProductionChart
              mineral={productionMineralName}
              regionName={chartRegionName}
              series={chartSeries}
              accent={chartAccent}
            />
          )
        )}

        <MetallogenicZonesToggle
          zonesVisible={zonesVisible}
          onToggle={handleToggleZones}
          mapReady={mapReady}
        />
        <MapControls
          onHome={activeRegion ? () => applyProductionRegion(activeRegion) : resetMapView}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetNorth={resetNorth}
          onFullscreen={toggleFullscreen}
          mapReady={mapReady}
        />
      </div>

      {activeRegion && (
        <div className="map-filter-chip">
          <span className="chip-dot" style={{ background: activeRegion.color }} />
          <span>Region: <strong>{activeRegion.name}</strong></span>
          <button
            type="button"
            className="chip-clear"
            onClick={() => onRegionChange?.(null)}
            aria-label="Clear region filter"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {selectedMineral && (
        <div className="map-filter-chip map-filter-chip-mineral">
          <span className="chip-dot" style={{ background: chartAccent }} />
          <span>
            {productionMineralName ? 'Production' : 'Mineral'}: <strong>{selectedAnnualMineral || productionMineralName || selectedMineral}</strong>
          </span>
          <button
            type="button"
            className="chip-clear"
            onClick={handleClearMineral}
            aria-label="Clear mineral selection"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  );
}
