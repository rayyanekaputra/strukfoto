import { RECEIPT_LAYOUTS } from './receipt_layout.js';

const DEFAULTS = {
  width: '450', contrast: '1.8', brightness: '1.0', dither: 'bayer8',
  palette: 'cream', transparency: 'none', dropouts: '0.012', tear: true,
  aspect: '1:1', transparentBg: false, imagePos: 'top', layout: 'album'
};

const PALETTES = {
  cream: { paper: [242, 239, 233], ink: [32, 32, 30], paperHex: '#F2EFE9', inkHex: '#20201E' },
  aged:  { paper: [235, 222, 190], ink: [50, 42, 35], paperHex: '#EBDEBE', inkHex: '#322A23' },
  blue:  { paper: [240, 244, 248], ink: [25, 40, 90], paperHex: '#F0F4F8', inkHex: '#19285A' },
  bw:    { paper: [255, 255, 255], ink: [0, 0, 0],  paperHex: '#FFFFFF', inkHex: '#000000' }
};

const BAYER_4X4 = [
  [ 0,  8,  2, 10], [12,  4, 14,  6],
  [ 3, 11,  1,  9], [15,  7, 13,  5]
];

const BAYER_8X8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
];

const elements = {
  imageInput: document.getElementById('imageInput'),
  clearBtn: document.getElementById('clearBtn'),
  aspectInput: document.getElementById('aspectInput'),
  transparentBgInput: document.getElementById('transparentBgInput'),
  imagePosInput: document.getElementById('imagePosInput'),
  layoutSelect: document.getElementById('layoutSelect'),
  headerTitle: document.getElementById('headerTitle'),
  headerSub: document.getElementById('headerSub'),
  trackInputs: document.querySelectorAll('.track-input'),
  widthInput: document.getElementById('widthInput'),
  widthVal: document.getElementById('widthVal'),
  contrastInput: document.getElementById('contrastInput'),
  contrastVal: document.getElementById('contrastVal'),
  brightnessInput: document.getElementById('brightnessInput'),
  brightVal: document.getElementById('brightVal'),
  ditherInput: document.getElementById('ditherInput'),
  paletteInput: document.getElementById('paletteInput'),
  transparencyInput: document.getElementById('transparencyInput'),
  dropoutsInput: document.getElementById('dropoutsInput'),
  dropoutsVal: document.getElementById('dropoutsVal'),
  tearInput: document.getElementById('tearInput'),
  resetBtn: document.getElementById('resetBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  canvas: document.getElementById('receiptCanvas')
};

const ctx = elements.canvas.getContext('2d');
let loadedImage = null;
let cachedDeadRows = [];
let lastHeight = 0;

function updateLabels() {
  if (elements.widthVal) elements.widthVal.textContent = elements.widthInput.value;
  if (elements.contrastVal) elements.contrastVal.textContent = elements.contrastInput.value;
  if (elements.brightVal) elements.brightVal.textContent = elements.brightnessInput.value;
  if (elements.dropoutsVal) elements.dropoutsVal.textContent = elements.dropoutsInput.value;
}

function processDitheredPhoto(img, targetWidth, targetHeight, brightness, contrast, ditherMode, palette) {
  const pCanvas = document.createElement('canvas');
  pCanvas.width = targetWidth;
  pCanvas.height = targetHeight;
  const pCtx = pCanvas.getContext('2d');

  pCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = pCtx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let norm = ((r * 0.299 + g * 0.587 + b * 0.114) / 255.0) * brightness;
      norm = (norm - 0.5) * contrast + 0.5;
      norm = Math.min(1.0, Math.max(0.0, norm));

      let threshold = 0.5;
      if (ditherMode === 'bayer4') {
        threshold = BAYER_4X4[y % 4][x % 4] / 16.0;
      } else if (ditherMode === 'bayer8') {
        threshold = BAYER_8X8[y % 8][x % 8] / 64.0;
      }

      const isPaper = norm > threshold;
      if (isPaper) {
        data[idx]     = palette.paper[0];
        data[idx + 1] = palette.paper[1];
        data[idx + 2] = palette.paper[2];
        data[idx + 3] = 255;
      } else {
        data[idx]     = palette.ink[0];
        data[idx + 1] = palette.ink[1];
        data[idx + 2] = palette.ink[2];
        data[idx + 3] = 255;
      }
    }
  }
  pCtx.putImageData(imgData, 0, 0);
  return pCanvas;
}

function drawBarcode(cCtx, y, width, margin, barHeight, inkColor) {
  cCtx.fillStyle = inkColor;
  let x = margin;
  const endX = width - margin;
  while (x < endX) {
    const barW = Math.floor(Math.random() * 3) + 1;
    const gap = Math.floor(Math.random() * 3) + 1;
    cCtx.fillRect(x, y, barW, barHeight);
    x += barW + gap;
  }
}

