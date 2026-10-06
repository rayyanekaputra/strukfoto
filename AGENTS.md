# AGENTS.md

Guidance for AI coding agents working on **strukfoto**: a browser tool that turns a photo into a dithered, thermal-receipt-style image.

## Hard constraints

- **Everything runs client-side in the browser.** No server, no uploads, no analytics, no network calls that carry user images. Photos must never leave the device. Do not add a backend, API route, or any dependency that requires one.
- **Phones are first-class users.** Assume a mid-range phone with limited memory, a small viewport, touch input, and a slow CPU. Every change must stay responsive there.
- **No build step.** The app is plain HTML plus native ES modules, served as static files. Don't introduce a bundler, framework, or transpiler without asking first.
- Prefer zero runtime dependencies. The only external resource today is the Manrope font from Google Fonts. Don't add CDN scripts.

## Project layout

| File | Role |
| --- | --- |
| `index.html` | Markup, inline CSS, and the single `<script>` entry point |
| `core_logic.mjs` | Main logic: UI sync, `render()`, `processDitheredPhoto()`, barcode drawing, PNG download |
| `elements.mjs` | Central DOM lookups (`elements` object). Add new control IDs here |
| `default_filter.mjs` | `DEFAULTS`, `PALETTES`, `BAYER_4X4`, `BAYER_8X8` |
| `receipt_layout.js` | `RECEIPT_LAYOUTS`: text templates for the receipt header and footer |
| `pocs/` | Old proofs of concept (Python, Bun). **Ignore this directory entirely.** Not part of the web app. |
| `favicon_io/` | Icons and web manifest |

The pipeline: scale to the target width, then apply grayscale, brightness, and contrast, then Bayer or threshold dither, then map to paper and ink colors, then add printhead dropout rows, then serrate the edges with a sine mask. The result is composed on a canvas with the receipt layout text.

## Environment and file safety

- **The user's runtime and package manager is Bun.** Use `bun` / `bunx` for anything that needs a JS runtime (serving, one-off scripts, syntax checks). Don't reach for `node`, `npm`, or `npx`; they aren't installed.
- **Work strictly inside the project working directory.** Never write, create, or delete files outside it. That includes `/tmp`, `~`, Firefox/Chrome profile folders, and any scratchpad or system temp directory. Writing outside the project is dangerous and not allowed.
- Put temporary files (screenshots, scratch scripts, browser profiles) in a throwaway folder inside the project, such as `./.tmp/`, and delete it when done. Don't commit it.
- Read only from the working directory too. If something outside it seems needed, ask the user first.

## Running and testing

- No install needed. Serve the directory statically and open it in a browser, e.g. `bunx serve` (or `python3 -m http.server`). ES modules do not load over `file://`.
- There is no test suite or linter. Verify changes by loading the page, uploading an image, and exercising the controls. Test at phone width (DevTools device emulation) as well as desktop.
- Ignore everything in `pocs/` (including the Python files). Don't read, run, update, or keep them in sync with the web app.

## Conventions

- Match the existing style: vanilla JS, 2-space indent, single quotes, semicolons, `camelCase` identifiers.
- UI state is read from DOM controls inside `render()`. New settings need an input in `index.html`, an entry in `elements.mjs`, a default in `DEFAULTS` if relevant, and handling in `render()`.
- Palettes are `{ paper, ink, paperHex, inkHex }`. Add new ones to `PALETTES` and to the palette `<select>`.
- Keep `README` (`readme.md`) in sync when user-facing options change.
- Commit messages follow a conventional style (`chore:`, `feat:`, `fix:`, `refactor:`), lowercase.

## Performance and memory guidelines (important for mobile)

- The dither loop works on `ImageData` pixel arrays. Keep it allocation-free inside loops and use typed arrays. Don't call `getImageData`/`putImageData` repeatedly.
- **Downscale before processing.** Never run per-pixel work on the full-resolution camera photo; draw it into a canvas at the target size first (as `processDitheredPhoto` does). Phone photos can be 12MP or more.
- `render()` is triggered by slider input. Avoid doing heavy work on every `input` event without throttling (`requestAnimationFrame` or debouncing). Consider this before adding new controls.
- Reuse canvases where possible rather than creating new ones per render; large canvases are costly on iOS Safari, which also enforces canvas size limits.
- Release object URLs (`URL.revokeObjectURL`) after loading images. Prefer `canvas.toBlob` over `toDataURL` for large exports.
- If processing becomes too slow, the natural next step is moving the pixel loop to a Web Worker with `OffscreenCanvas` (with a fallback, since support varies on older mobile browsers). Discuss before doing it.
- Respect EXIF orientation when loading photos from phones.

## Privacy

- Do not log, store, or transmit image data. No `localStorage` of images, no third-party embeds that would see usage beyond the font request.
- Keep the app working offline once loaded where practical.

## Known issues to be aware of

- `core_logic.mjs` contains a leftover `// <-- ADD THIS LINE` comment (in `render()`); remove it when touching that line.
- The project was originally generated with Gemini, so expect some inconsistent naming and dead code. Clean up only what you're already touching, and keep diffs focused.

## Working with the user

- **Plan first, then wait for "GO".** For every feature or fix request, start by presenting an implementation plan (what changes, which files, any trade-offs) plus any questions you have. Do not edit code until the user reviews it and replies "GO".
- Ask before adding dependencies, a build step, or changing the client-only architecture.
- Keep changes small and focused; this is a simple tool and should stay simple.
