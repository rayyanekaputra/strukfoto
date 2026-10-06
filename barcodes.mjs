// Barcode styles. These look like real codes but encode nothing.
// Every code is laid out in modules and sized from the block width alone, so the
// aspect ratio is the same at any export resolution.

const LABELED = new Set(['code128', 'code39', 'pdf417']);

// Block geometry as a fraction of the block width
const SPEC = {
  code128: { fill: 0.92, height: 0.11 },
  code39: { fill: 0.92, height: 0.11 },
  pdf417: { fill: 0.92, height: 0.17 },
  qr: { fill: 0, height: 0.36 }
};

function labelHeight(style, scale) {
  return LABELED.has(style) ? Math.round(14 * scale) : 0;
}

// Total height the barcode block needs for a block of width `w`, including the number line
export function barcodeBlockHeight(style, w, scale) {
  const spec = SPEC[style];
  if (!spec) return 0;
  return Math.round(w * spec.height + labelHeight(style, scale));
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

// Draw alternating bar/space widths starting with a bar. Positions are in modules from x0;
// edges are rounded to whole pixels so bars stay crisp. Returns the module offset after the last element.
function drawElements(ctx, widths, x0, offset, y, unit, h) {
  widths.forEach((w, i) => {
    if (i % 2 === 0) {
      const left = Math.round(x0 + offset * unit);
      const right = Math.round(x0 + (offset + w) * unit);
      ctx.fillRect(left, y, Math.max(1, right - left), h);
    }
    offset += w;
  });
  return offset;
}

function drawCode128(ctx, { x, y, w, h, rng }) {
  const symbols = 18;
  const total = 35 + 11 * symbols + 2;
  const unit = (w * SPEC.code128.fill) / total;
  const x0 = x + (w - total * unit) / 2;
  let o = drawElements(ctx, [2, 1, 1, 2, 1, 4], x0, 0, y, unit, h);
  for (let i = 0; i < symbols; i++) {
    o = drawElements(ctx, randomWidths(rng, 6, 11, 4), x0, o, y, unit, h);
  }
  drawElements(ctx, [2, 3, 3, 1, 1, 1, 2], x0, o, y, unit, h);
}

function drawCode39(ctx, { x, y, w, h, rng }) {
  const chars = 14;
  const unit = (w * SPEC.code39.fill) / (chars * 16);
  const x0 = x + (w - chars * 16 * unit) / 2;
  let o = 0;
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
    o = drawElements(ctx, widths, x0, o, y, unit, h);
  }
}

function drawPdf417(ctx, { x, y, w, h, rng }) {
  const rows = 5;
  const words = 6;
  const start = [8, 1, 1, 1, 1, 1, 1, 3];
  const stop = [7, 1, 1, 3, 1, 1, 1, 2, 1];
  const total = 17 + 17 * words + 18;
  const unit = (w * SPEC.pdf417.fill) / total;
  const x0 = x + (w - total * unit) / 2;
  const rowH = Math.floor(h / rows);
  for (let r = 0; r < rows; r++) {
    const ry = y + r * rowH;
    let o = drawElements(ctx, start, x0, 0, ry, unit, rowH);
    for (let i = 0; i < words; i++) {
      o = drawElements(ctx, randomWidths(rng, 8, 17, 6), x0, o, ry, unit, rowH);
    }
    drawElements(ctx, stop, x0, o, ry, unit, rowH);
  }
}

function drawQr(ctx, { x, y, w, h, rng }) {
  const n = 21;
  const m = Math.min(h, w) / n;
  const x0 = x + (w - n * m) / 2;
  const finders = [[0, 0], [n - 7, 0], [0, n - 7]];

  // Rectangle in cell units, snapped to whole pixels
  const cells = (fn, cx, cy, cw, ch) => {
    const l = Math.round(x0 + cx * m);
    const t = Math.round(y + cy * m);
    const r = Math.round(x0 + (cx + cw) * m);
    const b = Math.round(y + (cy + ch) * m);
    fn.call(ctx, l, t, Math.max(1, r - l), Math.max(1, b - t));
  };

  const inFinderZone = (cx, cy) => finders.some(([fx, fy]) => cx >= fx - 1 && cx <= fx + 7 && cy >= fy - 1 && cy <= fy + 7);

  for (let cy = 0; cy < n; cy++) {
    for (let cx = 0; cx < n; cx++) {
      if (inFinderZone(cx, cy)) continue;
      const timing = cx === 6 || cy === 6;
      const on = timing ? (cx + cy) % 2 === 0 : rng() < 0.5;
      if (on) cells(ctx.fillRect, cx, cy, 1, 1);
    }
  }

  finders.forEach(([fx, fy]) => {
    cells(ctx.fillRect, fx, fy, 7, 7);
    cells(ctx.clearRect, fx + 1, fy + 1, 5, 5);
    cells(ctx.fillRect, fx + 2, fy + 2, 3, 3);
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
  draw(ctx, { x, y, w, h: h - labelH, rng });

  if (labelH) {
    const digit = () => Math.floor(rng() * 10);
    const group = () => [digit(), digit(), digit(), digit()].join('');
    ctx.textAlign = 'center';
    ctx.font = `${Math.max(8, Math.round(11 * scale))}px "Courier New", monospace`;
    ctx.fillText(`${group()} ${group()} ${group()}`, x + w / 2, y + h - Math.round(2 * scale));
  }
  ctx.restore();
}
