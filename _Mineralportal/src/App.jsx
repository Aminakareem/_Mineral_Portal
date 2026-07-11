import { useState } from 'react';
import Header from './components/Header';
import LandslideView from './components/LandslideView';
import MineralMapView from './components/MineralMapView';
import MineralProductionView from './components/MineralProductionView';

export default function App() {
  const [activeView, setActiveView] = useState('mineral-map');
  const [mapFocusTab, setMapFocusTab] = useState(null);
  const [showLandslideOnMap, setShowLandslideOnMap] = useState(false);
  const [productionRegionId, setProductionRegionId] = useState(null);

  const handleOpenLandslideOnMap = () => {
    setActiveView('mineral-map');
    setMapFocusTab('landslide');
    setShowLandslideOnMap(true);
  };

  return (
    <>
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        productionRegionId={productionRegionId}
        onProductionRegionChange={setProductionRegionId}
      />
      <div className="main-container">
        {activeView === 'mineral-production' && (
          <div id="mineral-production" className="view-section active">
            <MineralProductionView
              isActive
              activeRegionId={productionRegionId}
              onRegionChange={setProductionRegionId}
            />
          </div>
        )}

        {activeView === 'mineral-map' && (
          <div id="mineral-map" className="view-section active">
            <MineralMapView
              isActive
              focusTab={mapFocusTab}
              onFocusHandled={() => setMapFocusTab(null)}
              showLandslideOnMap={showLandslideOnMap}
              onLandslideShown={() => setShowLandslideOnMap(false)}
            />
          </div>
        )}

        {activeView === 'landslide' && (
          <div id="landslide" className="view-section landslide-section active">
            <LandslideView onOpenMap={handleOpenLandslideOnMap} />
          </div>
        )}
      </div>
    </>
  );
}
