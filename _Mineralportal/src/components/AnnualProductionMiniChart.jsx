function formatTon(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

export default function AnnualProductionMiniChart({
  series = [],
  accent = '#22c55e',
  isOpen,
  onToggle,
}) {
  const max = Math.max(...series.map((item) => item.value), 1);

  return (
    <section className="annual-production-card">
      <button
        type="button"
        className={`annual-production-toggle${isOpen ? ' open' : ''}`}
        onClick={onToggle}
      >
        <span className="annual-production-toggle-left">
          <i className="fa-solid fa-chart-column" />
          <span>Annual Production</span>
        </span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} />
      </button>

      {isOpen && (
        <div className="annual-production-body">
          <div className="annual-production-bars">
            {series.map((item, index) => {
              const height = Math.max((item.value / max) * 100, 2);
              return (
                <div key={item.year} className="annual-production-col">
                  <span className="annual-production-value">{formatTon(item.value)}</span>
                  <div className="annual-production-bar-wrap">
                    <div
                      className="annual-production-bar"
                      style={{
                        '--bar-height': `${height}%`,
                        '--bar-delay': `${index * 65}ms`,
                        '--annual-accent': accent,
                      }}
                    />
                  </div>
                  <span className="annual-production-label">{item.year}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
