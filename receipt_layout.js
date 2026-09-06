// Helper for dynamic edge-to-edge space-between formatting
function row(left, right, maxChars, fillChar = ' ') {
  const l = String(left || '').toUpperCase();
  const r = String(right || '').toUpperCase();
  const maxL = Math.max(1, maxChars - r.length - 1);
  const truncL = l.length > maxL ? l.substring(0, maxL) : l;
  const fillLen = Math.max(1, maxChars - truncL.length - r.length);
  return truncL + fillChar.repeat(fillLen) + r;
}

export const RECEIPT_LAYOUTS = {
  album: {
    name: 'album receipt',
    fields: {
      footerMsg: 'THANK YOU FOR LISTENING',
      sectionTitle: 'TRACKLIST ITEMS',
      placeholders: ['Track 1 Title', 'Track 2 Title', 'Track 3 Title', 'Track 4 Title', 'Track 5 Title']
    },
    getHeight: ({ lineHeight, scale, photoHeight, isWatermark, items, barcodeHeight }) => {
      const headerH = 25 * scale + lineHeight * 4;
      const photoH = (!isWatermark && photoHeight) ? photoHeight + 15 * scale : 0;
      const bodyH = lineHeight * (6 + items.filter(Boolean).length) + 22 * scale;
      const footerH = barcodeHeight + 15 * scale + lineHeight + 30 * scale;
      return Math.round(headerH + photoH + bodyH + footerH);
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('ITEM / TRACK DESCRIPTION', 'QTY', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      items.forEach((text) => {
        if (!text) return;
        pCtx.fillText(row(text, '1', maxChars, '.'), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('TOTAL TRACKS:', items.filter(Boolean).length, maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('AUTH CODE:', '#SF2026', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  grocery: {
    name: 'grocery / market',
    fields: {
      footerMsg: '*** YOU SAVED $4.20 TODAY! ***',
      sectionTitle: 'GROCERY ITEMS',
      placeholders: ['Item 1 (e.g. Iced Coffee)', 'Item 2 (e.g. Fresh Milk)', 'Item 3 (e.g. Bakery)', 'Item 4', 'Item 5']
    },
    getHeight: ({ lineHeight, scale, photoHeight, isWatermark, items, barcodeHeight }) => {
      const headerH = 25 * scale + lineHeight * 4;
      const photoH = (!isWatermark && photoHeight) ? photoHeight + 15 * scale : 0;
      const bodyH = lineHeight * (9 + items.filter(Boolean).length) + 22 * scale;
      const footerH = barcodeHeight + 15 * scale + lineHeight + 30 * scale;
      return Math.round(headerH + photoH + bodyH + footerH);
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('ITEM DESCRIPTION', 'PRICE', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      const mockPrices = ['$4.50 T', '$5.75 T', '$0.00 T', '$8.00 T', '$9.99 T'];
      items.forEach((text, i) => {
        if (!text) return;
        const price = mockPrices[i % mockPrices.length];
        pCtx.fillText(row(text, price, maxChars), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('SUBTOTAL', '$28.24', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TAX (10%)', '$2.82', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TOTAL', '$31.06', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('CASH TENDERED', '$40.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('CHANGE DUE', '$8.94', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  airline: {
    name: 'airline boarding pass',
    fields: {
      footerMsg: 'HAVE A GOOD FLIGHT',
      sectionTitle: 'PASSENGER & FLIGHT DETAILS',
      placeholders: ['Passenger Name (e.g. RAYYAN/EKA)', 'Additional Note / Class', 'Special Request', '', '']
    },
    getHeight: ({ lineHeight, scale, photoHeight, isWatermark, barcodeHeight }) => {
      const headerH = 25 * scale + lineHeight * 4;
      const photoH = (!isWatermark && photoHeight) ? photoHeight + 15 * scale : 0;
      const bodyH = lineHeight * 10 + 22 * scale;
      const footerH = barcodeHeight + 15 * scale + lineHeight + 30 * scale;
      return Math.round(headerH + photoH + bodyH + footerH);
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('PASSENGER:', items[0] || 'RAYYAN/EKA', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('FLIGHT: SF-2026', 'GATE: B12', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('CLASS: FIRST', 'SEAT: 02A', maxChars), margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('[CGK]', '---------> [DPS]', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('JAKARTA', 'BALI', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText('- - - - TEAR OFF STUB - - - -', margin, y);
      y += lineHeight;
      pCtx.fillText(row('PASS:', items[0] || 'RAYYAN/EKA', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('FLIGHT: SF-2026', 'SEAT: 02A ZONE:1', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  parking: {
    name: 'parking ticket',
    fields: {
      footerMsg: '* LOST TICKET SUBJECT TO MAX RATE *',
      sectionTitle: 'VEHICLE & TICKET DETAILS',
      placeholders: ['Plate Number (e.g. B 1234 XYZ)', 'Parking Slot Code', '', '', '']
    },
    getHeight: ({ lineHeight, scale, photoHeight, isWatermark, barcodeHeight }) => {
      const headerH = 25 * scale + lineHeight * 4;
      const photoH = (!isWatermark && photoHeight) ? photoHeight + 15 * scale : 0;
      const bodyH = lineHeight * 9 + 22 * scale;
      const footerH = barcodeHeight + 15 * scale + lineHeight + 30 * scale;
      return Math.round(headerH + photoH + bodyH + footerH);
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('PLATE #:', items[0] || 'B 1234 XYZ', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('ENTRY TIME:', '18:02:14', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('EXIT TIME:', '23:10:05', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('DURATION:', '05H 07M', maxChars), margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(row('RATE TIER (1ST 2H)', '$5.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('ADDITIONAL (3H)', '$6.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('TOTAL DUE', '$11.00', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  concert: {
    name: 'concert stub',
    fields: {
      footerMsg: 'VOID IF DETACHED // NO REFUNDS',
      sectionTitle: 'PASS HOLDER & VENUE INFO',
      placeholders: ['Ticket Holder (e.g. VIP GUEST)', 'Gate / Entry Note', '', '', '']
    },
    getHeight: ({ lineHeight, scale, photoHeight, isWatermark, barcodeHeight }) => {
      const headerH = 25 * scale + lineHeight * 4;
      const photoH = (!isWatermark && photoHeight) ? photoHeight + 15 * scale : 0;
      const bodyH = lineHeight * 7 + 22 * scale;
      const footerH = barcodeHeight + 15 * scale + lineHeight + 30 * scale;
      return Math.round(headerH + photoH + bodyH + footerH);
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('VENUE:', 'THE GRAND ARENA', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('DOORS: 20:00', 'RATING: ALL AGES', maxChars), margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('SEC: A1', 'ROW: 04 | SEAT: 18', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(row('HOLDER:', items[0] || 'VIP GUEST', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('ADMIT:', '01 PERSON', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  atm: {
    name: 'atm slip',
    fields: {
      footerMsg: 'RECORD COPY - RETAIN FOR FILES',
      sectionTitle: 'ACCOUNT & ACCOUNT HOLDER',
      placeholders: ['Account Holder Name', 'Transaction Note', '', '', '']
    },
    getHeight: ({ lineHeight, scale, photoHeight, isWatermark, barcodeHeight }) => {
      const headerH = 25 * scale + lineHeight * 4;
      const photoH = (!isWatermark && photoHeight) ? photoHeight + 15 * scale : 0;
      const bodyH = lineHeight * 9 + 22 * scale;
      const footerH = barcodeHeight + 15 * scale + lineHeight + 30 * scale;
      return Math.round(headerH + photoH + bodyH + footerH);
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('CARD:', '************8821', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TRANSACTION #:', '009412', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TYPE:', 'WITHDRAWAL', maxChars), margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('AMOUNT:', '$200.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('FEE:', '$0.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(row('ACCOUNT BAL:', '$1,240.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('AVAILABLE:', '$1,240.00', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  }
};
