# Receipt layouts v2: fonts, shapes, palettes, 7 new types

Goal: make every "tipe struk" look like a real printed receipt or ticket, with its own font, paper shape and print details. Adds 7 new layouts and restyles the 6 existing ones.

Follows on from `receipt-types-redesign.md`. Layouts already carry `style.shape`, `style.header`, `style.barcode` and `style.divider`.

## Decisions (from review)

1. **Fonts:** load from Google Fonts, the same way as Manrope. Update `AGENTS.md`, since the font request is no longer Manrope only.
2. **Palette:** the user always picks it. Layouts do **not** set a palette. New palettes are only added to the dropdown.
3. **Colors:** receipts stay real thermal: one ink on paper. Logos, inverted bars and double-height text use the normal ink. The only exception is **rubber stamps**, which use a fixed stamp-ink color.
4. **Layouts:** add all 7 new ones.
5. **Thermal fade:** add it as an optional checkbox, off by default.

## Phase 1: font infrastructure

### `index.html`
Extend the existing Google Fonts `<link>` with one combined request, `display=swap`:

| Key | Family | Weights | Look |
|---|---|---|---|
| `courier` | `"Courier New", monospace` (system) | — | Current default, kept |
| `thermal` | Space Mono | 400, 700 | Modern POS thermal printer |
| `dotmatrix` | DotGothic16 | 400 | Impact / dot-matrix printer |
| `ticket` | Oswald | 500, 700 | Condensed cinema / event ticket |
| `typewriter` | Courier Prime | 400, 700 | Typed bill, stub |
| `bank` | IBM Plex Mono | 400, 600 | ATM / bank slip |
| `vt` | VT323 | 400 | Low-res thermal header |

Oswald is proportional, not monospace. Use it only for titles and big numbers, never for `row()` text that depends on monospace column alignment.

### New `fonts.mjs`
```js
export const FONTS = {
  courier:    { family: '"Courier New", monospace', bold: 'bold' },
  thermal:    { family: '"Space Mono", monospace', bold: '700' },
  dotmatrix:  { family: '"DotGothic16", monospace', bold: '400' },
  ticket:     { family: '"Oswald", sans-serif', bold: '700' },
  typewriter: { family: '"Courier Prime", monospace', bold: '700' },
  bank:       { family: '"IBM Plex Mono", monospace', bold: '600' },
  vt:         { family: '"VT323", monospace', bold: '400' }
};
export function fontString(key, size, bold = false) { ... }
export function ensureFonts(keys) { ... } // document.fonts.load per family, cached promise
```

### `style` gets two font keys
```js
style: { ..., font: { body: 'thermal', title: 'vt' } }
```
- `body` is used for all `row()` text, the date and REC # line, and the footer. It must be monospace.
- `title` is used by headers for titles and big numbers. If missing, it falls back to `body`.

### `core_logic.mjs`
- Replace the 3 hardcoded `"Courier New"` strings with `fontString(style.font.body, size)`.
- Measure `charWidth` and `maxChars` with the body font, since column widths change per font.
- Pass `fonts: { title, body }` into the header context `h`.
- Canvas text silently falls back if a font isn't loaded yet. When the layout changes, call `ensureFonts([...])` and then `render()` again once it resolves. Render immediately as well, so the UI never blocks. Offline, the request fails and the system monospace font is used.

### `headers.mjs`
Replace the module-level `FAMILY` and `font()` with `h.fonts`. `fitFont()` keeps working unchanged.

### Restyle the existing 6 layouts (fonts only)
| Layout | body | title |
|---|---|---|
| album | thermal | vt |
| grocery | thermal | thermal |
| airline | bank | ticket |
| parking | typewriter | typewriter |
| concert | thermal | ticket |
| atm | bank | bank |

## Phase 2: shapes, palettes, print details

### New shapes (`shapes.mjs`, plus matching `INSETS`)
Each shape only cuts paths with `destination-out`, so there are no per-pixel loops (except `torn`, which loops once per column like `strip`).

- **`pinfeed`:** a column of round tractor holes down both sides (r ≈ 4·scale, pitch ≈ 18·scale) and straight edges. Margins grow so text clears the holes, so `shapeInset` also needs a side inset. Add `shapeSideInset(shape, scale)` and use it in `margin`.
- **`torn`:** an irregular jagged top and bottom edge. Depth comes from the existing seeded `makeRng`, so the edge doesn't change while sliders move.
- **`tag`:** both top corners clipped at 45°, plus a punched hole centered near the top. The inset clears the hole.
- **`admit`:** a carnival roll ticket: inward quarter-circle notches at all 4 corners.
- **`diecut`:** chamfered corners plus side notches at `perfY`, like `stub`.

### New palettes (`default_filter.mjs` plus the `<select>`)
All of them are single-ink.

| Key | Paper | Ink | Label |
|---|---|---|---|
| `pink` | #F6DCDD | #2A2226 | pink carbon copy |
| `canary` | #F7EBA0 | #2B2A22 | canary yellow duplicate |
| `greenbar` | #E9F1E4 | #1E2A22 | green-bar dot matrix |
| `kraft` | #CDB08A | #2B2016 | kraft paper |
| `faded` | #F4F2EE | #6B6A66 | faded thermal |
| `red` | #B8292F | #F4E9D8 | ticket red (cream ink) |

