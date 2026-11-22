/* Editorial captions: every page becomes a tiny poster.
   Lead-in words: light, small.  *Key words*: heavy, large, uppercase, letters rise out of a mask, an underline sweeps in.
   Pages without key words: medium weight. [box] marker sweep, ~strike~, #count, {display-only}, %hidden, fx type = serif typewriter. */
(function () {
  const M = window.M;
  const { C, lerp, tw, E, prog } = M;
  const K = M.K;
  const F = (w, s, fam) => `${w} ${s}px ${fam || M.FONT}`;

  const parse = (words) => {
    let em = false, box = false;
    return words.map((w) => {
      let raw = w.w;
      const hide = raw.startsWith('%'), extra = raw.startsWith('{');
      raw = raw.replace(/^%/, '').replace(/[{}]/g, '');
      const lead = raw.replace(/^["']+/, '');
      if (lead.startsWith('*')) em = true;
      if (raw.includes('[')) box = true;
      const tok = { hide, extra, em, box, strike: raw.includes('~'), count: raw.includes('#'), fx: w.fx || 'rise', s: w.s, text: raw.replace(/[*\[\]~#]/g, '') };
      if (raw.replace(/["',.?!:]+$/, '').endsWith('*')) em = false;
      if (raw.includes(']')) box = false;
      return tok;
    });
  };
  const fmt = (txt, k) => {
    const m = txt.match(/^([^0-9]*)([0-9][0-9,]*)(.*)$/);
    if (!m) return txt;
    const n = parseInt(m[2].replace(/,/g, ''), 10), v = Math.round(n * k);
    return m[1] + (m[2].includes(',') ? v.toLocaleString('en-US') : String(v)) + m[3];
  };

  function layout(ctx, toks, o) {
    const hook = toks[0].fx === 'hook', type = toks[0].fx === 'type';
    const S = hook ? o.hookSmall ?? 50 : o.small ?? 40, B = hook ? o.hookBig ?? 104 : o.big ?? 72, MID = o.mid ?? 52;
    const anyEm = toks.some((t) => t.em && !t.hide);
    const vis = toks.filter((t) => !t.hide);
    // runs of same style
    const runs = [];
    for (const t of vis) {
      t.kind = type ? 'type' : anyEm ? (t.em ? 'big' : 'small') : 'mid';
      if (t.kind === 'big') t.text = t.text.toUpperCase();
      const last = runs[runs.length - 1];
      if (last && last.kind === t.kind) last.toks.push(t); else runs.push({ kind: t.kind, toks: [t] });
    }
    // merge very short small runs into a neighbouring line context is not needed; each run gets its own line(s)
    const lines = [];
    ctx.save();
    for (const r of runs) {
      const size = r.kind === 'big' ? B : r.kind === 'small' ? S : r.kind === 'type' ? o.typeSize ?? 50 : MID;
      const weight = r.kind === 'big' ? 800 : r.kind === 'small' ? 300 : 400;
      const fam = r.kind === 'type' ? o.serif || 'DejaVu Serif' : null;
      ctx.letterSpacing = r.kind === 'big' ? '-1px' : '0px';
      ctx.font = F(weight, size, fam);
      const space = ctx.measureText(' ').width;
      for (const t of r.toks) {
        ctx.font = F(t.box || t.count ? Math.max(weight, 600) : weight, size, fam);
        t.w = ctx.measureText(t.text).width;
        t.size = size; t.weight = t.box || t.count ? Math.max(weight, 600) : weight; t.fam = fam;
        if (r.kind === 'big') {
          t.chars = [];
          let acc = 0;
          for (const ch of t.text) { t.chars.push({ ch, x: acc }); acc += ctx.measureText(ch).width - 1; }
        }
      }
      const maxW = o.maxW ?? 1100;
      const total = r.toks.reduce((a, t) => a + t.w, 0) + space * (r.toks.length - 1);
      const n = Math.max(1, Math.ceil(total / maxW)), target = total / n;
      let cur = 0, line = { kind: r.kind, size, toks: [], space };
      lines.push(line);
      for (const t of r.toks) {
        const next = cur + (cur > 0 ? space : 0) + t.w;
        if (cur > 0 && (next > maxW || (lines.filter((l) => l.kind === r.kind).length < n && next - target > (t.w + space) / 2))) {
          line = { kind: r.kind, size, toks: [], space };
          lines.push(line);
          cur = 0;
        }
        cur += (cur > 0 ? space : 0) + t.w;
        line.toks.push(t);
      }
    }
    ctx.restore();
    const lh = (l) => (l.kind === 'big' ? l.size * 1.02 : l.size * 1.3);
    const H = lines.reduce((a, l) => a + lh(l), 0);
    let yy = -H / 2;
    for (const l of lines) {
      l.y = yy + lh(l) / 2;
      yy += lh(l);
      const lw = l.toks.reduce((a, t) => a + t.w, 0) + l.space * (l.toks.length - 1);
      l.w = lw;
      let x = -lw / 2;
      l.toks.forEach((t, j) => {
        t.dx = x; t.line = l;
        t.boxL = j > 0 && l.toks[j - 1].box && t.box;
        t.boxR = j < l.toks.length - 1 && l.toks[j + 1].box && t.box;
        x += t.w + l.space;
      });
    }
    return { lines, vis, y: hook ? o.hookY ?? 290 : o.y ?? 945 };
  }

  K.caps2 = (ctx, g, TM, o = {}) => {
    if (!TM._c2) {
      const pages = [];
      TM.lines.forEach((l) => {
        const toks = parse(l.words);
        let cur = [];
        toks.forEach((t, i) => {
          cur.push(t);
          if (/[.?!:]["]?$/.test(t.text) && i < toks.length - 1) { pages.push(cur); cur = []; }
        });
        if (cur.length) pages.push(cur);
      });
      const out = [];
      for (const p of pages) {
        if (p.every((t) => t.hide)) continue;
        p.forEach((t, i) => { if (t.extra && i > 0) t.s = Math.max(t.s, p[i - 1].s + 0.18); });
        if (p.length <= (o.maxWords ?? 11)) { out.push(p); continue; }
        let best = -1, bd = 1e9;
        p.forEach((t, i) => { if (i < p.length - 2 && /,$/.test(t.text) && Math.abs(i - p.length / 2) < bd) { bd = Math.abs(i - p.length / 2); best = i; } });
        if (best < 0) out.push(p); else out.push(p.slice(0, best + 1), p.slice(best + 1));
      }
      TM._c2 = out;
    }
    const P = TM._c2;
    ctx.save();
    ctx.globalAlpha *= 1 - tw(g, TM.duration - 0.7, TM.duration - 0.05, E.inCubic);
    P.forEach((p, pi) => {
      const shown = p.filter((t) => !t.hide);
      const first = Math.min(...shown.map((t) => t.s));
      if (g < first - 0.15) return;
      const q = P[pi + 1];
      const spoken = shown.filter((t) => !t.extra);
      const last = spoken.length ? spoken[spoken.length - 1].s : first;
      const qFirst = q ? Math.min(...q.filter((t) => !t.hide).map((t) => t.s)) : null;
      const t1 = q ? Math.min(Math.max(last + 0.32, qFirst - 0.45), qFirst - 0.34) : null;
      if (t1 != null && g > t1 + 0.7) return;
      if (!p._L) p._L = layout(ctx, p, o);
      const { lines, y } = p._L;
      const X = o.x ?? 720;
      let cursor = null;
      for (const l of lines) {
        const ly = y + l.y;
        if (l.kind === 'big') {
          // mask: letters rise from below the baseline, and fall back into it on exit
          ctx.save();
          ctx.beginPath();
          ctx.rect(X - l.w / 2 - 60, ly - l.size * 0.62, l.w + 120, l.size * 1.08);
          ctx.clip();
          ctx.font = F(800, l.size);
          ctx.letterSpacing = '0px';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          let n = 0;
          for (const t of l.toks) {
            const ts = t.s - 0.08;
            t.chars.forEach((c, ci) => {
              const tc = ts + ci * 0.03;
              n++;
              const pr = prog(g, tc, tc + 0.5);
              if (pr <= 0) return;
              const e = E.outExpo(pr);
              let dy = (1 - e) * l.size * 0.95;
              if (t1 != null) dy += E.inCubic(prog(g, t1 + n * 0.01, t1 + 0.3 + n * 0.01)) * l.size * 1.05;
              const spread = lerp(1.18, 1, e);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(c.ch, X + t.dx + c.x * spread, ly + dy);
            });
          }
          ctx.restore();
          // underline sweep
          const lastT = l.toks[l.toks.length - 1];
          const uk = E.inOutCubic(prog(g, lastT.s + 0.15, lastT.s + 0.5));
          const uo = t1 != null ? E.inCubic(prog(g, t1, t1 + 0.25)) : 0;
          if (uk > 0 && uo < 1) {
            ctx.fillStyle = C.white;
            const x0 = X - l.w / 2 + l.w * uo;
            ctx.fillRect(x0, ly + l.size * 0.48, (X - l.w / 2 + l.w * uk) - x0, 5);
          }
          continue;
        }
        l.toks.forEach((t, i) => {
          const ts = t.s - 0.06;
          const type = l.kind === 'type';
          const pr = prog(g, ts, ts + (type ? 0.02 : 0.45));
          if (pr <= 0) return;
          let a = 1, dy = 0, blur = 0;
          if (!type) { const e = E.outExpo(pr); a = E.outCubic(pr); dy = (1 - e) * t.size * 0.5; blur = (1 - e) * 8; }
          if (t1 != null) {
            const qq = prog(g, t1 + i * 0.012, t1 + 0.26 + i * 0.012);
            if (qq >= 1) return;
            const qe = E.inCubic(qq);
            a *= 1 - qe; dy -= qe * t.size * 0.35; blur += qe * 7;
          }
          const px = X + t.dx, py = ly + dy;
          ctx.save();
          ctx.globalAlpha *= a;
          ctx.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none';
          ctx.letterSpacing = '0px';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          ctx.font = F(t.weight, t.size, t.fam);
          let txt = t.text;
          if (type) {
            const n = Math.floor((g - ts) * 30);
            txt = txt.slice(0, Math.max(0, n));
            cursor = { x: px + ctx.measureText(txt).width + 5, y: py, s: t.size };
          }
          if (t.count) txt = fmt(txt, E.outCubic(prog(g, ts, ts + 0.7)));
          if (t.box) {
            const bk = E.outExpo(prog(g, ts - 0.05, ts + 0.3));
            const pl = t.boxL ? l.space / 2 + 1 : 12, prr = t.boxR ? l.space / 2 + 1 : 12;
            ctx.fillStyle = C.white;
            ctx.fillRect(px - pl, py - t.size * 0.62, (t.w + pl + prr) * bk, t.size * 1.24);
            ctx.fillStyle = C.bg;
          } else ctx.fillStyle = t.strike ? C.g2 : t.count ? '#FFFFFF' : l.kind === 'small' ? '#BDBDB9' : '#E4E4E0';
          ctx.fillText(txt, px, py);
          if (t.strike) {
            const sk = E.inOutCubic(prog(g, ts + 0.25, ts + 0.45));
            if (sk > 0) { ctx.fillStyle = C.white; ctx.fillRect(px - 4, py - 2, (t.w + 8) * sk, 4); }
          }
          ctx.restore();
        });
      }
      if (cursor && (t1 == null || g < t1) && Math.floor(g * 3) % 2 === 0) {
        ctx.fillStyle = C.white;
        ctx.fillRect(cursor.x, cursor.y - cursor.s * 0.45, 3, cursor.s * 0.9);
      }
    });
    ctx.restore();
  };
})();
