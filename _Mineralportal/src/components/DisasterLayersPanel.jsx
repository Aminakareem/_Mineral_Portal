import { DISASTER_LAYERS } from '../config/layers';
import { FLOOD_LAYERS } from '../config/floodData';
import CollapsiblePanel from './CollapsiblePanel';

export default function DisasterLayersPanel({
  disasterVisibility,
  onToggleLayer,
  onToggleAll,
  onToggleAllFloods,
  eqStartDate = '2025-01-01',
  eqEndDate = '2026-12-31',
  eqMinMag = 3.0,
  eqLoading = false,
  eqCount = 0,
  eqError = null,
  onEqStartDateChange,
  onEqEndDateChange,
  onEqMinMagChange,
  activeShakemapEventId = null,
  shakemapMineralImpacts = null,
  onSelectAffectedMineral,
  onHideShakemap,
  embedded = false,
}) {
  const activeCount = DISASTER_LAYERS.filter((l) => disasterVisibility[l.id]).length;
  const activeFloodCount = FLOOD_LAYERS.filter((l) => disasterVisibility[l.id]).length;
  const earthquakeLayer = DISASTER_LAYERS.find((l) => l.id === 'disaster-earthquake');
  const earthquakeExtraLayers = DISASTER_LAYERS.filter(
    (l) => l.group === 'earthquake' && l.id !== 'disaster-earthquake'
  );
  const impactSummary = shakemapMineralImpacts?.summary;

  const renderImpactList = (items, riskClass) => {
    if (!items?.length) {
      return <p className="shakemap-impact-empty">No {riskClass} risk sites in this ShakeMap.</p>;
    }

    return (
      <ul className="shakemap-impact-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`shakemap-impact-item ${riskClass}`}
              onClick={() => onSelectAffectedMineral?.(item.id)}
              title={`${item.mineralType} · MMI ${item.mmi}`}
            >
              <span className="shakemap-impact-name">{item.name}</span>
              <span className="shakemap-impact-meta">
                {item.mineralType}
                <span className="shakemap-impact-mmi">MMI {item.mmi}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

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
        <div className="hazard-item-group flood-group">
          <div className="flood-group-header">
            <span className="flood-group-title">
              <i className="fa-solid fa-water" /> Flood Extents
            </span>
            <span className="flood-group-count">{activeFloodCount}/{FLOOD_LAYERS.length}</span>
          </div>

          {FLOOD_LAYERS.map((layer) => (
            <div
              key={layer.id}
              className={`zone-row hazard-row flood-year-row${disasterVisibility[layer.id] ? '' : ' dimmed'}`}
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
          ))}

          <div className="flood-group-actions">
            <button type="button" className="action-btn small" onClick={() => onToggleAllFloods?.(true)}>
              Show all floods
            </button>
            <button type="button" className="action-btn small" onClick={() => onToggleAllFloods?.(false)}>
              Hide all floods
            </button>
          </div>
        </div>

        {earthquakeLayer && (
          <div className="hazard-item-group" style={{ width: '100%' }}>
            <div
              className={`zone-row hazard-row${disasterVisibility[earthquakeLayer.id] ? '' : ' dimmed'}`}
              style={{ '--zone-color': earthquakeLayer.color }}
            >
              <span className="zone-color-bar" aria-hidden="true" />
              <span className="hazard-badge">
                <i className={`fa-solid ${earthquakeLayer.icon}`} />
              </span>
              <span className="zone-name" title={earthquakeLayer.name}>{earthquakeLayer.name}</span>
              <button
                type="button"
                className={`visibility-toggle${disasterVisibility[earthquakeLayer.id] ? ' active' : ''}`}
                onClick={() => onToggleLayer(earthquakeLayer.id)}
                aria-label={`Toggle ${earthquakeLayer.name}`}
              >
                <i className={`fa-regular ${disasterVisibility[earthquakeLayer.id] ? 'fa-eye' : 'fa-eye-slash'}`} />
              </button>
            </div>

            {disasterVisibility[earthquakeLayer.id] && (
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
                      <i className="fa-solid fa-spinner fa-spin" /> Fetching USGS events...
                    </span>
                  ) : eqError ? (
                    <span className="eq-status error">
                      <i className="fa-solid fa-triangle-exclamation" /> {eqError}
                    </span>
                  ) : (
                    <span className="eq-status success">
                      <i className="fa-solid fa-circle-check" /> {eqCount} earthquakes loaded
                    </span>
                  )}
                </div>
              </div>
            )}

            {earthquakeExtraLayers.map((layer) => (
              <div
                key={layer.id}
                className={`zone-row hazard-row${disasterVisibility[layer.id] ? '' : ' dimmed'}`}
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
            ))}

            {activeShakemapEventId && (
              <div className="shakemap-impact-panel">
                <div className="shakemap-impact-header">
                  <span className="shakemap-impact-title">
                    <i className="fa-solid fa-gem" /> Minerals under ShakeMap
                  </span>
                  {impactSummary && (
                    <span className="shakemap-impact-count">{impactSummary.total} sites</span>
                  )}
                </div>

                <button type="button" className="shakemap-close-btn" onClick={() => onHideShakemap?.()}>
                  <i className="fa-solid fa-xmark" /> Close ShakeMap
                </button>

                {impactSummary ? (
                  <>
                    <div className="shakemap-impact-section high">
                      <div className="shakemap-impact-section-head">
                        <span className="risk-dot high" />
                        <strong>High risk</strong>
                        <span className="risk-count">{impactSummary.high}</span>
                      </div>
                      {renderImpactList(shakemapMineralImpacts.high, 'high')}
                    </div>

                    <div className="shakemap-impact-section moderate">
                      <div className="shakemap-impact-section-head">
                        <span className="risk-dot moderate" />
                        <strong>Moderate risk</strong>
                        <span className="risk-count">{impactSummary.moderate}</span>
                      </div>
                      {renderImpactList(shakemapMineralImpacts.moderate, 'moderate')}
                    </div>

                    {impactSummary.low > 0 && (
                      <div className="shakemap-impact-section low">
                        <div className="shakemap-impact-section-head">
                          <span className="risk-dot low" />
                          <strong>Low risk</strong>
                          <span className="risk-count">{impactSummary.low}</span>
                        </div>
                        {renderImpactList(shakemapMineralImpacts.low, 'low')}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="shakemap-impact-empty">Analyzing mineral sites in shaking zone…</p>
                )}
              </div>
            )}
          </div>
        )}
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
      subtitle={`${DISASTER_LAYERS.length} layers`}
    >
      {content}
    </CollapsiblePanel>
  );
}