function render() {
  updateLabels();

  const printWidth = parseInt(elements.widthInput.value, 10);
  const contrast = parseFloat(elements.contrastInput.value);
  const brightness = parseFloat(elements.brightnessInput.value);
  const ditherMode = elements.ditherInput.value;
  const palette = PALETTES[elements.paletteInput.value] || PALETTES.cream;
  const transparencyMode = elements.transparencyInput.value;
  const dropoutDensity = parseFloat(elements.dropoutsInput.value);
  const showTear = elements.tearInput.checked;
  const aspect = elements.aspectInput.value;
  const transparentCardBg = elements.transparentBgInput.checked;
  const imagePos = elements.imagePosInput.value;

  const scale = printWidth / 450.0;
  const margin = Math.round(20 * scale);
  const fontSizeTitle = Math.max(12, Math.round(20 * scale));
  const fontSizeSub = Math.max(9, Math.round(12 * scale));
  const fontSizeBody = Math.max(10, Math.round(13 * scale));
  const lineHeight = Math.round(18 * scale);
  const barcodeHeight = Math.round(35 * scale);

  const charWidth = fontSizeBody * 0.6;
  const maxChars = Math.max(18, Math.floor((printWidth - margin * 2) / charWidth));
  const dividerLine = '='.repeat(maxChars);
  const subDividerLine = '-'.repeat(maxChars);

  const usablePhotoWidth = printWidth - margin * 2;
  const photoHeight = loadedImage ? Math.round((loadedImage.height / loadedImage.width) * usablePhotoWidth) : 0;
  const isWatermark = imagePos === 'background';

  const paperHeight = Math.round(
    (lineHeight * 6) +
    (loadedImage && !isWatermark ? photoHeight + Math.round(15 * scale) : 0) +
    (lineHeight * (elements.trackInputs.length + 6)) +
    barcodeHeight + Math.round(30 * scale)
  );

  const paperCanvas = document.createElement('canvas');
  paperCanvas.width = printWidth;
  paperCanvas.height = paperHeight;
  const pCtx = paperCanvas.getContext('2d');

  if (transparencyMode !== 'paper') {
    pCtx.fillStyle = palette.paperHex;
    pCtx.fillRect(0, 0, printWidth, paperHeight);
  }

  let ditheredPhotoCanvas = null;
  if (loadedImage) {
    ditheredPhotoCanvas = processDitheredPhoto(loadedImage, usablePhotoWidth, photoHeight, brightness, contrast, ditherMode, palette);
  }

  let curY = Math.round(25 * scale);
  const inkColor = transparencyMode === 'ink' ? '#00000000' : palette.inkHex;
  pCtx.fillStyle = inkColor;
  pCtx.textAlign = 'center';

  // Header Block
  pCtx.font = `bold ${fontSizeTitle}px "Courier New", monospace`;
  pCtx.fillText(elements.headerTitle.value.toUpperCase(), printWidth / 2, curY);
  curY += lineHeight;

  pCtx.font = `${fontSizeSub}px "Courier New", monospace`;
  pCtx.fillText(`[ ${elements.headerSub.value.toUpperCase()} ]`, printWidth / 2, curY);
  curY += lineHeight;

  pCtx.font = `${fontSizeBody}px "Courier New", monospace`;
  pCtx.fillText(dividerLine, printWidth / 2, curY);
  curY += lineHeight;

  pCtx.textAlign = 'left';
  pCtx.fillText(`DATE: 2026-09-06      REC #: ${Math.floor(1000 + Math.random() * 9000)}`, margin, curY);
  curY += lineHeight;

  // Layout Delegation
  const selectedLayoutKey = elements.layoutSelect ? elements.layoutSelect.value : 'album';
  const layoutModule = RECEIPT_LAYOUTS[selectedLayoutKey] || RECEIPT_LAYOUTS.album;
  const itemStrings = Array.from(elements.trackInputs).map(input => input.value.trim());

  curY = layoutModule.drawContent(pCtx, {
    printWidth,
    margin,
    curY,
    lineHeight,
    scale,
    maxChars,
    subDividerLine,
    items: itemStrings,
    renderPhoto: (atY) => {
      if (ditheredPhotoCanvas && !isWatermark) {
        pCtx.drawImage(ditheredPhotoCanvas, margin, atY);
        return atY + photoHeight + Math.round(15 * scale);
      }
      return atY;
    },
    imagePos
  });

  // Barcode & Footer
  drawBarcode(pCtx, curY, printWidth, margin, barcodeHeight, inkColor);
  curY += barcodeHeight + Math.round(15 * scale);
  pCtx.textAlign = 'center';
  const footerMsg = layoutModule.fields?.footerMsg || 'THANK YOU FOR LISTENING';
  pCtx.fillText(footerMsg, printWidth / 2, curY);

  // Glitch Lines Pass
  const numDropouts = Math.floor(paperHeight * dropoutDensity);
  if (lastHeight !== paperHeight || cachedDeadRows.length !== numDropouts) {
    const rows = new Set();
    while (rows.size < numDropouts && numDropouts > 0) {
      rows.add(Math.floor(Math.random() * paperHeight));
    }
    cachedDeadRows = Array.from(rows);
    lastHeight = paperHeight;
  }

  cachedDeadRows.forEach((rowY) => {
    if (transparencyMode === 'paper') {
      pCtx.clearRect(0, rowY, printWidth, 1);
    } else {
      pCtx.fillStyle = palette.paperHex;
      pCtx.fillRect(0, rowY, printWidth, 1);
    }
  });

  // Serrated Tear Edge Pass
  if (showTear) {
    pCtx.save();
    pCtx.globalCompositeOperation = 'destination-out';
    pCtx.fillStyle = '#000000';

    const toothSize = 12;
    const toothDepth = 6;

    for (let x = 0; x < printWidth; x++) {
      const toothY = Math.floor(Math.abs(Math.sin((x / toothSize) * Math.PI)) * toothDepth);
      pCtx.fillRect(x, 0, 1, toothY);
      pCtx.fillRect(x, paperHeight - toothDepth + toothY, 1, toothDepth);
    }
    pCtx.restore();
  }

  // Compositing Output Canvas
  if (aspect === 'native') {
    elements.canvas.width = printWidth;
    elements.canvas.height = paperHeight;
    ctx.clearRect(0, 0, printWidth, paperHeight);
    ctx.drawImage(paperCanvas, 0, 0);
  } else {
    const finalW = 1080;
    const finalH = aspect === '1:1' ? 1080 : 1920;

    elements.canvas.width = finalW;
    elements.canvas.height = finalH;

    if (transparentCardBg) {
      ctx.clearRect(0, 0, finalW, finalH);
    } else {
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, finalW, finalH);
    }

    const maxDisplayW = finalW * 0.82;
    const maxDisplayH = finalH * 0.88;
    const fitScale = Math.min(maxDisplayW / printWidth, maxDisplayH / paperHeight, 2.0);

    const dispW = Math.round(printWidth * fitScale);
    const dispH = Math.round(paperHeight * fitScale);
    const destX = Math.round((finalW - dispW) / 2);
    const destY = Math.round((finalH - dispH) / 2);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(paperCanvas, destX, destY, dispW, dispH);
  }

  elements.downloadBtn.disabled = false;
  elements.clearBtn.disabled = !loadedImage;
}

