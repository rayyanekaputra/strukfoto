# Plan: barcode stretch, receipt padding, header redesign

## 1. Barcode stretches when resolution changes

**Cause:** `barcodes.mjs` mixes two scaling rules.
- Bar width is `unit = max(1, round(1.6 * scale))`, which snaps to whole pixels.
- Height is `baseHeight * scale`, which scales smoothly.
- Between snap points the width stays fixed while the height keeps growing, so the aspect ratio changes.
- The bar count is `floor((w/unit - 44)/11)`, so the total width also jumps when `unit` changes.

**Fix:**
- Define each barcode in modules, not pixels (e.g. code128 uses a fixed symbol count chosen for the 450 design width).
- Compute one fractional `unit = w / totalModules`, so the code always fills the same fraction of the width.
- Derive the height from the same `unit` (fixed height-to-module ratio), so the aspect ratio never changes.
- Snap each bar edge with `Math.round(cumulativeX)` so edges stay crisp with no gaps or blur.
- Do the same for pdf417. QR keeps square cells, `m = available width / 21`, capped by height.
- `barcodeBlockHeight` uses the same ratios, so layout and drawing agree.

## 2. Padding and layout

**Causes:**
- Each layout's `getHeight()` is a hand-tuned guess that doesn't match `drawContent()` (grocery reserves `9 + items` lines but draws a different count).
- `maxChars` assumes char width = `0.6 * fontSize`; real Courier fallbacks differ, so right-aligned columns drift.
- `Math.max(12, ...)` / `Math.max(9, ...)` font minimums break proportional scaling at small widths.
- The strip zigzag is hard-coded (12px/6px) and no shape reserves an inset, so edges eat into content.
- Padding constants are scattered (`25*scale`, `22*scale`, `15*scale`, `30*scale`).

**Fix:**
- **Measure, then draw:** run the layout once on a throwaway 1px canvas to get the true content height, allocate the paper from it, then draw for real. Remove every `getHeight()`.
- Take `charWidth` from `measureText('M')` with the real font and compute `maxChars` from it.
- Named spacing tokens (`padX`, `padTop`, `padBottom`, `gap`), all multiplied by `scale`.
- Each shape exports a safe inset; top and bottom padding add it. Zigzag size scales with `scale`.
- Receipt feel: blank leader and tail like thermal paper, consistent dashed rules between sections, tighter line rhythm, heavier rule above totals.
- Printhead dropout rows (the "dropouts" slider: random 1px blank lines across the paper) keep current behavior. They are cached by paper height, so they re-roll only when the height changes.

## 3. Header and subtitle

Move the header into a per-layout `drawHeader()`. The title auto-shrinks to fit the width.

| Layout | Header idea |
| --- | --- |
| album | Big centered title, subtitle as "ARTIST" between two rule lines, small "NOW PLAYING" tag |
| grocery | Store-sign style: `*** TITLE ***`, subtitle as address/tagline, "WELCOME" line |
| airline | Ink band, title left, small "BOARDING PASS" right, subtitle as route strip |
| parking | Boxed title, subtitle as inverted tab, "TICKET No." beside it |
| concert | Letter-spaced title, subtitle flanked by `~ ~ ~` ornaments |
| atm | Bank-name wordmark, subtitle as "CUSTOMER COPY" line |

The date stays a fixed fake date (`DATE: 2026-09-06`). The receipt number stays seeded-random.

## Order
1. `barcodes.mjs`: module-based sizing.
2. `shapes.mjs`: scaled shapes plus exported insets.
3. `receipt_layout.js` and `core_logic.mjs`: measure-then-draw, spacing tokens, `drawHeader` per layout; remove the `// <-- ADD THIS LINE` leftover if present.
4. Verify at widths 300, 450, 800 and at 1:1 and 9:16 export aspects, plus phone width.
5. Update `readme.md` only if user-facing options change.
