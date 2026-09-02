import sharp from 'sharp';
import { parseArgs } from 'util';

// 1. Thermal Color Presets
const PALETTES = {
  cream: { paper: [242, 239, 233], ink: [32, 32, 30] },
  aged:  { paper: [235, 222, 190], ink: [50, 42, 35] },
  blue:  { paper: [240, 244, 248], ink: [25, 40, 90] },
  bw:    { paper: [255, 255, 255], ink: [0, 0, 0] },
};

// 2. Dither Matrices
const BAYER_4X4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

const BAYER_8X8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];

// 3. CLI Options Parsing
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    input:    { type: 'string', short: 'i', default: 'input_js.jpg' },
    output:   { type: 'string', short: 'o', default: 'output_js.jpg' },
    width:    { type: 'string', short: 'w', default: '450' },
    contrast: { type: 'string', short: 'c', default: '1.7' },
    bright:   { type: 'string', short: 'b', default: '1.0' },
    dither:   { type: 'string', short: 'd', default: 'bayer8' }, // bayer8 | bayer4 | threshold
    palette:  { type: 'string', short: 'p', default: 'blue' },  // cream | aged | blue | bw
    dropouts: { type: 'string', default: '0.015' },
    noTear:   { type: 'boolean', default: false }
  },
  strict: false,
});

async function run() {
  const inputPath = values.input;
  const outputPath = values.output;
  const printWidth = parseInt(values.width, 10);
  const contrast = parseFloat(values.contrast);
  const brightness = parseFloat(values.bright);
  const dropouts = parseFloat(values.dropouts);
  const palette = PALETTES[values.palette] || PALETTES.cream;
  const showTear = !values.noTear;

  // Load and obtain dimensions
  const metadata = await sharp(inputPath).metadata();
  const printHeight = Math.round((metadata.height / metadata.width) * printWidth);

  const { data: rawGrayscale } = await sharp(inputPath)
    .resize(printWidth, printHeight)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuffer = new Uint8Array(printWidth * printHeight * 3);

  // Generate random dead printer head dropout rows
  const deadRows = new Set();
  const numDropouts = Math.floor(printHeight * dropouts);
  while (deadRows.size < numDropouts) {
    deadRows.add(Math.floor(Math.random() * printHeight));
  }

  const bgColor = [20, 20, 20];

  for (let y = 0; y < printHeight; y++) {
    for (let x = 0; x < printWidth; x++) {
      const inIdx = y * printWidth + x;
      const outIdx = (y * printWidth + x) * 3;

      // Serrated tear edge rendering
      if (showTear) {
        const toothSize = 12;
        const toothDepth = 6;
        const toothY = Math.floor(Math.abs(Math.sin((x / toothSize) * Math.PI)) * toothDepth);
        if (y < toothY || y >= (printHeight - toothDepth + toothY)) {
          outBuffer[outIdx]     = bgColor[0];
          outBuffer[outIdx + 1] = bgColor[1];
          outBuffer[outIdx + 2] = bgColor[2];
          continue;
        }
      }

      // Dead pin row
      if (deadRows.has(y)) {
        outBuffer[outIdx]     = palette.paper[0];
        outBuffer[outIdx + 1] = palette.paper[1];
        outBuffer[outIdx + 2] = palette.paper[2];
        continue;
      }

      // Brightness & Contrast Adjustments
      let norm = (rawGrayscale[inIdx] / 255.0) * brightness;
      norm = (norm - 0.5) * contrast + 0.5;
      norm = Math.min(1.0, Math.max(0.0, norm));

      // Thresholding / Dithering Selection
      let threshold = 0.5;
      if (values.dither === 'bayer4') {
        threshold = BAYER_4X4[y % 4][x % 4] / 16.0;
      } else if (values.dither === 'bayer8') {
        threshold = BAYER_8X8[y % 8][x % 8] / 64.0;
      }

      const activeColor = norm > threshold ? palette.paper : palette.ink;
      outBuffer[outIdx]     = activeColor[0];
      outBuffer[outIdx + 1] = activeColor[1];
      outBuffer[outIdx + 2] = activeColor[2];
    }
  }

  await sharp(outBuffer, {
    raw: { width: printWidth, height: printHeight, channels: 3 }
  })
  .jpeg({ quality: 90 })
  .toFile(outputPath);

  console.log(`Rendered: ${outputPath} [Width: ${printWidth}px, Dither: ${values.dither}, Palette: ${values.palette}]`);
}

run();