// Event Listeners
elements.resetBtn.addEventListener('click', () => {
  elements.widthInput.value = DEFAULTS.width;
  elements.contrastInput.value = DEFAULTS.contrast;
  elements.brightnessInput.value = DEFAULTS.brightness;
  elements.ditherInput.value = DEFAULTS.dither;
  elements.paletteInput.value = DEFAULTS.palette;
  elements.transparencyInput.value = DEFAULTS.transparency;
  elements.dropoutsInput.value = DEFAULTS.dropouts;
  elements.tearInput.checked = DEFAULTS.tear;
  elements.aspectInput.value = DEFAULTS.aspect;
  elements.transparentBgInput.checked = DEFAULTS.transparentBg;
  elements.imagePosInput.value = DEFAULTS.imagePos;
  if (elements.layoutSelect) elements.layoutSelect.value = DEFAULTS.layout;

  render();
});

elements.clearBtn.addEventListener('click', () => {
  elements.imageInput.value = '';
  loadedImage = null;
  render();
});

elements.imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      render();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

[
  elements.widthInput, elements.contrastInput, elements.brightnessInput,
  elements.ditherInput, elements.paletteInput, elements.transparencyInput,
  elements.dropoutsInput, elements.tearInput, elements.aspectInput,
  elements.transparentBgInput, elements.imagePosInput, elements.layoutSelect,
  elements.headerTitle, elements.headerSub, ...elements.trackInputs
].forEach(input => {
  if (input) input.addEventListener('input', render);
});

elements.downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `strukfoto-receipt-${elements.aspectInput.value}.png`;
  link.href = elements.canvas.toDataURL('image/png');
  link.click();
});

// Initial Execution
render();
