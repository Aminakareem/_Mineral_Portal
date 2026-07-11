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

export default function ProductionLineChart({
  title,
  subtitle,
  series = [],
  accent = '#22c55e',
  onClose,
  animationDuration = 2.4,
  animationPointStep = 140,
}) {
  const [animate, setAnimate] = useState(false);
  const gradientId = useId();
  const glowId = useId();

  const chartSeries = useMemo(
    () => FISCAL_YEARS.map((year) => {
      const match = series.find((item) => item.year === year);
      return { year, value: match?.value || 0 };
    }),
    [series]
  );

  useEffect(() => {
    setAnimate(false);
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [title, series]);

  const width = 640;
  const height = 320;
  const padLeft = 54;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 44;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const maxValue = Math.max(...chartSeries.map((item) => item.value), 1);
  const axisMax = Math.ceil(maxValue / 100) * 100 || 100;
  const ticks = Array.from({ length: 5 }, (_, index) => Math.round((axisMax / 4) * index));

  const points = chartSeries.map((item, index) => {
    const x = padLeft + (index / Math.max(chartSeries.length - 1, 1)) * plotWidth;
    const y = padTop + plotHeight - (item.value / axisMax) * plotHeight;
    return { ...item, x, y };
  });

  const linePath = buildSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
    : '';

  return (
    <div className="production-line-chart glass-panel">
      <div className="production-line-chart-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="production-line-chart-actions">
          <span className="production-chart-unit">M. TON</span>
          {onClose && (
            <button type="button" className="production-line-close" onClick={onClose} aria-label="Close chart">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`production-line-svg${animate ? ' is-animated' : ''}`}
        style={{
          '--line-draw-duration': `${animationDuration}s`,
          '--point-step': `${animationPointStep}ms`,
        }}
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ticks.map((tick) => {
          const y = padTop + plotHeight - (tick / axisMax) * plotHeight;
          return (
            <g key={`tick-${tick}`}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                className="production-line-grid"
              />
              <text x={padLeft - 10} y={y + 4} className="production-line-y-label">
                {formatTon(tick)}
              </text>
            </g>
          );
        })}

        {areaPath && (
          <path
            d={areaPath}
            className="production-line-area"
            fill={`url(#${gradientId})`}
          />
        )}

        {linePath && (
          <>
            <path
              d={linePath}
              className="production-line-glow"
              stroke={accent}
              filter={`url(#${glowId})`}
            />
            <path
              d={linePath}
              className="production-line-path"
              stroke={accent}
            />
          </>
        )}

        {points.map((point, index) => (
          <g key={point.year}>
            <circle
              cx={point.x}
              cy={point.y}
              r="7"
              className="production-line-dot-halo"
              fill={accent}
              style={{ '--point-delay': `${index * animationPointStep + 300}ms` }}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4.5"
              className="production-line-dot"
              fill="#f8fafc"
              stroke={accent}
              strokeWidth="2"
              style={{ '--point-delay': `${index * animationPointStep + 300}ms` }}
            />
            <text x={point.x} y={height - 14} className="production-line-x-label">
              {point.year}
            </text>
            {point.value > 0 && (
              <text
                x={point.x}
                y={point.y - 12}
                className="production-line-value"
                style={{ '--point-delay': `${index * animationPointStep + 380}ms` }}
              >
                {formatTon(point.value)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
