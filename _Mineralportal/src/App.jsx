import { useState } from 'react';
import Header from './components/Header';
import LandslideView from './components/LandslideView';
import MineralMapView from './components/MineralMapView';

export default function App() {
  const [activeView, setActiveView] = useState('mineral-map');
  const [mapFocusTab, setMapFocusTab] = useState(null);
  const [showLandslideOnMap, setShowLandslideOnMap] = useState(false);

  const handleOpenLandslideOnMap = () => {
    setActiveView('mineral-map');
    setMapFocusTab('landslide');
    setShowLandslideOnMap(true);
  };

  return (
    <>
      <Header activeView={activeView} onViewChange={setActiveView} />
      <div className="main-container">
        <div
          id="dashboard"
          className={`view-section placeholder-view${activeView === 'dashboard' ? ' active' : ''}`}
        >
          <p>Dashboard Metrics & Layout Workspace (Empty Component)</p>
        </div>

        <div id="mineral-map" className={`view-section${activeView === 'mineral-map' ? ' active' : ''}`}>
          <MineralMapView
            isActive={activeView === 'mineral-map'}
            focusTab={mapFocusTab}
            onFocusHandled={() => setMapFocusTab(null)}
            showLandslideOnMap={showLandslideOnMap}
            onLandslideShown={() => setShowLandslideOnMap(false)}
          />
        </div>

        <div
          id="landslide"
          className={`view-section landslide-section${activeView === 'landslide' ? ' active' : ''}`}
        >
          <LandslideView onOpenMap={handleOpenLandslideOnMap} />
        </div>
      </div>
    </>
  );
}
