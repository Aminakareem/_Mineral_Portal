import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMapboxMap } from '../hooks/useMapboxMap';
import MapControls from './MapControls';
import MapLegend from './MapLegend';
import LandslideMapLegend from './LandslideMapLegend';
import MapSidebar from './MapSidebar';
import MapStatsBar from './MapStatsBar';
import SearchPanel from './SearchPanel';

export default function MineralMapView({
  isActive,
  focusTab,
  onFocusHandled,
  showLandslideOnMap,
  onLandslideShown,
}) {
  const {
    mapContainerRef,
    mapReady,
    layers,
    mineralList,
    openGroups,
    layerVisibility,
    selectedMineralType,
    zoneVisibility,
    disasterVisibility,
    landslideVisibility,
    activeLayerCount,
    totalSites,
    visibleSites,
    categoryMap,
    getTypeColor,
    toggleDropdown,
    toggleLayerVisibility,
    selectMineralType,
    toggleAllLayers,
    toggleZone,
    toggleAllZones,
    toggleDisasterLayer,
    toggleAllDisaster,
    toggleLandslideRegion,
    toggleAllLandslide,
    clearSelection,
    zoomIn,
    zoomOut,
    resetNorth,
    resetMapView,
    eqStartDate,
    eqEndDate,
    eqMinMag,
    eqLoading,
    eqCount,
    eqError,
    setEqStartDate,
    setEqEndDate,
    setEqMinMag,
    toggleFullscreen,
  } = useMapboxMap({ isActive, showLandslideOnMap, onLandslideShown });

  const [sidebarTab, setSidebarTab] = useState('layers');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const handleSidebarTabChange = useCallback((tab) => setSidebarTab(tab), []);

  useEffect(() => {
    if (focusTab) {
      setSidebarTab(focusTab);
      setSidebarOpen(true);
    }
  }, [focusTab]);

  const visibleZones = useMemo(
    () => Object.values(zoneVisibility).filter(Boolean).length,
    [zoneVisibility]
  );
  const visibleHazards = useMemo(
    () => Object.values(disasterVisibility).filter(Boolean).length,
    [disasterVisibility]
  );
  const visibleLandslideRegions = useMemo(
    () => Object.values(landslideVisibility).filter(Boolean).length,
    [landslideVisibility]
  );

  return (
    <div className="map-viewport">
      <div id="map" ref={mapContainerRef} />
      <div className="map-vignette" aria-hidden="true" />

      {!mapReady && (
        <div className="map-loading">
          <div className="map-loading-brand">
            <div className="map-loading-spinner" />
            <div className="map-loading-logo">NMIP</div>
          </div>
          <span>Loading mineral intelligence…</span>
          <div className="map-loading-bar">
            <div className="map-loading-bar-fill" />
          </div>
        </div>
      )}

      <div className={`map-left-stack${sidebarOpen ? '' : ' is-collapsed'}`}>
        <div className={`map-left-panel${sidebarOpen ? '' : ' is-hidden'}`}>
          <MapStatsBar
            activeTab={sidebarTab}
            totalSites={totalSites}
            visibleSites={visibleSites}
            mineralTypes={mineralList.length}
            visibleZones={visibleZones}
            activeLayerCount={activeLayerCount}
            visibleHazards={visibleHazards}
            visibleFlood={disasterVisibility['disaster-flood']}
            visibleLandslideRegions={visibleLandslideRegions}
            mapReady={mapReady}
          />
          <MapSidebar
            focusTab={focusTab}
            onFocusHandled={onFocusHandled}
            onActiveTabChange={handleSidebarTabChange}
            layers={layers}
            openGroups={openGroups}
            layerVisibility={layerVisibility}
            activeLayerCount={activeLayerCount}
            selectedMineralType={selectedMineralType}
            onToggleDropdown={toggleDropdown}
            onToggleVisibility={toggleLayerVisibility}
            onSelectMineral={selectMineralType}
            onToggleAll={toggleAllLayers}
            zoneVisibility={zoneVisibility}
            onToggleZone={toggleZone}
            onToggleAllZones={toggleAllZones}
            disasterVisibility={disasterVisibility}
            onToggleDisasterLayer={toggleDisasterLayer}
            onToggleAllDisaster={toggleAllDisaster}
            landslideVisibility={landslideVisibility}
            onToggleLandslideRegion={toggleLandslideRegion}
            onToggleAllLandslide={toggleAllLandslide}
            eqStartDate={eqStartDate}
            eqEndDate={eqEndDate}
            eqMinMag={eqMinMag}
            eqLoading={eqLoading}
            eqCount={eqCount}
            eqError={eqError}
            onEqStartDateChange={setEqStartDate}
            onEqEndDateChange={setEqEndDate}
            onEqMinMagChange={setEqMinMag}
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

      <div className="map-right-stack">
        <SearchPanel
          mineralList={mineralList}
          categoryMap={categoryMap}
          getTypeColor={getTypeColor}
          onSelectMineral={selectMineralType}
        />
        <LandslideMapLegend visible={sidebarTab === 'landslide' && visibleLandslideRegions > 0} />
        <MapLegend layers={layers} />
        <MapControls
          onHome={resetMapView}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetNorth={resetNorth}
          onFullscreen={toggleFullscreen}
          mapReady={mapReady}
        />
      </div>

      {selectedMineralType && (
        <div className="map-filter-chip">
          <span className="chip-dot" style={{ background: getTypeColor(selectedMineralType) }} />
          <span>Filtering: <strong>{selectedMineralType}</strong></span>
          <button type="button" className="chip-clear" onClick={clearSelection} aria-label="Clear filter">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  );
}
