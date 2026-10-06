// Paper outlines. Each shape cuts pixels out of the paper canvas with 'destination-out'.

function cutCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Cuts the area between a corner and a quarter circle of radius r
function cutCorner(ctx, x, y, sx, sy, r) {
  const cx = x + sx * r;
  const cy = y + sy * r;
  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.min(x, cx), Math.min(y, cy), r, r);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(Math.min(x, cx), Math.min(y, cy), r, r);
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill('evenodd');
  ctx.restore();
}

// Cuts a 45 degree triangle of leg `d` off a corner
function cutChamfer(ctx, x, y, sx, sy, d) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + sx * d, y);
  ctx.lineTo(x, y + sy * d);
  ctx.closePath();
  ctx.fill();
}

// Stable pseudo-random value in [0, 1) for an integer, so torn edges don't change between renders
function hash01(n) {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function cutRoundedCorners(ctx, w, h, r) {
  cutCorner(ctx, 0, 0, 1, 1, r);
  cutCorner(ctx, w, 0, -1, 1, r);
  cutCorner(ctx, 0, h, 1, -1, r);
  cutCorner(ctx, w, h, -1, -1, r);
}

const SHAPES = {
  // Zigzag top and bottom edge, like a torn receipt strip
  strip: (ctx, w, h, scale) => {
    const toothSize = Math.max(4, Math.round(12 * scale));
    const toothDepth = Math.max(2, Math.round(6 * scale));
    for (let x = 0; x < w; x++) {
      const toothY = Math.floor(Math.abs(Math.sin((x / toothSize) * Math.PI)) * toothDepth);
      ctx.fillRect(x, 0, 1, toothY);
      ctx.fillRect(x, h - toothDepth + toothY, 1, toothDepth);
    }
  },

  // Semicircle notch in the middle of both sides
  ticket: (ctx, w, h, scale) => {
    const r = Math.round(12 * scale);
    cutCircle(ctx, 0, h / 2, r);
    cutCircle(ctx, w, h / 2, r);
    cutRoundedCorners(ctx, w, h, Math.round(6 * scale));
  },

  // Side notches at the tear-off line (perfY), rounded corners
  stub: (ctx, w, h, scale, perfY) => {
    const r = Math.round(10 * scale);
    if (perfY) {
      cutCircle(ctx, 0, perfY, r);
      cutCircle(ctx, w, perfY, r);
    }
    cutRoundedCorners(ctx, w, h, Math.round(8 * scale));
  },

  // Scalloped edge all around, like a coupon
  scallop: (ctx, w, h, scale) => {
    const r = Math.max(3, Math.round(5 * scale));
    const step = r * 3;
    for (let x = r; x < w; x += step) {
      cutCircle(ctx, x, 0, r);
      cutCircle(ctx, x, h, r);
    }
    for (let y = r; y < h; y += step) {
      cutCircle(ctx, 0, y, r);
      cutCircle(ctx, w, y, r);
    }
  },

  // Plain slip with large rounded corners
  rounded: (ctx, w, h, scale) => {
    cutRoundedCorners(ctx, w, h, Math.round(22 * scale));
  },

  // Continuous dot-matrix paper: tractor feed holes down both sides
  pinfeed: (ctx, w, h, scale) => {
    const r = Math.max(2, Math.round(4 * scale));
    const pitch = Math.round(18 * scale);
    const offset = Math.round(10 * scale);
    for (let y = pitch / 2; y < h; y += pitch) {
      cutCircle(ctx, offset, y, r);
      cutCircle(ctx, w - offset, y, r);
    }
  },

  // Irregular hand-torn top and bottom edge
  torn: (ctx, w, h, scale) => {
    const depth = Math.max(3, Math.round(9 * scale));
    const seg = Math.max(2, Math.round(5 * scale));
    for (let x = 0; x < w; x++) {
      const i = Math.floor(x / seg);
      const t = (x % seg) / seg;
      const top = (hash01(i) * (1 - t) + hash01(i + 1) * t) * depth;
      const bottom = (hash01(i + 5000) * (1 - t) + hash01(i + 5001) * t) * depth;
      ctx.fillRect(x, 0, 1, Math.round(top));
      ctx.fillRect(x, h - Math.round(bottom), 1, Math.round(bottom));
    }
  },

  // Coat check or laundry tag: clipped top corners and a punched hole
  tag: (ctx, w, h, scale) => {
    const d = Math.round(26 * scale);
    cutChamfer(ctx, 0, 0, 1, 1, d);
    cutChamfer(ctx, w, 0, -1, 1, d);
    cutCircle(ctx, w / 2, Math.round(16 * scale), Math.max(3, Math.round(7 * scale)));
    cutRoundedCorners(ctx, w, h, Math.round(6 * scale));
  },

  // Carnival roll ticket: inward round notches at every corner
  admit: (ctx, w, h, scale) => {
    const r = Math.round(16 * scale);
    cutCircle(ctx, 0, 0, r);
    cutCircle(ctx, w, 0, r);
    cutCircle(ctx, 0, h, r);
    cutCircle(ctx, w, h, r);
  },

  // Cinema ticket: chamfered corners and side notches at the tear-off line
  diecut: (ctx, w, h, scale, perfY) => {
    const d = Math.round(12 * scale);
    cutChamfer(ctx, 0, 0, 1, 1, d);
    cutChamfer(ctx, w, 0, -1, 1, d);
    cutChamfer(ctx, 0, h, 1, -1, d);
    cutChamfer(ctx, w, h, -1, -1, d);
    if (perfY) {
      const r = Math.round(9 * scale);
      cutCircle(ctx, 0, perfY, r);
      cutCircle(ctx, w, perfY, r);
    }
  }
};

// Vertical space at the top and bottom that content should stay clear of
const INSETS = {
  strip: (scale) => Math.max(2, Math.round(6 * scale)) + Math.round(8 * scale),
  ticket: (scale) => Math.round(10 * scale),
  stub: (scale) => Math.round(12 * scale),
  scallop: (scale) => Math.max(3, Math.round(5 * scale)) + Math.round(10 * scale),
  rounded: (scale) => Math.round(16 * scale),
  pinfeed: (scale) => Math.round(10 * scale),
  torn: (scale) => Math.round(16 * scale),
  tag: (scale) => Math.round(28 * scale),
  admit: (scale) => Math.round(14 * scale),
  diecut: (scale) => Math.round(12 * scale)
};

// Extra horizontal margin for shapes that cut into the sides
const SIDE_INSETS = {
  pinfeed: (scale) => Math.round(14 * scale)
};

export function shapeInset(shape, scale) {
  return (INSETS[shape] || INSETS.strip)(scale);
}

export function shapeSideInset(shape, scale) {
  return SIDE_INSETS[shape] ? SIDE_INSETS[shape](scale) : 0;
}

export function applyPaperShape(ctx, shape, w, h, scale, perfY) {
  const cut = SHAPES[shape] || SHAPES.strip;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';
  cut(ctx, w, h, scale, perfY);
  ctx.restore();
}

export function drawPerforation(ctx, w, y, scale, inkColor) {
  ctx.save();
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
  ctx.setLineDash([Math.round(6 * scale), Math.round(5 * scale)]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
  ctx.restore();
}
