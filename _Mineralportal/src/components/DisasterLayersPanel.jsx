import { DISASTER_LAYERS } from '../config/layers';
import CollapsiblePanel from './CollapsiblePanel';

export default function DisasterLayersPanel({
  disasterVisibility,
  onToggleLayer,
  onToggleAll,
  eqStartDate = '2025-01-01',
  eqEndDate = '2026-12-31',
  eqMinMag = 3.0,
  eqLoading = false,
  eqCount = 0,
  eqError = null,
  onEqStartDateChange,
  onEqEndDateChange,
  onEqMinMagChange,
  embedded = false,
}) {
  const activeCount = DISASTER_LAYERS.filter((l) => disasterVisibility[l.id]).length;

  const content = (
    <>
      <div className="panel-intro">
        <div className="panel-intro-icon hazards">
          <i className="fa-solid fa-bolt" />
        </div>
        <div>
          <h3>Disaster Layers</h3>
          <p>{activeCount} of {DISASTER_LAYERS.length} hazard layers visible</p>
        </div>
      </div>

      <div className="layer-list compact hazard-list">
        {DISASTER_LAYERS.map((layer) => (
          <div key={layer.id} className="hazard-item-group" style={{ width: '100%' }}>
            <div
              className={`zone-row hazard-row${disasterVisibility[layer.id] ? '' : ' dimmed'}`}
              id={`disaster-item-${layer.id.replace('disaster-', '')}`}
              style={{ '--zone-color': layer.color }}
            >
              <span className="zone-color-bar" aria-hidden="true" />
              <span className="hazard-badge">
                <i className={`fa-solid ${layer.icon}`} />
              </span>
              <span className="zone-name" title={layer.name}>{layer.name}</span>
              <button
                type="button"
                className={`visibility-toggle${disasterVisibility[layer.id] ? ' active' : ''}`}
                onClick={() => onToggleLayer(layer.id)}
                aria-label={`Toggle ${layer.name}`}
              >
                <i className={`fa-regular ${disasterVisibility[layer.id] ? 'fa-eye' : 'fa-eye-slash'}`} />
              </button>
            </div>

            {layer.id === 'disaster-earthquake' && disasterVisibility[layer.id] && (
              <div className="earthquake-controls-panel">
                <div className="eq-control-group">
                  <label>Date Range (2025 - 2026)</label>
                  <div className="eq-date-inputs">
                    <div className="eq-date-field">
                      <span>Start</span>
                      <input
                        type="date"
                        min="2025-01-01"
                        max="2026-12-31"
                        value={eqStartDate}
                        onChange={(e) => onEqStartDateChange?.(e.target.value)}
                      />
                    </div>
                    <div className="eq-date-field">
                      <span>End</span>
                      <input
                        type="date"
                        min="2025-01-01"
                        max="2026-12-31"
                        value={eqEndDate}
                        onChange={(e) => onEqEndDateChange?.(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="eq-control-group">
                  <div className="eq-label-row">
                    <label>Min Magnitude</label>
                    <span className="eq-val-badge">M {eqMinMag.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="9.0"
                    step="0.5"
                    value={eqMinMag}
                    onChange={(e) => onEqMinMagChange?.(parseFloat(e.target.value))}
                    className="eq-slider"
                  />
                </div>

                <div className="eq-status-row">
                  {eqLoading ? (
                    <span className="eq-status loading">
                      <i className="fa-solid fa-spinner fa-spin"></i> Fetching USGS events...
                    </span>
                  ) : eqError ? (
                    <span className="eq-status error">
                      <i className="fa-solid fa-triangle-exclamation"></i> {eqError}
                    </span>
                  ) : (
                    <span className="eq-status success">
                      <i className="fa-solid fa-circle-check"></i> {eqCount} earthquakes loaded
                    </span>
                  )}
                </div>
              </div>
            )}
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
      icon="fa-solid fa-triangle-exclamation"
      iconColor="#f97316"
      title="Disaster Layers"
      subtitle="2 layers"
    >
      {content}
    </CollapsiblePanel>
  );
}
