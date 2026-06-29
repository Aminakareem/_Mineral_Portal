import { LANDSLIDE_REGIONS, LANDSLIDE_SUMMARY, SUSCEPTIBILITY_CLASSES } from '../config/landslideData';

export default function LandslideView({ onOpenMap }) {
  return (
    <div className="landslide-view">
      <div className="landslide-hero glass-panel">
        <div className="landslide-hero-icon">
          <i className="fa-solid fa-hill-rockslide" />
        </div>
        <div className="landslide-hero-text">
          <h2>Landslide Susceptibility</h2>
          <p>
            National landslide risk rasters for {LANDSLIDE_SUMMARY.coverageLabel}.
            Classes range from 1 (low) to 5 (high). On the Mineral Map, open the
            <strong> LandSlide </strong> sidebar tab to toggle regional layers.
          </p>
        </div>
        <button type="button" className="action-btn primary landslide-map-btn" onClick={onOpenMap}>
          <i className="fa-solid fa-map-location-dot" />
          View on Mineral Map
        </button>
      </div>

      <div className="landslide-stats-row">
        <div className="landslide-stat glass-panel">
          <span className="landslide-stat-value">{LANDSLIDE_SUMMARY.totalRegions}</span>
          <span className="landslide-stat-label">Regional Rasters</span>
        </div>
        <div className="landslide-stat glass-panel">
          <span className="landslide-stat-value">{SUSCEPTIBILITY_CLASSES.length}</span>
          <span className="landslide-stat-label">Risk Classes</span>
        </div>
        <div className="landslide-stat glass-panel">
          <span className="landslide-stat-value">GeoTIFF</span>
          <span className="landslide-stat-label">Source Format</span>
        </div>
      </div>

      <div className="landslide-legend glass-panel">
        <h3>Susceptibility Legend</h3>
        <div className="landslide-legend-scale">
          {SUSCEPTIBILITY_CLASSES.map((item) => (
            <div key={item.level} className="legend-class-item">
              <span className="legend-swatch" style={{ background: item.color }} />
              <span className="legend-class-label">
                <strong>{item.level}</strong> — {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="landslide-grid">
        {LANDSLIDE_REGIONS.map((region) => (
          <article key={region.id} className="landslide-card glass-panel">
            <div className="landslide-card-image-wrap">
              <img src={region.previewUrl} alt={`${region.name} landslide susceptibility`} loading="lazy" />
              <span className="landslide-card-badge">Class {region.valueMin}–{region.valueMax}</span>
            </div>
            <div className="landslide-card-body">
              <h3>{region.name}</h3>
              <p className="landslide-card-file">{region.file}</p>
              <dl className="landslide-meta">
                <div>
                  <dt>File size</dt>
                  <dd>{region.size}</dd>
                </div>
                <div>
                  <dt>Resolution</dt>
                  <dd>{region.dimensions} px · {region.resolution}</dd>
                </div>
                <div>
                  <dt>CRS</dt>
                  <dd>{region.crs}</dd>
                </div>
                <div>
                  <dt>Mean susceptibility</dt>
                  <dd>{region.valueMean.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
