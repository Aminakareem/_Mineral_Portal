import { DISASTER_LAYERS, METALLOGENIC_ZONES } from '../config/layers';
import { LANDSLIDE_REGIONS, SUSCEPTIBILITY_CLASSES } from '../config/landslideData';

const STAT_SETS = {
  layers: (data) => [
    {
      icon: 'fa-location-dot',
      tone: 'green',
      value: data.mapReady ? data.totalSites.toLocaleString() : '—',
      label: 'Total Sites',
    },
    {
      icon: 'fa-layer-group',
      tone: 'cyan',
      value: data.mapReady ? data.visibleSites.toLocaleString() : '—',
      label: 'Visible',
    },
    {
      icon: 'fa-gem',
      tone: 'orange',
      value: data.mapReady ? data.mineralTypes : '—',
      label: 'Mineral Types',
    },
  ],
  zones: (data) => [
    {
      icon: 'fa-map',
      tone: 'purple',
      value: METALLOGENIC_ZONES.length,
      label: 'Total Zones',
    },
    {
      icon: 'fa-eye',
      tone: 'cyan',
      value: data.visibleZones,
      label: 'Visible',
    },
    {
      icon: 'fa-mountain',
      tone: 'green',
      value: data.activeLayerCount,
      label: 'Mineral Layers',
    },
  ],
  hazards: (data) => [
    {
      icon: 'fa-triangle-exclamation',
      tone: 'orange',
      value: DISASTER_LAYERS.length,
      label: 'Hazard Layers',
    },
    {
      icon: 'fa-eye',
      tone: 'cyan',
      value: data.visibleHazards,
      label: 'Visible',
    },
    {
      icon: 'fa-water',
      tone: 'blue',
      value: data.visibleFlood ? 'On' : 'Off',
      label: 'Flood Layer',
    },
  ],
  landslide: (data) => [
    {
      icon: 'fa-hill-rockslide',
      tone: 'amber',
      value: LANDSLIDE_REGIONS.length,
      label: 'Regions',
    },
    {
      icon: 'fa-eye',
      tone: 'cyan',
      value: data.visibleLandslideRegions,
      label: 'Visible',
    },
    {
      icon: 'fa-chart-simple',
      tone: 'orange',
      value: SUSCEPTIBILITY_CLASSES.length,
      label: 'Risk Classes',
    },
  ],
};

export default function MapStatsBar({
  activeTab = 'layers',
  mapReady,
  totalSites,
  visibleSites,
  mineralTypes,
  visibleZones,
  activeLayerCount,
  visibleHazards,
  visibleFlood,
  visibleLandslideRegions,
}) {
  const stats = (STAT_SETS[activeTab] || STAT_SETS.layers)({
    mapReady,
    totalSites,
    visibleSites,
    mineralTypes,
    visibleZones,
    activeLayerCount,
    visibleHazards,
    visibleFlood,
    visibleLandslideRegions,
  });

  return (
    <div className={`map-stats-bar glass-panel map-stats-${activeTab}`} data-active-tab={activeTab}>
      {stats.map((stat, index) => (
        <div key={stat.label} className="stat-group">
          {index > 0 && <div className="stat-divider" aria-hidden="true" />}
          <div className="stat-item">
            <div className={`stat-icon ${stat.tone}`}>
              <i className={`fa-solid ${stat.icon}`} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label" title={stat.label}>{stat.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
