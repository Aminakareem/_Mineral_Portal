export function MarkerIcon({ shape, color, size = 24 }) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  let shapeEl;
  if (shape === 'marker-square') {
    shapeEl = <rect x="2.5" y="2.5" width="11" height="11" rx="2" fill={color} />;
  } else if (shape === 'marker-triangle') {
    shapeEl = <path d="M8 1.5 L14.5 14.5 L1.5 14.5 Z" fill={color} />;
  } else if (shape === 'marker-star') {
    shapeEl = (
      <path
        d="M8 0.8 L10.2 5.5 L15.5 6.1 L11.5 9.5 L12.8 15 L8 12 L3.2 15 L4.5 9.5 L0.5 6.1 L5.8 5.5 Z"
        fill={color}
      />
    );
  } else if (shape === 'marker-pill') {
    shapeEl = <rect x="0.5" y="4.5" width="15" height="7" rx="3.5" fill={color} />;
  } else {
    shapeEl = <circle cx="8" cy="8" r="7" fill={color} />;
  }

  return (
    <span className="marker-shape" style={{ width: size, height: size }} aria-hidden="true">
      <svg className="marker-svg" {...svgProps}>
        {shapeEl}
      </svg>
    </span>
  );
}
