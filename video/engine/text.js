/* Text system: — TOP LINE — / italic serif headline with red keyword / small subline.
   Everything is fully visible on the first frame of a scene; optional fast pop (<=0.16s). */
(function () {
  const V = window.V;
  const CX = 540;          // centre of the text column
  const MAXW = 760;        // 160..920 — stays clear of the right-hand TikTok UI
  const TOP_Y = 412;       // centre of the top line

  function wordsWithColor(text, red) {
    const i = red ? text.lastIndexOf(red) : -1;
    const parts = i < 0 ? [[text, false]] : [[text.slice(0, i), false], [red, true], [text.slice(i + red.length), false]];
    const out = [];
    for (const [s, isRed] of parts) for (const w of s.split(/\s+/).filter(Boolean)) out.push({ w, red: isRed });
    // glue punctuation-only tokens to previous word
    return out;
  }

  function headlineLayout(g, words) {
    const measure = (ws, size) => { g.font = `italic 400 ${size}px ${V.FONT.serif}`; return g.measureText(ws.map((x) => x.w).join(' ')).width; };
    for (let size = 124; size >= 104; size -= 2) if (measure(words, size) <= MAXW) return { size, lines: [words] };
    // two balanced lines
    let best = null;
    for (let size = 100; size >= 70; size -= 2) {
      for (let k = 1; k < words.length; k++) {
        const a = words.slice(0, k), b = words.slice(k);
        const wa = measure(a, size), wb = measure(b, size);
        if (Math.max(wa, wb) <= MAXW) {
          const score = Math.abs(wa - wb);
          if (!best || score < best.score) best = { size, lines: [a, b], score };
        }
      }
      if (best) return best;
    }
    return { size: 70, lines: [words] };
  }

  function drawLine(g, ws, y, size) {
    g.font = `italic 400 ${size}px ${V.FONT.serif}`;
    const space = g.measureText(' ').width;
    const widths = ws.map((x) => g.measureText(x.w).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (ws.length - 1);
    let x = CX - total / 2;
    g.textAlign = 'left';
    ws.forEach((wd, i) => { g.fillStyle = wd.red ? V.COL.red : '#FFFFFF'; g.fillText(wd.w, x, y); x += widths[i] + space; });
  }

  function topLine(g, text, y) {
    // long lines: first tighten the side lines and letter spacing, only then shrink (never below 21px)
    let size = 27, sp = 0.36, L = 54, w;
    g.textBaseline = 'middle'; g.textAlign = 'center';
    const fit = () => { g.font = `500 ${size}px ${V.FONT.sans}`; g.letterSpacing = `${(size * sp).toFixed(1)}px`; w = g.measureText(text).width; return w + 2 * (24 + L) <= MAXW; };
    while (!fit()) { if (L > 26) L -= 4; else if (sp > 0.2) sp -= 0.02; else if (size > 21) size -= 1; else break; }
    const ls = size * sp;
    g.fillStyle = '#D6D8DF';
    g.fillText(text, CX + ls / 2, y);
    g.letterSpacing = '0px';
    g.strokeStyle = 'rgba(214,216,223,0.75)'; g.lineWidth = 2;
    const half = w / 2, gap = 24;
    g.beginPath(); g.moveTo(CX - half - gap - L, y); g.lineTo(CX - half - gap, y);
    g.moveTo(CX + half + gap, y); g.lineTo(CX + half + gap + L, y); g.stroke();
  }

  // sc: {top, headline, red, sub}; tl = seconds since scene start; popIn = whether to pop
  V.drawText = function (g, sc, tl, popIn = true) {
    g.save();
    if (V.ep && V.ep.textStyle === 'rise') {
      const u = popIn ? V.ease.out(V.clamp(tl / 0.2)) : 1;
      g.globalAlpha = u; g.translate(0, (1 - u) * 18);
    } else {
      const k = popIn ? V.pop(tl) : 1;
      g.translate(CX, 560); g.scale(k, k); g.translate(-CX, -560);
    }
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 22;
    let y = TOP_Y;
    const top = sc.top !== undefined ? sc.top : V.ep && V.ep.top;   // episode-wide top line fallback
    if (top) { topLine(g, top, y); }
    g.textBaseline = 'alphabetic';
    const L = headlineLayout(g, wordsWithColor(sc.headline, sc.red));
    let base = y + 44 + L.size * 0.8;
    L.lines.forEach((ln, i) => { drawLine(g, ln, base, L.size); if (i < L.lines.length - 1) base += L.size * 0.98; });
    let y2 = base;
    if (sc.sub) {
      g.letterSpacing = '0.5px'; g.textAlign = 'center';
      g.fillStyle = sc.subColor || '#D2D4DB';
      let size = sc.subSize || 42, lines = [sc.sub];
      const fits = (ls, s) => { g.font = `400 ${s}px ${V.FONT.sans}`; return ls.every((l) => g.measureText(l).width <= MAXW); };
      while (!fits(lines, size) && size > 38) size -= 1;
      if (!fits(lines, size)) { const i = sc.sub.indexOf(' — '); lines = i > 0 ? [sc.sub.slice(0, i + 2), sc.sub.slice(i + 3)] : [sc.sub]; size = sc.subSize || 42; while (!fits(lines, size) && size > 38) size -= 1; }
      g.font = `400 ${size}px ${V.FONT.sans}`;
      lines.forEach((l, i) => g.fillText(l, CX, base + 70 + i * size * 1.22));
      y2 = base + 70 + (lines.length - 1) * size * 1.22;
    }
    if (sc.sub2) {
      g.font = `700 34px ${V.FONT.sans}`; g.letterSpacing = '6px'; g.textAlign = 'center';
      g.fillStyle = sc.sub2Color || '#F4F5F7';
      g.fillText(sc.sub2, CX + 3, y2 + 62);
    }
    g.restore();
  };
})();
