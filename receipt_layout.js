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
  },

  cafe: {
    style: { shape: 'rounded', barcode: 'qr', header: 'cafe', font: { body: 'thermal', title: 'thermal' }, divider: { major: '=', minor: '-' } },
    name: 'coffee shop order',
    fields: {
      footerMsg: 'SEE YOU TOMORROW :)',
      sectionTitle: 'drinks & food',
      placeholders: ['iced kopi susu', 'hot cappuccino', 'butter croissant', 'item 4', 'item 5']
    },
    drawContent: (pCtx, { fx, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      y = fx.invertBar('ORDER #042', y, { tall: true });
      pCtx.fillText(row('DINE IN', 'BARISTA: EKA', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      const prices = ['28.000', '32.000', '24.000', '18.000', '21.000'];
      const modifiers = [['+ LESS SUGAR', '+ EXTRA SHOT'], ['+ OAT MILK'], ['+ WARMED UP']];
      items.forEach((text, i) => {
        if (!text) return;
        pCtx.fillText(row(`1 ${text}`, prices[i % prices.length], maxChars), margin, y);
        y += lineHeight;
        (modifiers[i] || []).forEach((mod) => {
          pCtx.fillText(`    ${mod}`, margin, y);
          y += lineHeight;
        });
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('SUBTOTAL', '84.000', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('PB1 (10%)', '8.400', maxChars), margin, y);
      y += lineHeight;
      y = fx.bigText(row('TOTAL', 'IDR 92.400', Math.floor(maxChars / 1.4)), y, { font: 'body' });
      pCtx.fillText(row('PAID BY', 'QRIS', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  invoice: {
    style: { shape: 'pinfeed', barcode: 'none', header: 'invoice', font: { body: 'dotmatrix', title: 'dotmatrix' }, divider: { major: '=', minor: '-' } },
    name: 'dot matrix invoice',
    fields: {
      footerMsg: 'PAYMENT DUE WITHIN 30 DAYS',
      sectionTitle: 'invoice line items',
      placeholders: ['photo session', 'retouching', 'print a4 glossy', 'item 4', 'item 5']
    },
    drawContent: (pCtx, { fx, printWidth, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('INVOICE NO:', 'INV/2026/0042', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('BILL TO:', 'STRUKFOTO CO.', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TERMS:', 'NET 30', maxChars), margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('QTY  DESCRIPTION', 'AMOUNT', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      const filled = items.filter(Boolean);
      const amounts = ['750.00', '250.00', '120.00', '90.00', '60.00'];
      fx.greenBands(y, filled.length);
      filled.forEach((text, i) => {
        pCtx.fillText(row(`${String(i + 1).padStart(2, '0')}   ${text}`, amounts[i % amounts.length], maxChars), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      const totalsTop = y;
      pCtx.fillText(row('SUBTOTAL', '1,270.00', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('VAT 11%', '139.70', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TOTAL DUE', '1,409.70', maxChars), margin, y);
      y += lineHeight;
      fx.stamp('PAID', printWidth * 0.36, totalsTop + lineHeight * 0.4, { angle: -12, color: 'red' });
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  cinema: {
    style: { shape: 'diecut', barcode: 'code128', header: 'cinema', font: { body: 'thermal', title: 'ticket' }, divider: { major: '=', minor: '-' } },
    name: 'cinema ticket',
    fields: {
      footerMsg: 'NO RE-ENTRY // ENJOY THE SHOW',
      sectionTitle: 'movie & seat details',
      placeholders: ['the receipt (2026)', '2d | 128 min', '', '', '']
    },
    drawContent: (pCtx, { fx, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos, markPerforation }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      const movie = (items[0] || 'THE RECEIPT').toUpperCase();
      y = fx.bigText(movie, y + Math.round(lineHeight * 0.6));
      y += Math.round(lineHeight * 0.2);
      pCtx.fillText(row('RATED: 13+', items[1] || '2D | 128 MIN', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('STUDIO 03', 'ROW F | SEAT 12', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('SAT 06 SEP 2026', '19:30', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('PRICE', 'IDR 50.000', maxChars), margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      markPerforation(y - Math.round(lineHeight * 0.4));
      y += Math.round(lineHeight * 1.1);
      y = fx.bigText('ADMIT ONE', y, { tall: false, wide: true });
      pCtx.fillText(row(movie, 'F-12', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('STUDIO 03', '19:30', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  restaurant: {
    style: { shape: 'torn', barcode: 'none', header: 'restaurant', font: { body: 'typewriter', title: 'typewriter' }, divider: { major: '=', minor: '-' } },
    name: 'restaurant bill',
    fields: {
      footerMsg: 'THANK YOU - PLEASE COME AGAIN',
      sectionTitle: 'dishes ordered',
      placeholders: ['nasi goreng spesial', 'sate ayam', 'es teh manis', 'item 4', 'item 5']
    },
    drawContent: (pCtx, { printWidth, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('TABLE: 07', 'SERVER: DINA', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('GUESTS: 2', 'TIME: 19:45', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      const qty = ['2', '1', '2', '1', '1'];
      const prices = ['64.000', '35.000', '16.000', '22.000', '18.000'];
      items.forEach((text, i) => {
        if (!text) return;
        pCtx.fillText(row(`${qty[i]} X ${text}`, prices[i], maxChars), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('SUBTOTAL', '155.000', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('SERVICE 5%', '7.750', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('TAX 10%', '16.275', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('AMOUNT', '179.025', maxChars), margin, y);
      y += lineHeight * 1.6;

      const blank = '_'.repeat(Math.min(14, Math.floor(maxChars / 2)));
      pCtx.fillText(row('TIP:', blank, maxChars), margin, y);
      y += lineHeight * 1.6;
      pCtx.fillText(row('TOTAL:', blank, maxChars), margin, y);
      y += lineHeight * 2.2;
      pCtx.fillText('X' + '_'.repeat(maxChars - 1), margin, y);
      y += lineHeight;
      pCtx.textAlign = 'center';
      pCtx.fillText('SIGNATURE', printWidth / 2, y);
      pCtx.textAlign = 'left';
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  laundry: {
    style: { shape: 'tag', barcode: 'code39', header: 'laundry', font: { body: 'thermal', title: 'ticket' }, divider: { major: '=', minor: '-' } },
    name: 'laundry claim tag',
    fields: {
      footerMsg: 'NO CLAIM WITHOUT THIS TICKET',
      sectionTitle: 'garments',
      placeholders: ['white shirt', 'denim jacket', 'bed sheet', 'item 4', 'item 5']
    },
    drawContent: (pCtx, { fx, printWidth, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.textAlign = 'center';
      pCtx.fillText('CLAIM NO.', printWidth / 2, y);
      pCtx.textAlign = 'left';
      y += lineHeight * 0.6;
      y = fx.bigText('A-0427', y + lineHeight, { size: Math.round(lineHeight * 1.4), wide: true });
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      const filled = items.filter(Boolean);
      filled.forEach((text) => {
        pCtx.fillText(row(text, 'X1  WASH+IRON', maxChars), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('TOTAL PIECES', filled.length, maxChars), margin, y);
      y += lineHeight;
      const stampY = y;
      pCtx.fillText(row('DROP OFF', 'MON 06 SEP', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(row('READY', 'THU 09 SEP 17:00', maxChars), margin, y);
      y += Math.round(22 * scale);
      fx.stamp('RECEIVED', printWidth * 0.42, stampY, { angle: 8, color: 'blue', size: Math.round(16 * scale) });

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  carnival: {
    style: { shape: 'admit', barcode: 'none', header: 'carnival', font: { body: 'typewriter', title: 'ticket' }, divider: { major: '*', minor: '-' } },
    name: 'carnival admit one',
    fields: {
      footerMsg: 'KEEP THIS COUPON - NOT TRANSFERABLE',
      sectionTitle: 'rides & attractions',
      placeholders: ['ferris wheel', 'bumper cars', 'carousel', '', '']
    },
    drawContent: (pCtx, { fx, printWidth, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      y = fx.bigText('ADMIT ONE', y + Math.round(lineHeight * 0.8), { size: Math.round(lineHeight * 1.5) });
      pCtx.textAlign = 'center';
      pCtx.fillText('Nº 004213', printWidth / 2, y);
      pCtx.textAlign = 'left';
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      items.forEach((text) => {
        if (!text) return;
        pCtx.fillText(row(text, '1 RIDE', maxChars, '.'), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(row('VALID', 'SAT 06 SEP ONLY', maxChars), margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  library: {
    style: { shape: 'rounded', barcode: 'code39', header: 'library', font: { body: 'typewriter', title: 'typewriter' }, divider: { major: '=', minor: '-' } },
    name: 'library checkout slip',
    fields: {
      footerMsg: 'PLEASE RETURN ON OR BEFORE DUE DATE',
      sectionTitle: 'books borrowed',
      placeholders: ['laskar pelangi', 'bumi manusia', 'cantik itu luka', '', '']
    },
    drawContent: (pCtx, { fx, printWidth, margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(row('BORROWER:', 'MEMBER #08812', maxChars), margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      items.forEach((text, i) => {
        if (!text) return;
        pCtx.fillText(row(`${i + 1}. ${text}`, '', maxChars), margin, y);
        y += lineHeight;
        pCtx.fillText(row('   CALL NO. 899.221', 'DUE 20/09', maxChars), margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.textAlign = 'center';
      pCtx.fillText('D A T E   D U E', printWidth / 2, y);
      pCtx.textAlign = 'left';
      y += lineHeight * 0.4;

      // Ruled date-due card with a few rows already stamped
      const rowH = Math.round(lineHeight * 1.7);
      const dates = ['20 SEP 2026', '04 OCT 2026', '18 OCT 2026'];
      const ruleW = Math.max(1, Math.round(scale));
      for (let r = 0; r <= 4; r++) {
        pCtx.fillRect(margin, Math.round(y + r * rowH), printWidth - margin * 2, ruleW);
      }
      dates.forEach((date, r) => {
        const cx = printWidth / 2 + (r % 2 ? 1 : -1) * Math.round(30 * scale);
        fx.stamp(date, cx, y + r * rowH + rowH / 2, { angle: (r - 1) * 3, color: 'blue', size: Math.round(14 * scale) });
      });
      y += rowH * 4 + lineHeight;
      y += Math.round(10 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  }
};
