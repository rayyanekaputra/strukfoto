export const RECEIPT_LAYOUTS = {
  album: {
    name: 'album receipt',
    fields: { footerMsg: 'THANK YOU FOR LISTENING' },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText('ITEM / TRACK DESCRIPTION        QTY', margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      items.forEach((text) => {
        if (!text) return;
        let line = text.toUpperCase();
        if (line.length > maxChars - 4) line = line.substring(0, maxChars - 4);
        const dots = '.'.repeat(Math.max(1, maxChars - line.length - 2));
        pCtx.fillText(`${line} ${dots} 1`, margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(`TOTAL TRACKS:                      ${items.filter(Boolean).length}`, margin, y);
      y += lineHeight;
      pCtx.fillText(`AUTH CODE:                   #SF2026`, margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  grocery: {
    name: 'grocery / market',
    fields: { footerMsg: '*** YOU SAVED $4.20 TODAY! ***' },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, maxChars, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText('ITEM DESCRIPTION               PRICE', margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      const mockPrices = ['$4.50 T', '$5.75 T', '$0.00 T', '$8.00 T', '$9.99 T'];
      items.forEach((text, i) => {
        if (!text) return;
        let line = text.toUpperCase();
        const price = mockPrices[i % mockPrices.length];
        if (line.length > maxChars - price.length - 1) line = line.substring(0, maxChars - price.length - 1);
        const spaces = ' '.repeat(Math.max(1, maxChars - line.length - price.length));
        pCtx.fillText(`${line}${spaces}${price}`, margin, y);
        y += lineHeight;
      });

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(`SUBTOTAL                       $28.24`, margin, y);
      y += lineHeight;
      pCtx.fillText(`TAX (10%)                       $2.82`, margin, y);
      y += lineHeight;
      pCtx.fillText(`TOTAL                          $31.06`, margin, y);
      y += lineHeight;
      pCtx.fillText(`CASH TENDERED                  $40.00`, margin, y);
      y += lineHeight;
      pCtx.fillText(`CHANGE DUE                      $8.94`, margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  airline: {
    name: 'airline boarding pass',
    fields: { footerMsg: 'HAVE A GOOD FLIGHT' },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(`PASSENGER: ${items[0] || 'RAYYAN/EKA'}`, margin, y);
      y += lineHeight;
      pCtx.fillText(`FLIGHT: SF-2026     GATE: B12`, margin, y);
      y += lineHeight;
      pCtx.fillText(`CLASS: FIRST       SEAT: 02A`, margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText('[CGK] --------------> [DPS]', margin, y);
      y += lineHeight;
      pCtx.fillText('JAKARTA               BALI', margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText('- - - - TEAR OFF STUB - - - -', margin, y);
      y += lineHeight;
      pCtx.fillText(`PASS: ${items[0] || 'RAYYAN/EKA'}`, margin, y);
      y += lineHeight;
      pCtx.fillText(`FLIGHT: SF-2026   SEAT: 02A   ZONE: 1`, margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  parking: {
    name: 'parking ticket',
    fields: { footerMsg: '* LOST TICKET SUBJECT TO MAX RATE *' },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(`PLATE #: ${items[0] || 'B 1234 XYZ'}`, margin, y);
      y += lineHeight;
      pCtx.fillText(`ENTRY TIME:                  18:02:14`, margin, y);
      y += lineHeight;
      pCtx.fillText(`EXIT TIME:                   23:10:05`, margin, y);
      y += lineHeight;
      pCtx.fillText(`DURATION:                    05H 07M`, margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(`RATE TIER (FIRST 2H)          $5.00`, margin, y);
      y += lineHeight;
      pCtx.fillText(`ADDITIONAL (3H)               $6.00`, margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(`TOTAL DUE                    $11.00`, margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  concert: {
    name: 'concert stub',
    fields: { footerMsg: 'VOID IF DETACHED // NO REFUNDS' },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(`VENUE: THE GRAND ARENA`, margin, y);
      y += lineHeight;
      pCtx.fillText(`DOORS OPEN: 20:00 | RATING: ALL AGES`, margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(`SEC: A1   | ROW: 04   | SEAT: 18`, margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(`HOLDER: ${items[0] || 'VIP GUEST'}`, margin, y);
      y += lineHeight;
      pCtx.fillText(`ADMIT: 01 PERSON`, margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  },

  atm: {
    name: 'atm slip',
    fields: { footerMsg: 'RECORD COPY - RETAIN FOR FILES' },
    drawContent: (pCtx, { margin, curY, lineHeight, scale, subDividerLine, items, renderPhoto, imagePos }) => {
      let y = curY;
      if (imagePos === 'top') y = renderPhoto(y);

      pCtx.fillText(`CARD: ************8821`, margin, y);
      y += lineHeight;
      pCtx.fillText(`TRANSACTION #: 009412`, margin, y);
      y += lineHeight;
      pCtx.fillText(`TYPE: WITHDRAWAL`, margin, y);
      y += lineHeight;

      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;
      pCtx.fillText(`AMOUNT:                     $200.00`, margin, y);
      y += lineHeight;
      pCtx.fillText(`FEE:                          $0.00`, margin, y);
      y += lineHeight;
      pCtx.fillText(subDividerLine, margin, y);
      y += lineHeight;

      if (imagePos === 'middle') y = renderPhoto(y);

      pCtx.fillText(`ACCOUNT BALANCE:          $1,240.00`, margin, y);
      y += lineHeight;
      pCtx.fillText(`AVAILABLE:                $1,240.00`, margin, y);
      y += Math.round(22 * scale);

      if (imagePos === 'bottom') y = renderPhoto(y);
      return y;
    }
  }
};
