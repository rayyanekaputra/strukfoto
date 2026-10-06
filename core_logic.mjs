import { RECEIPT_LAYOUTS } from './receipt_layout.js';
import { elements } from './elements.mjs';
import { barcodeBlockHeight, drawBarcode } from './barcodes.mjs';
import { HEADERS } from './headers.mjs';
import { applyPaperShape, drawPerforation, shapeInset } from './shapes.mjs';
import { DEFAULTS, BAYER_4X4, BAYER_8X8, PALETTES } from './default_filter.mjs';

let loadedImage = null;
let cachedDeadRows = [];
let lastHeight = 0;
let imageId = 0;
let rngSeed = (Math.random() * 0xffffffff) >>> 0;
let photoCache = { key: '', canvas: null };

const ctx = elements.canvas.getContext('2d');
// Reused across renders: a scratch context for measuring and the paper being drawn
const measureCtx = document.createElement('canvas').getContext('2d');
const paperCanvas = document.createElement('canvas');


function updateLabels() {
  if (elements.widthVal) elements.widthVal.textContent = elements.widthInput.value;
  if (elements.contrastVal) elements.contrastVal.textContent = elements.contrastInput.value;
  if (elements.brightVal) elements.brightVal.textContent = elements.brightnessInput.value;
  if (elements.dropoutsVal) elements.dropoutsVal.textContent = elements.dropoutsInput.value;
  if (elements.ditherScaleVal && elements.ditherScaleInput) {
    elements.ditherScaleVal.textContent = `${elements.ditherScaleInput.value}x`;
  }
}

function syncLayoutUI() {
  const selectedKey = elements.layoutSelect ? elements.layoutSelect.value : 'album';
  const layout = RECEIPT_LAYOUTS[selectedKey] || RECEIPT_LAYOUTS.album;
  const fields = layout.fields;

  const sectionTitleLabel = document.getElementById('itemSectionTitle');
  if (sectionTitleLabel && fields.sectionTitle) {
    sectionTitleLabel.textContent = fields.sectionTitle;
  }

  if (fields.placeholders && elements.trackInputs) {
    elements.trackInputs.forEach((input, index) => {
      const defaultValue = fields.placeholders[index] || '';
      input.placeholder = defaultValue || `Item ${index + 1}`;
      input.value = defaultValue;
    });
  }
}

// Small seeded PRNG (mulberry32) so barcode and receipt number stay stable across renders
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Re-dither only when the photo or a dither-related setting changed
function getDitheredPhoto(width, height, brightness, contrast, ditherMode, palette, ditherScale, colorMode) {
  const key = [imageId, width, height, brightness, contrast, ditherMode, palette.paperHex, palette.inkHex, ditherScale, colorMode].join('|');
  if (photoCache.key !== key) {
    photoCache = {
      key,
      canvas: processDitheredPhoto(loadedImage, width, height, brightness, contrast, ditherMode, palette, ditherScale, colorMode)
    };
  }
  return photoCache.canvas;
}

