# Plan: background watermark should not be padded

## Problem

With `layout struk: background watermark`, the faded photo is inset from the paper edges.

**Cause** (`core_logic.mjs`, `render()`):
- The photo is dithered at `usablePhotoWidth` (`printWidth - margin * 2`), the same size as the inline photo.
- It is drawn at `x = margin`, leaving a `margin` gap on the left and right.
- Its y position is `Math.max(margin, ...)`, which forces a top gap even when the photo is taller than the paper.

## Fix

1. When `isWatermark`, dither the photo at the full `printWidth`, with the height scaled to match (`watermarkHeight`). The inline positions keep using `usablePhotoWidth` and `photoHeight`.
2. Draw the watermark at `x = 0`, centered vertically: `y = round((paperHeight - watermarkHeight) / 2)`. Drop the `margin` clamp, so a tall photo bleeds off the top and bottom and gets cropped by the canvas.
3. Leave everything else unchanged: the 0.25 alpha, drawing it before the text, and skipping it in the measuring pass.
4. The serrated or zigzag edge mask still cuts the paper shape afterwards, so the watermark follows the paper edge.

## Follow-up: fit option

Add a `watermarkFitInput` select that only shows when the background watermark is chosen:
- **fit lebar foto** (`width`, the default): the photo is as wide as the paper, centered vertically, and the top and bottom are cropped.
- **fit tinggi foto** (`height`): the photo is as tall as the paper, centered horizontally, and the sides are cropped.

The paper height is only known after the measuring pass, so the watermark is dithered after measuring. The usual photo cache keeps repeat renders cheap. This needs a new input in `index.html`, an entry in `elements.mjs`, `DEFAULTS.watermarkFit`, the reset handler, and `toggleUIVisibility()`.

## Verify

- Serve with `bunx serve`, upload a portrait photo and a landscape photo, and pick the background watermark.
- Check that the photo touches the left and right paper edges, and the top and bottom too when the photo is taller than the paper.
- Check that the other image positions still have their padding.
- Repeat at widths 300, 450 and 800, and at phone width.
