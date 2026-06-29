import LayerGroupItem from './LayerGroupItem';
import CollapsiblePanel from './CollapsiblePanel';

export default function MineralLayersPanel({
  layers,
  openGroups,
  layerVisibility,
  activeLayerCount,
  selectedMineralType,
  onToggleDropdown,
  onToggleVisibility,
  onSelectMineral,
  onToggleAll,
  embedded = false,
}) {
  const content = (
    <>
      <div className="panel-intro">
        <div className="panel-intro-icon layers">
          <i className="fa-solid fa-layer-group" />
        </div>
        <div>
          <h3>Mineral Layers</h3>
          <p>{activeLayerCount} of {layers.length} active</p>
        </div>
      </div>

      <div className="layer-list">
        {layers.map((group) => (
          <LayerGroupItem
            key={group.id}
            group={group}
            isOpen={!!openGroups[group.id]}
            isVisible={!!layerVisibility[group.id]}
            selectedMineralType={selectedMineralType}
            onToggleDropdown={onToggleDropdown}
            onToggleVisibility={onToggleVisibility}
            onSelectMineral={onSelectMineral}
          />
        ))}
      </div>

      <div className="legend-actions">
        <button type="button" className="action-btn primary" onClick={() => onToggleAll(true)}>
          <i className="fa-solid fa-eye" /> Show All
        </button>
        <button type="button" className="action-btn" onClick={() => onToggleAll(false)}>
          <i className="fa-solid fa-eye-slash" /> Hide All
        </button>
      </div>
    </>
  );

  if (embedded) return <div className="embedded-panel">{content}</div>;

  return (
    <CollapsiblePanel
      icon="fa-solid fa-layer-group"
      iconColor="var(--accent-green)"
      title="Mineral Layers"
      subtitle={`${activeLayerCount} of ${layers.length} active`}
      defaultOpen
    >
      {content}
    </CollapsiblePanel>
  );
}
