const ICON_SIZE = 64;
const PAD = 3;

function drawStarPath(ctx, cx, cy, outerR, innerR, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/** Solid white shapes on transparent canvas — colored via Mapbox SDF, no side halo needed */
export function createFilledIconImageData(shape) {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
  ctx.fillStyle = '#ffffff';

  const center = ICON_SIZE / 2;
  const radius = center - PAD;

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      fillRoundRect(ctx, PAD, PAD, ICON_SIZE - PAD * 2, ICON_SIZE - PAD * 2, 5);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(center, PAD);
      ctx.lineTo(ICON_SIZE - PAD, ICON_SIZE - PAD);
      ctx.lineTo(PAD, ICON_SIZE - PAD);
      ctx.closePath();
      ctx.fill();
      break;
    case 'star':
      drawStarPath(ctx, center, center, radius, radius * 0.42, 5);
      ctx.fill();
      break;
    case 'pill': {
      const w = ICON_SIZE - PAD * 2;
      const h = w * 0.44;
      const x = PAD;
      const y = (ICON_SIZE - h) / 2;
      const r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(x + r, y + h);
      ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
  }

  return ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
}

export const MAP_ICON_NAMES = ['circle', 'square', 'triangle', 'star', 'pill'];
