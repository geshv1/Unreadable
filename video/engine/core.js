/* Core constants + math helpers shared by every episode. */
(function () {
  const V = (window.V = window.V || {});

  V.W = 1080;
  V.H = 1920;
  V.FLOOR = 1400;          // floor line (feet) in px
  V.S = 4.3;               // rig units -> px  (figure ≈ 125u ≈ 538px ≈ 28% of frame)
  V.POS = { reactive: 320, steady: 700 }; // home x of each character

  V.COL = {
    bg: '#0B0B0F',
    red: '#E0344A',
    ink: '#F4F5F7',
    soft: '#C9CBD3',
    muted: '#868893',
    line: '#2a2b33',
    outline: '#16171c',
  };

  V.FONT = {
    serif: '"Instrument Serif", "Times New Roman", serif',
    sans: '"Archivo", "Helvetica Neue", Arial, sans-serif',
  };

  // Safe zones (TikTok UI)
  V.SAFE = { top: 220, bottom: 1920 - 450, right: 1080 - 160, left: 0 };

  V.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  V.lerp = (a, b, t) => a + (b - a) * t;
  V.seg = (t, a, b) => V.clamp((t - a) / (b - a));
  V.ease = {
    lin: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };

  // Fast "pop": fully opaque from the first frame, scales 0.82 -> 1 (with overshoot) in `d` seconds.
  V.pop = (t, d = 0.16) => (t < 0 ? 0 : t >= d ? 1 : 0.82 + 0.18 * V.ease.back(t / d));

  V.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Deterministic noise in [-1,1] for a given integer + seed
  V.hash = (n, seed = 1) => { const r = V.rng((n * 2654435761) ^ (seed * 97531)); r(); return r() * 2 - 1; };

  // Keyframe interpolation: keys = [[t, value], ...]; value is number or array
  V.kf = function (t, keys, ease = V.ease.inOut) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, a] = keys[i - 1], [t1, b] = keys[i];
        const k = ease((t - t0) / (t1 - t0 || 1));
        return Array.isArray(a) ? a.map((v, j) => V.lerp(v, b[j], k)) : V.lerp(a, b, k);
      }
    }
    return keys[keys.length - 1][1];
  };

  V.add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  V.sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  V.mul = (a, k) => [a[0] * k, a[1] * k];
  V.len = (a) => Math.hypot(a[0], a[1]);
  V.rot = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };

  V.roundRect = function (g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  V.makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  V.actions = V.actions || {};
  V.sets = V.sets || {};
})();
