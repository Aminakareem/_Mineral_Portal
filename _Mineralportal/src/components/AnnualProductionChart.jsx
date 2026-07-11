import { useEffect, useId, useMemo, useState } from 'react';
import { FISCAL_YEARS } from '../utils/productionData';

function formatTon(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function scaleValue(value, maxValue, plotHeight, padTop) {
  if (maxValue <= 0) return padTop + plotHeight;
  const logVal = value > 0 ? Math.log10(value + 1) : 0;
  const logMax = Math.log10(maxValue + 1);
  return padTop + plotHeight - (logVal / logMax) * plotHeight;
}

export default function AnnualProductionChart({
  dataset = [],
  getTypeColor,
  regionName = 'Sindh',
  selectedMineralName = null,
  onSelectMineral,
  onClose,
}) {
  const [animate, setAnimate] = useState(false);
  const [hoveredMineral, setHoveredMineral] = useState(null);
  const clipId = useId();

  const mineralLines = useMemo(
    () => dataset
      .filter((item) => item.series?.some((point) => point.value > 0))
      .map((item) => ({
        mineral: item.mineral,
        portalType: item.portalType,
        series: item.series,
        color: getTypeColor?.(item.portalType || item.mineral) || '#22c55e',
        total: item.series.reduce((sum, point) => sum + point.value, 0),
      }))
      .sort((a, b) => b.total - a.total),
    [dataset, getTypeColor]
  );

  const activeMineral = selectedMineralName || hoveredMineral;

  useEffect(() => {
    setAnimate(false);
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [dataset, regionName]);

  const width = 1200;
  const height = 420;
  const padLeft = 64;
  const padRight = 220;
  const padTop = 36;
  const padBottom = 52;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const maxValue = Math.max(
    ...mineralLines.flatMap((line) => line.series.map((point) => point.value)),
    1
  );

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.pow(10, Math.log10(maxValue + 1) * ratio) - 1;
    return Math.round(value);
  });

  const lines = mineralLines.map((line, lineIndex) => {
    const points = FISCAL_YEARS.map((year, index) => {
      const match = line.series.find((item) => item.year === year);
      const value = match?.value || 0;
      const x = padLeft + (index / Math.max(FISCAL_YEARS.length - 1, 1)) * plotWidth;
      const y = scaleValue(value, maxValue, plotHeight, padTop);
      return { year, value, x, y };
    });

    return {
      ...line,
      points,
      path: buildSmoothPath(points),
      delay: lineIndex * 280,
    };
  });

  const activeLine = lines.find((line) => line.mineral === activeMineral);

  return (
    <div className="annual-production-chart glass-panel">
      <div className="annual-production-chart-header">
        <div>
          <h3>Annual Production — {regionName}</h3>
          <p>Click any string line to reveal mineral name and highlight on map</p>
        </div>
        <div className="annual-production-chart-actions">
          {activeLine && (
            <span className="annual-production-selected-pill" style={{ '--pill-color': activeLine.color }}>
              <span className="annual-production-selected-dot" />
              {activeLine.mineral}
            </span>
          )}
          <span className="production-chart-unit">M. TON (log scale)</span>
          {onClose && (
            <button type="button" className="production-line-close" onClick={onClose} aria-label="Close chart">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      <div className="annual-production-chart-body">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`annual-production-svg${animate ? ' is-animated' : ''}`}
          role="img"
          aria-label={`Annual production chart for ${regionName}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={padLeft} y={padTop} width={plotWidth} height={plotHeight} />
            </clipPath>
          </defs>

          {ticks.map((tick) => {
            const y = scaleValue(tick, maxValue, plotHeight, padTop);
            return (
              <g key={`tick-${tick}`}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} className="production-line-grid" />
                <text x={padLeft - 12} y={y + 4} className="production-line-y-label">
                  {formatTon(tick)}
                </text>
              </g>
            );
          })}

          {FISCAL_YEARS.map((year, index) => {
            const x = padLeft + (index / Math.max(FISCAL_YEARS.length - 1, 1)) * plotWidth;
            return (
              <text key={year} x={x} y={height - 16} className="production-line-x-label">
                {year}
              </text>
            );
          })}

          <g clipPath={`url(#${clipId})`}>
            {lines.map((line) => {
              const isActive = activeMineral === line.mineral;
              const isDimmed = activeMineral && !isActive;
              return (
                <g
                  key={line.mineral}
                  className={`annual-mineral-line-group${isActive ? ' active' : ''}${isDimmed ? ' dimmed' : ''}`}
                  style={{ '--line-color': line.color, '--line-delay': `${line.delay}ms` }}
                  onMouseEnter={() => setHoveredMineral(line.mineral)}
                  onMouseLeave={() => setHoveredMineral(null)}
                  onClick={() => onSelectMineral?.(line.portalType, line.mineral)}
                >
                  <path d={line.path} className="annual-mineral-line-hit" />
                  <path d={line.path} className="annual-mineral-line-glow" stroke={line.color} />
                  <path d={line.path} className="annual-mineral-line-path" stroke={line.color} />
                  {isActive && line.points.map((point) => (
                    point.value > 0 ? (
                      <g key={`${line.mineral}-${point.year}`}>
                        <circle cx={point.x} cy={point.y} r="6" className="annual-mineral-point-halo" fill={line.color} />
                        <circle cx={point.x} cy={point.y} r="4" className="annual-mineral-point" fill="#f8fafc" stroke={line.color} strokeWidth="2" />
                      </g>
                    ) : null
                  ))}
                  {isActive && (
                    <text
                      x={line.points[line.points.length - 1].x + 8}
                      y={line.points[line.points.length - 1].y}
                      className="annual-mineral-line-label"
                      fill={line.color}
                    >
                      {line.mineral}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          <g className="annual-mineral-legend">
            {lines.map((line, index) => (
              <g
                key={`legend-${line.mineral}`}
                transform={`translate(${width - padRight + 16}, ${padTop + index * 18})`}
                className={`annual-legend-item${activeMineral === line.mineral ? ' active' : ''}`}
                onClick={() => onSelectMineral?.(line.portalType, line.mineral)}
                onMouseEnter={() => setHoveredMineral(line.mineral)}
                onMouseLeave={() => setHoveredMineral(null)}
              >
                <line x1="0" y1="7" x2="14" y2="7" stroke={line.color} strokeWidth="2.5" strokeLinecap="round" />
                <text x="20" y="11" className="annual-legend-label">{line.mineral}</text>
              </g>
            ))}
          </g>
        </svg>

        <div className="annual-mineral-chip-row">
          {mineralLines.map((line) => (
            <button
              key={`chip-${line.mineral}`}
              type="button"
              className={`annual-mineral-chip${activeMineral === line.mineral ? ' active' : ''}`}
              style={{ '--chip-color': line.color }}
              onClick={() => onSelectMineral?.(line.portalType, line.mineral)}
              onMouseEnter={() => setHoveredMineral(line.mineral)}
              onMouseLeave={() => setHoveredMineral(null)}
            >
              {line.mineral}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
