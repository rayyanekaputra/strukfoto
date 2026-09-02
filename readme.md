# thermal receipt filter

a lightweight thermal print filter implemented in both python and javascript (bun). converts regular photos into dithered thermal printer receipts with custom color palettes, dead printhead glitches, and serrated paper tear edges.

vibecoded with gemini 3.6

---

## how it works

1. **grayscale & contrast adjustment**: scales the image to receipt pixel width and boosts contrast so midtones push into crisp dot patterns.
2. **bayer dithering**: compares pixel luminance against a threshold matrix (`4x4` or `8x8`) to simulate 1-bit thermal print dots.
3. **color remapping**: maps binary pixels to paper and ink tones instead of harsh digital black and white.
4. **printhead dropouts**: randomly erases horizontal pixel rows to simulate dead thermal printer pins.
5. **serrated paper tear**: clips top and bottom canvas boundaries with a sine wave mask.

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
