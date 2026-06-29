import { MarkerIcon } from './MarkerIcon';

const LEGEND_LABELS = {
  metallic_minerals: 'Metallic',
  dimension_stones: 'Dimension',
  chemical_fertilizer: 'Chemical',
  gemstones: 'Gemstones',
  fuels: 'Fuels',
};

export default function MapLegend({ layers }) {
  return (
    <div className="map-legend glass-panel">
      <div className="legend-header">
        <i className="fa-solid fa-shapes" />
        <span>Map Legend</span>
      </div>
      <div className="legend-items">
        {layers.map((layer) => (
          <div key={layer.id} className="legend-item">
            <MarkerIcon shape={layer.marker_style} color={layer.marker_color} size={22} />
            <div className="legend-text">
              <span className="legend-name">{LEGEND_LABELS[layer.id] || layer.name}</span>
              <span className="legend-count">{layer.count} sites</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
