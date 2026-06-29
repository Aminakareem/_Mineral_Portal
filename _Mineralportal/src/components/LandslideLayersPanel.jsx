import { LANDSLIDE_REGIONS } from '../config/landslideData';
import CollapsiblePanel from './CollapsiblePanel';

export default function LandslideLayersPanel({
  landslideVisibility,
  onToggleRegion,
  onToggleAll,
  embedded = false,
}) {
  const activeCount = LANDSLIDE_REGIONS.filter((r) => landslideVisibility[r.id]).length;

  const content = (
    <>
      <div className="panel-intro">
        <div className="panel-intro-icon landslide">
          <i className="fa-solid fa-hill-rockslide" />
        </div>
        <div>
          <h3>Landslide Susceptibility</h3>
          <p>{activeCount} of {LANDSLIDE_REGIONS.length} regional layers visible</p>
        </div>
      </div>

      <div className="layer-list compact hazard-list">
        {LANDSLIDE_REGIONS.map((region) => (
          <div
            key={region.id}
            className={`zone-row hazard-row landslide-row${landslideVisibility[region.id] ? '' : ' dimmed'}`}
            style={{ '--zone-color': '#a16207' }}
          >
            <span className="zone-color-bar" aria-hidden="true" />
            <span className="hazard-badge landslide-badge">
              <i className="fa-solid fa-hill-rockslide" />
            </span>
            <span className="zone-name" title={region.file}>
              {region.name}
              <small className="landslide-file-hint">{region.resolution}</small>
            </span>
            <button
              type="button"
              className={`visibility-toggle${landslideVisibility[region.id] ? ' active' : ''}`}
              onClick={() => onToggleRegion(region.id)}
              aria-label={`Toggle ${region.name} landslide layer`}
            >
              <i className={`fa-regular ${landslideVisibility[region.id] ? 'fa-eye' : 'fa-eye-slash'}`} />
            </button>
          </div>
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
      icon="fa-solid fa-hill-rockslide"
      iconColor="#a16207"
      title="Landslide Layers"
      subtitle={`${LANDSLIDE_REGIONS.length} regions`}
    >
      {content}
    </CollapsiblePanel>
  );
}
