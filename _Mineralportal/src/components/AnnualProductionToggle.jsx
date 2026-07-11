export default function AnnualProductionToggle({ isActive, onToggle }) {
  return (
    <button
      type="button"
      className={`annual-production-toggle-btn${isActive ? ' active' : ''}`}
      onClick={onToggle}
    >
      <span className="annual-production-toggle-btn-left">
        <i className="fa-solid fa-chart-line" />
        <span>Annual Production</span>
      </span>
      <span className="annual-production-toggle-state">{isActive ? 'ON' : 'OFF'}</span>
    </button>
  );
}