function processDitheredPhoto(img, targetWidth, targetHeight, brightness, contrast, ditherMode, palette, ditherScale = 1, colorMode = 'mono') {
  const dW = Math.max(1, Math.floor(targetWidth / ditherScale));
  const dH = Math.max(1, Math.floor(targetHeight / ditherScale));

  const pCanvas = document.createElement('canvas');
  pCanvas.width = dW;
  pCanvas.height = dH;
  const pCtx = pCanvas.getContext('2d');

  pCtx.drawImage(img, 0, 0, dW, dH);
  const imgData = pCtx.getImageData(0, 0, dW, dH);
  const data = imgData.data;

  for (let y = 0; y < dH; y++) {
    for (let x = 0; x < dW; x++) {
      const idx = (y * dW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let threshold = 0.5;
      if (ditherMode === 'bayer4') {
        threshold = (BAYER_4X4[y % 4][x % 4] + 0.5) / 16.0;
      } else if (ditherMode === 'bayer8') {
        threshold = (BAYER_8X8[y % 8][x % 8] + 0.5) / 64.0;
      }

      if (colorMode === 'mono') {
        let norm = ((r * 0.299 + g * 0.587 + b * 0.114) / 255.0) * brightness;
        norm = (norm - 0.5) * contrast + 0.5;
        norm = Math.min(1.0, Math.max(0.0, norm));

        const isPaper = norm > threshold;
        const color = isPaper ? palette.paper : palette.ink;
        data[idx] = color[0];
        data[idx + 1] = color[1];
        data[idx + 2] = color[2];
        data[idx + 3] = 255;
      } else {

        // RGB Color Dithering (8-Color or 64-Color)
        const levels = colorMode === 'rgb8' ? 2 : 4;
        const ditherChannel = (c) => {
          let norm = (c / 255.0) * brightness;
          norm = Math.min(1.0, Math.max(0.0, (norm - 0.5) * contrast + 0.5));
          const step = 1 / (levels - 1);
          const offset = (threshold - 0.5) * step;
          const dithered = Math.min(1.0, Math.max(0.0, norm + offset));
          const q = Math.round(dithered * (levels - 1));
          return Math.round(q * (255 / (levels - 1)));
        };

        data[idx] = ditherChannel(r);
        data[idx + 1] = ditherChannel(g);
        data[idx + 2] = ditherChannel(b);
        data[idx + 3] = 255;
      }
    }
  }
  pCtx.putImageData(imgData, 0, 0);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(pCanvas, 0, 0, targetWidth, targetHeight);

  return outCanvas;
}

function render() {
  updateLabels();

  const isPhotoOnly = elements.modeSelect && elements.modeSelect.value === 'photo';
  const colorMode = elements.colorModeSelect ? elements.colorModeSelect.value : 'mono';
  const printWidth = parseInt(elements.widthInput.value, 10);
  const contrast = parseFloat(elements.contrastInput.value);
  const brightness = parseFloat(elements.brightnessInput.value);
  const ditherMode = elements.ditherInput.value;
  const ditherScale = parseInt(elements.ditherScaleInput ? elements.ditherScaleInput.value : 2, 10);
  const palette = PALETTES[elements.paletteInput.value] || PALETTES.cream;
  const transparencyMode = elements.transparencyInput.value;
  const dropoutDensity = parseFloat(elements.dropoutsInput.value);
  const showTear = elements.tearInput.checked;
  const aspect = elements.aspectInput.value;
  const transparentCardBg = elements.transparentBgInput.checked;
  const imagePos = elements.imagePosInput.value;

  const scale = printWidth / 450.0;
  const margin = Math.round(20 * scale);
  const fontSizeTitle = Math.max(8, Math.round(20 * scale));
  const fontSizeSub = Math.max(6, Math.round(12 * scale));
  const fontSizeBody = Math.max(6, Math.round(13 * scale));
  const lineHeight = Math.round(18 * scale);

  const selectedLayoutKey = elements.layoutSelect ? elements.layoutSelect.value : 'album';
  const layoutModule = RECEIPT_LAYOUTS[selectedLayoutKey] || RECEIPT_LAYOUTS.album;
  const style = layoutModule.style || {};

  const usablePhotoWidth = printWidth - margin * 2;
  const barcodeHeight = barcodeBlockHeight(style.barcode, usablePhotoWidth, scale);
  const photoHeight = loadedImage ? Math.round((loadedImage.height / loadedImage.width) * usablePhotoWidth) : 0;
  const isWatermark = imagePos === 'background';

  const itemStrings = Array.from(elements.trackInputs).map(input => input.value.trim());

  let ditheredPhotoCanvas = null;
  // The watermark is dithered after measuring, once the paper height is known
  if (loadedImage && !isPhotoOnly && !isWatermark) {
    ditheredPhotoCanvas = getDitheredPhoto(
      usablePhotoWidth, photoHeight, brightness,
      contrast, ditherMode, palette, ditherScale, colorMode
    );
  }

  // --- PHOTO ONLY PIPELINE BRANCH ---
  if (isPhotoOnly) {
    if (!loadedImage) {
      elements.canvas.width = printWidth;
      elements.canvas.height = printWidth;
      ctx.clearRect(0, 0, printWidth, printWidth);
      elements.downloadBtn.disabled = true;
      elements.clearBtn.disabled = true;
      return;
    }

    const usableWidth = printWidth;
    const photoHeight = Math.round((loadedImage.height / loadedImage.width) * usableWidth);

    const ditheredPhoto = getDitheredPhoto(
      usableWidth, photoHeight, brightness, contrast,
      ditherMode, palette, ditherScale, colorMode
    );

    if (aspect === 'native') {
      elements.canvas.width = usableWidth;
      elements.canvas.height = photoHeight;
      ctx.clearRect(0, 0, usableWidth, photoHeight);
      ctx.drawImage(ditheredPhoto, 0, 0);
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

      const maxDisplayW = finalW * 0.9;
      const maxDisplayH = finalH * 0.9;
      const fitScale = Math.min(maxDisplayW / usableWidth, maxDisplayH / photoHeight);

      const dispW = Math.round(usableWidth * fitScale);
      const dispH = Math.round(photoHeight * fitScale);
      const destX = Math.round((finalW - dispW) / 2);
      const destY = Math.round((finalH - dispH) / 2);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ditheredPhoto, destX, destY, dispW, dispH);
    }

    elements.downloadBtn.disabled = false;
    elements.clearBtn.disabled = false;
    return; // Stop execution before receipt rendering
  }


  // Spacing: the paper shape reserves its own inset at the top and bottom
  const inset = shapeInset(style.shape, scale);
  const padTop = inset + Math.round(14 * scale);
  const padBottom = inset + Math.round(18 * scale);

  measureCtx.font = `${fontSizeBody}px "Courier New", monospace`;
  const charWidth = measureCtx.measureText('M').width || fontSizeBody * 0.6;
  const maxChars = Math.max(18, Math.floor(usablePhotoWidth / charWidth));
  const dividerLine = (style.divider?.major || '=').repeat(maxChars);
  const subDividerLine = (style.divider?.minor || '-').repeat(maxChars);

  const inkColor = transparencyMode === 'ink' ? '#00000000' : palette.inkHex;
  let perfY = 0;
  let paperHeight = 0;

  // Draws the whole receipt and returns the y just below the footer.
  // The first pass only measures, so the paper height always matches the content.
  const paintReceipt = (pCtx, measuring) => {
    const rng = makeRng(rngSeed);
    perfY = 0;
    pCtx.textBaseline = 'alphabetic';
    pCtx.fillStyle = inkColor;

    if (!measuring && ditheredPhotoCanvas && isWatermark) {
      // Edge to edge, centered; whichever side overflows gets cropped by the canvas
      pCtx.save();
      pCtx.globalAlpha = 0.25;
      pCtx.drawImage(
        ditheredPhotoCanvas,
        Math.round((printWidth - ditheredPhotoCanvas.width) / 2),
        Math.round((paperHeight - ditheredPhotoCanvas.height) / 2)
      );
      pCtx.restore();
    }

    let curY = padTop + fontSizeTitle;
    const header = HEADERS[style.header] || HEADERS.album;
    curY = Math.round(header(pCtx, {
      y: curY,
      cx: printWidth / 2,
      margin,
      innerW: usablePhotoWidth,
      scale,
      lineHeight,
      sizeTitle: fontSizeTitle,
      sizeSub: fontSizeSub,
      sizeBody: fontSizeBody,
      title: elements.headerTitle.value,
      sub: elements.headerSub.value,
      maxChars,
      dividerLine,
      ink: inkColor,
      paper: palette.paperHex,
      // Ink-transparent mode would hide filled shapes, so headers fall back to plain text
      solid: transparencyMode !== 'ink'
    }));

    pCtx.font = `${fontSizeBody}px "Courier New", monospace`;
    pCtx.fillStyle = inkColor;
    pCtx.textAlign = 'left';
    pCtx.fillText('DATE: 2026-09-06', margin, curY);
    pCtx.textAlign = 'right';
    pCtx.fillText(`REC #: ${Math.floor(1000 + rng() * 9000)}`, margin + usablePhotoWidth, curY);
    pCtx.textAlign = 'left';
    curY += lineHeight;

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
          if (!measuring) pCtx.drawImage(ditheredPhotoCanvas, margin, atY);
          return atY + photoHeight + Math.round(15 * scale);
        }
        return atY;
      },
      imagePos,
      markPerforation: (y) => { perfY = y; }
    });

    drawBarcode(pCtx, style.barcode, { x: margin, y: curY, w: usablePhotoWidth, h: barcodeHeight, rng, scale, ink: inkColor });
    if (barcodeHeight) curY += barcodeHeight + Math.round(15 * scale);
    pCtx.font = `${fontSizeBody}px "Courier New", monospace`;
    pCtx.textAlign = 'center';
    pCtx.fillText(layoutModule.fields?.footerMsg || 'THANK YOU FOR LISTENING', printWidth / 2, curY);
    return curY;
  };

  const footerY = paintReceipt(measureCtx, true);
  paperHeight = Math.round(footerY + Math.round(fontSizeBody * 0.3) + padBottom);

  if (loadedImage && isWatermark) {
    const ratio = loadedImage.width / loadedImage.height;
    const fitHeight = elements.watermarkFitInput.value === 'height';
    const wmWidth = fitHeight ? Math.round(paperHeight * ratio) : printWidth;
    const wmHeight = fitHeight ? paperHeight : Math.round(printWidth / ratio);
    ditheredPhotoCanvas = getDitheredPhoto(
      wmWidth, wmHeight, brightness,
      contrast, ditherMode, palette, ditherScale, colorMode
    );
  }

  paperCanvas.width = printWidth;
  paperCanvas.height = paperHeight;
  const pCtx = paperCanvas.getContext('2d');

  if (transparencyMode !== 'paper') {
    pCtx.fillStyle = palette.paperHex;
    pCtx.fillRect(0, 0, printWidth, paperHeight);
  }

  paintReceipt(pCtx, false);


  const numDropouts = Math.floor(paperHeight * dropoutDensity);
  if (lastHeight !== paperHeight || cachedDeadRows.length !== numDropouts) {
    const rows = new Set();
    while (rows.size < numDropouts && numDropouts > 0) {
      rows.add(Math.floor(Math.random() * paperHeight));
    }
    cachedDeadRows = Array.from(rows);
    lastHeight = paperHeight;
  }

  if (perfY) drawPerforation(pCtx, printWidth, perfY, scale, inkColor);

  cachedDeadRows.forEach((rowY) => {
    if (transparencyMode === 'paper') {
      pCtx.clearRect(0, rowY, printWidth, 1);
    } else {
      pCtx.fillStyle = palette.paperHex;
      pCtx.fillRect(0, rowY, printWidth, 1);
    }
  });

  if (showTear) {
    applyPaperShape(pCtx, layoutModule.style?.shape, printWidth, paperHeight, scale, perfY);
  }

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


