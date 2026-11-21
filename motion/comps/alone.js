/* "Fifteen Minutes" — the disappearing skill of being alone with your own mind.
   Wilson et al. 2014 (Science) · Pew Research 2024 · Nguyen, Ryan & Deci 2018 · Westgate et al. 2017 */
(function () {
  const M = window.M;
  const TM = M.TIMINGS && M.TIMINGS.alone;
  if (!TM) return;
  const { C, lerp, tw, E, prog, env, mix, K } = M;
  const { ls, W, win, alpha } = K.track(TM);
  const P = M.Pose;
  const fig = (ctx, x, y, h, pose, o = {}) => M.figure(ctx, { x, y, h, pose, ...o });
  const num = (ctx, s, x, y, o) => M.T.number(ctx, s, x, y, o);

  // ============ the room (hook → pay), one continuous layer ============
  const ROOM = { x: 270, y: 640, w: 540, h: 500 };
  const FLOOR = ROOM.y + ROOM.h;
  const BTN = { x: 610, top: 1068 };
  const roomEnd = ls('men') - 0.04;
  function roomLayer(ctx, g) {
    const a = env(g, 0, roomEnd, 0.01, 0.26);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    // perimeter draws in from the floor
    const k = tw(g, 0, 0.45, E.outExpo);
    const per = 2 * (ROOM.w + ROOM.h);
    const pulse = env(g, W('hook', 6) - 0.05, W('hook', 6) + 0.6, 0.1, 0.45);
    ctx.save();
    ctx.strokeStyle = mix(C.g2, C.white, pulse);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([per * k, per]);
    ctx.beginPath();
    ctx.roundRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h, 6);
    ctx.stroke();
    ctx.restore();
    // a bare bulb
    const bk = tw(g, 0.15, 0.5, E.outCubic);
    K.line(ctx, [{ x: 540, y: ROOM.y }, { x: 540, y: ROOM.y + 70 * bk }], { color: C.g3, lw: 2 });
    if (bk > 0.9) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, ROOM.y + 82, 11, 0, M.TAU);
      ctx.strokeStyle = C.g1;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    // the button on its stand
    const btnIn = Math.max(tw(g, 0.1, 0.4, E.outBack), 0);
    const hookOn = 1 - tw(g, ls('room') - 0.2, ls('room') + 0.1);
    const roomBtn = tw(g, W('room', 7) - 0.1, W('room', 7) + 0.3, E.outBack);
    const show = Math.max(btnIn * hookOn, roomBtn);
    if (show > 0) {
      const press = env(g, W('hook', 2) - 0.08, W('hook', 2) + 0.25, 0.06, 0.18);
      ctx.save();
      ctx.globalAlpha *= M.clamp(show);
      ctx.strokeStyle = C.g2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BTN.x, FLOOR);
      ctx.lineTo(BTN.x, BTN.top + 10);
      ctx.moveTo(BTN.x - 22, BTN.top + 10);
      ctx.lineTo(BTN.x + 22, BTN.top + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(BTN.x, BTN.top + 4 * press, 12 * M.clamp(show), Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.restore();
    }
  }

  // shocks: flash, burst and a tiny camera shake
  const shock = (ctx, g, t0, from, to, seed) => {
    const f = env(g, t0, t0 + 0.26, 0.01, 0.2);
    if (f <= 0) return;
    const flick = Math.floor((g - t0) * 40) % 2 ? 1 : 0.55;
    K.bolt(ctx, from, to, seed + Math.floor((g - t0) * 30), { alpha: f * flick, lw: 3, amp: 14 });
    M.I.node(ctx, from.x, from.y, g - t0, { r: 0.1, alpha: f });
  };
  const shake = (g, t0) => {
    const s = env(g, t0, t0 + 0.25, 0.01, 0.2) * 7;
    return { x: M.noise(g * 60, 1) * s, y: M.noise(g * 60, 2) * s };
  };

  // ---------------- A1 hook ----------------
  const A1 = [0, ls('room') - 0.04];
  function act1(ctx, g) {
    const a = alpha(g, A1);
    if (a <= 0) return;
    const pain = W('hook', 2);
    const sk = shake(g, pain);
    ctx.translate(sk.x, sk.y);
    ctx.globalAlpha = Math.max(a, g < 0.25 ? 1 : 0);
    // countdown: the fifteen minutes
    const secs = Math.max(0, 900 - g * 75);
    const mm = Math.floor(secs / 60), ss = Math.floor(secs % 60);
    num(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 540, 560, { size: 46, weight: 500, color: C.white });
    M.T.label(ctx, 'ALONE  ·  NO PHONE', 540, 606, g - 0.1, { size: 15, color: C.g2 });

    const reach = tw(g, pain - 0.35, pain - 0.05, E.inOutCubic);
    const jolt = env(g, pain, pain + 0.7, 0.06, 0.5);
    let pose = M.blendPose(P.sitCalm, P.sitReach, reach * (1 - jolt));
    pose = M.blendPose(pose, P.sitJolt, jolt);
    const f = fig(ctx, 470, FLOOR, 190, pose, { measure: true });
    K.chair(ctx, f, 1, FLOOR, { color: C.g3 });
    fig(ctx, 470, FLOOR, 190, pose);
    shock(ctx, g, pain, { x: BTN.x, y: BTN.top - 6 }, { x: f.handR.x + 4, y: f.handR.y }, 3);
  }

  // ---------------- A2 the setup ----------------
  const A2 = win('room', 'pay');
  function act2(ctx, g) {
    const a = alpha(g, A2);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'WILSON ET AL.  ·  SCIENCE  ·  2014', g, W('room', 0) - 0.05, 560);
    // empty chair
    const f = fig(ctx, 470, FLOOR, 190, P.sit, { measure: true });
    K.chair(ctx, f, 1, FLOOR, { color: C.g3, alpha: tw(g, A2[0], A2[0] + 0.3) });
    // no phone
    const pk = tw(g, W('room', 4) - 0.1, W('room', 4) + 0.2, E.outBack);
    const strike = tw(g, W('room', 5) + 0.05, W('room', 5) + 0.35, E.outCubic);
    const gone = tw(g, W('room', 6) - 0.15, W('room', 6) + 0.15, E.inCubic);
    if (pk > 0 && gone < 1) K.phone(ctx, 540, 860 - gone * 30, 78 * pk, { strike, alpha: 1 - gone });
    // shock
    const sh = W('room', 11);
    shock(ctx, g, sh, { x: BTN.x, y: BTN.top - 6 }, { x: BTN.x + 40, y: BTN.top - 150 }, 9);
    shock(ctx, g, sh + 0.08, { x: BTN.x, y: BTN.top - 6 }, { x: BTN.x - 90, y: BTN.top - 120 }, 17);
    M.T.label(ctx, 'SHOCK', BTN.x + 70, BTN.top - 30, g - (sh + 0.05), { size: 15, color: C.white, align: 'left', tracking: '4px' });
  }

  // ---------------- A3 they'd pay to avoid it ----------------
  const A3 = win('pay', 'men');
  function act3(ctx, g) {
    const a = alpha(g, A3);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const fa = tw(g, A3[0], A3[0] + 0.3, E.outCubic);
    const f = fig(ctx, 470, FLOOR, 190, P.sitCalm, { measure: true });
    K.chair(ctx, f, 1, FLOOR, { color: C.g3, alpha: fa });
    fig(ctx, 470, FLOOR, 190, P.sitCalm, { alpha: fa });
    // coin above the head
    const pay = W('pay', 6);
    const ck = tw(g, pay - 0.1, pay + 0.25, E.outBack);
    if (ck > 0) {
      const cx = f.head.x + 20, cy = f.top - 70;
      ctx.save();
      ctx.globalAlpha *= M.clamp(ck);
      ctx.beginPath();
      ctx.arc(cx, cy, 30 * ck, 0, M.TAU);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      num(ctx, '$', cx, cy + 1, { size: 34 * ck, weight: 600 });
      K.dash(ctx, { x: f.head.x + 4, y: f.top - 10 }, { x: cx - 6, y: cy + 34 }, ck, { color: C.g3, dash: [2, 6] });
    }
    // prohibited sign over the button
    const av = W('pay', 8);
    const pk = tw(g, av - 0.05, av + 0.35, E.inOutCubic);
    if (pk > 0) {
      M.G.ring(ctx, BTN.x, BTN.top - 2, 40, { stroke: C.white, lw: 3.5, k: pk, cap: 'round' });
      const d = 28 * tw(g, av + 0.2, av + 0.4, E.outCubic);
      K.line(ctx, [{ x: BTN.x - d, y: BTN.top - 2 - d }, { x: BTN.x + d, y: BTN.top - 2 + d }], { lw: 3.5 });
    }
    M.T.label(ctx, 'WOULD PAY TO AVOID IT', 540, 560, g - (pay - 0.05), { size: 18, color: C.g1, tracking: '6px' });
  }

  // ---------------- A4 67% of men ----------------
  const A4 = win('men', 'teens');
  function donut(ctx, g, x, y, r, v, t0, t1, lw, col, label, size) {
    M.G.ring(ctx, x, y, r, { stroke: C.g4, lw });
    const k = tw(g, t0, t1, E.outCubic);
    M.G.ring(ctx, x, y, r, { stroke: col, lw, k: (v / 100) * k });
    num(ctx, `${Math.round(v * k)}%`, x, y + r + 58, { size, weight: 500, color: col });
    M.T.label(ctx, label, x, y + r + 58 + size * 0.75, g - t0, { size: 15, color: C.g2 });
  }
  function act4(ctx, g) {
    const a = alpha(g, A4);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'PRESSED THE BUTTON', g, A4[0] + 0.1, 560);
    const t0 = W('men', 0) - 0.05;
    const ap = tw(g, A4[0], A4[0] + 0.3, E.outCubic);
    ctx.globalAlpha = a * ap;
    donut(ctx, g, 375, 850, 128, 67, t0, t0 + 0.9, 16, C.white, 'MEN', 64);
    fig(ctx, 375, 850 + 50, 104, P.front);
    const w0 = W('men', 5) - 0.2;
    ctx.globalAlpha = a * tw(g, w0 - 0.3, w0, E.outCubic);
    donut(ctx, g, 745, 880, 92, 25, w0, w0 + 0.6, 12, C.g1, 'WOMEN', 44);
    fig(ctx, 745, 880 + 37, 76, P.front, { color: C.g1 });
    // a spark crosses both on "pressed"
    const pr = W('men', 3);
    shock(ctx, g, pr, { x: 375, y: 850 - 128 }, { x: 375 + 30, y: 850 - 175 }, 21);
  }

  // ---------------- A5 teens online ----------------
  const A5 = win('teens', 'muscle');
  const CH = { base: 1110, y: (v) => 1110 - v * 8, xa: 330, xb: 750 };
  function act5(ctx, g) {
    const a = alpha(g, A5);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'PEW RESEARCH  ·  US TEENS 13–17', g, A5[0] + 0.1, 520);
    const ak = tw(g, A5[0] + 0.05, A5[0] + 0.5, E.outExpo);
    K.line(ctx, [{ x: 250, y: CH.base }, { x: lerp(250, 830, ak), y: CH.base }], { color: C.g3, lw: 2 });
    // 2024 point
    const t46 = W('teens', 1) - 0.05;
    const pb = tw(g, t46, t46 + 0.35, E.outBack);
    if (pb > 0) {
      K.dash(ctx, { x: CH.xb, y: CH.base }, { x: CH.xb, y: CH.y(46) }, M.clamp(pb), { color: C.g3, dash: [2, 7] });
      M.I.node(ctx, CH.xb, CH.y(46), g - t46, { r: 9 });
      num(ctx, `${Math.round(46 * M.clamp(pb))}%`, CH.xb, CH.y(46) - 50, { size: 52, weight: 500 });
      M.T.label(ctx, '2024', CH.xb, CH.base + 32, g - t46, { size: 16, color: C.g1, tracking: '3px' });
    }
    // "almost constantly": a 24-hour strip, nearly full
    const c0 = W('teens', 6) - 0.15;
    const sa = tw(g, c0 - 0.1, c0 + 0.1);
    if (sa > 0) {
      M.T.label(ctx, '24 HOURS', 540, 590, g - (c0 - 0.1), { size: 14, color: C.g2 });
      for (let i = 0; i < 24; i++) {
        const on = i < 22 ? tw(g, c0 + i * 0.03, c0 + 0.12 + i * 0.03) : 0;
        ctx.save();
        ctx.globalAlpha *= sa;
        ctx.fillStyle = mix(C.g4, C.white, on);
        ctx.fillRect(240 + i * 25, 615, 21, 14);
        ctx.restore();
      }
    }
    // ten years ago
    const t24 = W('teens', 8) - 0.05;
    const pa = tw(g, t24, t24 + 0.35, E.outBack);
    if (pa > 0) {
      K.dash(ctx, { x: CH.xa, y: CH.base }, { x: CH.xa, y: CH.y(24) }, M.clamp(pa), { color: C.g3, dash: [2, 7] });
      M.I.node(ctx, CH.xa, CH.y(24), g - t24, { r: 8, color: C.g1 });
      M.T.label(ctx, '2014–15', CH.xa, CH.base + 32, g - t24, { size: 16, color: C.g2, tracking: '3px' });
    }
    const v24 = W('teens', 11) - 0.05;
    const nk = tw(g, v24, v24 + 0.3, E.outCubic);
    if (nk > 0) num(ctx, '24%', CH.xa, CH.y(24) - 46, { size: 44, weight: 500, color: C.g1 });
    // the rise
    const lk = tw(g, v24 + 0.1, v24 + 0.6, E.inOutCubic);
    if (lk > 0) {
      M.I.arrow(ctx, CH.xa + 12, CH.y(24) - 5, CH.xb - 14, CH.y(46) + 7, lk, { lw: 3, head: 16 });
      M.T.label(ctx, 'NEARLY DOUBLE', 540, CH.y(35) + 52, g - (v24 + 0.45), { size: 15, color: C.white, tracking: '4px' });
    }
    // a teen, head down over a glowing phone, standing on the 2024 side
    const fa = tw(g, t46 + 0.1, t46 + 0.45, E.outCubic);
    if (fa > 0) {
      const pose = { ...P.side, lean: 0.14, hd: 0.04, hf: 0.03, ra1: 0.55, ra2: 2.15, la1: 0.5, la2: 2.1 };
      const f = fig(ctx, 845, CH.base - 2, 112, pose, { dir: -1, alpha: fa });
      K.phone(ctx, f.handR.x - 2, f.handR.y - 4, 17, { fill: C.white, alpha: fa, rot: 0.9, lw: 1.2 });
    }
  }

  // ---------------- A6 the muscle ----------------
  const A6 = win('muscle', 'fix');
  const BAR = { y: 720, x0: 370, x1: 710, floor: 1150 };
  function act6(ctx, g) {
    const a = alpha(g, A6);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'TOLERANCE FOR BOREDOM', g, A6[0] + 0.1, 560);
    const pk = tw(g, A6[0], A6[0] + 0.4, E.outExpo);
    K.line(ctx, [{ x: BAR.x0, y: BAR.floor }, { x: BAR.x0, y: lerp(BAR.floor, BAR.y - 20, pk) }], { color: C.g3, lw: 5 });
    K.line(ctx, [{ x: BAR.x1, y: BAR.floor }, { x: BAR.x1, y: lerp(BAR.floor, BAR.y - 20, pk) }], { color: C.g3, lw: 5 });
    K.line(ctx, [{ x: BAR.x0, y: BAR.y }, { x: lerp(BAR.x0, BAR.x1, pk), y: BAR.y }], { color: C.g1, lw: 5 });
    K.line(ctx, [{ x: 250, y: BAR.floor }, { x: 830, y: BAR.floor }], { color: C.g4, lw: 2, alpha: pk });

    const drop = W('muscle', 7) - 0.05;
    const fall = tw(g, drop, drop + 0.32, E.inQuad);
    const h = 210;
    const mHang = fig(ctx, 540, 0, h, P.hang, { measure: true });
    const hangY = BAR.y + 4 - mHang.handR.y; // ground value that puts the hands on the bar
    const y = lerp(hangY, BAR.floor, fall);
    const land = tw(g, drop + 0.3, drop + 0.6, E.outCubic);
    const pose = fall < 1 ? M.blendPose(P.hang, { ...P.front, la1: 1.2, la2: 1.6, ra1: 1.2, ra2: 1.6 }, fall) : M.blendPose({ ...P.front, la1: 1.2, la2: 1.6, ra1: 1.2, ra2: 1.6 }, P.frontDown, land);
    const sway = (1 - fall) * Math.sin(g * 2.2) * 0.03;
    ctx.save();
    ctx.translate(540, BAR.y);
    ctx.rotate(sway);
    ctx.translate(-540, -BAR.y);
    fig(ctx, 540, y + (fall >= 1 ? -9 * env(g, drop + 0.3, drop + 0.5, 0.05, 0.15) : 0), h, pose, { alpha: tw(g, A6[0] + 0.05, A6[0] + 0.35) });
    ctx.restore();

    // capacity meter drains
    const n = 8, mx = 340, mw = 400, my = 1215;
    M.T.label(ctx, 'CAPACITY', mx, my - 30, g - (A6[0] + 0.25), { size: 14, color: C.g2, align: 'left' });
    const d0 = W('muscle', 4) - 0.1;
    for (let i = 0; i < n; i++) {
      const ap = tw(g, A6[0] + 0.2 + i * 0.03, A6[0] + 0.4 + i * 0.03);
      const off = tw(g, d0 + (n - 1 - i) * 0.07, d0 + 0.1 + (n - 1 - i) * 0.07);
      ctx.save();
      ctx.globalAlpha *= ap;
      ctx.fillStyle = mix(C.white, C.g4, off);
      ctx.fillRect(mx + i * (mw / n), my, mw / n - 6, 16);
      ctx.restore();
    }
  }

  // ---------------- A7 the fix: fifteen minutes ----------------
  const A7 = win('fix', 'choose');
  function act7(ctx, g) {
    const a = alpha(g, A7);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'NGUYEN, RYAN & DECI  ·  2018', g, A7[0] + 0.1, 540);
    const cx = 540, cy = 900, R = 185;
    const t0 = W('fix', 4) - 0.1, t1 = W('fix', 10) + 0.2;
    const k = tw(g, t0, t1, E.inOutSine);
    M.G.ring(ctx, cx, cy, R, { stroke: C.g4, lw: 3, alpha: tw(g, A7[0], A7[0] + 0.4) });
    M.G.ring(ctx, cx, cy, R, { stroke: C.white, lw: 3, k, cap: 'round' });
    for (let i = 0; i < 15; i++) {
      const ang = -Math.PI / 2 + (i / 15) * M.TAU, lit = k * 15 > i ? 1 : 0;
      const ap = tw(g, A7[0] + 0.1 + i * 0.015, A7[0] + 0.3 + i * 0.015);
      K.line(ctx, [{ x: cx + Math.cos(ang) * (R + 16), y: cy + Math.sin(ang) * (R + 16) }, { x: cx + Math.cos(ang) * (R + 28), y: cy + Math.sin(ang) * (R + 28) }], { color: lit ? C.white : C.g3, lw: 2.5, alpha: ap });
    }
    num(ctx, `${Math.min(15, Math.floor(k * 15))} MIN`, cx, cy - R - 62, { size: 30, weight: 500, color: k > 0 ? C.white : C.g3 });
    fig(ctx, cx, cy + 95, 165, P.meditate, { alpha: tw(g, A7[0] + 0.1, A7[0] + 0.4, E.outCubic) });
    // no phone
    const np = W('fix', 8) - 0.1;
    const pa = tw(g, np, np + 0.25, E.outBack);
    if (pa > 0) K.phone(ctx, cx + R + 70, cy - R + 10, 54, { strike: tw(g, np + 0.15, np + 0.4), alpha: M.clamp(pa) * (1 - tw(g, np + 0.9, np + 1.3)) });
    // arousal: a jagged line that settles
    const amp = lerp(42, 3, tw(g, t0, t1 + 0.2, E.inOutCubic));
    const wa = tw(g, A7[0] + 0.15, A7[0] + 0.5);
    ctx.save();
    ctx.globalAlpha *= wa;
    ctx.beginPath();
    for (let x = 250; x <= 830; x += 4) {
      const e = Math.sin(((x - 250) / 580) * Math.PI);
      const yy = 1222 + (Math.sin(x * 0.11 + g * 10) * 0.6 + M.noise(x * 0.05 + g * 6, 4) * 0.7) * amp * e;
      x === 250 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = mix(C.g1, C.white, 1 - amp / 42);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    M.T.label(ctx, 'AROUSAL', 250, 1170, g - (A7[0] + 0.3), { size: 14, color: C.g2, align: 'left' });
    M.T.label(ctx, 'CALM', 830, 1170, g - (W('fix', 11) - 0.05), { size: 14, color: C.white, align: 'right' });
  }

  // ---------------- A8 choose it, pick a topic ----------------
  const A8 = win('choose', 'corner');
  const THOUGHTS = (() => {
    const r = M.rng(5), types = ['circle', 'triangle', 'square', 'diamond', 'hex', 'triangle', 'square'];
    return types.map((t, i) => ({ t, x: 690 + Math.cos(i * 0.9) * lerp(70, 150, r()), y: 790 + Math.sin(i * 1.3) * lerp(50, 120, r()), s: lerp(12, 20, r()), ph: r() * 10 }));
  })();
  THOUGHTS[0].x = 690;
  THOUGHTS[0].y = 770;
  THOUGHTS[0].s = 22;
  function act8(ctx, g) {
    const a = alpha(g, A8);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'WESTGATE ET AL.  ·  2017', g, A8[0] + 0.1, 540);
    const gy = 1150, fa = tw(g, A8[0], A8[0] + 0.3, E.outCubic);
    const f = fig(ctx, 360, gy, 185, P.sitCalm, { measure: true });
    K.chair(ctx, f, 1, gy, { alpha: fa });
    fig(ctx, 360, gy, 185, P.sitCalm, { alpha: fa });
    // choice: a circle drawn around yourself
    const ck = tw(g, W('choose', 0) - 0.1, W('choose', 1) + 0.2, E.inOutCubic);
    M.G.ring(ctx, 385, gy - 95, 150, { stroke: C.white, lw: 2, k: ck, cap: 'round' });
    // thoughts
    const pick = W('choose', 4) - 0.05, first = W('choose', 9);
    const sel = tw(g, pick, pick + 0.35, E.inOutCubic);
    THOUGHTS.forEach((th, i) => {
      const ap = tw(g, A8[0] + 0.1 + i * 0.04, A8[0] + 0.4 + i * 0.04, E.outBack);
      if (ap <= 0) return;
      const drift = i === 0 ? 0 : sel;
      const dx = (th.x - 690) * drift * 0.5, dy = (th.y - 790) * drift * 0.5;
      const x = th.x + dx + M.noise(g * 1.3 + th.ph, 1) * 10 * (1 - (i === 0 ? sel : 0));
      const y = th.y + dy + M.noise(g * 1.1 + th.ph, 2) * 10 * (1 - (i === 0 ? sel : 0));
      const fill = i === 0 ? tw(g, first - 0.1, first + 0.2) : 0;
      M.G.shape(ctx, th.t, x, y, th.s * M.clamp(ap), th.ph + g * (i === 0 ? 0.3 * (1 - sel) : 0.8), {
        stroke: i === 0 ? C.white : C.g2, lw: 2.5, alpha: i === 0 ? 1 : 1 - 0.75 * sel, fill: fill > 0.5 ? C.white : null,
      });
    });
    K.brackets(ctx, 690 - 42, 770 - 42, 84, 84, tw(g, pick, pick + 0.3, E.outBack));
    K.dash(ctx, { x: f.head.x + 24, y: f.head.y - 20 }, { x: 690 - 50, y: 770 + 20 }, tw(g, W('choose', 5) - 0.05, W('choose', 5) + 0.4), { color: C.g1, dash: [2, 8] });
    M.T.label(ctx, 'ONE TOPIC', 690, 770 + 72, g - (first - 0.05), { size: 15, color: C.white, tracking: '4px' });
  }

  // ---------------- A9 the corner ----------------
  const A9 = win('corner', 'skill');
  function act9(ctx, g) {
    const a = alpha(g, A9);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const floor = 1130, post = 790;
    const rk = tw(g, A9[0], A9[0] + 0.5, E.outExpo);
    K.line(ctx, [{ x: 220, y: floor }, { x: lerp(220, 860, rk), y: floor }], { color: C.g3, lw: 2 });
    K.line(ctx, [{ x: post, y: floor }, { x: post, y: lerp(floor, 700, rk) }], { color: C.white, lw: 7 });
    [790, 865, 940].forEach((y, i) => {
      const k = tw(g, A9[0] + 0.15 + i * 0.07, A9[0] + 0.55 + i * 0.07, E.outExpo);
      K.line(ctx, [{ x: post, y }, { x: lerp(post, 230, k), y: y + 28 * k }], { color: C.g2, lw: 3 });
    });
    // stool + fighter, facing out of the corner
    const nr = W('corner', 12) - 0.05;
    const stand = tw(g, nr - 0.05, nr + 0.45, E.inOutCubic);
    const up = tw(g, W('corner', 10) - 0.1, W('corner', 10) + 0.3);
    const pose = M.blendPose(M.blendPose(P.sitDown, P.sitCalm, up), P.side, stand);
    const f = fig(ctx, 650, floor, 190, P.sit, { measure: true, dir: -1 });
    ctx.save();
    ctx.strokeStyle = C.g3;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const sy = f.hip.y + 0.055 * 190;
    ctx.moveTo(650 - 32, sy); ctx.lineTo(650 + 32, sy);
    ctx.moveTo(650 - 24, sy); ctx.lineTo(650 - 34, floor);
    ctx.moveTo(650 + 24, sy); ctx.lineTo(650 + 34, floor);
    ctx.stroke();
    ctx.restore();
    fig(ctx, 650 - 45 * stand, floor, 190, pose, { dir: -1, alpha: tw(g, A9[0] + 0.1, A9[0] + 0.4) });
    // one minute
    const t0 = W('corner', 3) - 0.1;
    const left = Math.max(0, Math.ceil(60 * (1 - prog(g, t0, nr))));
    const ta = 1 - tw(g, nr, nr + 0.15);
    if (ta > 0) {
      ctx.save();
      ctx.globalAlpha *= ta * tw(g, A9[0] + 0.1, A9[0] + 0.35);
      num(ctx, left === 60 ? '1:00' : `0:${String(left).padStart(2, '0')}`, 540, 590, { size: 64, weight: 500 });
      ctx.restore();
      M.T.label(ctx, 'BETWEEN ROUNDS', 540, 646, g - (A9[0] + 0.2), { size: 15, color: C.g2 });
    }
    M.T.label(ctx, 'ROUND 2', 540, 600, g - (nr + 0.05), { size: 30, color: C.white, tracking: '8px', weight: 600 });
    // bell
    M.I.node(ctx, post, 676, g - nr, { r: 10, hollow: true });
    if (g > nr) for (let i = 0; i < 2; i++) M.I.node(ctx, post, 676, g - nr - i * 0.18, { r: 10, alpha: 0.6 });
  }

  // ---------------- A10 a skill: train it ----------------
  const A10 = win('skill', 'cta');
  function act10(ctx, g) {
    const a = alpha(g, A10);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    K.chapter(ctx, 'WEEK 1  →  6', g, A10[0] + 0.15, 560);
    const cx = 540, cy = 860;
    fig(ctx, cx, cy + 90, 160, P.meditate, { alpha: tw(g, A10[0], A10[0] + 0.3, E.outCubic) });
    const rk = tw(g, W('skill', 7) - 0.2, W('skill', 7) + 0.3, E.inOutCubic);
    M.G.ring(ctx, cx, cy + 10, 160, { stroke: C.white, lw: 2, k: rk, cap: 'round' });
    const n = 6, sz = 62, gap = 22, x0 = 540 - (n * sz + (n - 1) * gap) / 2, y = 1110;
    const tr = W('skill', 8) - 0.08;
    for (let i = 0; i < n; i++) {
      const ap = tw(g, A10[0] + 0.15 + i * 0.04, A10[0] + 0.4 + i * 0.04, E.outBack);
      if (ap <= 0) continue;
      const x = x0 + i * (sz + gap);
      const ck = tw(g, tr + i * 0.08, tr + 0.2 + i * 0.08, E.outCubic);
      ctx.save();
      ctx.globalAlpha *= M.clamp(ap);
      ctx.beginPath();
      ctx.roundRect(x, y, sz, sz, 10);
      ctx.strokeStyle = ck > 0 ? C.white : C.g3;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      K.check(ctx, x + sz / 2, y + sz / 2, sz * 0.55, ck);
      M.T.label(ctx, `W${i + 1}`, x + sz / 2, y + sz + 28, g - (A10[0] + 0.3 + i * 0.04), { size: 14, color: C.g2, tracking: '2px' });
    }
  }

  // ---------------- A11 CTA: The Complete Fighter ----------------
  const A11 = [ls('cta') - 0.08, TM.duration];
  const COVER = { w: 360 };
  function act11(ctx, g) {
    const a = env(g, A11[0], A11[1], 0.22, 0.6);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const img = M.IMG && M.IMG.cover;
    const iw = img ? img.naturalWidth : 642, ih = img ? img.naturalHeight : 1039;
    const w = COVER.w, h = (w * ih) / iw, x = 540 - w / 2, y = 880 - h / 2;
    const s0 = tw(g, A11[0], A11[0] + 0.55, E.outExpo);
    const name = W('cta', 10) - 0.05;
    const bump = env(g, name, name + 0.5, 0.12, 0.35) * 0.035;
    const sc = lerp(0.9, 1, s0) + bump;
    ctx.save();
    ctx.translate(540, 880 + (1 - s0) * 30);
    ctx.scale(sc, sc);
    ctx.translate(-540, -880);
    ctx.globalAlpha *= s0;
    if (img && img.complete) ctx.drawImage(img, x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    // light sweep on the title
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
    // highlight Part 01 on the cover
    const six = W('cta', 3) - 0.05;
    const hk = tw(g, six, six + 0.45, E.inOutCubic);
    if (hk > 0) {
      const k = w / iw, rx = x + 40 * k, ry = y + 782 * k, rw = 210 * k, rh = 40 * k;
      const per = 2 * (rw + rh);
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
    M.T.label(ctx, 'PART 01  ·  6-WEEK MIND PROGRAM', 540, y + h + 46, g - (six + 0.2), { size: 16, color: C.g1, tracking: '4px' });
    // link in bio
    const lb = W('cta', 13) - 0.1;
    const lk = tw(g, lb, lb + 0.3, E.outBack);
    if (lk > 0.002) {
      const bob = Math.sin((g - lb) * 7) * 6 * M.clamp(lk);
      M.I.arrow(ctx, 540, 520 + bob, 540, 470 + bob, M.clamp(lk), { lw: 3.5, head: 16 });
      M.T.label(ctx, 'LINK IN BIO', 540, 555, g - lb, { size: 22, color: C.white, tracking: '7px', weight: 600 });
    }
  }

  const tl = new M.Timeline(TM.duration);
  tl.add(0, roomEnd, (ctx, lt, D, g) => roomLayer(ctx, g));
  [[A1, act1], [A2, act2], [A3, act3], [A4, act4], [A5, act5], [A6, act6], [A7, act7], [A8, act8], [A9, act9], [A10, act10], [A11, act11]].forEach(([w, fn]) =>
    tl.add(w[0], w[1] - w[0], (ctx, lt, D, g) => fn(ctx, g))
  );
  tl.add(0, TM.duration, (ctx, lt, D, g) => K.subtitles(ctx, g, TM));

  // ---------------- sound cues ----------------
  const cues = [];
  const cue = (t, type, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), type, gain });
  cue(0.02, 'low', 0.6);
  cue(W('hook', 2), 'zap', 1);
  cue(W('hook', 2), 'low', 0.8);
  cue(W('hook', 6), 'tick', 0.6);
  cue(W('room', 0), 'tick');
  cue(W('room', 4) - 0.1, 'pop', 0.7);
  cue(W('room', 5) + 0.05, 'tick', 0.7);
  cue(W('room', 7) - 0.1, 'pop', 0.8);
  cue(W('room', 11), 'zap', 0.9);
  cue(W('pay', 6) - 0.1, 'pop');
  cue(W('pay', 8), 'tick', 0.8);
  for (let i = 0; i < 8; i++) cue(W('men', 0) - 0.05 + i * 0.1, 'tick', 0.25);
  cue(W('men', 3), 'zap', 0.6);
  cue(W('teens', 1) - 0.05, 'pop');
  for (let i = 0; i < 22; i++) cue(W('teens', 6) - 0.15 + i * 0.03, 'tick', 0.18);
  cue(W('teens', 8) - 0.05, 'pop', 0.7);
  cue(W('teens', 11) + 0.1, 'sweep', 0.35);
  for (let i = 0; i < 8; i++) cue(W('muscle', 4) - 0.1 + i * 0.07, 'tick', 0.3);
  cue(W('muscle', 7) + 0.27, 'low', 1);
  cue(W('fix', 11), 'chime', 0.7);
  cue(W('choose', 0) - 0.05, 'pop', 0.6);
  cue(W('choose', 4), 'tick', 0.8);
  cue(W('choose', 9), 'pop', 0.6);
  for (let i = 0; i < 12; i++) cue(W('corner', 3) - 0.1 + i * ((W('corner', 12) - W('corner', 3)) / 12), 'tick', 0.2);
  cue(W('corner', 12) - 0.05, 'bell', 1);
  for (let i = 0; i < 6; i++) cue(W('skill', 8) - 0.08 + i * 0.08, 'tick', 0.55);
  cue(A11[0] + 0.05, 'low', 0.6);
  cue(W('cta', 3) - 0.05, 'pop', 0.6);
  cue(W('cta', 10) - 0.05, 'chime', 0.8);
  cue(W('cta', 13) - 0.1, 'pop', 0.9);

  M.comps.alone = { duration: TM.duration, render: (ctx, t) => tl.render(ctx, t), cues };
})();
