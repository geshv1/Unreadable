/* System 4 — Infographic storytelling: paths, milestones, bars, arcs, arrows, ticks, tags. */
(function () {
  const M = window.M;
  const I = (M.I = {});

  /** arc-length parameterised path, optionally Catmull-Rom smoothed */
  I.Path = class {
    constructor(pts, smooth = true, res = 24) {
      let P = pts;
      if (smooth && pts.length > 2) {
        P = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
          for (let s = 0; s < res; s++) {
            const u = s / res, u2 = u * u, u3 = u2 * u;
            const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
            P.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
          }
        }
        P.push(pts[pts.length - 1]);
      }
      this.p = P;
      this.l = [0];
      for (let i = 1; i < P.length; i++) this.l.push(this.l[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
      this.len = this.l[this.l.length - 1];
    }
    at(u) {
      const d = M.clamp(u) * this.len, l = this.l;
      let lo = 0, hi = l.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; l[m] < d ? (lo = m) : (hi = m); }
      const seg = l[hi] - l[lo] || 1, f = (d - l[lo]) / seg, a = this.p[lo], b = this.p[hi];
      return { x: M.lerp(a.x, b.x, f), y: M.lerp(a.y, b.y, f), a: Math.atan2(b.y - a.y, b.x - a.x), i: lo };
    }
    /** st: { stroke, lw, dash, offset, alpha, cap } */
    draw(ctx, u0, u1, st = {}) {
      if (u1 <= u0) return;
      const A = this.at(u0), B = this.at(u1);
      ctx.save();
      ctx.globalAlpha *= st.alpha ?? 1;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      for (let i = A.i + 1; i <= B.i; i++) ctx.lineTo(this.p[i].x, this.p[i].y);
      ctx.lineTo(B.x, B.y);
      ctx.setLineDash(st.dash || []);
      ctx.lineDashOffset = st.offset || 0;
      ctx.strokeStyle = st.stroke || M.C.white;
      ctx.lineWidth = st.lw || 3;
      ctx.lineCap = st.cap || 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  };

  /** milestone: pops in with a ring pulse. t local. */
  I.node = (ctx, x, y, t, o = {}) => {
    if (t < 0) return;
    const r = o.r ?? 8, s = M.E.outBack(M.prog(t, 0, 0.4));
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.beginPath();
    ctx.arc(x, y, r * s, 0, M.TAU);
    if (o.hollow) {
      ctx.fillStyle = M.C.bg; ctx.fill();
      ctx.strokeStyle = o.color || M.C.white; ctx.lineWidth = o.lw || 2.5; ctx.stroke();
    } else {
      ctx.fillStyle = o.color || M.C.white; ctx.fill();
    }
    if (o.pulse !== false) {
      const q = M.prog(t, 0.05, 1.0);
      if (q < 1) {
        ctx.globalAlpha *= (1 - q) * 0.8;
        ctx.beginPath();
        ctx.arc(x, y, r + M.E.outCubic(q) * r * 3.6, 0, M.TAU);
        ctx.strokeStyle = o.color || M.C.white;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /** ruler ticks along a horizontal line; k reveals left→right */
  I.ticks = (ctx, x, y, w, n, k, o = {}) => {
    ctx.save();
    ctx.strokeStyle = o.color || M.C.g3;
    ctx.lineWidth = o.lw || 2;
    for (let i = 0; i <= n; i++) {
      const lk = M.clamp(k * (n + 4) - i);
      if (lk <= 0) continue;
      const major = o.major && i % o.major === 0, h = (major ? o.h2 ?? 14 : o.h ?? 7) * M.E.outCubic(lk);
      const px = x + (w * i) / n;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
      ctx.stroke();
    }
    ctx.restore();
  };

  /** horizontal progress bar */
  I.bar = (ctx, x, y, w, k, o = {}) => {
    const h = o.h ?? 6;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillStyle = o.track || M.C.g4;
    ctx.fillRect(x, y - h / 2, w * (o.trackK ?? 1), h);
    ctx.fillStyle = o.color || M.C.white;
    ctx.fillRect(x, y - h / 2, w * M.clamp(k), h);
    ctx.restore();
  };

  /** arc progress around (x,y) */
  I.arc = (ctx, x, y, r, k, o = {}) => {
    M.G.ring(ctx, x, y, r, { ...o, k: M.clamp(k) });
  };

  /** arrow drawn from a to b up to k */
  I.arrow = (ctx, x1, y1, x2, y2, k, o = {}) => {
    if (k <= 0) return;
    const x = M.lerp(x1, x2, k), y = M.lerp(y1, y2, k), a = Math.atan2(y2 - y1, x2 - x1), hs = o.head ?? 14;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || M.C.white;
    ctx.lineWidth = o.lw || 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(o.dash || []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a - 0.5) * hs, y - Math.sin(a - 0.5) * hs);
    ctx.lineTo(x, y);
    ctx.lineTo(x - Math.cos(a + 0.5) * hs, y - Math.sin(a + 0.5) * hs);
    ctx.stroke();
    ctx.restore();
  };

  /** callout: leader line up from (x,y) then label. t local. */
  I.tag = (ctx, text, x, y, len, t, o = {}) => {
    if (t < 0) return;
    let a = 1;
    if (o.t1 != null) a = 1 - M.E.inCubic(M.prog(t, o.t1, o.t1 + 0.25));
    if (a <= 0) return;
    const k = M.E.outExpo(M.prog(t, 0, 0.35));
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = o.line || M.C.g3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - len * k);
    ctx.stroke();
    M.T.label(ctx, text, x, y - len - 18, t - 0.15, { color: o.color || M.C.g1, size: o.size ?? 19, tracking: '4px' });
    ctx.restore();
  };
})();
