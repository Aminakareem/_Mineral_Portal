import { useEffect, useState } from 'react';
import DisasterLayersPanel from './DisasterLayersPanel';
import LandslideLayersPanel from './LandslideLayersPanel';
import MetallogenicZonesPanel from './MetallogenicZonesPanel';
import MineralLayersPanel from './MineralLayersPanel';

const TABS = [
  { id: 'layers', label: 'Layers', icon: 'fa-layer-group', accent: '#10b981' },
  { id: 'zones', label: 'Zones', icon: 'fa-map', accent: '#a855f7' },
  { id: 'hazards', label: 'Hazards', icon: 'fa-triangle-exclamation', accent: '#f97316' },
  { id: 'landslide', label: 'LandSlide', icon: 'fa-hill-rockslide', accent: '#a16207' },
];

export default function MapSidebar({ focusTab, onFocusHandled, onActiveTabChange, ...props }) {
  const [activeTab, setActiveTab] = useState('layers');
  const active = TABS.find((t) => t.id === activeTab);

  useEffect(() => {
    if (!focusTab) return;
    setActiveTab(focusTab);
    onFocusHandled?.();
  }, [focusTab, onFocusHandled]);

  useEffect(() => {
    onActiveTabChange?.(activeTab);
  }, [activeTab, onActiveTabChange]);

  return (
    <aside className="map-sidebar glass-panel">
      <div className="sidebar-glow" style={{ '--tab-accent': active.accent }} />

      <div className="sidebar-tabs sidebar-tabs-4" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`sidebar-tab${activeTab === tab.id ? ' active' : ''}`}
            style={{ '--tab-accent': tab.accent }}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-panel-body" role="tabpanel">
        {activeTab === 'layers' && <MineralLayersPanel embedded {...props} />}
        {activeTab === 'zones' && (
          <MetallogenicZonesPanel
            zoneVisibility={props.zoneVisibility}
            onToggleZone={props.onToggleZone}
            onToggleAll={props.onToggleAllZones}
            embedded
          />
        )}
        {activeTab === 'hazards' && (
          <DisasterLayersPanel
            disasterVisibility={props.disasterVisibility}
            onToggleLayer={props.onToggleDisasterLayer}
            onToggleAll={props.onToggleAllDisaster}
            eqStartDate={props.eqStartDate}
            eqEndDate={props.eqEndDate}
            eqMinMag={props.eqMinMag}
            eqLoading={props.eqLoading}
            eqCount={props.eqCount}
            eqError={props.eqError}
            onEqStartDateChange={props.onEqStartDateChange}
            onEqEndDateChange={props.onEqEndDateChange}
            onEqMinMagChange={props.onEqMinMagChange}
            embedded
          />
        )}
        {activeTab === 'landslide' && (
          <LandslideLayersPanel
            landslideVisibility={props.landslideVisibility}
            onToggleRegion={props.onToggleLandslideRegion}
            onToggleAll={props.onToggleAllLandslide}
            embedded
          />
        )}
      </div>
    </aside>
  );
}
