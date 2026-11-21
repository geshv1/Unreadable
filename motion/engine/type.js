/* System 3 — Kinetic typography: word-by-word lines, scramble labels, tabular counters. */
(function () {
  const M = window.M;
  const T = (M.T = {});
  const font = (w, s) => `${w} ${s}px ${M.FONT}`;
  const cache = new Map();

  T.layout = (ctx, o) => {
    const size = o.size ?? 54, w = o.weight ?? 400, ew = o.emWeight ?? 600, maxW = o.maxW ?? 860, lh = o.lineH ?? size * 1.22;
    const key = [o.text, size, w, ew, maxW, o.tracking].join('|');
    if (cache.has(key)) return cache.get(key);
    ctx.save();
    ctx.letterSpacing = o.tracking ?? '-0.6px';
    const words = o.text.split(/\s+/).filter(Boolean).map((raw) => ({ txt: raw.replace(/\*/g, ''), em: raw.includes('*') }));
    ctx.font = font(w, size);
    const space = ctx.measureText(' ').width;
    for (const wd of words) {
      ctx.font = font(wd.em ? ew : w, size);
      wd.w = ctx.measureText(wd.txt).width;
    }
    ctx.restore();
    // balanced wrap: aim every line at total / n so no word is left alone
    const total = words.reduce((a, b) => a + b.w, 0) + space * (words.length - 1);
    const n = Math.ceil(total / maxW);
    const target = total / n;
    const lines = [[]];
    let cur = 0;
    for (const wd of words) {
      const next = cur + (cur > 0 ? space : 0) + wd.w;
      const overshoot = next - target;
      if (cur > 0 && lines.length < n && (next > maxW || overshoot > (wd.w + space) / 2)) { lines.push([]); cur = 0; }
      cur += (cur > 0 ? space : 0) + wd.w;
      lines[lines.length - 1].push(wd);
    }
    lines.forEach((ln, li) => {
      const lw = ln.reduce((a, b) => a + b.w, 0) + space * (ln.length - 1);
      let x = o.align === 'left' ? 0 : -lw / 2;
      for (const wd of ln) {
        wd.dx = x;
        wd.dy = li * lh - ((lines.length - 1) * lh) / 2;
        x += wd.w + space;
      }
    });
    const res = { words, size, w, ew };
    cache.set(key, res);
    return res;
  };

  /**
   * Word-by-word line.
   * o: { text ('*word*' = emphasis), x, y, size, t0, stagger, times[] (absolute per-word starts), t1 (exit), color, emColor }
   */
  T.words = (ctx, o, t) => {
    const L = T.layout(ctx, o);
    const size = L.size, dur = o.dur ?? 0.5, ga = ctx.globalAlpha;
    ctx.save();
    ctx.letterSpacing = o.tracking ?? '-0.6px';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    L.words.forEach((wd, i) => {
      const st = o.times ? o.times[i] : o.t0 + i * (o.stagger ?? 0.085);
      const p = M.prog(t, st, st + dur);
      if (p <= 0) return;
      const e = M.E.outExpo(p);
      let a = M.E.outCubic(p), dy = (1 - e) * size * 0.55, blur = (1 - e) * 9;
      if (o.t1 != null) {
        const q = M.prog(t, o.t1 + i * 0.012, o.t1 + 0.26 + i * 0.012);
        if (q >= 1) return;
        const qe = M.E.inCubic(q);
        a *= 1 - qe;
        dy -= qe * size * 0.32;
        blur += qe * 7;
      }
      ctx.globalAlpha = ga * a;
      ctx.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none';
      ctx.font = font(wd.em ? L.ew : L.w, size);
      ctx.fillStyle = wd.em ? o.emColor || '#FFFFFF' : o.color || '#CFCFCB';
      ctx.fillText(wd.txt, o.x + wd.dx, o.y + wd.dy + dy);
    });
    ctx.restore();
  };

  const GLYPHS = '/\\-+×#01<>:=';
  /** small uppercase tracked label with scramble-decode reveal. t is local (0 = start). */
  T.label = (ctx, text, x, y, t, o = {}) => {
    if (t < 0) return;
    const size = o.size ?? 20, dur = o.dur ?? 0.45, n = text.length;
    let a = 1;
    if (o.t1 != null) a = 1 - M.E.inCubic(M.prog(t, o.t1, o.t1 + 0.3));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a * (o.alpha ?? 1);
    ctx.font = font(o.weight ?? 500, size);
    ctx.letterSpacing = o.tracking ?? '5px';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const full = ctx.measureText(text).width;
    const sx = o.align === 'left' ? x : o.align === 'right' ? x - full : x - full / 2;
    const rev = Math.floor(M.prog(t, 0, dur) * (n + 4));
    const rnd = M.rng(Math.floor(t * 28) * 977 + n);
    let s = '';
    for (let i = 0; i < n; i++) {
      if (text[i] === ' ') s += ' ';
      else if (i < rev - 4) s += text[i];
      else if (i < rev) s += GLYPHS[Math.floor(rnd() * GLYPHS.length)];
      else break;
    }
    ctx.fillStyle = o.color || M.C.g2;
    ctx.fillText(s, sx, y);
    ctx.restore();
  };

  /** number with fixed-width digits so counting never jitters */
  T.number = (ctx, str, x, y, o = {}) => {
    const size = o.size ?? 64;
    ctx.save();
    ctx.font = font(o.weight ?? 500, size);
    ctx.letterSpacing = '0px';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = o.color || M.C.white;
    const cw = ctx.measureText('0').width * (o.cell ?? 1.0);
    const widths = [...str].map((ch) => (/\d/.test(ch) ? cw : ctx.measureText(ch).width));
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
    [...str].forEach((ch, i) => {
      ctx.fillText(ch, cx + widths[i] / 2, y);
      cx += widths[i];
    });
    ctx.restore();
    return total;
  };
  T.counter = (ctx, from, to, x, y, t, t0, t1, o = {}) => {
    const v = M.lerp(from, to, M.tw(t, t0, t1, o.ease || M.E.outExpo));
    const s = (o.prefix || '') + v.toFixed(o.dec ?? 0) + (o.suffix || '');
    return T.number(ctx, s, x, y, o);
  };
})();
