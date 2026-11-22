/* Kit 2: expressive captions + scene sequencer with short, varied transitions. */
(function () {
  const M = window.M;
  const { C, lerp, tw, E, prog } = M;
  const K = M.K;
  const font = (w, s) => `${w} ${s}px ${M.FONT}`;

  // ================= captions =================
  // markers in the script's "show" text:
  //   *em*  bold white      [box]  marker-pen highlight     ~strike~  struck out
  //   #123  counts up        {x}    shown but not spoken     %x        spoken but hidden
  //   per-line "fx": hook (big, upper) | type (typewriter) | pop (scale in) | default rise
  const parse = (words) => {
    let em = false, box = false;
    return words.map((w, i) => {
      let raw = w.w;
      const hide = raw.startsWith('%');
      const extra = raw.startsWith('{');
      raw = raw.replace(/^%/, '').replace(/[{}]/g, '');
      const strike = raw.includes('~');
      const count = raw.startsWith('#');
      const emOpen = raw.startsWith('*') || raw.startsWith('"*');
      const boxOpen = raw.includes('[');
      if (emOpen) em = true;
      if (boxOpen) box = true;
      const tok = { i, hide, extra, strike, count, em, box, fx: w.fx || 'rise', s: w.s, text: raw.replace(/[*\[\]~#]/g, '') };
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

  function layoutPage(ctx, toks, size, maxW) {
    ctx.save();
    ctx.letterSpacing = '-0.5px';
    ctx.font = font(400, size);
    const space = ctx.measureText(' ').width;
    for (const t of toks) {
      ctx.font = font(t.em || t.box || t.count ? 600 : 400, size);
      t.w = ctx.measureText(t.text).width + (t.box ? 0 : 0);
    }
    ctx.restore();
    const vis = toks.filter((t) => !t.hide);
    const total = vis.reduce((a, t) => a + t.w, 0) + space * (vis.length - 1);
    const n = Math.max(1, Math.ceil(total / maxW)), target = total / n, lines = [[]];
    let cur = 0;
    for (const t of vis) {
      const next = cur + (cur > 0 ? space : 0) + t.w;
      if (cur > 0 && lines.length < n && (next > maxW || next - target > (t.w + space) / 2)) { lines.push([]); cur = 0; }
      cur += (cur > 0 ? space : 0) + t.w;
      lines[lines.length - 1].push(t);
    }
    const lh = size * 1.32;
    lines.forEach((ln, li) => {
      const lw = ln.reduce((a, t) => a + t.w, 0) + space * (ln.length - 1);
      let x = -lw / 2;
      ln.forEach((t, j) => {
        t.dx = x;
        t.dy = li * lh - ((lines.length - 1) * lh) / 2;
        t.boxL = j > 0 && ln[j - 1].box && t.box;
        t.boxR = j < ln.length - 1 && ln[j + 1].box && t.box;
        x += t.w + space;
      });
    });
    return { vis, space };
  }

  K.caps = (ctx, g, TM, o = {}) => {
    if (!TM._cp) {
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
        // keep display-only words after the word before them
        p.forEach((t, i) => { if (t.extra && i > 0) t.s = Math.max(t.s, p[i - 1].s + 0.18); });
        if (p.length <= (o.maxWords ?? 12)) { out.push(p); continue; }
        let best = -1, bd = 1e9;
        p.forEach((t, i) => { if (i < p.length - 2 && /,$/.test(t.text) && Math.abs(i - p.length / 2) < bd) { bd = Math.abs(i - p.length / 2); best = i; } });
        if (best < 0) out.push(p); else out.push(p.slice(0, best + 1), p.slice(best + 1));
      }
      TM._cp = out;
    }
    const P = TM._cp;
    ctx.save();
    ctx.globalAlpha *= 1 - tw(g, TM.duration - 0.7, TM.duration - 0.05, E.inCubic);
    P.forEach((p, pi) => {
      const spoken = p.filter((t) => !t.hide && !t.extra);
      const q = P[pi + 1];
      const first = Math.min(...p.filter((t) => !t.hide).map((t) => t.s));
      if (g < first - 0.12) return;
      const last = spoken.length ? spoken[spoken.length - 1].s : first;
      const qFirst = q ? Math.min(...q.filter((t) => !t.hide).map((t) => t.s)) : null;
      const t1 = q ? Math.min(Math.max(last + 0.3, qFirst - 0.42), qFirst - 0.36) : null;
      if (t1 != null && g > t1 + 0.6) return;
      const fx = p[0].fx;
      const size = fx === 'hook' ? o.hookSize ?? 74 : o.size ?? 46;
      const y = fx === 'hook' ? o.hookY ?? 300 : o.y ?? 950;
      const x = o.x ?? 720;
      if (!p._lay || p._lay.size !== size) p._lay = { size, ...layoutPage(ctx, p, size, fx === 'hook' ? o.hookMaxW ?? 1100 : o.maxW ?? 1100) };
      const { vis } = p._lay;
      let cursorAt = null;
      vis.forEach((t, i) => {
        const ts = t.s - 0.06;
        const pr = prog(g, ts, ts + (fx === 'type' ? 0.02 : 0.45));
        if (pr <= 0) return;
        let a = 1, dy = 0, blur = 0, sc = 1;
        if (fx === 'pop') { const e = E.outBack(pr); sc = lerp(1.5, 1, M.clamp(e)); a = M.clamp(pr * 2.5); }
        else if (fx !== 'type') { const e = E.outExpo(pr); a = E.outCubic(pr); dy = (1 - e) * size * 0.55; blur = (1 - e) * 9; }
        if (t1 != null) {
          const qq = prog(g, t1 + i * 0.012, t1 + 0.26 + i * 0.012);
          if (qq >= 1) return;
          const qe = E.inCubic(qq);
          a *= 1 - qe; dy -= qe * size * 0.32; blur += qe * 7;
        }
        const px = x + t.dx, py = y + t.dy + dy;
        ctx.save();
        ctx.globalAlpha *= a;
        ctx.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none';
        ctx.letterSpacing = '-0.5px';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.font = font(t.em || t.box || t.count ? 600 : 400, size);
        let txt = t.text;
        if (fx === 'type') {
          const n = Math.floor((g - ts) * 32);
          txt = txt.slice(0, Math.max(0, n));
          if (n < t.text.length || i === vis.length - 1 || (vis[i + 1] && g < vis[i + 1].s - 0.06)) cursorAt = { x: px + ctx.measureText(txt).width + 4, y: py };
        }
        if (t.count) txt = fmt(txt, E.outCubic(prog(g, ts, ts + 0.7)));
        if (sc !== 1) { ctx.translate(px + t.w / 2, py); ctx.scale(sc, sc); ctx.translate(-(px + t.w / 2), -py); }
        if (t.box) {
          const bk = E.outExpo(prog(g, ts - 0.05, ts + 0.3));
          const padL = t.boxL ? p._lay.space / 2 + 1 : 12, padR = t.boxR ? p._lay.space / 2 + 1 : 12;
          ctx.fillStyle = C.white;
          ctx.fillRect(px - padL, py - size * 0.6, (t.w + padL + padR) * bk, size * 1.2);
          ctx.fillStyle = C.bg;
        } else ctx.fillStyle = t.strike ? C.g2 : t.em || t.count ? '#FFFFFF' : o.color || '#CFCFCB';
        ctx.fillText(txt, px, py);
        if (t.strike) {
          const sk = E.inOutCubic(prog(g, ts + 0.22, ts + 0.42));
          if (sk > 0) {
            ctx.strokeStyle = C.white;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px - 4, py + 2);
            ctx.lineTo(px - 4 + (t.w + 8) * sk, py - 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      });
      if (fx === 'type' && cursorAt && (t1 == null || g < t1) && Math.floor(g * 3) % 2 === 0) {
        ctx.save();
        ctx.fillStyle = C.white;
        ctx.fillRect(cursorAt.x, cursorAt.y - size * 0.45, 4, size * 0.9);
        ctx.restore();
      }
    });
    ctx.restore();
  };

  // ================= scene sequencer =================
  // scenes: [{ t, fn(ctx, g, lt), tr, z: {x, y} }]; tr is the transition INTO the scene:
  //   cut | slide | up | zoom (into outgoing scene's z point) | iris | wipe | shrink (outgoing scene → rect r)
  K.seq = (scenes, W, H, d = 0.42) => (ctx, g) => {
    let i = 0;
    for (let j = 0; j < scenes.length; j++) if (g >= scenes[j].t - d / 2) i = j;
    const cur = scenes[i], prev = scenes[i - 1];
    const e = E.inOutCubic(prog(g, cur.t - d / 2, cur.t + d / 2));
    const draw = (s, fn) => { ctx.save(); fn(); s.fn(ctx, g, g - s.t); ctx.restore(); };
    if (!prev || e >= 1 || cur.tr === 'cut') { draw(cur, () => {}); return; }
    const tr = cur.tr || 'slide', z = prev.z || { x: W / 2, y: H / 2 };
    if (tr === 'slide' || tr === 'up') {
      const dx = tr === 'slide' ? 300 : 0, dy = tr === 'up' ? 220 : 0;
      draw(prev, () => { ctx.globalAlpha = 1 - e; ctx.translate(-dx * e, -dy * e); });
      draw(cur, () => { ctx.globalAlpha = e; ctx.translate(dx * (1 - e), dy * (1 - e)); });
    } else if (tr === 'zoom') {
      draw(prev, () => { ctx.globalAlpha = Math.pow(1 - e, 1.4); ctx.translate(z.x, z.y); ctx.scale(1 + 3 * e, 1 + 3 * e); ctx.translate(-z.x, -z.y); });
      draw(cur, () => { const s = lerp(0.9, 1, e); ctx.globalAlpha = e; ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); });
    } else if (tr === 'iris') {
      const c = cur.iris || { x: W / 2, y: H * 0.42 }, R = Math.hypot(W, H) * e;
      draw(prev, () => { ctx.globalAlpha = 1 - e * 0.6; });
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, M.TAU);
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.clip();
      draw(cur, () => {});
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, M.TAU);
      ctx.strokeStyle = C.white;
      ctx.globalAlpha = 1 - e;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else if (tr === 'wipe') {
      const x = W * e;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, W - x, H);
      ctx.clip();
      draw(prev, () => {});
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, x, H);
      ctx.clip();
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, x, H);
      draw(cur, () => {});
      ctx.restore();
      ctx.fillStyle = C.white;
      ctx.fillRect(x - 2, 0, 4, H);
    } else if (tr === 'shrink') {
      const r = cur.r;
      draw(cur, () => { ctx.globalAlpha = e; });
      draw(prev, () => {
        const s = lerp(1, r.w / W, e);
        ctx.globalAlpha = 1 - e;
        ctx.translate(lerp(0, r.x, e), lerp(0, r.y, e));
        ctx.scale(s, s);
      });
    }
  };
})();
