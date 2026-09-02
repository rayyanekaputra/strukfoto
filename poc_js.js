import sharp from 'sharp';

// 8x8 Bayer Dithering Matrix
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

async function runThermalFilter({
  inputPath = 'input_js.jpg',
  outputPath = 'output_js.jpg',
  printWidth = 450,
  contrast = 1.7,
  deadPinDensity = 0.015,
  paperColor = [242, 239, 233],
  inkColor = [32, 32, 30],
  bgColor = [20, 20, 20]
} = {}) {
  console.log(`Processing ${inputPath}...`);

  // 1. Load image and scale down to receipt pixel width in grayscale
  const metadata = await sharp(inputPath).metadata();
  const printHeight = Math.round((metadata.height / metadata.width) * printWidth);

  const { data: rawGrayscale } = await sharp(inputPath)
    .resize(printWidth, printHeight)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Prepare output buffer (3 channels: R, G, B)
  const outBuffer = new Uint8Array(printWidth * printHeight * 3);

  // 3. Generate random dead pin dropout row indices
  const deadRows = new Set();
  const numDropouts = Math.floor(printHeight * deadPinDensity);
  while (deadRows.size < numDropouts) {
    deadRows.add(Math.floor(Math.random() * printHeight));
  }

  // 4. Pixel-by-pixel Dithering & Palette Remapping
  for (let y = 0; y < printHeight; y++) {
    for (let x = 0; x < printWidth; x++) {
      const inIdx = y * printWidth + x;
      const outIdx = (y * printWidth + x) * 3;

      // Serrated tear edges (Top and Bottom)
      const toothSize = 12;
      const toothDepth = 6;
      const toothY = Math.floor(Math.abs(Math.sin((x / toothSize) * Math.PI)) * toothDepth);
      const isOutsidePaper = y < toothY || y >= (printHeight - toothDepth + toothY);

      if (isOutsidePaper) {
        outBuffer[outIdx]     = bgColor[0];
        outBuffer[outIdx + 1] = bgColor[1];
        outBuffer[outIdx + 2] = bgColor[2];
        continue;
      }

      // Dead printer head pin dropout line
      if (deadRows.has(y)) {
        outBuffer[outIdx]     = paperColor[0];
        outBuffer[outIdx + 1] = paperColor[1];
        outBuffer[outIdx + 2] = paperColor[2];
        continue;
      }

      // Grayscale value (0.0 to 1.0)
      let norm = rawGrayscale[inIdx] / 255.0;

      // Apply contrast curve
      norm = (norm - 0.5) * contrast + 0.5;
      norm = Math.min(1.0, Math.max(0.0, norm));

      // Bayer Dithering Threshold lookup
      const threshold = BAYER_8X8[y % 8][x % 8] / 64.0;
      const activeColor = norm > threshold ? paperColor : inkColor;

      outBuffer[outIdx]     = activeColor[0];
      outBuffer[outIdx + 1] = activeColor[1];
      outBuffer[outIdx + 2] = activeColor[2];
    }
  }

  // 5. Output back to JPEG
  await sharp(outBuffer, {
    raw: { width: printWidth, height: printHeight, channels: 3 }
  })
  .jpeg({ quality: 90 })
  .toFile(outputPath);

  console.log(`Done! Saved to ${outputPath}`);
}

// Execute
runThermalFilter();
