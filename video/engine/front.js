/* FRONT-FACING NARRATOR RIG — looks and talks straight into the camera.
   Same look as the side rig (capsule limbs, palettes, black spiky hair), drawn frontal.
   f = { x, y, s, gesture: {name or blended targets}, mouth 0..1, brow 0..1, blink 0..1 (1 open), look [dx, dy],
         point 0..1 (finger toward the lens), lean 0..1 (closer: scale up), nod (head offset), sway }
   Hand targets are in rig units (feet at y=0, head ≈ -112). L = screen-left hand, R = screen-right hand. */
(function () {
  const V = window.V;
  const { add, sub, mul, len, clamp } = V;
  const OL = '#16171c';

  V.FRONT = {
    idle: { L: [-18, -39], R: [18, -39] },
    explain: { L: [-17, -80], R: [18, -78] },
    palms: { L: [-36, -76], R: [36, -76] },
    chest: { L: [-18, -39], R: [3, -80] },
    shrug: { L: [-32, -86], R: [32, -86], up: 3 },
    present: { L: [-18, -39], R: [46, -94] },
    point: { L: [-18, -39], R: [12, -80] },         // with f.point = 1: finger at the lens (chest height, face stays clear)
    wave: { L: [-18, -39], R: [34, -120] },
    count: { L: [-14, -84], R: [16, -86] },
  };
  V.frontGesture = function (t, keys) { // keys = [[t, name], ...]: at each key time blend (0.35 s) from the previous gesture
    const get = (k) => V.FRONT[k];
    let j = 0;
    for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) j = i;
    const a = get(keys[Math.max(0, j - 1)][1]), b = get(keys[j][1]);
    const u = j === 0 ? 1 : V.ease.inOut(V.clamp((t - keys[j][0]) / 0.35));
    return { L: [V.lerp(a.L[0], b.L[0], u), V.lerp(a.L[1], b.L[1], u)], R: [V.lerp(a.R[0], b.R[0], u), V.lerp(a.R[1], b.R[1], u)], up: V.lerp(a.up || 0, b.up || 0, u) };
  };

  function ik(A, T, l1, l2, pref) {
    const d = sub(T, A), dist = len(d) || 0.001, u = mul(d, 1 / dist);
    const dc = clamp(dist, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.05);
    const Tc = add(A, mul(u, dc));
    const a = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const base = add(A, mul(u, a)), n = [-u[1], u[0]];
    const m1 = add(base, mul(n, h)), m2 = add(base, mul(n, -h));
    return [(m1[0] - base[0]) * pref[0] + (m1[1] - base[1]) * pref[1] >= 0 ? m1 : m2, Tc];
  }
  function line(g, a, b, col, w, alpha = 1) { g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.globalAlpha = 1; }
  function capsule(g, a, b, w, pal) {
    g.lineCap = 'round';
    line(g, a, b, OL, w + 3.2); line(g, a, b, pal[0], w);
    const d = sub(b, a), L = len(d) || 1, u = mul(d, 1 / L), n = [-u[1], u[0]];
    const k = clamp((n[0] * -0.8 + n[1] * -0.6) * 2.5, -1, 1);
    const a2 = add(a, mul(u, L * 0.12)), b2 = sub(b, mul(u, L * 0.12));
    line(g, add(a2, mul(n, -k * w * 0.26)), add(b2, mul(n, -k * w * 0.26)), pal[1], w * 0.42, 0.5);
    line(g, add(a2, mul(n, k * w * 0.27)), add(b2, mul(n, k * w * 0.27)), pal[2], w * 0.3, 0.8);
  }
  const circle = (g, c, r, fill, ol = OL, lw = 1.6) => { g.beginPath(); g.arc(c[0], c[1], r, 0, 6.283); g.fillStyle = fill; g.fill(); if (ol) { g.strokeStyle = ol; g.lineWidth = lw; g.stroke(); } };

  V.frontGeom = function (f) {
    const gs = f.gesture || V.FRONT.idle, up = gs.up || 0, sw = f.sway || 0, br = f.breath || 0;
    const C = [sw * 0.6, -88 - br - up * 0.4], P = [sw, -54];
    const G = { C, P };
    G.sL = [C[0] - 14, C[1] + 2 - up]; G.sR = [C[0] + 14, C[1] + 2 - up];
    G.hipL = [P[0] - 8, P[1] + 4]; G.hipR = [P[0] + 8, P[1] + 4];
    G.H = [C[0] + (f.headX || 0), C[1] - 23 + (f.nod || 0) - up * 0.3];
    [G.kL, G.fL] = ik(G.hipL, [-12, -4], 24, 22.7, [-1, 0]);
    [G.kR, G.fR] = ik(G.hipR, [12, -4], 24, 22.7, [1, 0]);
    let R = gs.R.slice();
    const p = f.point || 0;
    if (p > 0) R = [V.lerp(R[0], 12, p), V.lerp(R[1], -80, p)];
    [G.eL, G.hL] = ik(G.sL, gs.L, 20.5, 28, [-1, 0.6]);
    [G.eR, G.hR] = ik(G.sR, R, 20.5 - p * 6, 28 - p * 16, [1, 0.6]);   // forearm foreshortens toward the lens
    return G;
  };
  V.frontPoint = function (f, name) {
    const G = V.frontGeom(f), k = V.S * (f.s || 1);
    return [f.x + G[name][0] * k, (f.y == null ? V.FLOOR : f.y) + G[name][1] * k];
  };

  V.drawFront = function (g, f) {
    const pal = V.PAL[f.kind || 'steady'];
    const G = V.frontGeom(f);
    g.save();
    g.translate(f.x, f.y == null ? V.FLOOR : f.y);
    const k = V.S * (f.s || 1);
    g.scale(k, k);
    // legs
    for (const [hip, kn, ft, side] of [[G.hipL, G.kL, G.fL, -1], [G.hipR, G.kR, G.fR, 1]]) {
      capsule(g, hip, kn, 12, pal.leg); capsule(g, kn, ft, 11.5, pal.leg);
      g.beginPath(); g.ellipse(ft[0] + side * 3, ft[1] + 3, 8.5, 4.4, 0, 0, 6.283); g.fillStyle = pal.foot; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke();
    }
    // torso (front: slightly wider), hoodie seam for Reactive
    capsule(g, G.C, G.P, 27, pal.torso);
    const p = f.point || 0;
    // left arm (always behind nothing)
    capsule(g, G.sL, G.eL, 8.5, pal.arm); capsule(g, G.eL, G.hL, 8.5, pal.arm); circle(g, G.hL, 5.8, pal.fist);
    // head
    drawHead(g, G, f, pal);
    // right arm: when pointing, the hand comes toward the lens (bigger, finger out)
    capsule(g, G.sR, G.eR, 8.5 + p * 2, pal.arm);
    capsule(g, G.eR, G.hR, 8.5 + p * 4, pal.arm);
    if (p > 0.05) {
      const r = 5.8 + p * 6.5;
      circle(g, G.hR, r, pal.fist);
      // index finger pointing at the viewer: a fingertip disc with nail, in front of the fist
      const tip = [G.hR[0] - p * 1.5, G.hR[1] - p * 3];
      circle(g, tip, 2.6 + p * 3.6, '#ffffff');
      g.globalAlpha = 0.35; circle(g, [tip[0], tip[1] + 0.8], 1.3 + p * 1.6, '#c9cbd3', null); g.globalAlpha = 1;
      g.strokeStyle = OL; g.lineWidth = 1.1; g.beginPath(); g.arc(G.hR[0] + r * 0.25, G.hR[1] + r * 0.15, r * 0.55, 0.3, 2.2); g.stroke();   // curled fingers
    } else circle(g, G.hR, 5.8, pal.fist);
    g.restore();
  };

  function drawHead(g, G, f, pal) {
    const H = G.H;
    g.save(); g.translate(H[0], H[1]); g.rotate(f.headTilt || 0);
    circle(g, [0, 0], 14.5, pal.head);
    g.globalAlpha = 0.5; circle(g, [-5, -5], 5, '#fff', null); g.globalAlpha = 1;
    if (pal.extra === 'hair') { // spiky hair, frontal
      g.beginPath(); g.moveTo(-14.5, -1);
      g.quadraticCurveTo(-16, -12, -9, -15); g.lineTo(-7, -10); g.lineTo(-4, -17.5); g.lineTo(-1, -11); g.lineTo(3, -17.5); g.lineTo(5, -11); g.lineTo(10, -15.5);
      g.quadraticCurveTo(16, -11, 14.5, -1); g.quadraticCurveTo(10, -9, 3, -8.5); g.quadraticCurveTo(-6, -9, -14.5, -1); g.closePath();
      g.fillStyle = '#17181d'; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.2; g.lineJoin = 'round'; g.stroke();
    } else if (pal.extra === 'cap') {
      g.beginPath(); g.moveTo(-15, -2); g.quadraticCurveTo(-14, -18, 0, -18); g.quadraticCurveTo(14, -18, 15, -2); g.closePath(); g.fillStyle = '#d42a3c'; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke();
      g.beginPath(); g.ellipse(0, -1.5, 15, 3.4, 0, 0, 6.283); g.fillStyle = '#c22233'; g.fill(); g.stroke();
    }
    // face — looking into the lens
    const ink = '#101116', lx = (f.look ? f.look[0] : 0) * 1.4, ly = (f.look ? f.look[1] : 0) * 1;
    const blink = f.blink == null ? 1 : f.blink, br = f.brow || 0;
    g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
    for (const sx of [-1, 1]) {
      g.save(); g.translate(sx * 5.2 + lx, 2 + ly); g.scale(1, blink);
      g.beginPath(); g.ellipse(0, 0, 1.9, 2.3, 0, 0, 6.283); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-0.6, -0.8, 0.6, 0, 6.283); g.fill();
      g.restore(); g.fillStyle = ink;
      // brows: raise with emphasis, slight inner tilt when serious
      g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx * 2.8, -2.6 - br * 2 + (f.serious ? 0.8 : 0)); g.lineTo(sx * 7.6, -3.3 - br * 1.6); g.stroke();
    }
    const m = f.mouth || 0;
    if (m > 0.05) { g.beginPath(); g.ellipse(0, 8.6, 3 + m * 0.8, 0.8 + m * 2.8, 0, 0, 6.283); g.fillStyle = '#3a0d14'; g.fill(); g.lineWidth = 1.1; g.stroke(); }
    else if (f.smile) { g.lineWidth = 1.4; g.beginPath(); g.moveTo(-3.6, 7.6); g.quadraticCurveTo(0, 10.2, 3.6, 7.6); g.stroke(); }
    else { g.lineWidth = 1.4; g.beginPath(); g.moveTo(-3, 8.4); g.lineTo(3, 8.4); g.stroke(); }
    g.restore();
  }

  // Life: blinks, breathing, weight shift, speech nods + emphasis (red words) brow lifts
  V.narratorLife = function (t) {
    const ep = V.ep, ws = V.narrationWords(ep);
    const mouth = V.speaking(t);
    let emph = 0;
    for (const w of ws) if (w.red && t >= w.t - 0.05 && t < w.t + 0.6) emph = Math.max(emph, Math.sin(V.clamp((t - w.t + 0.05) / 0.65) * Math.PI));
    const blink = ((t + 0.7) % 3.1) < 0.11 ? 0.12 : 1;
    return {
      mouth, blink, brow: 0.25 + 0.75 * emph,
      nod: mouth * 0.7 + emph * 1.6 + Math.sin(t * 2.1) * 0.3,
      breath: 0.8 + 0.8 * Math.sin(t * 2.4),
      sway: Math.sin(t * 0.9) * 1.6,
      headTilt: Math.sin(t * 1.3) * 0.035 + emph * 0.05,
    };
  };
})();
