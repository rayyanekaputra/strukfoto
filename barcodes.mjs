// Barcode styles. These look like real codes but encode nothing.

const HEIGHT_FACTOR = { code128: 1, code39: 1, pdf417: 1.6, qr: 2.4, none: 0 };
const LABELED = new Set(['code128', 'code39', 'pdf417']);

function labelHeight(style, scale) {
  return LABELED.has(style) ? Math.round(14 * scale) : 0;
}

// Total height the barcode block needs, including the number line
export function barcodeBlockHeight(style, baseHeight, scale) {
  const factor = HEIGHT_FACTOR[style] ?? 1;
  if (!factor) return 0;
  return Math.round(baseHeight * factor + labelHeight(style, scale));
}

// Split `total` modules into `count` widths between 1 and `max`
function randomWidths(rng, count, total, max) {
  const widths = new Array(count).fill(1);
  let left = total - count;
  while (left > 0) {
    const i = Math.floor(rng() * count);
    if (widths[i] < max) {
      widths[i]++;
      left--;
    }
  }
  return widths;
}

// Draw alternating bar/space widths starting with a bar. Returns the x after the last element.
function drawElements(ctx, widths, x, y, unit, h) {
  widths.forEach((w, i) => {
    if (i % 2 === 0) ctx.fillRect(x, y, w * unit, h);
    x += w * unit;
  });
  return x;
}

function drawCode128(ctx, { x, y, w, h, rng, scale }) {
  const unit = Math.max(1, Math.round(1.6 * scale));
  const symbols = Math.max(1, Math.floor((w / unit - 44) / 11));
  const start = [2, 1, 1, 2, 1, 4];
  const stop = [2, 3, 3, 1, 1, 1, 2];
  const totalW = (44 + 11 * symbols) * unit;
  let cx = x + Math.floor((w - totalW) / 2) + 10 * unit;
  cx = drawElements(ctx, start, cx, y, unit, h);
  for (let i = 0; i < symbols; i++) {
    cx = drawElements(ctx, randomWidths(rng, 6, 11, 4), cx, y, unit, h);
  }
  drawElements(ctx, stop, cx, y, unit, h);
}

function drawCode39(ctx, { x, y, w, h, rng, scale }) {
  const unit = Math.max(1, Math.round(1.4 * scale));
  const chars = Math.max(1, Math.floor(w / unit / 16));
  let cx = x + Math.floor((w - chars * 16 * unit) / 2);
  for (let i = 0; i < chars; i++) {
    // 5 bars and 4 spaces; 2 wide bars and 1 wide space per character
    const bars = [1, 1, 1, 1, 1];
    const spaces = [1, 1, 1, 1];
    for (let n = 0; n < 2; ) {
      const b = Math.floor(rng() * 5);
      if (bars[b] === 1) {
        bars[b] = 3;
        n++;
      }
    }
    spaces[Math.floor(rng() * 4)] = 3;
    const widths = [];
    for (let k = 0; k < 5; k++) {
      widths.push(bars[k]);
      if (k < 4) widths.push(spaces[k]);
    }
    widths.push(1); // gap between characters
    cx = drawElements(ctx, widths, cx, y, unit, h);
  }
}

function drawPdf417(ctx, { x, y, w, h, rng, scale }) {
  const unit = Math.max(1, Math.round(1.2 * scale));
  const rows = 5;
  const rowH = Math.floor(h / rows);
  const start = [8, 1, 1, 1, 1, 1, 1, 3];
  const stop = [7, 1, 1, 3, 1, 1, 1, 2, 1];
  const words = Math.max(1, Math.floor((w / unit - 35) / 17));
  const totalW = (35 + 17 * words) * unit;
  const x0 = x + Math.floor((w - totalW) / 2);
  for (let r = 0; r < rows; r++) {
    let cx = drawElements(ctx, start, x0, y + r * rowH, unit, rowH);
    for (let i = 0; i < words; i++) {
      cx = drawElements(ctx, randomWidths(rng, 8, 17, 6), cx, y + r * rowH, unit, rowH);
    }
    drawElements(ctx, stop, cx, y + r * rowH, unit, rowH);
  }
}

function drawQr(ctx, { x, y, w, h, rng }) {
  const n = 21;
  const m = Math.max(1, Math.floor(h / n));
  const x0 = x + Math.floor((w - n * m) / 2);
  const finders = [[0, 0], [n - 7, 0], [0, n - 7]];

  const inFinderZone = (cx, cy) => finders.some(([fx, fy]) => cx >= fx - 1 && cx <= fx + 7 && cy >= fy - 1 && cy <= fy + 7);

  for (let cy = 0; cy < n; cy++) {
    for (let cx = 0; cx < n; cx++) {
      if (inFinderZone(cx, cy)) continue;
      const timing = cx === 6 || cy === 6;
      const on = timing ? (cx + cy) % 2 === 0 : rng() < 0.5;
      if (on) ctx.fillRect(x0 + cx * m, y + cy * m, m, m);
    }
  }

  finders.forEach(([fx, fy]) => {
    ctx.fillRect(x0 + fx * m, y + fy * m, 7 * m, 7 * m);
    ctx.clearRect(x0 + (fx + 1) * m, y + (fy + 1) * m, 5 * m, 5 * m);
    ctx.fillRect(x0 + (fx + 2) * m, y + (fy + 2) * m, 3 * m, 3 * m);
  });
}

const DRAWERS = { code128: drawCode128, code39: drawCode39, pdf417: drawPdf417, qr: drawQr };

// `h` is the block height from barcodeBlockHeight()
export function drawBarcode(ctx, style, { x, y, w, h, rng, scale, ink }) {
  const draw = DRAWERS[style];
  if (!draw || !h) return;

  const labelH = labelHeight(style, scale);
  ctx.save();
  ctx.fillStyle = ink;
  draw(ctx, { x, y, w, h: h - labelH, rng, scale });

  if (labelH) {
    const digit = () => Math.floor(rng() * 10);
    const group = () => [digit(), digit(), digit(), digit()].join('');
    ctx.textAlign = 'center';
    ctx.font = `${Math.max(8, Math.round(11 * scale))}px "Courier New", monospace`;
    ctx.fillText(`${group()} ${group()} ${group()}`, x + w / 2, y + h - Math.round(2 * scale));
  }
  ctx.restore();
}