function toggleUIVisibility() {
  const isPhotoOnly = elements.modeSelect && elements.modeSelect.value === 'photo';

  // Receipt-only control selectors
  const receiptOnlyElements = [
    elements.layoutSelect?.closest('.grid-row'),
    elements.imagePosInput?.closest('.grid-row'),
    document.querySelector('.text-inputs-block'),
    elements.transparencyInput?.closest('.grid-row'),
    elements.dropoutsInput?.closest('.sliders-block'),
    elements.tearInput?.closest('.grid-row')
  ];

  receiptOnlyElements.forEach(el => {
    if (el) el.style.display = isPhotoOnly ? 'none' : '';
  });

  const watermarkFitRow = elements.watermarkFitInput?.closest('.grid-row');
  if (watermarkFitRow) {
    watermarkFitRow.style.display = (!isPhotoOnly && elements.imagePosInput.value === 'background') ? '' : 'none';
  }

  // Palette input is only useful when in mono mode
  const paletteRow = elements.paletteInput?.closest('.grid-row');
  const isMono = elements.colorModeSelect && elements.colorModeSelect.value === 'mono';
  if (paletteRow) {
    paletteRow.style.display = (!isPhotoOnly || isMono) ? '' : 'none';
  }
}

// Event Listeners
if (elements.layoutSelect) {
  elements.layoutSelect.addEventListener('change', () => {
    syncLayoutUI();
    render();
  });
}
if (elements.modeSelect) {
  elements.modeSelect.addEventListener('change', () => {
    toggleUIVisibility();
    render();
  });
}

if (elements.colorModeSelect) {
  elements.colorModeSelect.addEventListener('change', () => {
    toggleUIVisibility();
    render();
  });
}

elements.imagePosInput.addEventListener('input', () => {
  toggleUIVisibility();
  render();
});

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
  elements.watermarkFitInput.value = DEFAULTS.watermarkFit;
  toggleUIVisibility();
  if (elements.layoutSelect) elements.layoutSelect.value = DEFAULTS.layout;

  syncLayoutUI();
  render();
});

elements.reshuffleBtn.addEventListener('click', () => {
  rngSeed = (Math.random() * 0xffffffff) >>> 0;
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
      imageId++;
      render();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

[
  elements.widthInput, elements.contrastInput, elements.brightnessInput,
  elements.ditherInput, elements.ditherScaleInput, elements.paletteInput,
  elements.transparencyInput, elements.dropoutsInput, elements.tearInput,
  elements.aspectInput, elements.transparentBgInput, elements.watermarkFitInput,
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
syncLayoutUI();
render();
toggleUIVisibility();