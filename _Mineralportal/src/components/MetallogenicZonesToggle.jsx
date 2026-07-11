export default function MetallogenicZonesToggle({ zonesVisible, onToggle, mapReady }) {
  return (
    <button
      type="button"
      className={`metallogenic-zones-toggle glass-panel${zonesVisible ? ' active' : ''}`}
      onClick={onToggle}
      disabled={!mapReady}
      aria-pressed={zonesVisible}
      title={zonesVisible ? 'Hide metallogenic zones' : 'Show metallogenic zones'}
    >
      <i className="fa-solid fa-layer-group" aria-hidden="true" />
      <span className="metallogenic-zones-toggle-label">Metallogenic Zones</span>
      <span className="metallogenic-zones-toggle-state">{zonesVisible ? 'ON' : 'OFF'}</span>
    </button>
  );
}
