/* Core: palette, math, easing, noise, timeline. Everything is deterministic: render(t) always gives the same frame. */
(function () {
  const M = (window.M = window.M || {});
  M.W = 1080;
  M.H = 1920;
  M.TAU = Math.PI * 2;
  M.FONT = 'Inter';
  M.C = {
    bg: '#040404',
    white: '#F5F5F2',
    g1: '#C9C9C6',
    g2: '#8C8C8A',
    g3: '#555553',
    g4: '#2D2D2C',
    g5: '#181818',
  };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
  M.clamp = clamp;
  M.lerp = lerp;
  M.prog = prog;

  const E = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  M.E = E;

  /** eased progress of t through [a,b] */
  M.tw = (t, a, b, e = E.inOutCubic) => e(prog(t, a, b));
  /** 0→1→0 envelope: rises over [a, a+din], falls over [b-dout, b] */
  M.env = (t, a, b, din = 0.35, dout = 0.3, ei = E.outCubic, eo = E.inCubic) => {
    if (t < a || t > b) return 0;
    const i = din > 0 ? ei(prog(t, a, a + din)) : 1;
    const o = dout > 0 ? 1 - eo(prog(t, b - dout, b)) : 1;
    return Math.min(i, o);
  };

  /** mix two #rrggbb colours */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  M.mix = (a, b, t) => {
    const A = hex(a), B = hex(b), k = clamp(t);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
  };

  M.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  /** smooth 1D value noise in [-1, 1] */
  M.noise = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i + seed * 57.31), hash(i + 1 + seed * 57.31), u) * 2 - 1;
  };

  /** run fn inside a transformed / faded layer */
  M.layer = (ctx, o, fn) => {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= clamp(o.alpha);
    if (o.x || o.y) ctx.translate(o.x || 0, o.y || 0);
    if (o.ox != null) ctx.translate(o.ox, o.oy);
    if (o.rot) ctx.rotate(o.rot);
    if (o.scale != null) ctx.scale(o.scale, o.scale);
    if (o.ox != null) ctx.translate(-o.ox, -o.oy);
    fn();
    ctx.restore();
  };

  M.Timeline = class {
    constructor(duration, w = M.W, h = M.H) {
      this.duration = duration;
      this.w = w;
      this.h = h;
      this.items = [];
    }
    add(start, dur, draw) {
      this.items.push({ start, dur, draw });
      return this;
    }
    render(ctx, t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.fillStyle = M.C.bg;
      ctx.fillRect(0, 0, this.w, this.h);
      for (const it of this.items) {
        if (t < it.start || t > it.start + it.dur) continue;
        ctx.save();
        it.draw(ctx, t - it.start, it.dur, t);
        ctx.restore();
        ctx.filter = 'none';
      }
    }
  };

  M.comps = M.comps || {};
})();
