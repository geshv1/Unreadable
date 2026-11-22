/* "Four Strange Things" — 4:3 (1440×1080). 22 short scenes, varied transitions, expressive captions.
   Mischkowski, Kross & Bushman 2012 · Marcus Aurelius, Meditations 6.6 · Woolley & Fishbach 2022 ·
   Li & Kanazawa 2016 · Ambady & Rosenthal 1993. CTA: the "what type of fighter are you" quiz. */
(function () {
  const M = window.M;
  const TM = M.TIMINGS && M.TIMINGS.smart;
  if (!TM) return;
  const { C, lerp, tw, E, prog, env, mix, K, O } = M;
  const { ls, W } = K.track(TM);
  const P = M.Pose;
  const WD = 1440, HT = 1080, GY = 790;
  const fig = (ctx, x, y, h, pose, o = {}) => M.figure(ctx, { x, y, h, pose, ...o });
  const num = (ctx, s, x, y, o) => M.T.number(ctx, s, x, y, o);
  const lab = (ctx, text, x, y, t, o = {}) => M.T.label(ctx, text, x, y, t, { size: 16, color: C.g2, tracking: '4px', ...o });
  const chap = (ctx, text, lt, o = {}) => M.T.label(ctx, text, 720, o.y ?? 120, lt - (o.d ?? 0.15), { size: 18, color: C.g1, tracking: '6px' });
  const fin = (lt, t0 = 0, d = 0.3) => tw(lt, t0, t0 + d, E.outCubic);
  const ground = (ctx, lt, x0 = 160, x1 = 1280, y = GY) => {
    const k = tw(lt, -0.1, 0.35, E.outExpo);
    K.line(ctx, [{ x: lerp((x0 + x1) / 2, x0, k), y }, { x: lerp((x0 + x1) / 2, x1, k), y }], { color: C.g3, lw: 2.5 });
  };
  const side = P.side;
  const GUARD = { ...side, lean: 0.12, hd: 0.01, ra1: 0.75, ra2: 2.55, la1: 0.55, la2: 2.45, ll1: -0.28, ll2: -0.2, rl1: 0.3, rl2: 0.25 };
  const boxer = (ctx, x, y, h, pose, o = {}) => {
    const f = fig(ctx, x, y, h, pose, o);
    if (o.gloves !== false) for (const hd of [f.handL, f.handR]) O.glove(ctx, hd.x, hd.y - h * 0.02, h * 0.15, { color: o.color || C.white, alpha: o.alpha, rot: (o.dir || 1) * 0.3 });
    return f;
  };
  const flag = (ctx, x, y, s, t, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    K.line(ctx, [{ x, y: y + s * 0.5 }, { x, y: y - s * 0.55 }], { lw: 4 });
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.55);
    for (let i = 0; i <= 12; i++) { const u = i / 12; ctx.lineTo(x + u * s * 0.7, y - s * 0.55 + Math.sin(u * 5 + t * 6) * 5 * u); }
    for (let i = 12; i >= 0; i--) { const u = i / 12; ctx.lineTo(x + u * s * 0.7, y - s * 0.1 + Math.sin(u * 5 + t * 6) * 5 * u); }
    ctx.closePath();
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.restore();
  };

  // ---------------- S1 hook ----------------
  const ICONS = [360, 600, 840, 1080];
  function s1(ctx, g, lt) {
    const y = 640;
    ICONS.forEach((x, i) => {
      M.G.ring(ctx, x, y, 84, { stroke: C.g3, lw: 2, dash: [4, 10], offset: -g * 30 * (i % 2 ? 1 : -1) });
      lab(ctx, `0${i + 1}`, x, y + 122, lt + 0.3 - i * 0.06, { color: C.g1, size: 18 });
    });
    const t0 = [W('hook', 3), W('hook', 3) + 0.22, W('hook', 4) + 0.1, W('hook', 5)];
    ICONS.forEach((x, i) => {
      const k = tw(g, t0[i] - 0.08, t0[i] + 0.3, E.outBack);
      if (k <= 0) return;
      M.G.ring(ctx, x, y, 84 * M.clamp(k), { stroke: C.white, lw: 3 });
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k, k);
      ctx.translate(-x, -y);
      if (i === 0) flag(ctx, x - 12, y + 4, 90, g);
      if (i === 1) O.flame(ctx, x, y + 40, 82, g);
      if (i === 2) { O.moon(ctx, x - 4, y - 4, 38); O.sparkle(ctx, x + 36, y - 30, 8); }
      if (i === 3) O.eye(ctx, x, y, 104, 1, Math.sin(g * 2) * 0.6);
      ctx.restore();
    });
  }

  // ---------------- S2 walk away from a fight you could win ----------------
  function s2(ctx, g, lt) {
    ground(ctx, lt);
    const walk = W('one', 2) - 0.1;
    const u = Math.max(0, g - walk);
    const turned = u > 0.08;
    const dist = u < 0.25 ? (150 * u * u) / 0.5 : 150 * (u - 0.125);
    const bob = Math.sin(g * 9) * 3;
    if (!turned) boxer(ctx, 540, GY + bob * 0.3, 230, GUARD, { alpha: fin(lt, 0.25) });
    else {
      const amp = Math.min(1, u / 0.25);
      fig(ctx, 540 - dist, GY, 230, M.walkPose(M.walkPhase(dist, 230), amp), { dir: -1 });
    }
    boxer(ctx, 900, GY + bob, 230, GUARD, { dir: -1, color: C.g2, alpha: fin(lt, 0.3) });
    // the trophy nobody claims
    const win = W('one', 8) - 0.05;
    const tk = fin(lt, 0.45, 0.35), drop = tw(g, win + 0.15, win + 0.6, E.inQuad);
    O.trophy(ctx, 720, 330 + drop * 120, 110, { alpha: tk * (1 - drop), color: mix(C.white, C.g3, tw(g, win, win + 0.2)) });
  }

  // ---------------- S3 replaying an insult ----------------
  function s3(ctx, g, lt) {
    chap(ctx, 'MISCHKOWSKI, KROSS & BUSHMAN  ·  2012', lt);
    ground(ctx, lt);
    fig(ctx, 520, GY, 230, P.sideDown, { alpha: fin(lt, 0) });
    fig(ctx, 920, GY, 230, { ...side, lean: -0.06, ra1: 1.3, ra2: 1.45 }, { dir: -1, color: C.g2, alpha: fin(lt, 0.1) });
    const ins = W('fly', 5) - 0.1;
    const bk = tw(g, ins, ins + 0.3, E.outBack);
    if (bk > 0) O.bubble(ctx, 800, 400, 240 * bk, 110 * bk, { tail: 1, text: bk > 0.8 ? '#@!%' : '', jx: Math.sin(g * 40) * 3, jy: Math.cos(g * 37) * 2, alpha: M.clamp(bk) });
    // replay loop around the head
    const rp = W('fly', 3) - 0.1;
    const rk = tw(g, rp, rp + 0.5, E.inOutCubic);
    if (rk > 0) {
      ctx.save();
      ctx.translate(560, GY - 250);
      ctx.rotate(g * 4);
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, M.TAU * 0.8 * rk);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 3;
      ctx.stroke();
      const a = M.TAU * 0.8 * rk;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 52, Math.sin(a) * 52);
      ctx.lineTo(Math.cos(a - 0.25) * 64, Math.sin(a - 0.25) * 64);
      ctx.moveTo(Math.cos(a) * 52, Math.sin(a) * 52);
      ctx.lineTo(Math.cos(a - 0.25) * 40, Math.sin(a - 0.25) * 40);
      ctx.stroke();
      ctx.restore();
      lab(ctx, 'REPLAY', 560, GY - 330, g - rp, { color: C.white });
    }
  }

  // ---------------- S4 fly on the wall ----------------
  const FRAME = { x: 170, y: 235, w: 600 };
  FRAME.h = (FRAME.w * HT) / WD;
  function s4(ctx, g, lt) {
    // the memory, seen from outside
    ctx.save();
    ctx.beginPath();
    ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
    ctx.clip();
    ctx.translate(FRAME.x, FRAME.y);
    ctx.scale(FRAME.w / WD, FRAME.w / WD);
    s3(ctx, g, 9);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.strokeRect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
    ctx.restore();
    lab(ctx, 'THE MOMENT', FRAME.x + FRAME.w / 2, FRAME.y + FRAME.h + 36, lt - 0.2);
    // the wall and the fly
    K.line(ctx, [{ x: 1120, y: 140 }, { x: 1120, y: lerp(140, GY, fin(lt, 0, 0.4)) }], { color: C.g3, lw: 4 });
    const path = new M.I.Path([{ x: 1400, y: 120 }, { x: 1180, y: 260 }, { x: 1260, y: 400 }, { x: 1135, y: 430 }]);
    const fk = tw(lt, 0.05, 0.75, E.inOutCubic);
    const p = path.at(fk);
    O.fly(ctx, p.x, p.y, 34, g, { rot: fk < 1 ? p.a + Math.PI / 2 : -Math.PI / 2 });
    const ck = tw(lt, 0.75, 1.05, E.outCubic);
    if (ck > 0) {
      ctx.save();
      ctx.globalAlpha *= 0.9 * ck;
      ctx.beginPath();
      ctx.moveTo(1118, 430);
      ctx.lineTo(FRAME.x + FRAME.w + 10, FRAME.y);
      ctx.lineTo(FRAME.x + FRAME.w + 10, FRAME.y + FRAME.h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.setLineDash([3, 9]);
      ctx.strokeStyle = C.g2;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      lab(ctx, 'SELF-DISTANCING', 1120, GY + 40, lt - 0.85, { color: C.white });
    }
  }

  // ---------------- S5 anger & aggression drop ----------------
  function s5(ctx, g, lt) {
    chap(ctx, 'AFTER LOOKING FROM OUTSIDE', lt);
    [[560, W('fly', 13), 'ANGER'], [880, W('fly', 15), 'AGGRESSION']].forEach(([x, t, name], i) => {
      const ap = fin(lt, i * 0.08);
      const lvl = lerp(0.88, 0.32, tw(g, t - 0.1, t + 0.5, E.inOutCubic));
      O.thermo(ctx, x, 640, 330, lvl * ap, { alpha: ap });
      lab(ctx, name, x, 760, lt - 0.15 - i * 0.08, { color: C.white, size: 17 });
      const dk = tw(g, t, t + 0.35, E.outCubic);
      if (dk > 0) M.I.arrow(ctx, x + 90, 330, x + 90, 470, dk, { lw: 3.5, head: 16 });
    });
  }

  // ---------------- S6 Marcus Aurelius ----------------
  function s6(ctx, g, lt) {
    ground(ctx, lt, 200, 1240);
    O.column(ctx, 430, GY, 440, tw(lt, 0, 0.7, E.outCubic));
    O.column(ctx, 560, GY, 340, tw(lt, 0.12, 0.8, E.outCubic), { color: C.g2 });
    M.T.label(ctx, 'MEDITATIONS  ·  BOOK 6.6', 960, 360, lt - 0.2, { size: 18, color: C.g1, tracking: '6px' });
    M.T.words(ctx, { text: 'MARCUS AURELIUS', x: 960, y: 450, size: 66, weight: 700, emWeight: 700, color: C.white, tracking: '-1px', maxW: 520, lineH: 70, t0: 0.15, stagger: 0.1 }, lt);
    lab(ctx, 'EMPEROR  ·  STOIC  ·  121–180 AD', 960, 560, lt - 0.45);
  }

  // ---------------- S7 the mirror ----------------
  function s7(ctx, g, lt) {
    ground(ctx, lt);
    const brk = W('marcus', 6) - 0.1, crack = tw(g, W('marcus', 9) - 0.1, W('marcus', 10) + 0.2, E.inOutCubic);
    const bob = Math.sin(g * 9) * 4;
    // mirror line
    for (let i = 0; i < 9; i++) {
      const y0 = 230 + i * 62, dx = crack * (i % 2 ? 18 : -18) * (1 + (i % 3)), dy = crack * 20 * (i % 2 ? 1 : -1);
      K.line(ctx, [{ x: 720 + dx, y: y0 + dy }, { x: 720 + dx, y: y0 + 44 + dy }], { color: C.g1, lw: 3, alpha: fin(lt, 0) * (1 - crack * 0.7) });
    }
    boxer(ctx, 940, GY + bob, 230, GUARD, { dir: -1, color: C.g2, alpha: fin(lt, 0.05) });
    const calm = tw(g, brk, brk + 0.4, E.inOutCubic);
    const f = fig(ctx, 500, GY + bob * (1 - calm), 230, M.blendPose(GUARD, { ...side, lean: -0.02 }, calm), { alpha: fin(lt, 0) });
    if (calm < 0.6) for (const hd of [f.handL, f.handR]) O.glove(ctx, hd.x, hd.y - 4, 34, { alpha: 1 - calm / 0.6, rot: 0.3 });
    lab(ctx, 'NOT LIKE THEM', 500, GY + 40, g - (W('marcus', 9) + 0.1), { color: C.white });
  }

  // ---------------- S8 comfort / discomfort ----------------
  const SLOPE = (x) => (x < 760 ? GY : GY - (x - 760) * 0.55);
  function s8(ctx, g, lt) {
    const gk = tw(lt, -0.1, 0.4, E.outExpo);
    K.line(ctx, [{ x: 160, y: GY }, { x: 760, y: GY }, { x: lerp(760, 1250, gk), y: SLOPE(lerp(760, 1250, gk)) }], { color: C.g3, lw: 2.5 });
    O.signpost(ctx, 720, GY, 400, tw(lt, 0.1, 0.8), [
      { text: 'COMFORT', dir: -1, color: C.g2, w: 200 },
      { text: 'DISCOMFORT', dir: 1, color: C.white, w: 250, tilt: -0.12 },
    ]);
    O.flame(ctx, 1230, SLOPE(1230) - 6, 70, g, { alpha: fin(lt, 0.5) });
    const go = W('two', 5) - 0.2;
    const u = tw(g, go, go + 1.0, E.inOutSine);
    const x = g < go ? lerp(330, 560, fin(lt, 0.05, 0.9)) : lerp(560, 960, u);
    const walking = (lt > 0.05 && lt < 0.95) || (g > go && u < 1);
    const ph = M.walkPhase(x, 200);
    fig(ctx, x, SLOPE(x), 200, walking ? M.walkPose(ph, 1, { lean: x > 760 ? 0.16 : 0.05 }) : side, { alpha: fin(lt, 0) });
  }

  // ---------------- S9 improv stage ----------------
  function s9(ctx, g, lt) {
    chap(ctx, 'WOOLLEY & FISHBACH  ·  2022', lt);
    const open = tw(lt, 0.05, 0.7, E.inOutCubic);
    ctx.save();
    ctx.strokeStyle = C.g2;
    ctx.lineWidth = 3;
    ctx.strokeRect(330, GY - 30, 780, 30);
    ctx.restore();
    const seek = W('improv', 7) - 0.1;
    [[560, { ...P.frontOpen }], [720, P.point], [880, { ...P.think }]].forEach(([x, pose], i) => {
      fig(ctx, x, GY - 30, 190, pose, { alpha: fin(lt, 0.35 + i * 0.08), dir: i === 2 ? -1 : 1 });
      const fk = tw(g, seek + i * 0.1, seek + 0.3 + i * 0.1, E.outBack);
      if (fk > 0) O.flame(ctx, x, GY - 270, 34 * M.clamp(fk), g + i);
    });
    O.curtains(ctx, 330, 1110, 200, GY - 30, open);
    O.masks(ctx, 720, 150, 44, { alpha: fin(lt, 0.4) });
    lab(ctx, 'SEEK DISCOMFORT', 720, GY + 40, g - (seek + 0.2), { color: C.white });
  }

  // ---------------- S10 longer, learned more ----------------
  function s10(ctx, g, lt) {
    const lo = W('improv', 11) - 0.15, more = W('improv', 14) - 0.1;
    const k = tw(g, lo - 0.3, lo + 0.6, E.inOutCubic);
    O.stopwatch(ctx, 520, 470, 130, 0.82 * k, { alpha: fin(lt, 0) });
    O.stopwatch(ctx, 920, 470, 130, 0.5 * k, { alpha: fin(lt, 0.08), color: C.g2, fill: 'rgba(255,255,255,0.07)' });
    lab(ctx, 'SEEK DISCOMFORT', 520, 680, lt - 0.1, { color: C.white });
    lab(ctx, 'CONTROL', 920, 680, lt - 0.18);
    const mk = tw(g, more - 0.05, more + 0.35, E.outBack);
    if (mk > 0) {
      M.I.arrow(ctx, 720, 560, 720, 360, M.clamp(mk), { lw: 4, head: 18 });
      lab(ctx, 'LEARNED MORE', 720, 300, g - more, { color: C.white, size: 17 });
    }
    lab(ctx, 'KEPT GOING LONGER', 720, 760, g - (lo + 0.1), { color: C.g1 });
  }

  // ---------------- S11 signal of growth ----------------
  function s11(ctx, g, lt) {
    ground(ctx, lt, 360, 1080);
    const grow = tw(lt, 0.05, W('signal', 6) + 0.3 - (ls('signal') - 0.1), E.inOutCubic);
    O.sprout(ctx, 720, GY, 360, grow);
    const sg = W('signal', 3) - 0.1;
    if (g > sg) for (let i = 0; i < 3; i++) {
      const q = ((g - sg) * 0.9 + i / 3) % 1;
      for (const sd of [-1, 1]) {
        ctx.save();
        ctx.globalAlpha *= Math.sin(q * Math.PI) * 0.9;
        ctx.beginPath();
        ctx.arc(720, GY - 360 * grow, 40 + q * 160, sd > 0 ? -0.6 : Math.PI - 0.6 + 0.0, sd > 0 ? 0.6 : Math.PI + 0.6);
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }
    lab(ctx, 'DISCOMFORT', 520, GY + 40, lt - 0.2);
    lab(ctx, 'GROWTH', 920, GY + 40, g - (W('signal', 6) - 0.1), { color: C.white });
  }

  // ---------------- S12 happy alone ----------------
  const STARS = [[260, 180], [430, 120], [610, 210], [820, 140], [1250, 300], [1180, 120], [360, 300], [960, 260]];
  function s12(ctx, g, lt) {
    ground(ctx, lt);
    STARS.forEach(([x, y], i) => O.sparkle(ctx, x, y, 5 + 3 * Math.abs(Math.sin(g * 2 + i)), { alpha: fin(lt, 0.1 + i * 0.04) * 0.8 }));
    O.moon(ctx, 1080, 220, 48, { alpha: fin(lt, 0.15) });
    const on = tw(lt, 0.3, 0.45) * (0.85 + 0.15 * (Math.sin(g * 40) > -0.9 ? 1 : 0));
    O.lamp(ctx, 500, GY, 380, on, { alpha: fin(lt, 0) });
    O.bench(ctx, 700, GY, 240, { alpha: fin(lt, 0.1), color: C.g1 });
    fig(ctx, 670, GY, 205, P.sitCalm, { alpha: fin(lt, 0.2) });
  }

  // ---------------- S13 15,000 ----------------
  function s13(ctx, g, lt) {
    chap(ctx, 'LI & KANAZAWA  ·  2016', lt);
    const r = 24, dx = r * Math.sqrt(3), dy = r * 1.5;
    let n = 0;
    for (let j = 0; j < 12; j++) for (let i = 0; i < 20; i++) {
      const x = 720 + (i - 9.5) * dx + (j % 2 ? dx / 2 : 0), y = 250 + j * dy * 1.02;
      const d = Math.hypot(x - 720, y - 420);
      const k = tw(lt, d / 900, d / 900 + 0.25, E.outBack);
      n++;
      if (k <= 0) continue;
      const smart = (i * 13 + j * 7) % 17 === 0;
      O.hex(ctx, x, y, r * 0.9 * M.clamp(k), { color: smart ? C.white : C.g3, lw: 2, fill: smart && lt > 1.3 ? C.white : null });
    }
    lab(ctx, 'AGES 18–28', 720, GY + 20, lt - 0.5, { color: C.g1 });
  }

  // ---------------- S14 the chart ----------------
  function s14(ctx, g, lt) {
    const x0 = 330, x1 = 1110, y0 = 720, y1 = 250;
    const ak = tw(lt, -0.05, 0.4, E.outExpo);
    K.line(ctx, [{ x: x0, y: y0 }, { x: lerp(x0, x1, ak), y: y0 }], { color: C.g3, lw: 2.5 });
    K.line(ctx, [{ x: x0, y: y0 }, { x: x0, y: lerp(y0, y1, ak) }], { color: C.g3, lw: 2.5 });
    lab(ctx, 'TIME WITH FRIENDS  →', 720, y0 + 40, lt - 0.1);
    ctx.save();
    ctx.translate(x0 - 40, (y0 + y1) / 2);
    ctx.rotate(-Math.PI / 2);
    lab(ctx, 'LIFE SATISFACTION', 0, 0, lt - 0.15);
    ctx.restore();
    lab(ctx, 'SCHEMATIC', x1, y1 - 20, lt - 0.3, { size: 13, color: C.g3, align: 'right' });
    [1, 2, 3, 4].forEach((n, i) => {
      for (let k = 0; k < n; k++) fig(ctx, 430 + i * 210 + (k - (n - 1) / 2) * 22, y0 - 8, 44, P.front, { color: C.g3, alpha: fin(lt, 0.2 + i * 0.08) });
    });
    const mk = tw(lt, 0.2, 0.9, E.inOutCubic);
    K.line(ctx, [{ x: x0 + 20, y: 560 }, { x: lerp(x0 + 20, x1 - 20, mk), y: lerp(560, 380, mk) }], { color: C.g2, lw: 3.5 });
    if (mk > 0.95) lab(ctx, 'MOST PEOPLE', x1 - 20, 350, lt - 0.9, { align: 'right' });
    const sk = tw(g, W('alone', 7) - 0.2, W('alone', 8) + 0.4, E.inOutCubic);
    if (sk > 0) {
      K.line(ctx, [{ x: x0 + 20, y: 400 }, { x: lerp(x0 + 20, x1 - 20, sk), y: lerp(400, 610, sk) }], { color: C.white, lw: 4.5 });
      if (sk > 0.95) lab(ctx, 'THE SMARTEST', x1 - 20, 645, g - (W('alone', 8) + 0.4), { align: 'right', color: C.white });
    }
  }

  // ---------------- S15 good company ----------------
  const CONST = [[700, 360], [770, 300], [860, 330], [900, 410], [830, 470], [740, 450], [800, 390]];
  function s15(ctx, g, lt) {
    ground(ctx, lt, 200, 1240);
    const f = fig(ctx, 420, GY, 220, P.sitCalm, { measure: true });
    K.chair(ctx, f, 1, GY, { alpha: fin(lt, 0) });
    fig(ctx, 420, GY, 220, P.sitCalm, { alpha: fin(lt, 0) });
    const bk = tw(lt, 0.15, 0.6, E.outBack);
    O.thought(ctx, 800, 390, 460, 270, bk, { tail: [{ x: 520, y: 520 }, { x: 560, y: 480 }, { x: 610, y: 450 }] });
    if (bk > 0.9) {
      const ck = tw(g, W('company', 4) - 0.2, W('company', 6) + 0.2, E.inOutCubic);
      const order = [0, 1, 2, 3, 4, 5, 0, 6, 2];
      for (let i = 0; i < order.length - 1; i++) {
        const lk = M.clamp(ck * (order.length - 1) - i);
        if (lk <= 0) continue;
        const a = CONST[order[i]], b = CONST[order[i + 1]];
        K.line(ctx, [{ x: a[0], y: a[1] }, { x: lerp(a[0], b[0], lk), y: lerp(a[1], b[1], lk) }], { color: C.g1, lw: 2 });
      }
      CONST.forEach(([x, y], i) => O.sparkle(ctx, x, y, 9 + 3 * Math.sin(g * 3 + i), { alpha: tw(lt, 0.5 + i * 0.05, 0.7 + i * 0.05) }));
    }
  }

  // ---------------- S16 like a book ----------------
  function s16(ctx, g, lt) {
    const bk = fin(lt, 0, 0.35);
    O.book(ctx, 720, 700, 640, 380, tw(lt, 0.5, 1.1, E.inOutCubic), { alpha: bk, lines: true });
    const fa = tw(lt, 1.0, 1.25);
    if (fa > 0) {
      const f = fig(ctx, 880, 640, 190, P.front, { alpha: fa });
      const notes = [[f.head.x, f.head.y, 1020, 360, 'EYES'], [f.handR.x, f.handR.y, 1040, 560, 'HANDS'], [f.hip.x - 30, f.hip.y, 610, 520, 'STANCE']];
      notes.forEach(([ax, ay, bx, by, t], i) => {
        const k = tw(lt, 1.15 + i * 0.12, 1.45 + i * 0.12);
        K.dash(ctx, { x: ax, y: ay }, { x: bx, y: by }, k, { color: C.g1, dash: [2, 6] });
        if (k > 0.9) lab(ctx, t, bx + (bx > 800 ? 46 : -46), by, lt - 1.35 - i * 0.12, { size: 14, color: C.white });
      });
    }
  }

  // ---------------- S17 thirty silent seconds ----------------
  function s17(ctx, g, lt) {
    chap(ctx, 'AMBADY & ROSENTHAL  ·  1993', lt);
    const sx = 820, sy = 450, sw = 620, sh = 400;
    const pk = tw(g, W('thin', 2) - 0.05, W('thin', 6) + 0.3, E.linear);
    O.screen(ctx, sx, sy, sw, sh, pk, { alpha: fin(lt, 0) });
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx - sw / 2 + 6, sy - sh / 2 + 6, sw - 12, sh - 60);
    ctx.clip();
    ctx.strokeStyle = C.g2;
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 20, sy - 130, 220, 140);
    for (let i = 0; i < 3; i++) K.line(ctx, [{ x: sx + 45, y: sy - 95 + i * 34 }, { x: sx + 45 + (150 - i * 30) * tw(g, ls('thin') + i * 0.4, ls('thin') + 0.6 + i * 0.4), y: sy - 95 + i * 34 }], { color: C.g1, lw: 3 });
    fig(ctx, sx - 120, sy + 125, 210, { ...side, ra1: 2.0 + Math.sin(g * 3) * 0.15, ra2: 2.2 + Math.sin(g * 3) * 0.15 }, {});
    ctx.restore();
    const mk = tw(g, W('thin', 3) - 0.1, W('thin', 3) + 0.25, E.outBack);
    if (mk > 0) O.mute(ctx, sx + sw / 2 - 50, sy - sh / 2 + 44, 42 * M.clamp(mk));
    // the strangers watching
    [270, 380].forEach((x, i) => fig(ctx, x, GY, 170, { ...side, lean: 0.06 }, { color: C.g2, alpha: fin(lt, 0.1 + i * 0.06) }));
    ground(ctx, lt, 160, 1180);
  }

  // ---------------- S18 the ratings match ----------------
  function s18(ctx, g, lt) {
    const rows = [{ y: 380, name: 'STRANGERS  ·  30 SECONDS', fill: 4.4, t: lt * 0 + 0.15 }, { y: 600, name: 'STUDENTS  ·  A WHOLE TERM', fill: 4.5, t: W('thin', 12) - 0.1 - (W('thin', 8) - 0.1) }];
    rows.forEach((r, j) => {
      lab(ctx, r.name, 720, r.y - 75, lt - r.t + 0.1, { color: j ? C.white : C.g1, size: 17 });
      for (let i = 0; i < 5; i++) {
        const k = tw(lt, r.t + i * 0.08, r.t + 0.3 + i * 0.08, E.outBack);
        if (k <= 0) continue;
        O.star(ctx, 540 + i * 90, r.y, 34 * M.clamp(k), M.clamp(r.fill - i) * tw(lt, r.t + 0.2 + i * 0.08, r.t + 0.4 + i * 0.08));
      }
    });
    const mk = tw(g, W('thin', 13) - 0.2, W('thin', 13) + 0.3, E.outCubic);
    if (mk > 0) {
      K.line(ctx, [{ x: 960, y: 380 }, { x: 1010, y: 380 }, { x: 1010, y: lerp(380, 600, mk) }], { color: C.white, lw: 3 });
      K.line(ctx, [{ x: 1010, y: 600 }, { x: lerp(1010, 960, mk), y: 600 }], { color: C.white, lw: 3 });
      num(ctx, 'r = .76', 1110, 490, { size: 36, weight: 600, color: C.white });
      lab(ctx, 'CORRELATION', 1110, 535, g - (W('thin', 13) + 0.1), { size: 13 });
    }
  }

  // ---------------- S19 nobody is looking ----------------
  function s19(ctx, g, lt) {
    ground(ctx, lt);
    const cx = 720;
    fig(ctx, cx, GY, 230, P.front, { color: C.g1, alpha: fin(lt, 0) });
    // signals: pulses at head, hands, feet
    const pts = [[cx, GY - 210], [cx - 50, GY - 110], [cx + 50, GY - 110], [cx, GY - 5]];
    pts.forEach(([x, y], i) => {
      const q = ((g * 0.9 + i * 0.27) % 1);
      M.G.ring(ctx, x, y, 8 + q * 46, { stroke: C.white, lw: 2, alpha: (1 - q) * fin(lt, 0.2 + i * 0.05) });
    });
    const most = W('look', 5) - 0.15;
    const ck = fin(g - most, 0, 0.3);
    const crowd = [[330, 1], [450, 1], [990, -1], [1110, -1]];
    crowd.forEach(([x, d], i) => {
      const ap = tw(g, most + i * 0.06, most + 0.3 + i * 0.06, E.outCubic);
      if (ap <= 0) return;
      const pose = { ...side, lean: 0.14, hd: 0.04, hf: 0.03, ra1: 0.55, ra2: 2.15, la1: 0.5, la2: 2.1 };
      const f = fig(ctx, x, GY, 190, pose, { dir: d, color: C.g3, alpha: ap });
      K.phone(ctx, f.handR.x, f.handR.y - 4, 26, { fill: C.g1, color: C.g1, alpha: ap, rot: d * 0.9, lw: 1.5 });
    });
    const lk = W('look', 9) - 0.2;
    const eo = tw(g, lk, lk + 0.35, E.outBack);
    if (eo > 0) O.eye(ctx, cx, 330, 160, eo, Math.sin(g * 2.5) * 0.7);
    void ck;
  }

  // ---------------- S20 what type of fighter ----------------
  const TYPES = [GUARD, P.meditate, { ...P.frontOpen }, M.walkPose(1.2, 1.3, { lean: 0.2 })];
  function s20(ctx, g, lt) {
    const fl = W('cta', 4) - 0.1;
    TYPES.forEach((pose, i) => {
      const x = 360 + i * 240, y = 470;
      const ap = tw(lt, i * 0.07, 0.3 + i * 0.07, E.outBack);
      if (ap <= 0) return;
      const flip = tw(g, fl + i * 0.12, fl + 0.4 + i * 0.12, E.inOutCubic);
      O.card(ctx, x, y + (1 - M.clamp(ap)) * 40, 190, 280, flip,
        (c) => { c.font = `700 120px ${M.FONT}`; c.fillStyle = C.g2; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 6); },
        (c) => {
          c.scale(-1, 1);
          if (i === 0) boxer(c, 0, 105, 190, GUARD, { gloves: true });
          else fig(c, 0, 105, i === 1 ? 160 : 190, pose, {});
        }, { alpha: M.clamp(ap), color: flip > 0.5 ? C.white : C.g3 });
    });
    const ring = W('cta', 9) - 0.1, life = W('cta', 12) - 0.1;
    if (g > ring) { K.line(ctx, [{ x: 280, y: 650 }, { x: lerp(280, 680, tw(g, ring, ring + 0.3)), y: 650 }], { color: C.white, lw: 3 }); lab(ctx, 'IN THE RING', 480, 690, g - ring, { color: C.white, size: 18 }); }
    if (g > life) { K.line(ctx, [{ x: 760, y: 650 }, { x: lerp(760, 1160, tw(g, life, life + 0.3)), y: 650 }], { color: C.white, lw: 3 }); lab(ctx, 'IN LIFE', 960, 690, g - life, { color: C.white, size: 18 }); }
  }

  // ---------------- S21 the 2-minute quiz ----------------
  function s21(ctx, g, lt) {
    const x = 720, y = 470, w = 400, h = 600;
    const ap = fin(lt, 0, 0.35);
    ctx.save();
    ctx.globalAlpha *= ap;
    ctx.translate(0, (1 - ap) * 40);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 36);
    ctx.fillStyle = C.bg;
    ctx.fill();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = C.g4;
    ctx.fillRect(x - w / 2 + 40, y - h / 2 + 60, w - 80, 6);
    ctx.fillStyle = C.white;
    ctx.fillRect(x - w / 2 + 40, y - h / 2 + 60, (w - 80) * lerp(0.2, 0.6, tw(lt, 0.4, 1.4)), 6);
    ctx.restore();
    lab(ctx, 'WHAT TYPE OF FIGHTER', x, y - h / 2 + 110, lt - 0.15, { color: C.white, size: 17 });
    lab(ctx, 'ARE YOU?', x, y - h / 2 + 140, lt - 0.22, { color: C.white, size: 17 });
    ['', '', ''].forEach((_, i) => {
      const oy = y - 60 + i * 96, k = tw(lt, 0.3 + i * 0.1, 0.6 + i * 0.1, E.outBack);
      if (k <= 0) return;
      const sel = i === 1 && lt > 0.9;
      ctx.save();
      ctx.globalAlpha *= M.clamp(k);
      ctx.beginPath();
      ctx.roundRect(x - 150, oy - 32, 300, 64, 32);
      ctx.fillStyle = sel ? C.white : C.bg;
      ctx.fill();
      ctx.strokeStyle = sel ? C.white : C.g2;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = sel ? C.bg : C.g3;
      ctx.fillRect(x - 100, oy - 4, 150 - i * 25, 8);
      ctx.restore();
      if (sel) { ctx.save(); K.check(ctx, x + 105, oy, 26, tw(lt, 0.9, 1.15), { color: C.bg, lw: 4 }); ctx.restore(); }
    });
    // two minutes
    const tk = tw(lt, 0.2, 1.6);
    M.G.ring(ctx, x + w / 2 + 120, y - 120, 64, { stroke: C.g4, lw: 6 });
    M.G.ring(ctx, x + w / 2 + 120, y - 120, 64, { stroke: C.white, lw: 6, k: 1 - tk * 0.25, cap: 'round' });
    num(ctx, '2:00', x + w / 2 + 120, y - 120, { size: 28, weight: 600 });
    lab(ctx, 'MINUTES', x + w / 2 + 120, y - 30, lt - 0.3, { size: 13 });
  }

  // ---------------- S22 link in bio ----------------
  function s22(ctx, g, lt) {
    const bob = Math.sin(lt * 7) * 8;
    const k = tw(lt, 0, 0.35, E.outBack);
    M.I.arrow(ctx, 720, 520 + bob, 720, 380 + bob, M.clamp(k), { lw: 6, head: 30 });
    M.T.words(ctx, { text: 'LINK IN BIO', x: 720, y: 610, size: 84, weight: 800, emWeight: 800, color: C.white, tracking: '2px', t0: 0.05, stagger: 0.08 }, lt);
    lab(ctx, 'THE COMPLETE FIGHTER  ·  2-MINUTE QUIZ', 720, 700, lt - 0.4, { color: C.g1, size: 17 });
    O.glove(ctx, 300, 600, 76, { alpha: fin(lt, 0.3), rot: 0.4 });
    O.glove(ctx, 1140, 600, 76, { alpha: fin(lt, 0.35), rot: -0.4, color: C.white });
  }

  // ---------------- sequence ----------------
  const S = [
    { t: 0, fn: s1, z: { x: ICONS[0], y: 640 } },
    { t: ls('one') - 0.05, fn: s2, tr: 'zoom' },
    { t: W('fly', 0) - 0.1, fn: s3, tr: 'slide' },
    { t: W('fly', 8) - 0.35, fn: s4, tr: 'shrink', r: FRAME },
    { t: W('fly', 12) - 0.12, fn: s5, tr: 'up' },
    { t: ls('marcus') - 0.1, fn: s6, tr: 'wipe' },
    { t: W('marcus', 2) - 0.15, fn: s7, tr: 'slide' },
    { t: ls('two') - 0.05, fn: s8, tr: 'iris' },
    { t: ls('improv') - 0.1, fn: s9, tr: 'slide' },
    { t: W('improv', 9) - 0.15, fn: s10, tr: 'up', z: { x: 520, y: 470 } },
    { t: ls('signal') - 0.1, fn: s11, tr: 'zoom' },
    { t: ls('three') - 0.05, fn: s12, tr: 'iris', iris: { x: 1080, y: 220 } },
    { t: ls('alone') - 0.1, fn: s13, tr: 'slide' },
    { t: W('alone', 4) - 0.2, fn: s14, tr: 'wipe' },
    { t: ls('company') - 0.1, fn: s15, tr: 'up' },
    { t: ls('four') - 0.05, fn: s16, tr: 'iris' },
    { t: ls('thin') - 0.1, fn: s17, tr: 'slide' },
    { t: W('thin', 8) - 0.1, fn: s18, tr: 'up', z: { x: 720, y: 490 } },
    { t: ls('look') - 0.1, fn: s19, tr: 'zoom' },
    { t: ls('cta') - 0.1, fn: s20, tr: 'iris' },
    { t: W('cta', 13) - 0.2, fn: s21, tr: 'slide' },
    { t: W('cta', 17) - 0.25, fn: s22, tr: 'up' },
  ];
  // the hook's zoom target is icon 01; the "signal" zoom dives into the white stopwatch; the eye zooms from the match
  const seq = K.seq(S, WD, HT, 0.42);

  // section numerals: a big outlined number that docks into a corner badge
  const SECTIONS = [ls('one'), ls('two'), ls('three'), ls('four'), ls('cta')];
  function sections(ctx, g) {
    for (let s = 0; s < 4; s++) {
      const t0 = SECTIONS[s] - 0.02, t1 = SECTIONS[s + 1] - 0.1;
      if (g < t0 || g > t1) continue;
      const dock = tw(g, t0 + 0.5, t0 + 0.85, E.inOutCubic);
      const pop = tw(g, t0, t0 + 0.18, E.outBack);
      const out = 1 - tw(g, t1 - 0.25, t1, E.inCubic);
      const x = lerp(720, 120, dock), y = lerp(430, 92, dock), sz = lerp(300, 44, dock);
      ctx.save();
      ctx.globalAlpha *= out * M.clamp(pop);
      ctx.font = `800 ${sz}px ${M.FONT}`;
      ctx.textAlign = dock > 0.5 ? 'left' : 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0px';
      const label = `0${s + 1}`;
      const xx = dock > 0.5 ? x - 40 : x;
      if (dock < 0.5) {
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 3;
        ctx.strokeText(label, xx, y);
      } else {
        ctx.fillStyle = C.white;
        ctx.fillText(label, xx, y);
        ctx.font = `500 22px ${M.FONT}`;
        ctx.fillStyle = C.g2;
        ctx.fillText('/ 04', xx + 66, y + 4);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i <= s ? C.white : C.g4;
          ctx.fillRect(xx + i * 32, y + 34, 26, 4);
        }
      }
      ctx.restore();
    }
  }

  const tl = new M.Timeline(TM.duration, WD, HT);
  tl.add(0, TM.duration, (ctx, lt, D, g) => {
    ctx.globalAlpha = 1 - tw(g, TM.duration - 0.6, TM.duration - 0.02, E.inCubic);
    seq(ctx, g);
  });
  tl.add(0, TM.duration, (ctx, lt, D, g) => sections(ctx, g));
  tl.add(0, TM.duration, (ctx, lt, D, g) => K.caps(ctx, g, TM, { x: 720, y: 952, size: 46, maxW: 1100, hookY: 300, hookSize: 76 }));

  // ---------------- sound ----------------
  const cues = [];
  const cue = (t, type, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), type, gain });
  cue(0.02, 'low', 0.5);
  [W('hook', 3), W('hook', 3) + 0.22, W('hook', 4) + 0.1, W('hook', 5)].forEach((t) => cue(t - 0.05, 'pop', 0.7));
  S.slice(1).forEach((s) => cue(s.t - 0.2, 'sweep', s.tr === 'iris' || s.tr === 'zoom' ? 0.4 : 0.22));
  SECTIONS.slice(0, 4).forEach((t) => cue(t, 'low', 0.9));
  cue(W('one', 8) + 0.15, 'tick', 0.8);
  cue(W('fly', 5) - 0.1, 'zap', 0.3);
  cue(W('fly', 8) - 0.35, 'chime', 0.4);
  cue(W('fly', 13) - 0.1, 'sweep', 0.4);
  // typewriter clicks for the Marcus quote
  TM.lines.find((l) => l.id === 'marcus').words.forEach((w) => {
    const n = w.w.replace(/[^A-Za-z]/g, '').length;
    for (let i = 0; i < n; i += 2) cue(w.s - 0.06 + i / 32, 'tick', 0.18);
  });
  cue(W('two', 5) - 0.2, 'pop', 0.7);
  cue(W('improv', 7) - 0.1, 'pop', 0.6);
  cue(W('improv', 14) - 0.05, 'pop', 0.8);
  cue(W('signal', 3) - 0.1, 'chime', 0.5);
  for (let i = 0; i < 12; i++) cue(ls('alone') - 0.1 + i * 0.07, 'tick', 0.15);
  cue(W('alone', 7) - 0.2, 'sweep', 0.4);
  cue(W('company', 4) - 0.2, 'chime', 0.5);
  cue(ls('four') + 0.5, 'tick', 0.6);
  cue(W('thin', 3) - 0.1, 'pop', 0.6);
  cue(W('thin', 13) - 0.2, 'pop', 0.9);
  cue(W('look', 9) - 0.2, 'chime', 0.6);
  for (let i = 0; i < 4; i++) cue(W('cta', 4) - 0.1 + i * 0.12, 'tick', 0.6);
  cue(W('cta', 13) - 0.2 + 0.9, 'pop', 0.8);
  cue(W('cta', 17) - 0.25, 'low', 0.8);
  cue(W('cta', 17), 'chime', 0.9);

  M.comps.smart = { duration: TM.duration, width: WD, height: HT, render: (ctx, t) => tl.render(ctx, t), cues };
})();
