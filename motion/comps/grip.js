/* "Losing Grip" — young men's grip strength fell a generation; grip predicts how long you live.
   Fain & Weatherford 2016 (J Hand Ther) · Leong et al. 2015 (The Lancet, PURE)
   Safe area: everything stays left of x≈900 between y 800–1500 (TikTok's button column). */
(function () {
  const M = window.M;
  const TM = M.TIMINGS && M.TIMINGS.grip;
  if (!TM) return;
  const { C, lerp, tw, E, prog, env, mix, K } = M;
  const { ls, W, win, alpha } = K.track(TM);
  const P = M.Pose;
  const fig = (ctx, x, y, h, pose, o = {}) => M.figure(ctx, { x, y, h, pose, ...o });
  const num = (ctx, s, x, y, o) => M.T.number(ctx, s, x, y, o);
  const SUB = { x: 515, maxW: 800, size: 50 };

  // ---------- bar work ----------
  const TOP = { ...P.front, la1: 0.95, la2: 2.95, ra1: 0.95, ra2: 2.95, ll1: 0.08, ll2: -0.1, rl1: 0.08, rl2: -0.1 };
  const DROP = { ...P.front, la1: 0.3, la2: 0.2 };
  /** draws a figure whose hands sit on a bar at barY; anchor 'R' keeps only the right hand on it */
  const hanger = (ctx, x, barY, h, pose, o = {}) => {
    const m = fig(ctx, x, 0, h, pose, { measure: true });
    const hy = o.anchor === 'R' ? m.handR.y : (m.handR.y + m.handL.y) / 2;
    return fig(ctx, x, barY + 3 - hy + (o.dy || 0), h, pose, o);
  };
  const bar = (ctx, x0, x1, y, k, floor, o = {}) => {
    K.line(ctx, [{ x: x0, y: floor }, { x: x0, y: lerp(floor, y - 18, k) }], { color: C.g3, lw: o.post ?? 5, alpha: o.alpha });
    K.line(ctx, [{ x: x1, y: floor }, { x: x1, y: lerp(floor, y - 18, k) }], { color: C.g3, lw: o.post ?? 5, alpha: o.alpha });
    K.line(ctx, [{ x: x0, y }, { x: lerp(x0, x1, k), y }], { color: C.g1, lw: o.lw ?? 5, alpha: o.alpha });
  };
  const dial = (ctx, cx, cy, r, v, max, o = {}) => {
    // semicircle gauge 0..max with a needle at v
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = C.g3;
    ctx.lineWidth = o.lw ?? 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, M.TAU);
    ctx.stroke();
    const n = o.ticks ?? 14;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI, L = i % 2 ? r * 0.07 : r * 0.13;
      K.line(ctx, [{ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }, { x: cx + Math.cos(a) * (r - L), y: cy + Math.sin(a) * (r - L) }], { color: i % 2 ? C.g3 : C.g2, lw: 2 });
    }
    const a = Math.PI + M.clamp(v / max) * Math.PI;
    K.line(ctx, [{ x: cx, y: cy }, { x: cx + Math.cos(a) * r * 0.82, y: cy + Math.sin(a) * r * 0.82 }], { color: C.white, lw: o.needle ?? 4 });
    ctx.beginPath();
    ctx.arc(cx, cy, o.hub ?? 8, 0, M.TAU);
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.restore();
  };

  // ---------------- A1 hook: losing their grip, literally ----------------
  const A1 = [0, ls('study') - 0.04];
  function act1(ctx, g) {
    const a = alpha(g, A1);
    if (a <= 0) return;
    ctx.globalAlpha = Math.max(a, g < 0.25 ? 1 : 0);
    const barY = 720, floor = 1170, h = 230;
    bar(ctx, 370, 710, barY, 1, floor);
    K.line(ctx, [{ x: 250, y: floor }, { x: 830, y: floor }], { color: C.g4, lw: 2 });
    const rel1 = W('hook', 5) - 0.12, rel2 = W('hook', 6) - 0.02;
    const k1 = tw(g, rel1, rel1 + 0.25, E.outCubic);
    const fall = tw(g, rel2, rel2 + 0.34, E.inQuad);
    const sway = Math.sin(g * 2.4) * 0.025 + k1 * (1 - fall) * Math.sin((g - rel1) * 7) * 0.05 * Math.exp(-(g - rel1) * 2);
    if (fall <= 0) {
      const pose = { ...P.hang, la1: lerp(P.hang.la1, 0.45, k1), la2: lerp(P.hang.la2, 0.35, k1) };
      ctx.save();
      ctx.translate(540, barY);
      ctx.rotate(sway);
      ctx.translate(-540, -barY);
      hanger(ctx, 540 + 14 * k1, barY, h, pose, { anchor: 'R' });
      ctx.restore();
    } else {
      const m = fig(ctx, 554, 0, h, { ...P.hang, la1: 0.45, la2: 0.35 }, { measure: true });
      const y0 = barY + 3 - m.handR.y;
      const land = tw(g, rel2 + 0.32, rel2 + 0.6, E.outCubic);
      const pose = fall < 1 ? M.blendPose({ ...P.hang, la1: 0.45, la2: 0.35 }, DROP, fall) : M.blendPose(DROP, P.frontDown, land);
      const bounce = env(g, rel2 + 0.32, rel2 + 0.55, 0.05, 0.18) * 10;
      fig(ctx, 554, lerp(y0, floor, fall) - bounce, h, pose);
      if (g > rel2 + 0.32) M.I.node(ctx, 554, floor, g - rel2 - 0.32, { r: 0.1 });
    }
    // grip readout
    num(ctx, 'GRIP', 540, 600, { size: 22, weight: 600, color: C.g2 });
    const v = lerp(121, 101, tw(g, rel1 - 0.2, rel2 + 0.3, E.inOutCubic));
    num(ctx, `${Math.round(v)} LB`, 540, 645, { size: 40, weight: 500 });
  }

  // ---------------- A2 the 2016 study ----------------
  const A2 = win('study', 'drop');
  function act2(ctx, g) {
    const a = alpha(g, A2);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'FAIN & WEATHERFORD  ·  2016', g, W('study', 1) - 0.1, 560);
    const cx = 540, cy = 930, r = 190;
    const dk = tw(g, A2[0] + 0.1, A2[0] + 0.5, E.outCubic);
    const test = W('study', 3) - 0.05;
    const jit = g > test ? M.noise(g * 9, 3) * 6 * (1 - tw(g, test + 0.6, test + 1.2)) : 0;
    const v = g < test ? 0 : lerp(0, 101, tw(g, test, test + 0.6, E.outCubic)) + jit;
    dial(ctx, cx, cy, r, v, 140, { alpha: dk });
    M.T.label(ctx, 'GRIP · LB', cx, cy + 40, g - (A2[0] + 0.3), { size: 15, color: C.g2 });
    // age row
    const ag = W('study', 5) - 0.1;
    for (let i = 0; i < 5; i++) {
      const t0 = ag + i * 0.12;
      const ap = tw(g, t0, t0 + 0.3, E.outCubic);
      if (ap <= 0) continue;
      const x = 540 + (i - 2) * 92;
      fig(ctx, x, 1180 + (1 - ap) * 12, 92, P.front, { alpha: ap, color: i === 0 || i === 4 ? C.white : C.g1 });
      M.T.label(ctx, String(20 + i), x, 1212, g - t0, { size: 16, color: C.g2, tracking: '2px' });
    }
  }

  // ---------------- A3 20 pounds weaker ----------------
  const A3 = win('drop', 'cause');
  function act3(ctx, g) {
    const a = alpha(g, A3);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'MEN 20–24  ·  RIGHT-HAND GRIP', g, A3[0] + 0.1, 600);
    const x0 = 300, s = 4.2, rows = [{ y: 830, v: 121, yr: '1985', col: C.g2 }, { y: 990, v: 101, yr: '2016', col: C.white }];
    rows.forEach((r, i) => {
      const t0 = A3[0] + 0.1 + i * 0.15;
      const k = tw(g, t0, t0 + 0.7, E.outExpo);
      ctx.save();
      ctx.fillStyle = r.col;
      ctx.fillRect(x0, r.y - 14, r.v * s * k, 28);
      ctx.restore();
      M.T.label(ctx, r.yr, x0, r.y - 44, g - t0, { size: 17, color: i ? C.white : C.g2, align: 'left', tracking: '3px' });
      ctx.save();
      ctx.globalAlpha *= tw(g, t0 + 0.3, t0 + 0.6);
      num(ctx, `${Math.round(r.v * k)} LB`, x0 + r.v * s, r.y - 44, { size: 26, weight: 500, color: i ? C.white : C.g1, align: 'right' });
      ctx.restore();
      fig(ctx, 230, r.y + 40, 86, P.front, { alpha: tw(g, t0, t0 + 0.3), color: i ? C.white : C.g2 });
    });
    // the missing 20 lb
    const wk = W('drop', 3) - 0.1;
    const gk = tw(g, wk, wk + 0.4, E.inOutCubic);
    if (gk > 0) {
      const xa = x0 + 101 * s, xb = x0 + 121 * s;
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2;
      ctx.strokeRect(xa, 990 - 14, (xb - xa) * gk, 28);
      ctx.restore();
      K.dash(ctx, { x: xb, y: 830 + 16 }, { x: xb, y: 990 - 16 }, gk, { color: C.g2, dash: [2, 6] });
      M.T.label(ctx, '−20 LB  ·  −9 KG', (xa + xb) / 2 - 40, 1060, g - (wk + 0.25), { size: 17, color: C.white, tracking: '3px' });
    }
  }

  // ---------------- A4 the likely cause ----------------
  const A4 = win('cause', 'just');
  const CARRY = (ph, amp) => ({ ...M.walkPose(ph, amp), ra1: 0.04, ra2: 0, la1: 0.04, la2: 0 });
  const CLIMB = { ...P.front, ra1: 2.8, ra2: 2.95, la1: 1.9, la2: 2.7, rl1: 1.0, rl2: -0.15, ll1: 0.05, ll2: 0 };
  function vignette(ctx, g, kind, x, floor, h, col, alphaV) {
    ctx.save();
    ctx.globalAlpha *= alphaV;
    if (kind === 'carry') {
      const f = fig(ctx, x, floor, h, CARRY(g * 5, 0.55), { color: col });
      for (const hd of [f.handR, f.handL]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(hd.x - 9, hd.y + 2, 18, 22, 4);
        ctx.fill();
      }
    } else if (kind === 'climb') {
      const rx = 0.2 * h;
      K.line(ctx, [{ x: x - rx, y: floor }, { x: x - rx, y: floor - h * 1.25 }], { color: C.g3, lw: 3 });
      K.line(ctx, [{ x: x + rx, y: floor }, { x: x + rx, y: floor - h * 1.25 }], { color: C.g3, lw: 3 });
      for (let i = 1; i < 6; i++) K.line(ctx, [{ x: x - rx, y: floor - i * h * 0.22 }, { x: x + rx, y: floor - i * h * 0.22 }], { color: C.g3, lw: 2 });
      fig(ctx, x, floor - h * 0.22, h, CLIMB, { color: col });
    } else {
      const by = floor - h * 1.3;
      K.line(ctx, [{ x: x - 0.45 * h, y: by }, { x: x + 0.45 * h, y: by }], { color: C.g2, lw: 4 });
      hanger(ctx, x, by, h, P.hang, { color: col });
    }
    ctx.restore();
  }
  function act4(ctx, g) {
    const a = alpha(g, A4);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'LIKELY CAUSE', g, W('cause', 1) - 0.05, 560);
    // the phone, scrolling
    const pk = tw(g, W('cause', 3) - 0.15, W('cause', 3) + 0.2, E.outBack);
    if (pk > 0) {
      const px = 540, py = 790, pw = 130, ph = 230;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(pk, pk);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(-pw / 2 + 12, -ph / 2 + 22, pw - 24, ph - 44);
      ctx.clip();
      const off = ((g - W('cause', 5)) * 160) % 40;
      for (let i = -1; i < 8; i++) {
        const y = -ph / 2 + 30 + i * 40 - Math.max(0, off);
        ctx.fillStyle = i % 3 === 0 ? C.g1 : C.g3;
        ctx.fillRect(-pw / 2 + 16, y, i % 3 === 0 ? pw - 32 : (pw - 32) * 0.7, i % 3 === 0 ? 16 : 8);
      }
      ctx.restore();
      M.T.label(ctx, 'SCROLL', 540, 940, g - W('cause', 5), { size: 15, color: C.white, tracking: '4px' });
    }
    // what hands rarely do now
    const items = [['carry', 330, 7], ['climb', 540, 8], ['hang', 750, 10]];
    items.forEach(([kind, x, wi]) => {
      const t0 = W('cause', wi) - 0.12;
      const ap = tw(g, t0, t0 + 0.3, E.outCubic);
      if (ap <= 0) return;
      vignette(ctx, g, kind, x, 1180, 110, C.g2, ap * 0.75);
      M.T.label(ctx, kind.toUpperCase(), x, 1215, g - t0, { size: 15, color: C.g2, tracking: '4px' });
    });
    const rk = tw(g, W('cause', 7) - 0.3, W('cause', 7), E.outCubic);
    M.T.label(ctx, 'RARELY', 540, 1000, g - (W('cause', 7) - 0.35), { size: 14, color: C.g3, tracking: '6px', alpha: rk });
  }

  // ---------------- A5 not just hands ----------------
  const A5 = win('just', 'lancet');
  function act5(ctx, g) {
    const a = alpha(g, A5);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const floor = 1170, h = 330;
    const f = fig(ctx, 540, floor, h, P.front, { alpha: tw(g, A5[0], A5[0] + 0.3, E.outCubic) });
    // hands first, then the whole body
    const hk = tw(g, A5[0] + 0.15, A5[0] + 0.45, E.outBack);
    for (const hd of [f.handR, f.handL]) M.G.ring(ctx, hd.x, hd.y, 26 * M.clamp(hk), { stroke: C.white, lw: 2, alpha: 1 - tw(g, W('just', 5) - 0.2, W('just', 5) + 0.1) });
    const bk = tw(g, W('just', 5) - 0.2, W('just', 5) + 0.35, E.inOutCubic);
    if (bk > 0) {
      const bx0 = lerp(f.handL.x - 30, 540 - 120, bk), bx1 = lerp(f.handR.x + 30, 540 + 120, bk);
      const by0 = lerp(f.handR.y - 30, f.top - 26, bk), by1 = lerp(f.handR.y + 30, floor + 16, bk);
      K.brackets(ctx, bx0, by0, bx1 - bx0, by1 - by0, 1, { lw: 3 });
      const sy = lerp(by1, by0, prog(g, W('just', 5), W('just', 5) + 0.6));
      if (g > W('just', 5)) K.line(ctx, [{ x: bx0 + 10, y: sy }, { x: bx1 - 10, y: sy }], { color: C.white, lw: 2, alpha: 0.6 * (1 - prog(g, W('just', 5) + 0.5, W('just', 5) + 0.7)) });
    }
    M.T.label(ctx, 'WHOLE-BODY SIGNAL', 540, 600, g - (W('just', 5) + 0.1), { size: 18, color: C.white, tracking: '6px' });
  }

  // ---------------- A6 the Lancet: 140,000 people ----------------
  const A6 = win('lancet', 'bp');
  function act6(ctx, g) {
    const a = alpha(g, A6);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'LEONG ET AL.  ·  THE LANCET  ·  2015', g, A6[0] + 0.1, 560);
    // population grid, then bars
    const pop = W('lancet', 1) - 0.1, five = W('lancet', 4) - 0.1;
    const gridOut = tw(g, five - 0.35, five, E.inCubic);
    if (gridOut < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - gridOut;
      for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) {
        const t0 = pop + (i + j) * 0.018;
        const k = tw(g, t0, t0 + 0.2, E.outBack);
        if (k <= 0) continue;
        ctx.beginPath();
        ctx.arc(540 + (i - 8.5) * 32, 790 + j * 32, 5 * k, 0, M.TAU);
        ctx.fillStyle = (i * 7 + j * 3) % 11 === 0 ? C.white : C.g2;
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= (1 - gridOut) * tw(g, pop, pop + 0.3);
      num(ctx, `${Math.round(lerp(0, 140, tw(g, pop, pop + 0.9, E.outExpo)))},000`, 540, 680, { size: 64, weight: 500 });
      ctx.restore();
      M.T.label(ctx, 'PEOPLE  ·  17 COUNTRIES', 540, 732, g - (pop + 0.3), { size: 15, color: C.g2, t1: five - 0.35 - (pop + 0.3) });
    }
    if (g > five - 0.2) {
      const base = 1150, gx = 410, rx = 670, bw = 110;
      const bk = tw(g, five - 0.2, five + 0.3, E.outExpo);
      const lost = W('lancet', 8) - 0.1;
      const drop = tw(g, lost, lost + 0.45, E.inQuad);
      const H = 380, seg = 60;
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.fillRect(gx - bw / 2, base - (H - seg) * bk, bw, (H - seg) * bk);
      ctx.globalAlpha *= 1 - drop;
      ctx.setLineDash([]);
      ctx.fillRect(gx - bw / 2, base - H * bk + drop * 90, bw, seg * bk - 4);
      ctx.restore();
      M.T.label(ctx, 'GRIP', gx, base + 34, g - five, { size: 16, color: C.g1, tracking: '4px' });
      M.T.label(ctx, '−5 KG', gx, base - H - 30, g - (five + 0.15), { size: 18, color: C.white, tracking: '3px' });
      // risk bar
      const r0 = W('lancet', 12) - 0.1;
      const rk = tw(g, five + 0.1, five + 0.5, E.outExpo);
      const up = tw(g, r0, r0 + 0.6, E.outCubic);
      const RH = 230, add = RH * 0.16;
      ctx.save();
      ctx.fillStyle = C.g3;
      ctx.fillRect(rx - bw / 2, base - RH * rk, bw, RH * rk);
      ctx.fillStyle = C.white;
      ctx.fillRect(rx - bw / 2, base - RH * rk - add * up, bw, add * up);
      ctx.restore();
      M.T.label(ctx, 'RISK OF DEATH', rx, base + 34, g - (five + 0.15), { size: 16, color: C.g1, tracking: '4px' });
      ctx.save();
      ctx.globalAlpha *= up;
      num(ctx, `+${Math.round(16 * up)}%`, rx, base - RH - add - 36, { size: 44, weight: 600 });
      ctx.restore();
      M.I.arrow(ctx, gx + bw / 2 + 14, base - 200, rx - bw / 2 - 14, base - 200, tw(g, r0 - 0.3, r0 + 0.1, E.inOutCubic), { lw: 2.5, color: C.g2, dash: [3, 7] });
    }
  }

  // ---------------- A7 better than blood pressure ----------------
  const A7 = win('bp', 'keeps');
  function act7(ctx, g) {
    const a = alpha(g, A7);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'PREDICTS DEATH', g, A7[0] + 0.1, 640);
    const sw = tw(g, W('bp', 3) - 0.15, W('bp', 3) + 0.4, E.inOutCubic);
    const y1 = 800, y2 = 960;
    const rows = [
      { name: 'BLOOD PRESSURE', y: lerp(y1, y2, sw), col: mix(C.white, C.g2, sw), icon: 'bp' },
      { name: 'GRIP STRENGTH', y: lerp(y2, y1, sw), col: mix(C.g2, C.white, sw), icon: 'grip' },
    ];
    rows.forEach((r, i) => {
      const ap = tw(g, A7[0] + 0.05 + i * 0.1, A7[0] + 0.35 + i * 0.1, E.outCubic);
      ctx.save();
      ctx.globalAlpha *= ap;
      const dx = Math.sin(sw * Math.PI) * (i ? -40 : 40);
      if (r.icon === 'bp') {
        ctx.beginPath();
        const ix = 300 + dx;
        ctx.moveTo(ix - 40, r.y);
        [[-18, 0], [-10, -20], [0, 22], [10, -30], [18, 0], [40, 0]].forEach(([u, v]) => ctx.lineTo(ix + u, r.y + v));
        ctx.strokeStyle = r.col;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.stroke();
      } else {
        dial(ctx, 300 + dx, r.y + 18, 38, 60 + 50 * sw, 140, { lw: 2.5, ticks: 6, needle: 3, hub: 4 });
      }
      ctx.restore();
      M.T.label(ctx, r.name, 380 + dx, r.y, g - (A7[0] + 0.1 + i * 0.1), { size: 22, color: r.col, align: 'left', tracking: '4px', weight: 600 });
    });
    // ranks stay put; rows move past them
    num(ctx, '1', 220, y1, { size: 30, weight: 600, color: C.white });
    num(ctx, '2', 220, y2, { size: 30, weight: 600, color: C.g2 });
    K.line(ctx, [{ x: 200, y: (y1 + y2) / 2 }, { x: 820, y: (y1 + y2) / 2 }], { color: C.g4, lw: 2, alpha: tw(g, A7[0] + 0.1, A7[0] + 0.4) });
  }

  // ---------------- A8 the body keeps what you ask of it ----------------
  const A8 = win('keeps', 'ask');
  const NODES = ['circle', 'triangle', 'square', 'hex', 'diamond', 'circle', 'triangle', 'square', 'diamond', 'hex'];
  const KEEP = [0, 3, 5, 8];
  function act8(ctx, g) {
    const a = alpha(g, A8);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const cx = 540, cy = 900, R = 250;
    const only = W('keeps', 3) - 0.05, ask = W('keeps', 6) - 0.1;
    const f = fig(ctx, cx, cy + 115, 230, P.front, { alpha: tw(g, A8[0], A8[0] + 0.3, E.outCubic) });
    NODES.forEach((t, i) => {
      const ang = -Math.PI / 2 + (i / NODES.length) * M.TAU + g * 0.08;
      const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
      const ap = tw(g, A8[0] + 0.05 + i * 0.03, A8[0] + 0.35 + i * 0.03, E.outBack);
      const keep = KEEP.includes(i);
      const fade = keep ? 0 : tw(g, only + i * 0.03, only + 0.4 + i * 0.03, E.inCubic);
      const lit = keep ? tw(g, ask, ask + 0.3) : 0;
      if (ap <= 0 || fade >= 1) return;
      const from = { x: cx + Math.cos(ang) * 70, y: cy + Math.sin(ang) * 70 };
      K.dash(ctx, from, { x: x - Math.cos(ang) * 26, y: y - Math.sin(ang) * 26 }, M.clamp(ap) * (1 - fade), {
        color: mix(C.g4, C.white, lit), dash: lit > 0.5 ? [] : [2, 8], lw: lit > 0.5 ? 2.5 : 2,
      });
      M.G.shape(ctx, t, x, y, 18 * M.clamp(ap) * (1 - fade * 0.7), ang, { stroke: mix(C.g2, C.white, lit), lw: 2.5, alpha: 1 - fade, fill: lit > 0.5 ? C.white : null });
    });
    void f;
  }

  // ---------------- A9 so ask: hang, carry, pull-up ----------------
  const A9 = win('ask', 'cta');
  function act9(ctx, g) {
    const a = alpha(g, A9);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'START HERE', g, W('ask', 1) - 0.1, 600);
    const floor = 1150;
    const panels = [
      { x: 300, t: W('ask', 2) - 0.12, name: '01  HANG' },
      { x: 540, t: W('ask', 6) - 0.12, name: '02  CARRY' },
      { x: 780, t: W('ask', 11) - 0.2, name: '03  PULL-UP' },
    ];
    panels.forEach((p, i) => {
      const ap = tw(g, p.t, p.t + 0.3, E.outCubic);
      if (ap <= 0) return;
      ctx.save();
      ctx.globalAlpha *= ap;
      K.line(ctx, [{ x: p.x - 90, y: floor }, { x: p.x + 90, y: floor }], { color: C.g4, lw: 2 });
      const h = 150, by = 800;
      if (i === 0) {
        K.line(ctx, [{ x: p.x - 70, y: by }, { x: p.x + 70, y: by }], { color: C.g1, lw: 4 });
        ctx.save();
        ctx.translate(p.x, by);
        ctx.rotate(Math.sin(g * 2.2) * 0.03);
        ctx.translate(-p.x, -by);
        hanger(ctx, p.x, by, h, P.hang);
        ctx.restore();
      } else if (i === 1) {
        const f = fig(ctx, p.x, floor - 3, h, CARRY(g * 5.5, 0.6));
        for (const hd of [f.handR, f.handL]) {
          ctx.fillStyle = C.white;
          ctx.beginPath();
          ctx.roundRect(hd.x - 10, hd.y + 2, 20, 26, 4);
          ctx.fill();
        }
      } else {
        K.line(ctx, [{ x: p.x - 70, y: by }, { x: p.x + 70, y: by }], { color: C.g1, lw: 4 });
        const rep = (1 - Math.cos((g - p.t) * 4.6)) / 2;
        hanger(ctx, p.x, by, h, M.blendPose(P.hang, TOP, E.inOutSine(rep)));
      }
      ctx.restore();
      M.T.label(ctx, p.name, p.x, floor + 40, g - p.t, { size: 15, color: C.white, tracking: '3px' });
    });
  }

  // ---------------- A10 CTA: one messy pull-up → The Complete Fighter ----------------
  const A10 = [ls('cta') - 0.08, TM.duration];
  function act10(ctx, g) {
    const a = env(g, A10[0], A10[1], 0.22, 0.6);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const swap = W('cta', 7) - 0.25;
    // part 1: 2022, one messy rep
    const pa = 1 - tw(g, swap - 0.1, swap + 0.2, E.inCubic);
    if (pa > 0) {
      ctx.save();
      ctx.globalAlpha *= pa;
      const by = 760, floor = 1170;
      bar(ctx, 400, 680, by, tw(g, A10[0], A10[0] + 0.4, E.outExpo), floor);
      // between two trees: the bar sits on two posts
      const r0 = W('cta', 4) - 0.25, r1 = W('cta', 6) + 0.1;
      const up = tw(g, r0, r1, E.inOutSine) * (1 - tw(g, r1 + 0.15, r1 + 0.5, E.inCubic));
      const wob = Math.sin(g * 23) * 0.06 * env(g, r0, r1 + 0.2, 0.1, 0.2);
      ctx.save();
      ctx.translate(540, by);
      ctx.rotate(wob);
      ctx.translate(-540, -by);
      hanger(ctx, 540, by, 210, M.blendPose(P.hang, { ...TOP, ll1: 0.5, ll2: -0.6, rl1: 0.15, rl2: 0.3 }, up * 0.92));
      ctx.restore();
      M.T.label(ctx, '2022', 540, 600, g - (W('cta', 1) - 0.1), { size: 26, color: C.white, tracking: '8px', weight: 600 });
      M.T.label(ctx, '1 MESSY REP', 540, 645, g - (W('cta', 5) - 0.05), { size: 16, color: C.g2, tracking: '4px' });
      ctx.restore();
    }
    // part 2: the book
    if (g > swap - 0.05) {
      const img = M.IMG && M.IMG.cover;
      const iw = img ? img.naturalWidth : 642, ih = img ? img.naturalHeight : 1039;
      const w = 360, h = (w * ih) / iw, x = 540 - w / 2, cyc = 890, y = cyc - h / 2;
      const s0 = tw(g, swap, swap + 0.55, E.outExpo);
      const name = W('cta', 11) - 0.05;
      const bump = env(g, name, name + 0.5, 0.12, 0.35) * 0.035;
      ctx.save();
      ctx.translate(540, cyc + (1 - s0) * 30);
      ctx.scale(lerp(0.9, 1, s0) + bump, lerp(0.9, 1, s0) + bump);
      ctx.translate(-540, -cyc);
      ctx.globalAlpha *= s0;
      if (img && img.complete) ctx.drawImage(img, x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      const sw = prog(g, name - 0.05, name + 0.6);
      if (sw > 0 && sw < 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        const sx = lerp(x - 200, x + w + 200, E.inOutCubic(sw));
        const gr = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0.16)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.translate(sx, y + h / 2);
        ctx.rotate(0.35);
        ctx.translate(-sx, -(y + h / 2));
        ctx.fillRect(sx - 90, y - 200, 180, h + 400);
        ctx.restore();
      }
      // highlight Part 03, the calisthenics blueprint
      const plan = W('cta', 8) - 0.05;
      const hk = tw(g, plan, plan + 0.45, E.inOutCubic);
      if (hk > 0) {
        const k = w / iw, rx = x + 40 * k, ry = y + 849 * k, rw = 236 * k, rh = 40 * k, per = 2 * (rw + rh);
        ctx.save();
        ctx.setLineDash([per * hk, per]);
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, 6);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      M.T.label(ctx, 'PART 03  ·  12-WEEK BAR PLAN', 540, y + h + 46, g - (plan + 0.2), { size: 16, color: C.g1, tracking: '4px' });
      const lb = W('cta', 14) - 0.1;
      const lk = tw(g, lb, lb + 0.3, E.outBack);
      if (lk > 0.002) {
        const bob = Math.sin((g - lb) * 7) * 6 * M.clamp(lk);
        M.I.arrow(ctx, 540, 520 + bob, 540, 470 + bob, M.clamp(lk), { lw: 3.5, head: 16 });
        M.T.label(ctx, 'LINK IN BIO', 540, 555, g - lb, { size: 22, color: C.white, tracking: '7px', weight: 600 });
      }
    }
  }

  const tl = new M.Timeline(TM.duration);
  [[A1, act1], [A2, act2], [A3, act3], [A4, act4], [A5, act5], [A6, act6], [A7, act7], [A8, act8], [A9, act9], [A10, act10]].forEach(([w, fn]) =>
    tl.add(w[0], w[1] - w[0], (ctx, lt, D, g) => fn(ctx, g))
  );
  tl.add(0, TM.duration, (ctx, lt, D, g) => K.subtitles(ctx, g, TM, SUB));

  // ---------------- sound cues ----------------
  const cues = [];
  const cue = (t, type, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), type, gain });
  cue(0.02, 'low', 0.5);
  cue(W('hook', 5) - 0.12, 'tick', 0.9);
  cue(W('hook', 6) - 0.02, 'sweep', 0.5);
  cue(W('hook', 6) + 0.3, 'low', 1.1);
  cue(W('study', 1), 'tick');
  cue(W('study', 3) - 0.05, 'sweep', 0.4);
  for (let i = 0; i < 5; i++) cue(W('study', 5) - 0.1 + i * 0.12, 'tick', 0.4);
  cue(A3[0] + 0.1, 'tick', 0.6);
  cue(W('drop', 3) - 0.1, 'pop', 0.9);
  cue(W('cause', 3) - 0.15, 'pop', 0.8);
  [7, 8, 10].forEach((i) => cue(W('cause', i) - 0.12, 'tick', 0.6));
  cue(W('just', 5) - 0.2, 'sweep', 0.4);
  for (let i = 0; i < 10; i++) cue(W('lancet', 1) - 0.1 + i * 0.05, 'tick', 0.2);
  cue(W('lancet', 8) - 0.1, 'low', 0.8);
  cue(W('lancet', 12) - 0.1, 'pop', 0.9);
  cue(W('bp', 3) - 0.15, 'sweep', 0.5);
  cue(W('bp', 3) + 0.3, 'pop', 0.7);
  cue(W('keeps', 3), 'low', 0.5);
  cue(W('keeps', 6) - 0.1, 'chime', 0.6);
  [2, 6, 11].forEach((i, j) => cue(W('ask', i) - 0.12 - (j === 2 ? 0.08 : 0), 'pop', 0.7));
  cue(W('cta', 6), 'tick', 0.7);
  cue(W('cta', 7) - 0.25, 'low', 0.6);
  cue(W('cta', 8) - 0.05, 'pop', 0.6);
  cue(W('cta', 11) - 0.05, 'chime', 0.8);
  cue(W('cta', 14) - 0.1, 'pop', 0.9);

  M.comps.grip = { duration: TM.duration, render: (ctx, t) => tl.render(ctx, t), cues };
})();
