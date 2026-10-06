# Receipt types redesign

Goal: make each "tipe struk" look different (shape, colors, font, barcode style, dividers, header), not just differ in text content.

## What's wrong today

Each of the six types in `RECEIPT_LAYOUTS` only supplies text rows. Everything visual is hardcoded in `render()`:

- **Shape:** always a rectangle. The only variation is the optional sine tear on the top and bottom edges.
- **Font:** always `"Courier New"`.
- **Dividers:** always `=` and `-`.
- **Header:** always the same centered title and `[ sub ]`.
- **Barcode:** always the same random bars, drawn from `Math.random()`.
- **Palette:** a global control, unrelated to the type.

`Math.random()` also feeds the barcode and the `REC #`, so they change on every slider tick.

## Core idea: split content from look

Each type becomes `{ content, style }`. Content is today's `fields`, `getHeight` and `drawContent`. Style is a new data object:

```js
style: {
  shape: 'ticket',            // paper outline
  edge: 'notch-sides',        // how the edges are cut
  font: { title, body },      // font stacks
  divider: { major: '═', minor: '·' },
  header: 'banner',           // header renderer
  barcode: 'code128',         // barcode renderer
  palette: 'aged',            // default palette, still overridable
  perforation: { y: 0.62 }    // optional tear line
}
```

New looks are then data, not new `render()` branches.

## Phases

### 0. Prep (small, no visible change)

- Seed one `rngSeed` per session. Use a small mulberry32 for the barcode and `REC #`, and add a "reshuffle" button. This fixes the flicker.
- Cache the dithered photo, keyed on image, width, brightness, contrast, dither mode, scale and color mode. Typing in a text field currently re-dithers the photo.
- `render()` is already ~250 lines. Move the paper drawing into `drawReceipt(style, content, opts)`. Photo-only mode stays as it is.
- Remove the stray `// <-- ADD THIS LINE` comment while there.

### 1. Shapes and edges (new `shapes.mjs`)

- `buildShapePath(style, w, h)` returns a `Path2D`. Apply it as a `destination-in` mask on the paper canvas at the end. The sine tear becomes one edge style among several.
- Shapes:
  - Receipt strip with zigzag top and bottom (today's look).
  - Ticket with semicircle notches on the sides.
  - Boarding pass with a vertical or horizontal stub and a dashed perforation.
  - ATM slip with rounded corners.
  - Coupon with scalloped edges.
  - Wide ticket stub.
- Perforation lines are drawn dashed, and the mask can optionally split off the stub.
- `getHeight` gets a per-style padding.

### 2. Fonts

- Add `font: { title, body }` per type and use it in the `ctx.font` strings.
- `maxChars` currently assumes a 0.6em monospace width. Replace it with `measureText('M').width` so `row()` alignment works for any font.
- Await `document.fonts.load(...)` before drawing. Re-render when it resolves.
- Keep the family pool small, for example: dot-matrix, thermal sans, serif ticket, condensed stencil, pixel, handwritten stamp.

### 3. Barcode and decoration (new `barcodes.mjs`)

- Each style is a function `(ctx, {x, y, w, h, seed, ink})`:
  - **Code 128:** real bar patterns for readable-looking bars.
  - **Code 39:** wide and narrow bars.
  - **QR-like:** a seeded matrix with three finder squares.
  - **PDF417:** stacked rows, good for boarding passes.
  - **Ticket serial:** a vertical barcode along the edge.
  - **None.**
- Add a human-readable number line under the barcode.
- Per-type dividers and header renderers: a boxed banner, an inverted band (ink fill with paper text), a stamped logo circle, or double rules.

### 4. Per-type presets

| Type | Shape | Palette | Font | Barcode |
| --- | --- | --- | --- | --- |
| Album | zigzag strip | cream | dot-matrix | code128 |
| Grocery | zigzag strip | bw | thermal sans | code128 plus savings footer |
| Airline | stub with perforation | blue | condensed | PDF417 |
| Parking | notched ticket | aged | stencil | vertical serial |
| Concert | wide stub, side notches | bold ink | serif or pixel | QR-like |
| ATM | rounded slip | cream | thermal mono | none, with a `****` mask line |

A selected type sets the default palette and edge. The user can still override them. A "keep my palette" checkbox would avoid surprise resets.

### 5. UI, README, tests

- A style summary line under the type select, and possibly an advanced section with overrides for edge, barcode and font. Each override needs an `elements.mjs` entry and a `DEFAULTS` entry.
- Update `readme.md`.
- Test on a phone-width viewport. The shape mask adds one extra full-size canvas operation, so reuse a single paper canvas across renders. The paper canvas is currently recreated every render.

## Decisions

1. **Fonts:** add extra Google Fonts families to the existing request (approved).
2. **Order:** phase 0, then 1, then 3, then 2, then 4 and 5. Hobby project, so keep each phase small.
3. **Type defaults:** picking a type overwrites palette and edge style; the user can still override afterwards (approved).
