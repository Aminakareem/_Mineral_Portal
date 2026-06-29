import { METALLOGENIC_ZONES } from '../config/layers';
import CollapsiblePanel from './CollapsiblePanel';

export default function MetallogenicZonesPanel({ zoneVisibility, onToggleZone, onToggleAll, embedded = false }) {
  const activeCount = METALLOGENIC_ZONES.filter((z) => zoneVisibility[z.id]).length;

  const content = (
    <>
      <div className="panel-intro">
        <div className="panel-intro-icon zones">
          <i className="fa-solid fa-mountain" />
        </div>
        <div>
          <h3>Metallogenic Zones</h3>
          <p>{activeCount} of {METALLOGENIC_ZONES.length} zones visible</p>
        </div>
      </div>

      <div className="layer-list compact zone-list">
        {METALLOGENIC_ZONES.map((zone) => (
          <div
            key={zone.id}
            className={`zone-row${zoneVisibility[zone.id] ? '' : ' dimmed'}`}
            id={`metallo-item-${zone.num}`}
            style={{ '--zone-color': zone.color }}
          >
            <span className="zone-color-bar" aria-hidden="true" />
            <span className="zone-badge">{zone.num}</span>
            <span className="zone-name" title={zone.name}>{zone.name}</span>
            <button
              type="button"
              className={`visibility-toggle${zoneVisibility[zone.id] ? ' active' : ''}`}
              onClick={() => onToggleZone(zone.id)}
              aria-label={`Toggle ${zone.name}`}
            >
              <i className={`fa-regular ${zoneVisibility[zone.id] ? 'fa-eye' : 'fa-eye-slash'}`} />
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
      icon="fa-solid fa-map"
      iconColor="#a855f7"
      title="Metallogenic Zones"
      subtitle="13 zones"
    >
      {content}
    </CollapsiblePanel>
  );
}
