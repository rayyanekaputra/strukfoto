# thermal receipt filter

a lightweight thermal print filter implemented in both python and javascript (bun). converts regular photos into dithered thermal printer receipts with custom color palettes, dead printhead glitches, and serrated paper tear edges.

vibecoded with gemini 3.6

---

## how it works

1. **grayscale & contrast adjustment**: scales the image to receipt pixel width and boosts contrast so midtones push into crisp dot patterns.
2. **bayer dithering**: compares pixel luminance against a threshold matrix (`4x4` or `8x8`) to simulate 1-bit thermal print dots.
3. **color remapping**: maps binary pixels to paper and ink tones instead of harsh digital black and white.
4. **printhead dropouts**: randomly erases horizontal pixel rows to simulate dead thermal printer pins.
5. **paper shape**: cuts the paper outline per receipt type (zigzag, ticket notches, tractor holes, torn edge, tag, and more).

---

## web app

runs fully in the browser. serve the folder statically (e.g. `bunx serve`) and open it. photos never leave your device.

### receipt types

each type has its own paper shape, fonts, barcode and print details:

* album / tracklist, supermarket / grocery, airline boarding pass, parking ticket, concert / event stub, atm / bank slip
* coffee shop order: inverted order number bar, drink modifiers, double-height total, qr code
* dot matrix invoice: tractor feed holes, green-bar rows, red `PAID` stamp
* cinema ticket: die-cut corners, big movie title, tear-off `ADMIT ONE` stub
* restaurant bill: torn edges, tip and signature lines
* laundry claim tag: punched tag, huge claim number, blue `RECEIVED` stamp
* carnival admit one: notched roll ticket with serial number
* library checkout slip: due list and a stamped `DATE DUE` card

receipt fonts (space mono, dotgothic16, oswald, courier prime, ibm plex mono, vt323) load from google fonts. offline, it falls back to courier new.

### paper colors

classic cream, aged yellow, blue thermal, stark b&w, pink carbon copy, canary yellow, green-bar dot matrix, kraft paper, faded thermal, ticket red. receipts print in a single ink; only rubber stamps use red or blue stamp ink.

### extra options

* **pinggir kertas bergerigi?**: turns the paper shape on or off
* **efek pudar thermal?**: fades the ink toward the bottom, like an old thermal receipt

---

## python poc

### dependencies

* python 3.x
* `pillow`
* `numpy`

```bash
pip install pillow numpy

```

### execution

```bash
python poc_python.py

```

uses `numpy` matrix tiling for fast matrix comparisons and `pillow` for image contrast manipulation.

---

## javascript / bun poc

the javascript version is built for high-performance array operations using `bun` and `sharp`.

### dependencies

* `bun` runtime
* `sharp`

```bash
bun add sharp

```

### execution

run with default settings:

```bash
bun poc_js.js

```

### cli options

customize the filter output on the fly using command line flags:

* `-i, --input`: path to input image (default: `input_js.jpg`)
* `-o, --output`: path to output image (default: `output_js.jpg`)
* `-w, --width`: receipt paper width in pixels (default: `450`)
* `-c, --contrast`: contrast adjustment factor (default: `1.7`)
* `-b, --bright`: brightness multiplier (default: `1.0`)
* `-d, --dither`: dithering mode (`bayer8`, `bayer4`, `threshold`)
* `-p, --palette`: thermal paper palette (`cream`, `aged`, `blue`, `bw`)
* `--dropouts`: dead pin dropout line density (default: `0.015`)
* `--notear`: disable serrated paper tear edges

### examples

```bash
# vintage yellowed receipt with 4x4 bayer dithering
bun poc_js.js -i photo.jpg -o aged.jpg -p aged -d bayer4

# high contrast blueprint effect without serrated edges
bun poc_js.js -i photo.jpg -o blueprint.jpg -p blue -c 2.0 --notear

```
