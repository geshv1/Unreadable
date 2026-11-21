/* System 2 — Geometric motion graphics: primitives, 3D wireframes, grids, shatter, shape fields. */
(function () {
  const M = window.M;
  const { TAU, lerp } = M;
  const G = (M.G = {});

  const poly = (ctx, x, y, r, n, rot) => {
    for (let i = 0; i <= n; i++) {
      const a = rot + (i / n) * TAU;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  G.path = (ctx, type, x, y, s, rot = 0) => {
    ctx.beginPath();
    switch (type) {
      case 'circle': ctx.arc(x, y, s, 0, TAU); break;
      case 'square': poly(ctx, x, y, s * 1.2, 4, rot + Math.PI / 4); break;
      case 'diamond': poly(ctx, x, y, s * 1.2, 4, rot); break;
      case 'triangle': poly(ctx, x, y, s * 1.3, 3, rot - Math.PI / 2); break;
      case 'hex': poly(ctx, x, y, s * 1.1, 6, rot); break;
      case 'plus': {
        const c = Math.cos(rot), sn = Math.sin(rot);
        ctx.moveTo(x - c * s, y - sn * s); ctx.lineTo(x + c * s, y + sn * s);
        ctx.moveTo(x + sn * s, y - c * s); ctx.lineTo(x - sn * s, y + c * s);
        break;
      }
    }
  };
  /** st: { fill, stroke, lw, alpha } */
  G.shape = (ctx, type, x, y, s, rot, st = {}) => {
    if (s <= 0.2) return;
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * (st.alpha ?? 1);
    G.path(ctx, type, x, y, s, rot);
    if (st.fill && type !== 'plus') { ctx.fillStyle = st.fill; ctx.fill(); }
    if (st.stroke || type === 'plus') {
      ctx.lineWidth = st.lw || 2.5;
      ctx.strokeStyle = st.stroke || st.fill;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.globalAlpha = ga;
  };
  G.ring = (ctx, x, y, r, st = {}) => {
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * (st.alpha ?? 1);
    ctx.beginPath();
    const a0 = st.a0 ?? -Math.PI / 2, k = st.k ?? 1;
    ctx.arc(x, y, r, a0, a0 + TAU * k);
    ctx.setLineDash(st.dash || []);
    ctx.lineDashOffset = st.offset || 0;
    ctx.lineWidth = st.lw || 2;
    ctx.strokeStyle = st.stroke || M.C.white;
    ctx.lineCap = st.cap || 'butt';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = ga;
  };

  // ---------- 3D ----------
  G.rot3 = (p, rx, ry, rz) => {
    let { x, y, z } = p, c, s;
    c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ry); s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rz); s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c];
    return { x, y, z };
  };
  G.proj = (p, cx, cy, f = 1100) => {
    const k = f / (f + p.z);
    return { x: cx + p.x * k, y: cy + p.y * k, z: p.z };
  };
  const seg3 = (ctx, a, b, s, st) => {
    // depth-cued segment: nearer = brighter
    const depth = M.clamp(0.5 - (a.z + b.z) / (4 * s));
    ctx.globalAlpha = (st.alpha ?? 1) * lerp(st.backAlpha ?? 0.22, 1, depth);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  G.cube = (ctx, cx, cy, s, rx, ry, rz, st = {}) => {
    const v = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push(G.proj(G.rot3({ x: x * s, y: y * s, z: z * s }, rx, ry, rz), cx, cy));
    const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    ctx.save();
    ctx.strokeStyle = st.stroke || M.C.white;
    ctx.lineWidth = st.lw || 2;
    ctx.lineCap = 'round';
    const k = st.k ?? 1;
    E.forEach(([a, b], i) => {
      const local = M.clamp(k * E.length - i);
      if (local <= 0) return;
      const B = { x: lerp(v[a].x, v[b].x, local), y: lerp(v[a].y, v[b].y, local), z: lerp(v[a].z, v[b].z, local) };
      seg3(ctx, v[a], B, s, st);
    });
    ctx.restore();
  };
  G.sphere = (ctx, cx, cy, r, rx, ry, st = {}) => {
    ctx.save();
    ctx.strokeStyle = st.stroke || M.C.white;
    ctx.lineWidth = st.lw || 1.6;
    const nLat = st.lat ?? 5, nLon = st.lon ?? 8, N = 40;
    const draw = (fn) => {
      let prev = null;
      for (let i = 0; i <= N; i++) {
        const p = G.proj(G.rot3(fn(i / N), rx, ry, 0), cx, cy);
        if (prev) seg3(ctx, prev, p, r, st);
        prev = p;
      }
    };
    for (let j = 1; j < nLat; j++) {
      const phi = (j / nLat) * Math.PI - Math.PI / 2, y = Math.sin(phi) * r, rr = Math.cos(phi) * r;
      draw((u) => ({ x: Math.cos(u * TAU) * rr, y, z: Math.sin(u * TAU) * rr }));
    }
    for (let j = 0; j < nLon; j++) {
      const th = (j / nLon) * Math.PI;
      draw((u) => {
        const phi = u * TAU;
        return { x: Math.cos(th) * Math.cos(phi) * r, y: Math.sin(phi) * r, z: Math.sin(th) * Math.cos(phi) * r };
      });
    }
    ctx.restore();
  };

  /** grid of points or lines; distort(x,y) -> {x,y}; k reveals rows */
  G.grid = (ctx, cx, cy, cols, rows, cell, st = {}, distort = null) => {
    const w = (cols - 1) * cell, h = (rows - 1) * cell, k = st.k ?? 1;
    ctx.save();
    ctx.strokeStyle = st.stroke || M.C.g4;
    ctx.fillStyle = st.fill || M.C.g2;
    ctx.lineWidth = st.lw || 1.5;
    const pt = (i, j) => {
      const x = cx - w / 2 + i * cell, y = cy - h / 2 + j * cell;
      return distort ? distort(x, y, i, j) : { x, y };
    };
    if (st.lines) {
      for (let j = 0; j < rows; j++) {
        const lk = M.clamp(k * rows - j);
        if (lk <= 0) continue;
        ctx.beginPath();
        for (let i = 0; i < cols; i++) { const p = pt(i, j); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
        ctx.globalAlpha = lk * (st.alpha ?? 1);
        ctx.stroke();
      }
      for (let i = 0; i < cols; i++) {
        ctx.beginPath();
        for (let j = 0; j < rows; j++) { const p = pt(i, j); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
        ctx.globalAlpha = M.clamp(k) * (st.alpha ?? 1);
        ctx.stroke();
      }
    } else {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const lk = M.clamp(k * (rows + cols) - (i + j));
        if (lk <= 0) continue;
        const p = pt(i, j);
        ctx.globalAlpha = lk * (st.alpha ?? 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, (st.r || 2.5) * lk, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  /** polygon broken into shards; k = 0 whole … 1 scattered */
  G.shatter = (ctx, cx, cy, r, sides, k, seed, st = {}, rot = -Math.PI / 2) => {
    const rnd = M.rng(seed);
    const V = [];
    for (let i = 0; i < sides; i++) { const a = rot + (i / sides) * TAU; V.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
    const shards = [];
    for (let i = 0; i < sides; i++) {
      const a = V[i], b = V[(i + 1) % sides], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const c = { x: m.x * (0.35 + rnd() * 0.3), y: m.y * (0.35 + rnd() * 0.3) };
      shards.push([{ x: 0, y: 0 }, a, c], [a, m, c], [m, b, c], [{ x: 0, y: 0 }, c, b]);
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    for (const s of shards) {
      const gx = (s[0].x + s[1].x + s[2].x) / 3, gy = (s[0].y + s[1].y + s[2].y) / 3;
      const d = Math.hypot(gx, gy) || 1, push = k * (st.dist ?? r * 1.1) * (0.6 + rnd() * 0.8), spin = k * (rnd() * 2 - 1) * 1.6;
      ctx.save();
      ctx.translate(gx + (gx / d) * push, gy + (gy / d) * push);
      ctx.rotate(spin);
      ctx.beginPath();
      s.forEach((p, i) => (i ? ctx.lineTo(p.x - gx, p.y - gy) : ctx.moveTo(p.x - gx, p.y - gy)));
      ctx.closePath();
      if (st.fill) { ctx.fillStyle = st.fill; ctx.globalAlpha = st.alpha ?? 1; ctx.fill(); }
      if (st.stroke) { ctx.strokeStyle = st.stroke; ctx.lineWidth = st.lw || 1.5; ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
  };

  /**
   * A field of shapes that can be chaotic (orbiting, jittering) or ordered (any target layout).
   * opt: { types, sMin, sMax, rMin, rMax, spin, wobble, fillRatio }
   */
  G.Field = class {
    constructor(n, seed, opt) {
      const r = M.rng(seed);
      this.opt = opt;
      this.items = Array.from({ length: n }, (_, i) => ({
        i,
        type: opt.types[Math.floor(r() * opt.types.length)],
        s: lerp(opt.sMin, opt.sMax, r()),
        a: r() * TAU,
        rad: lerp(opt.rMin, opt.rMax, r()),
        w: (r() < 0.5 ? -1 : 1) * lerp(0.35, 1, r()) * opt.spin,
        rs: (r() * 2 - 1) * 3.2,
        ph: r() * 100,
        fill: r() < (opt.fillRatio ?? 0.3),
        delay: r(),
      }));
    }
    chaos(it, t) {
      const o = this.opt;
      const a = it.a + it.w * t + 0.5 * M.noise(t * 1.4 + it.ph, 1);
      const rad = it.rad + M.noise(t * 1.9 + it.ph * 2, 2) * (o.wobble ?? 30);
      return { x: Math.cos(a) * rad, y: Math.sin(a) * rad, rot: it.a + it.rs * t, s: it.s };
    }
    /** k: 0 chaos … 1 order; target(it, n, t) → {x,y,rot,s}; appear: 0..1 */
    draw(ctx, cx, cy, t, k, target, styleFn, appear = 1) {
      const n = this.items.length;
      for (const it of this.items) {
        const ap = M.E.outBack(M.clamp(appear * 1.6 - it.delay * 0.6));
        if (ap <= 0) continue;
        const c = this.chaos(it, t);
        const kk = M.E.inOutCubic(M.clamp(k * 1.5 - (it.i / n) * 0.5));
        const g = kk > 0 && target ? target(it, n, t) : c;
        const x = lerp(c.x, g.x, kk), y = lerp(c.y, g.y, kk);
        const rot = lerp(c.rot, g.rot, kk), s = lerp(c.s, g.s, kk) * ap;
        G.shape(ctx, it.type, cx + x, cy + y, s, rot, styleFn(it, kk));
      }
    }
  };
})();
