import { SUSCEPTIBILITY_CLASSES } from '../config/landslideData';

export default function LandslideMapLegend({ visible }) {
  if (!visible) return null;

  return (
    <div className="landslide-map-legend glass-panel" aria-label="Landslide susceptibility legend">
      <div className="landslide-map-legend-title">
        <i className="fa-solid fa-hill-rockslide" />
        <span>Susceptibility</span>
      </div>
      <div className="landslide-map-legend-bar" aria-hidden="true" />
      <div className="landslide-map-legend-labels">
        <span>Low</span>
        <span>High</span>
      </div>
      <ul className="landslide-map-legend-classes">
        {SUSCEPTIBILITY_CLASSES.map((item) => (
          <li key={item.level}>
            <span className="legend-swatch" style={{ background: item.color }} />
            <span>{item.level} — {item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
