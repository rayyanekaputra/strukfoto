// Receipt header styles. Each draws the title and subtitle from baseline `y` and returns the next y.

import { fontString } from './fonts.mjs';

function bodyFont(h, size, bold = false) {
  return fontString(h.fonts.body, size, bold);
}

function titleFont(h, size) {
  return fontString(h.fonts.title, size, true);
}

// Largest title font size (up to `size`) at which `text` fits in `maxW`
function fitFont(ctx, h, text, size, maxW) {
  let s = size;
  ctx.font = titleFont(h, s);
  while (s > 8 && ctx.measureText(text).width > maxW) {
    s -= 1;
    ctx.font = titleFont(h, s);
  }
  return s;
}

// `text` with `ch` filling the rest of the line on both sides
function flank(text, ch, maxChars) {
  const t = text.length > maxChars - 6 ? text.slice(0, Math.max(1, maxChars - 6)) : text;
  const side = Math.max(2, Math.floor((maxChars - t.length - 2) / 2));
  return `${ch.repeat(side)} ${t} ${ch.repeat(side)}`;
}

function spaced(text) {
  return text.split('').join(' ');
}

export const HEADERS = {
  // Big title between a "now playing" tag and an artist rule
  album(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText('* NOW PLAYING *', h.cx, y);
    y += h.lineHeight * 1.1;

    const title = h.title.toUpperCase();
    ctx.font = titleFont(h, fitFont(ctx, h, title, Math.round(h.sizeTitle * 1.25), h.innerW));
    ctx.fillText(title, h.cx, y);
    y += h.lineHeight * 1.1;

    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(flank(h.sub.toUpperCase(), '-', h.maxChars), h.cx, y);
    y += h.lineHeight;
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Store sign with a tagline under it
  grocery(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    const title = `*${h.title.toUpperCase()}*`;
    ctx.font = titleFont(h, fitFont(ctx, h, title, Math.round(h.sizeTitle * 1.3), h.innerW));
    ctx.fillText(title, h.cx, y);
    y += h.lineHeight;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('WELCOME - PLEASE COME AGAIN', h.cx, y);
    y += h.lineHeight * 0.8;

    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Solid band: title left, document type right, route strip below
  airline(ctx, h) {
    const bandH = Math.round(h.lineHeight * 1.7);
    const top = Math.round(h.y - h.sizeTitle - h.lineHeight * 0.2);
    const pad = Math.round(8 * h.scale);
    const label = 'BOARDING PASS';
    const title = h.title.toUpperCase();

    if (h.solid) {
      ctx.fillRect(h.margin, top, h.innerW, bandH);
      ctx.fillStyle = h.paper;
    }
    ctx.font = bodyFont(h, h.sizeSub);
    const labelW = ctx.measureText(label).width;
    ctx.textAlign = 'left';
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW - labelW - pad * 3));
    ctx.fillText(title, h.margin + pad, top + bandH / 2 + h.sizeTitle * 0.35);
    ctx.textAlign = 'right';
    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(label, h.margin + h.innerW - pad, top + bandH / 2 + h.sizeSub * 0.35);
    ctx.fillStyle = h.ink;

    let y = top + bandH + h.lineHeight;
    ctx.textAlign = 'center';
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(flank(h.sub.toUpperCase(), '>', h.maxChars), h.cx, y);
    y += h.lineHeight;
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Boxed title with an inverted subtitle tab
  parking(ctx, h) {
    const pad = Math.round(6 * h.scale);
    const boxH = Math.round(h.sizeTitle * 1.9);
    const top = Math.round(h.y - h.sizeTitle - pad);
    ctx.lineWidth = Math.max(1, Math.round(2 * h.scale));
    ctx.strokeStyle = h.ink;
    ctx.strokeRect(h.margin, top, h.innerW, boxH);

    const title = h.title.toUpperCase();
    ctx.textAlign = 'center';
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW - pad * 4));
    ctx.fillText(title, h.cx, top + boxH / 2 + h.sizeTitle * 0.35);

    const sub = h.sub.toUpperCase();
    ctx.font = bodyFont(h, h.sizeSub, true);
    const tabW = Math.min(h.innerW, Math.round(ctx.measureText(sub).width + pad * 4));
    const tabH = Math.round(h.sizeSub * 1.7);
    const tabTop = top + boxH;
    if (h.solid) {
      ctx.fillRect(Math.round(h.cx - tabW / 2), tabTop, tabW, tabH);
      ctx.fillStyle = h.paper;
    }
    ctx.fillText(sub, h.cx, tabTop + tabH / 2 + h.sizeSub * 0.35);
    ctx.fillStyle = h.ink;

    let y = tabTop + tabH + h.lineHeight;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Letter-spaced title with ornaments around the subtitle
  concert(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    const title = spaced(h.title.toUpperCase());
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW));
    ctx.fillText(title, h.cx, y);
    y += h.lineHeight * 1.1;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(flank(h.sub.toUpperCase(), '~*~', h.maxChars), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Bank wordmark with a heavy underline
  atm(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    const title = h.title.toUpperCase();
    ctx.font = titleFont(h, fitFont(ctx, h, title, Math.round(h.sizeTitle * 1.15), h.innerW));
    ctx.fillText(title, h.cx, y);
    const underW = Math.min(h.innerW, Math.round(ctx.measureText(title).width));
    y += Math.round(h.lineHeight * 0.3);
    ctx.fillRect(Math.round(h.cx - underW / 2), y, underW, Math.max(2, Math.round(3 * h.scale)));
    y += h.lineHeight * 0.9;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('CUSTOMER COPY', h.cx, y);
    y += h.lineHeight * 0.8;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Coffee shop: big shop name, subtitle, opening hours
  cafe(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    const title = h.title.toUpperCase();
    ctx.font = titleFont(h, fitFont(ctx, h, title, Math.round(h.sizeTitle * 1.35), h.innerW));
    ctx.fillText(title, h.cx, y);
    y += h.lineHeight * 1.1;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(flank(h.sub.toUpperCase(), '~', h.maxChars), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('OPEN DAILY 07:00 - 22:00', h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Dot-matrix letterhead: company left, boxed document type right
  invoice(ctx, h) {
    const pad = Math.round(5 * h.scale);
    const label = 'INVOICE';
    ctx.font = titleFont(h, h.sizeTitle);
    const labelW = Math.round(ctx.measureText(label).width + pad * 3);
    const boxH = Math.round(h.sizeTitle * 1.6);
    const top = Math.round(h.y - h.sizeTitle - pad);

    ctx.lineWidth = Math.max(1, Math.round(1.5 * h.scale));
    ctx.strokeStyle = h.ink;
    ctx.strokeRect(h.margin + h.innerW - labelW, top, labelW, boxH);
    ctx.textAlign = 'center';
    ctx.fillText(label, h.margin + h.innerW - labelW / 2, top + boxH / 2 + h.sizeTitle * 0.35);

    const title = h.title.toUpperCase();
    ctx.textAlign = 'left';
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW - labelW - pad * 2));
    ctx.fillText(title, h.margin, top + boxH / 2 + h.sizeTitle * 0.35);

    let y = top + boxH + h.lineHeight;
    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.margin, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('JL. KERTAS THERMAL NO. 58', h.margin, y);
    y += h.lineHeight;
    ctx.textAlign = 'center';
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Cinema chain name in a ruled band
  cinema(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    const title = spaced(h.title.toUpperCase());
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW));
    ctx.fillText(title, h.cx, y);
    const ruleH = Math.max(1, Math.round(2 * h.scale));
    ctx.fillRect(h.margin, Math.round(y - h.sizeTitle - 4 * h.scale), h.innerW, ruleH);
    ctx.fillRect(h.margin, Math.round(y + 6 * h.scale), h.innerW, ruleH);
    y += h.lineHeight * 1.2;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Restaurant: name with a rule under it, address line
  restaurant(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    const title = h.title.toUpperCase();
    ctx.font = titleFont(h, fitFont(ctx, h, title, Math.round(h.sizeTitle * 1.2), h.innerW));
    ctx.fillText(title, h.cx, y);
    y += h.lineHeight * 1.1;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('TEL. (021) 555-0142', h.cx, y);
    y += h.lineHeight * 0.8;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Laundry: shop name in an inverted band (the tag hole sits above it)
  laundry(ctx, h) {
    const pad = Math.round(6 * h.scale);
    const bandH = Math.round(h.sizeTitle * 1.8);
    const top = Math.round(h.y - h.sizeTitle - pad);
    const title = h.title.toUpperCase();

    if (h.solid) {
      ctx.fillRect(h.margin, top, h.innerW, bandH);
      ctx.fillStyle = h.paper;
    }
    ctx.textAlign = 'center';
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW - pad * 4));
    ctx.fillText(title, h.cx, top + bandH / 2 + h.sizeTitle * 0.35);
    ctx.fillStyle = h.ink;

    let y = top + bandH + h.lineHeight;
    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('CLAIM CHECK - CUSTOMER COPY', h.cx, y);
    y += h.lineHeight * 0.8;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Carnival: stars over a big condensed title
  carnival(ctx, h) {
    let y = h.y;
    ctx.textAlign = 'center';
    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText('*  *  *  *  *', h.cx, y);
    y += Math.round(h.sizeTitle * 1.25 + h.lineHeight * 0.4);

    const title = h.title.toUpperCase();
    ctx.font = titleFont(h, fitFont(ctx, h, title, Math.round(h.sizeTitle * 1.4), h.innerW));
    ctx.fillText(title, h.cx, y);
    y += h.lineHeight;

    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(flank(h.sub.toUpperCase(), '*', h.maxChars), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  },

  // Library: name in a double-ruled box
  library(ctx, h) {
    const pad = Math.round(6 * h.scale);
    const boxH = Math.round(h.sizeTitle * 1.9);
    const top = Math.round(h.y - h.sizeTitle - pad);
    const gap = Math.max(2, Math.round(3 * h.scale));
    ctx.lineWidth = Math.max(1, Math.round(1 * h.scale));
    ctx.strokeStyle = h.ink;
    ctx.strokeRect(h.margin, top, h.innerW, boxH);
    ctx.strokeRect(h.margin + gap, top + gap, h.innerW - gap * 2, boxH - gap * 2);

    const title = h.title.toUpperCase();
    ctx.textAlign = 'center';
    ctx.font = titleFont(h, fitFont(ctx, h, title, h.sizeTitle, h.innerW - pad * 4));
    ctx.fillText(title, h.cx, top + boxH / 2 + h.sizeTitle * 0.35);

    let y = top + boxH + h.lineHeight;
    ctx.font = bodyFont(h, h.sizeSub);
    ctx.fillText(h.sub.toUpperCase(), h.cx, y);
    y += h.lineHeight * 0.9;
    ctx.fillText('CIRCULATION DESK', h.cx, y);
    y += h.lineHeight * 0.8;
    ctx.font = bodyFont(h, h.sizeBody);
    ctx.fillText(h.dividerLine, h.cx, y);
    return y + h.lineHeight;
  }
};
