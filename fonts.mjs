// Receipt fonts. Web fonts come from the Google Fonts <link> in index.html.
// `body` fonts must be monospace, since rows are padded to a fixed character count.

export const FONTS = {
  courier: { family: '"Courier New", monospace', bold: 'bold' },
  thermal: { family: '"Space Mono", "Courier New", monospace', bold: '700' },
  dotmatrix: { family: '"DotGothic16", "Courier New", monospace', bold: '400' },
  ticket: { family: '"Oswald", "Arial Narrow", sans-serif', bold: '700' },
  typewriter: { family: '"Courier Prime", "Courier New", monospace', bold: '700' },
  bank: { family: '"IBM Plex Mono", "Courier New", monospace', bold: '600' },
  vt: { family: '"VT323", "Courier New", monospace', bold: '400' }
};

export function fontString(key, size, bold = false) {
  const f = FONTS[key] || FONTS.courier;
  return `${bold ? f.bold + ' ' : ''}${size}px ${f.family}`;
}

// Font keys that are loaded, or whose load already failed (canvas then uses the fallback)
const settled = new Set(['courier']);
const pending = new Set();

// Starts loading any fonts not yet settled and calls onReady once they are.
// Returns true when everything is already usable, so callers can draw right away.
export function ensureFonts(keys, onReady) {
  const missing = keys.filter((k) => k && !settled.has(k) && !pending.has(k));
  if (missing.length) {
    missing.forEach((k) => pending.add(k));
    const loads = missing.map((k) => Promise.all([
      document.fonts.load(fontString(k, 16)),
      document.fonts.load(fontString(k, 16, true))
    ]).catch(() => {}).finally(() => {
      pending.delete(k);
      settled.add(k);
    }));
    Promise.all(loads).then(onReady);
  }
  return keys.every((k) => !k || settled.has(k));
}
