import MineralLayersPanel from './MineralLayersPanel';
import AnnualProductionToggle from './AnnualProductionToggle';
import { categoryDisplayNames, categoryStyles, getCategoryMarkerStyle } from '../config/layers';

export default function ProductionSidebar({
  layers,
  openGroups,
  layerVisibility,
  activeLayerCount,
  selectedMineralType,
  onToggleDropdown,
  onToggleVisibility,
  onSelectMineral,
  onToggleAll,
  annualChartOpen,
  onToggleAnnualChart,
}) {
  const enrichedLayers = layers.map((layer) => ({
    ...layer,
    name: categoryDisplayNames[layer.id] || layer.name,
    marker_style: getCategoryMarkerStyle(layer.id),
    marker_color: categoryStyles[layer.id] || '#64748b',
    visible: layerVisibility[layer.id] !== false,
  }));

  return (
    <aside className="map-sidebar glass-panel production-sidebar">
      <div className="sidebar-glow" style={{ '--tab-accent': '#22c55e' }} />
      <div className="sidebar-panel-body production-sidebar-body">
        <AnnualProductionToggle
          isActive={annualChartOpen}
          onToggle={onToggleAnnualChart}
        />
        <MineralLayersPanel
          embedded
          layers={enrichedLayers}
          openGroups={openGroups}
          layerVisibility={layerVisibility}
          activeLayerCount={activeLayerCount}
          selectedMineralType={selectedMineralType}
          onToggleDropdown={onToggleDropdown}
          onToggleVisibility={onToggleVisibility}
          onSelectMineral={onSelectMineral}
          onToggleAll={onToggleAll}
        />
      </div>
    </aside>
  );
}
