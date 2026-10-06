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
    style: { shape: 'strip', barcode: 'code128', header: 'album', font: { body: 'thermal', title: 'vt' }, divider: { major: '=', minor: '-' } },
    name: 'album receipt',
    fields: {
      footerMsg: 'THANK YOU FOR LISTENING',
      sectionTitle: 'tracklist items',
      placeholders: ['track 1 title', 'track 2 title', 'track 3 title', 'track 4 title', 'track 5 title']
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
    style: { shape: 'strip', barcode: 'code128', header: 'grocery', font: { body: 'thermal', title: 'thermal' }, divider: { major: '*', minor: '-' } },
    name: 'grocery / market',
    fields: {
      footerMsg: '*** YOU SAVED $4.20 TODAY! ***',
      sectionTitle: 'grocery items',
      placeholders: ['item 1 (e.g. iced coffee)', 'item 2 (e.g. fresh milk)', 'item 3 (e.g. bakery)', 'item 4', 'item 5']
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
    style: { shape: 'stub', barcode: 'pdf417', header: 'airline', font: { body: 'bank', title: 'ticket' }, divider: { major: '=', minor: '-' } },
    name: 'airline boarding pass',
    fields: {
      footerMsg: 'HAVE A GOOD FLIGHT',
      sectionTitle: 'passenger & flight details',
      placeholders: ['passenger name (e.g. rayyan/eka)', 'additional note / class', 'special request', '', '']
    },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos, markPerforation }) => {
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

      markPerforation(y - Math.round(lineHeight * 0.8));
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
    style: { shape: 'ticket', barcode: 'code39', header: 'parking', font: { body: 'typewriter', title: 'typewriter' }, divider: { major: '#', minor: '-' } },
    name: 'parking ticket',
    fields: {
      footerMsg: '* LOST TICKET SUBJECT TO MAX RATE *',
      sectionTitle: 'vehicle & ticket details',
      placeholders: ['plate number (e.g. b 1234 xyz)', 'parking slot code', '', '', '']
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
    style: { shape: 'scallop', barcode: 'qr', header: 'concert', font: { body: 'thermal', title: 'ticket' }, divider: { major: '~', minor: '.' } },
    name: 'concert stub',
    fields: {
      footerMsg: 'VOID IF DETACHED // NO REFUNDS',
      sectionTitle: 'pass holder & venue info',
      placeholders: ['ticket holder (e.g. vip guest)', 'gate / entry note', '', '', '']
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
    style: { shape: 'rounded', barcode: 'none', header: 'atm', font: { body: 'bank', title: 'bank' }, divider: { major: '-', minor: '.' } },
    name: 'atm slip',
    fields: {
      footerMsg: 'RECORD COPY - RETAIN FOR FILES',
      sectionTitle: 'account & account holder',
      placeholders: ['account holder name', 'transaction note', '', '', '']
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
