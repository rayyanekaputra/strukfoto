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

function cutRoundedCorners(ctx, w, h, r) {
  cutCorner(ctx, 0, 0, 1, 1, r);
  cutCorner(ctx, w, 0, -1, 1, r);
  cutCorner(ctx, 0, h, 1, -1, r);
  cutCorner(ctx, w, h, -1, -1, r);
}

const SHAPES = {
  // Zigzag top and bottom edge, like a torn receipt strip
  strip: (ctx, w, h) => {
    const toothSize = 12;
    const toothDepth = 6;
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
  }
};

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