### Print details (new helpers in a new `print_fx.mjs`, passed into `drawContent`)
- **`bigText(text, x, y, opts)`:** ESC/POS double-height or double-width text, using `ctx.save(); ctx.scale(1, 2)`. Returns the next y.
- **`invertBar(text, y)`:** a solid ink bar with text knocked out in the paper color. Falls back to plain text when `transparencyMode === 'ink'`, using the existing `solid` flag.
- **`stamp(text, cx, cy, angle, color)`:** a rotated double-border box with text in the stamp color at 0.85 alpha. Draw it after the paper shape is cut, so it sits on top. Cheap roughness: knock out a few seeded rng specks with `destination-out`, clipped to the stamp box. Stamp colors are fixed:
  - `STAMP_RED = '#B3262E'` (PAID, VOID, ADMIT ONE)
  - `STAMP_BLUE = '#2B3F8C'` (library date-due, RECEIVED)
- **`greenBands(y0, y1)`:** alternating row shading for the dot-matrix invoice, drawn as `ink` at 0.06 alpha. It stays single-ink.

### Thermal fade (optional)
- Add a checkbox `fadeInput` ("efek pudar thermal"), defaulting to `false` in `DEFAULTS`.
- After painting, draw one vertical `createLinearGradient` from transparent to paper color at about 0.35 alpha over the text area, with `source-atop`. It's one fill, so it's cheap on phones.
- Skip it when transparent paper mode is on.

## Phase 3: the 7 new layouts (`receipt_layout.js`)

Each one adds an `<option>` to `layoutSelect`, a `HEADERS` entry if it needs a new header, `fields` (footerMsg, sectionTitle, placeholders) and `drawContent`. All values are mock data, like the existing layouts.

| Key | Shape | Font body / title | Barcode | Header and signature details |
|---|---|---|---|---|
| `cafe` (coffee order) | rounded | thermal / thermal | qr | Order # with `bigText` in an `invertBar`. Items with indented modifiers (`  + OAT MILK`, `  + EXTRA SHOT`). "BARISTA: …" line. |
| `invoice` (dot matrix) | pinfeed | dotmatrix / dotmatrix | none | INVOICE NO and DATE grid. Bordered item table on `greenBands`. Red `PAID` stamp at -12°. |
| `cinema` | diecut | thermal / ticket | code128 | Large movie title, STUDIO / ROW / SEAT grid, perforation, stub repeating seat and time. |
| `restaurant` (bill) | torn | typewriter / typewriter | none | TABLE, SERVER and GUESTS line. Items with qty. Subtotal, service and tax. `TIP: ______`, `TOTAL: ______`, signature line. |
| `laundry` (claim check) | tag | thermal / ticket | code39 | Huge claim number (`bigText`, 2x). Item count. Pickup date. "NO CLAIM WITHOUT TICKET". |
| `carnival` (admit one) | admit | ticket / ticket | none | Centered "ADMIT ONE" large. Serial `Nº 004213`. Short. Item fields become ride or event name. |
| `library` (checkout slip) | rounded | typewriter / typewriter | code39 | Borrower and due list. "DATE DUE" table, with 2–3 rows stamped in `STAMP_BLUE` at small random angles. |

Item inputs map to each layout's natural content (drinks, line items, movie title, dishes, garments, rides, book titles) through `fields.placeholders`.

## Files touched

- `index.html`: Google Fonts link, palette options, layout options, fade checkbox
- `fonts.mjs` (new), `print_fx.mjs` (new)
- `core_logic.mjs`: font resolution, `ensureFonts`, side inset, print helpers, stamp pass, fade pass
- `headers.mjs`: per-layout fonts, plus new headers (`cafe`, `invoice`, `cinema`, `restaurant`, `laundry`, `carnival`, `library`)
- `shapes.mjs`: 5 shapes, insets, side insets
- `default_filter.mjs`: 6 palettes, `fade` default
- `elements.mjs`: `fadeInput`
- `receipt_layout.js`: font keys on existing layouts, 7 new layouts
- `readme.md`: new types, palettes, fade option
- `AGENTS.md`: the external-resources line now lists the Google Fonts families

## Mobile and performance checks

- Nothing touches the dither loop. All new work is canvas path or text drawing on the composed receipt.
- Fonts load once and are cached by the browser. Layout switches don't refetch them.
- Stamps' roughness uses a bounded number of specks (about 40), not per-pixel noise.
- `torn` uses the existing seeded rng, so the edge is stable and costs no extra per render.
- Test on desktop and at phone width with DevTools emulation, in each layout × {cream, red, transparent paper, transparent ink} × fade on/off. Also test offline, where the font should fall back cleanly.

## Delivery order (one commit each, reviewed between)

1. `feat: per-layout receipt fonts` (Phase 1)
2. `feat: new paper shapes and palettes` (Phase 2: shapes and palettes)
3. `feat: print effects (stamps, inverted bars, double height, thermal fade)`
4. `feat: cafe, invoice, cinema receipt layouts`
5. `feat: restaurant, laundry, carnival, library receipt layouts`
6. `docs: readme and agents update`
