import { PRODUCTION_REGIONS } from '../config/productionRegions';

export default function ProductionRegionNav({ activeRegionId, onRegionChange, className = '' }) {
  return (
    <nav className={`production-region-nav${className ? ` ${className}` : ''}`} aria-label="Production regions">
      {PRODUCTION_REGIONS.map((region) => (
        <button
          key={region.id}
          type="button"
          className={`production-region-pill${activeRegionId === region.id ? ' active' : ''}`}
          style={{ '--region-color': region.color }}
          onClick={() => onRegionChange(activeRegionId === region.id ? null : region.id)}
        >
          {region.name}
        </button>
      ))}
    </nav>
  );
}
