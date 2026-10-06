// Printer effects that layouts can use from drawContent: big ESC/POS text, inverted bars,
// green-bar row shading and rubber stamps. Everything except stamps uses the thermal ink.

import { fontString } from './fonts.mjs';

// Real stamp-pad inks; the only colors on a receipt that aren't the thermal ink
export const STAMP_INKS = { red: '#B3262E', blue: '#2B3F8C' };

// `o` holds: ctx, margin, innerW, lineHeight, scale, fonts, ink, paper, solid, rng, stamps (queue)
export function makePrintFx(o) {
  const { ctx } = o;

  // Double-height and/or double-width text. `y` is the baseline a normal line would use;
  // returns the baseline for the line after it.
  function bigText(text, y, { size, tall = true, wide = false, align = 'center', font = 'title' } = {}) {
    const sx = wide ? 2 : 1;
    const sy = tall ? 2 : 1;
    const s = size || Math.round(o.lineHeight * 0.8);
    const baseline = Math.round(y - o.lineHeight * 0.7 + s * sy * 0.8);
    const x = align === 'left' ? o.margin : align === 'right' ? o.margin + o.innerW : o.margin + o.innerW / 2;

    ctx.save();
    ctx.font = fontString(o.fonts[font], s, true);
    ctx.textAlign = align;
    const maxW = o.innerW / sx;
    const w = ctx.measureText(text).width;
    ctx.translate(x, baseline);
    ctx.scale(Math.min(sx, sx * maxW / Math.max(w, 1)), sy);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    return baseline + o.lineHeight;
  }

  // Paper-colored text knocked out of a solid ink bar. Plain text when ink is transparent.
  function invertBar(text, y, { size, font = 'title', tall = false } = {}) {
    const s = size || Math.round(o.lineHeight * 0.85);
    const sy = tall ? 2 : 1;
    const barH = Math.round(s * sy * 1.5);
    const top = Math.round(y - o.lineHeight * 0.8);

    ctx.save();
    if (o.solid) {
      ctx.fillRect(o.margin, top, o.innerW, barH);
      ctx.fillStyle = o.paper;
    }
    ctx.font = fontString(o.fonts[font], s, true);
    ctx.textAlign = 'center';
    ctx.translate(o.margin + o.innerW / 2, top + barH / 2 + s * sy * 0.36);
    ctx.scale(1, sy);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    return top + barH + o.lineHeight;
  }

  // Faint ink bands behind alternating rows, like green-bar computer paper
  function greenBands(firstBaseline, rows) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < rows; i += 2) {
      const top = Math.round(firstBaseline + i * o.lineHeight - o.lineHeight * 0.78);
      ctx.fillRect(o.margin - Math.round(4 * o.scale), top, o.innerW + Math.round(8 * o.scale), o.lineHeight);
    }
    ctx.restore();
  }

  // Queues a rubber stamp; stamps are drawn after the paper is cut, on top of everything
  function stamp(text, cx, cy, { angle = -12, color = 'red', size } = {}) {
    o.stamps.push({ text, cx, cy, angle, color, size, seed: o.rng() });
  }

  return { bigText, invertBar, greenBands, stamp };
}

export function drawStamps(ctx, stamps, { scale, fonts, paper }) {
  stamps.forEach((st) => {
    const size = st.size || Math.round(22 * scale);
    const color = STAMP_INKS[st.color] || st.color;

    ctx.save();
    // Keep the stamp on the paper, off the cut-away edges
    if (paper) ctx.globalCompositeOperation = 'source-atop';
    ctx.translate(st.cx, st.cy);
    ctx.rotate((st.angle * Math.PI) / 180);
    ctx.font = fontString(fonts.title, size, true);
    ctx.textAlign = 'center';
    const w = ctx.measureText(st.text).width + size * 1.2;
    const h = size * 1.7;

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.5, 3 * scale);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    const gap = Math.max(2, 4 * scale);
    ctx.strokeRect(-w / 2 + gap, -h / 2 + gap, w - gap * 2, h - gap * 2);
    ctx.fillText(st.text, 0, size * 0.36);

    // Worn ink: a few paper-colored specks (skipped on transparent paper)
    if (paper) {
      let a = Math.floor(st.seed * 0xffffffff) >>> 0;
      const rnd = () => {
        a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
        return a / 4294967296;
      };
      ctx.globalAlpha = 1;
      ctx.fillStyle = paper;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc((rnd() - 0.5) * w, (rnd() - 0.5) * h, (0.4 + rnd()) * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });
}

// Thermal paper fading: ink gets lighter toward the bottom. One gradient fill.
export function drawThermalFade(ctx, w, h, paper) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, paper + '00');
  g.addColorStop(0.35, paper + '1A');
  g.addColorStop(1, paper + '99');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
