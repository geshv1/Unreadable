/* Kit: shared helpers for timed compositions (act windows, labels, dashed lines, paged subtitles, props). */
(function () {
  const M = window.M;
  const { C, lerp, tw, E, env } = M;
  const K = (M.K = {});

  /** helpers bound to one timing file */
  K.track = (TM) => {
    const L = {};
    TM.lines.forEach((l) => (L[l.id] = l));
    const ls = (id) => L[id].start;
    const W = (id, i) => L[id].words[i].s;
    const win = (a, b) => [ls(a) - 0.08, b ? ls(b) - 0.04 : TM.duration];
    const alpha = (g, w, dout = 0.26) => env(g, w[0], w[1], 0.22, dout);
    return { L, ls, W, win, alpha };
  };

  K.dash = (ctx, a, b, k, o = {}) => {
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.setLineDash(o.dash || [3, 9]);
    ctx.lineDashOffset = o.offset || 0;
    ctx.strokeStyle = o.color || C.g2;
    ctx.lineWidth = o.lw || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(lerp(a.x, b.x, k), lerp(a.y, b.y, k));
    ctx.stroke();
    ctx.restore();
  };
  K.line = (ctx, pts, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.white;
    ctx.lineWidth = o.lw || 3;
    ctx.lineCap = o.cap || 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.restore();
  };
  K.chapter = (ctx, text, g, t0, y = 540, t1) =>
    M.T.label(ctx, text, 540, y, g - t0, { color: C.g2, size: 18, tracking: '6px', t1: t1 != null ? t1 - t0 : undefined });

  /** subtitles paged at sentence ends, so long lines never stack into a block */
  K.subtitles = (ctx, g, TM, o = {}) => {
    if (!TM._pages) {
      const pages = [];
      TM.lines.forEach((l) => {
        let cur = [];
        l.words.forEach((w, i) => {
          cur.push(w);
          if (/[.?!:]$/.test(w.w.replace(/\*/g, '')) && i < l.words.length - 1) { pages.push(cur); cur = []; }
        });
        if (cur.length) pages.push(cur);
      });
      TM._pages = pages;
    }
    const P = TM._pages;
    ctx.save();
    ctx.globalAlpha = 1 - tw(g, TM.duration - 0.7, TM.duration - 0.05, E.inCubic);
    P.forEach((p, i) => {
      const q = P[i + 1];
      if (g < p[0].s - 0.12) return;
      const last = p[p.length - 1].s;
      const t1 = q ? Math.min(Math.max(last + 0.3, q[0].s - 0.42), q[0].s - 0.38) : null;
      if (t1 != null && g > t1 + 0.6) return;
      M.T.words(ctx, { text: p.map((w) => w.w).join(' '), x: 540, y: o.y ?? 1390, times: p.map((w) => w.s - 0.06), t1 }, g);
    });
    ctx.restore();
  };

  // ---------- props ----------
  /** chair under a seated figure; f = joints returned by M.figure */
  K.chair = (ctx, f, dir, ground, o = {}) => {
    const U = f.U, sy = f.hip.y + 0.055 * U;
    const x0 = f.hip.x - dir * 0.1 * U, x1 = f.hip.x + dir * 0.17 * U;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.g3;
    ctx.lineWidth = o.lw || 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, sy); ctx.lineTo(x1, sy);
    ctx.moveTo(x0, sy); ctx.lineTo(x0, ground);
    ctx.moveTo(x1, sy); ctx.lineTo(x1, ground);
    if (o.back !== false) { ctx.moveTo(x0, sy); ctx.lineTo(x0 - dir * 0.03 * U, sy - 0.38 * U); }
    ctx.stroke();
    ctx.restore();
  };
  /** phone icon; k = 0..1 strike-through */
  K.phone = (ctx, x, y, s, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    ctx.strokeStyle = o.color || C.white;
    ctx.lineWidth = o.lw || 2.5;
    ctx.beginPath();
    ctx.roundRect(-s * 0.3, -s * 0.5, s * 0.6, s, s * 0.1);
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, s * 0.38); ctx.lineTo(s * 0.08, s * 0.38);
    ctx.stroke();
    if (o.strike > 0) {
      const k = M.clamp(o.strike), r = s * 0.62;
      ctx.lineWidth = (o.lw || 2.5) + 0.5;
      ctx.beginPath();
      ctx.moveTo(-r, -r);
      ctx.lineTo(lerp(-r, r, k), lerp(-r, r, k));
      ctx.stroke();
    }
    ctx.restore();
  };
  /** electric zig-zag between two points */
  K.bolt = (ctx, a, b, seed, o = {}) => {
    const r = M.rng(seed), n = o.n ?? 7, pts = [a];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    for (let i = 1; i < n; i++) {
      const u = i / n, j = (r() * 2 - 1) * (o.amp ?? 16);
      pts.push({ x: a.x + dx * u + nx * j, y: a.y + dy * u + ny * j });
    }
    pts.push(b);
    K.line(ctx, pts, { color: o.color || C.white, lw: o.lw || 3, alpha: o.alpha ?? 1 });
  };
  /** check mark drawn up to k */
  K.check = (ctx, x, y, s, k, o = {}) => {
    if (k <= 0) return;
    const p = [{ x: x - s * 0.45, y: y + s * 0.02 }, { x: x - s * 0.12, y: y + s * 0.32 }, { x: x + s * 0.48, y: y - s * 0.34 }];
    const l1 = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), l2 = Math.hypot(p[2].x - p[1].x, p[2].y - p[1].y);
    const d = k * (l1 + l2), pts = [p[0]];
    if (d <= l1) pts.push({ x: lerp(p[0].x, p[1].x, d / l1), y: lerp(p[0].y, p[1].y, d / l1) });
    else pts.push(p[1], { x: lerp(p[1].x, p[2].x, (d - l1) / l2), y: lerp(p[1].y, p[2].y, (d - l1) / l2) });
    K.line(ctx, pts, { color: o.color || C.white, lw: o.lw || 4 });
  };
  /** corner brackets around a box */
  K.brackets = (ctx, x, y, w, h, k, o = {}) => {
    if (k <= 0) return;
    const L = Math.min(w, h) * 0.28 * k;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.white;
    ctx.lineWidth = o.lw || 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      ctx.moveTo(cx, cy + sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * L, cy);
    }
    ctx.stroke();
    ctx.restore();
  };
})();
