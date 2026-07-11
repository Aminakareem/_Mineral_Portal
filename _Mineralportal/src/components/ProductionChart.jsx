import { FISCAL_YEARS } from '../utils/productionData';

function formatTon(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export default function ProductionChart({ mineral, regionName, series = [], accent = '#22c55e' }) {
  const chartSeries = FISCAL_YEARS.map((year) => {
    const match = series.find((item) => item.year === year);
    return { year, value: match?.value || 0 };
  });

  const maxValue = Math.max(...chartSeries.map((item) => item.value), 1);
  const axisMax = Math.ceil(maxValue / 100) * 100 || 100;
  const ticks = Array.from({ length: 9 }, (_, index) => Math.round((axisMax / 8) * index));

  return (
    <div className="production-chart-panel glass-panel">
      <div className="production-chart-header">
        <div>
          <h3>Production of {mineral}</h3>
          <p>in {regionName}</p>
        </div>
        <span className="production-chart-unit">M. TON</span>
      </div>

      <div className="production-chart-stage" style={{ '--chart-accent': accent }}>
        <div className="production-chart-y-axis">
          {ticks.reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="production-chart-grid">
          {ticks.map((tick) => (
            <div key={`grid-${tick}`} className="production-chart-gridline" />
          ))}

          <div className="production-chart-bars">
            {chartSeries.map((item) => {
              const height = Math.max((item.value / axisMax) * 100, item.value > 0 ? 4 : 1.5);
              return (
                <div key={item.year} className="production-chart-bar-col">
                  <div className="production-chart-bar-value">
                    {item.value > 0 ? formatTon(item.value) : '0'}
                  </div>
                  <div className="production-chart-bar-3d" style={{ '--bar-height': `${height}%` }}>
                    <div className="production-chart-bar-front" />
                    <div className="production-chart-bar-top" />
                    <div className="production-chart-bar-side" />
                  </div>
                  <span className="production-chart-bar-label">{item.year}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
