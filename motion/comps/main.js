/* "Go First" — the full piece. Every visual beat is keyed to a spoken word time from comps/timing.js. */
(function () {
  const M = window.M;
  const TM = M.TIMING;
  if (!TM) return;
  const { C, lerp, tw, E, prog, env, mix } = M;
  const L = {};
  TM.lines.forEach((l) => (L[l.id] = l));
  const ls = (id) => L[id].start;
  const W = (id, i) => L[id].words[i].s;
  const TY = 1390;
  const FRONT = M.Pose.front;
  /** act window: from just before line a until just after line b starts */
  const win = (a, b) => [ls(a) - 0.08, b ? ls(b) - 0.04 : TM.duration];
  const actAlpha = (g, w) => env(g, w[0], w[1], 0.22, 0.26);
  const fig = (ctx, x, y, h, pose, o = {}) => M.figure(ctx, { x, y, h, pose, ...o });
  const dashLine = (ctx, a, b, k, o = {}) => {
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
  const chapter = (ctx, text, g, t0, y = 560, t1) => M.T.label(ctx, text, 540, y, g - t0, { color: C.g2, size: 18, tracking: '6px', t1: t1 != null ? t1 - t0 : undefined });

  // ======================= the Asch card + the room (acts 1 & 6) =======================
  const CARD = { y0: 1000, X: { x: 330, h: 230 }, L: [{ k: 'A', x: 610, h: 150 }, { k: 'B', x: 700, h: 230 }, { k: 'C', x: 790, h: 300 }] };
  const cardMap = (s, dy) => (x, y) => ({ x: 540 + (x - 560) * s, y: 880 + dy + (y - 880) * s });
  const ROW = { y: 1180, h: 92, me: 5, ally: 1, x: (i) => 540 + (i - 3) * 100 };

  function drawCard(ctx, g, st) {
    const P = cardMap(st.s, st.dy);
    const lw = 6 * st.s + 1;
    ctx.save();
    ctx.lineCap = 'round';
    const vline = (x, h, k, col) => {
      if (k <= 0) return;
      const a = P(x, CARD.y0), b = P(x, CARD.y0 - h * k);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    dashLine(ctx, P(470, 1010), P(470, 700), st.grow[0], { color: C.g4, dash: [2, 8] });
    vline(CARD.X.x, CARD.X.h, st.grow[0], C.white);
    CARD.L.forEach((ln, i) => {
      const col = i === 1 ? mix(C.g1, C.white, st.hl) : mix(C.g1, C.g3, st.hl);
      vline(ln.x, ln.h, st.grow[i + 1], col);
    });
    // letters
    const ly = 1042, fs = Math.round(14 + 6 * st.s);
    M.T.label(ctx, 'X', P(CARD.X.x, ly).x, P(0, ly).y, (g - st.lt[0]), { size: fs, color: C.g2, tracking: '0px' });
    CARD.L.forEach((ln, i) =>
      M.T.label(ctx, ln.k, P(ln.x, ly).x, P(0, ly).y, g - st.lt[i + 1], { size: fs, color: i === 1 ? mix(C.g2, C.white, st.hl) : C.g2, tracking: '0px' })
    );
    // match guide X → B
    if (st.guide > 0) dashLine(ctx, P(330, 770), P(700, 770), st.guide, { color: C.white, dash: [2, 10], lw: 2 });
    if (st.nodeT != null) M.I.node(ctx, P(700, 770).x, P(700, 770).y, g - st.nodeT, { r: 7 + 2 * st.s });
    // the room's pick: bracket around C
    if (st.cMark > 0) {
      const a = P(760, 680), b = P(820, 1060);
      ctx.save();
      ctx.globalAlpha *= st.cMark;
      ctx.setLineDash([3, 7]);
      ctx.strokeStyle = C.g2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(a.x, a.y, b.x - a.x, b.y - a.y, 10);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return P;
  }

  /** votes: [{ i, k (draw), r (0 = C … 1 = B), col }] */
  function drawVotes(ctx, P, votes, g) {
    const tC = P(790, 1068), tB = P(700, 1068);
    for (const v of votes) {
      if (v.k <= 0) continue;
      const a = { x: ROW.x(v.i), y: ROW.y - ROW.h - 12 };
      const b = { x: lerp(tC.x, tB.x, v.r), y: lerp(tC.y, tB.y, v.r) };
      dashLine(ctx, a, b, v.k, { color: v.col, dash: [2, 7], lw: 2, offset: -g * 30 });
    }
  }

  // ---------------- Act 1: asch · match · room ----------------
  const A1 = win('asch', '75');
  function act1(ctx, g) {
    const a = actAlpha(g, A1);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'ASCH  ·  1951', g, A1[0] + 0.15, 520);

    const three = W('asch', 6);
    const roomT = ls('room') - 0.12;
    const zoom = tw(g, roomT, roomT + 0.6, E.inOutExpo);
    const st = {
      s: lerp(1, 0.62, zoom),
      dy: lerp(0, -150, zoom),
      grow: [tw(g, A1[0] + 0.2, A1[0] + 0.75, E.outExpo), ...[0, 1, 2].map((i) => tw(g, three - 0.05 + i * 0.1, three + 0.45 + i * 0.1, E.outExpo))],
      lt: [A1[0] + 0.45, three + 0.15, three + 0.25, three + 0.35],
      hl: tw(g, W('match', 2) - 0.1, W('match', 2) + 0.25),
      guide: tw(g, W('match', 1) - 0.05, W('match', 1) + 0.45, E.inOutCubic),
      nodeT: W('match', 2),
      cMark: tw(g, W('room', 5), W('room', 5) + 0.3),
    };
    const P = drawCard(ctx, g, st);

    // the participant watches the card, then joins the room
    const pa = tw(g, W('asch', 5) - 0.15, W('asch', 5) + 0.3, E.outCubic) * (1 - zoom);
    if (pa > 0) fig(ctx, 200 - 10 * zoom, 1000 + (1 - pa) * 14, 120, M.Pose.side, { alpha: pa });

    // the room
    const votes = [];
    for (let i = 0; i < 7; i++) {
      const ap = tw(g, roomT + 0.15 + i * 0.05, roomT + 0.5 + i * 0.05, E.outCubic);
      if (ap <= 0) continue;
      const me = i === ROW.me;
      const pose = me ? M.blendPose(FRONT, M.Pose.frontDown, tw(g, W('room', 6), W('room', 6) + 0.35)) : FRONT;
      fig(ctx, ROW.x(i), ROW.y + (1 - ap) * 16, ROW.h, pose, { alpha: ap, color: me ? C.white : C.g2 });
      if (!me) votes.push({ i, k: tw(g, W('room', 5) - 0.12 + i * 0.035, W('room', 5) + 0.25 + i * 0.035, E.outCubic), r: 0, col: C.g2 });
    }
    drawVotes(ctx, P, votes, g);
    if (g > roomT + 0.4) M.T.label(ctx, 'YOU', ROW.x(ROW.me), ROW.y + 34, g - (roomT + 0.4), { size: 15, color: C.g1, tracking: '4px' });
  }

  // ---------------- Act 2: 75% ----------------
  const A2 = win('75', 'lines');
  function act2(ctx, g) {
    const a = actAlpha(g, A2);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'RESULT', g, A2[0] + 0.15, 520);
    const t0 = ls('75');
    const ca = tw(g, A2[0] + 0.05, A2[0] + 0.35, E.outCubic);
    ctx.save();
    ctx.globalAlpha *= ca;
    M.T.counter(ctx, 0, 75, 540, 700, g, t0 - 0.05, t0 + 0.95, { size: 104, weight: 500, suffix: '%' });
    ctx.restore();
    M.T.label(ctx, 'WENT ALONG AT LEAST ONCE', 540, 785, g - (t0 + 0.35), { size: 16, color: C.g2 });
    const lit0 = W('75', 1) - 0.25;
    for (let i = 0; i < 20; i++) {
      const row = Math.floor(i / 10), col = i % 10;
      const x = 540 + (col - 4.5) * 78, y = 1010 + row * 128;
      const ap = tw(g, A2[0] + 0.05 + i * 0.012, A2[0] + 0.35 + i * 0.012, E.outCubic);
      const lit = i < 15 ? tw(g, lit0 + i * 0.045, lit0 + 0.18 + i * 0.045) : 0;
      fig(ctx, x, y + (1 - ap) * 12, 74, FRONT, { alpha: ap, color: mix(C.g3, C.white, lit) });
    }
  }

  // ---------------- Act 3: lines → the room ----------------
  const A3 = win('lines', 'half');
  function act3(ctx, g) {
    const a = actAlpha(g, A3);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const r0 = ls('misjudged') - 0.05;
    const collapse = tw(g, r0 - 0.2, r0 + 0.12, E.inExpo);
    chapter(ctx, 'PERCEPTION', g, A3[0] + 0.15, 520, r0 - 0.3);
    chapter(ctx, 'PRESSURE', g, r0 + 0.1, 520);

    if (collapse < 1) {
      const p = 1 - collapse;
      const grow = tw(g, A3[0] + 0.1, A3[0] + 0.55, E.outExpo);
      const h = 230 * grow, base = 990, xl = lerp(540, 470, p), xr = lerp(540, 610, p);
      ctx.save();
      ctx.globalAlpha *= p;
      const gk = tw(g, W('lines', 2) - 0.1, W('lines', 2) + 0.35, E.outCubic);
      dashLine(ctx, { x: 400, y: base - 230 }, { x: 680, y: base - 230 }, gk, { color: C.g3 });
      dashLine(ctx, { x: 400, y: base }, { x: 680, y: base }, gk, { color: C.g3 });
      ctx.strokeStyle = C.white;
      ctx.lineCap = 'round';
      ctx.lineWidth = 7;
      for (const x of [xl, xr]) {
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x, base - h);
        ctx.stroke();
      }
      const ek = tw(g, W('lines', 4) - 0.1, W('lines', 4) + 0.2, E.outExpo);
      ctx.lineWidth = 3;
      for (const dy of [-8, 8]) {
        ctx.beginPath();
        ctx.moveTo(540 - 16 * ek, base - 115 + dy);
        ctx.lineTo(540 + 16 * ek, base - 115 + dy);
        ctx.stroke();
      }
      ctx.restore();
      M.T.label(ctx, 'X', 470, base + 40, g - (A3[0] + 0.4), { size: 18, tracking: '0px', t1: r0 - 0.25 - (A3[0] + 0.4) });
      M.T.label(ctx, 'B', 610, base + 40, g - (A3[0] + 0.5), { size: 18, tracking: '0px', color: C.white, t1: r0 - 0.25 - (A3[0] + 0.5) });
    }

    if (g > r0) {
      const cx = 540, cy = 880, R = 290;
      const press = tw(g, W('misjudged', 3) - 0.1, W('misjudged', 3) + 0.4);
      // pressure waves contracting inward
      const on = tw(g, r0 + 0.15, r0 + 0.5);
      for (let k = 0; k < 3; k++) {
        const ph = ((g - r0) * 1.35 + k / 3) % 1;
        M.G.ring(ctx, cx, cy, lerp(245, 92, E.inCubic(ph)), { stroke: C.g2, lw: 1.5, alpha: on * Math.sin(ph * Math.PI) * 0.7 });
      }
      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI / 2 + (i / 9) * M.TAU;
        const ap = tw(g, r0 + 0.05 + i * 0.035, r0 + 0.35 + i * 0.035, E.outBack);
        if (ap <= 0) continue;
        const rr = R * lerp(1.15, 1, ap) * lerp(1, 0.93, press);
        fig(ctx, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr + 36, 72, FRONT, { alpha: M.clamp(ap), color: C.g2 });
      }
      const ca = tw(g, r0 + 0.02, r0 + 0.3, E.outCubic);
      fig(ctx, cx, cy + 60, lerp(118, 104, press), M.blendPose(FRONT, M.Pose.frontDown, press), { alpha: ca });
    }
  }

  // ---------------- Act 4: spotlight ----------------
  const A4 = win('half', 'stoics');
  function act4(ctx, g) {
    const a = actAlpha(g, A4);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'GILOVICH  ·  2000', g, A4[0] + 0.15, 440);
    const q = W('quarter', 6);
    const shrink = tw(g, q - 0.4, q + 0.25, E.inOutCubic);
    const ck = tw(g, A4[0] + 0.1, A4[0] + 0.55, E.outCubic);
    const apex = { x: 540, y: 640 }, gy = 960, w = lerp(300, 150, shrink);

    // cone of light
    ctx.save();
    ctx.globalAlpha *= ck;
    const grd = ctx.createLinearGradient(0, apex.y, 0, gy);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(1, 'rgba(255,255,255,0.10)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(540 - w / 2, gy);
    ctx.lineTo(540 + w / 2, gy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.g4;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(540, gy + 2, w / 2, 13, 0, 0, M.TAU);
    ctx.strokeStyle = C.g3;
    ctx.stroke();
    ctx.restore();
    fig(ctx, 540, gy, 120, FRONT, { alpha: tw(g, A4[0] + 0.15, A4[0] + 0.45, E.outCubic) });

    // audience
    const watch = [1, 2, 4, 6, 8, 10], keep = [2, 6, 10];
    const h0 = W('half', 2) - 0.05;
    for (let i = 0; i < 12; i++) {
      const ang = lerp(0.18, Math.PI - 0.18, i / 11);
      const x = 540 + Math.cos(ang) * 410, y = 1060 + Math.sin(ang) * 150;
      const ap = tw(g, A4[0] + 0.2 + i * 0.025, A4[0] + 0.5 + i * 0.025, E.outCubic);
      const j = watch.indexOf(i);
      let lit = 0;
      if (j >= 0) {
        const k = tw(g, h0 + j * 0.05, h0 + 0.3 + j * 0.05, E.outCubic);
        const drop = keep.includes(i) ? 0 : tw(g, q - 0.45 + j * 0.04, q - 0.1 + j * 0.04, E.inCubic);
        lit = k * (1 - drop);
        if (lit > 0) dashLine(ctx, { x, y: y - 62 - 8 }, { x: 540, y: gy - 70 }, k * (1 - drop), { color: C.g2, dash: [2, 8] });
      }
      fig(ctx, x, y, 58, FRONT, { alpha: ap, color: mix(C.g3, C.white, lit) });
    }
    // readout
    if (g > h0 - 0.1) {
      const ra = tw(g, h0 - 0.1, h0 + 0.2, E.outCubic);
      const v = lerp(50, 25, shrink);
      ctx.save();
      ctx.globalAlpha *= ra;
      M.T.number(ctx, `${Math.round(v)}%`, 540, 525, { size: 56, weight: 500 });
      ctx.restore();
      M.T.label(ctx, 'THINK THEY NOTICE', 540, 580, g - h0, { size: 15, color: C.g2, t1: q - 0.45 - h0 });
      M.T.label(ctx, 'ACTUALLY NOTICE', 540, 580, g - (q - 0.1), { size: 15, color: C.white });
    }
  }

  // ---------------- Act 5: stoic assent ----------------
  const A5 = win('stoics', 'ally');
  const GATE = { x: 578, y: 895, half: 100 };
  const SH = (() => {
    const r = M.rng(41), types = ['triangle', 'square', 'circle', 'diamond'];
    return Array.from({ length: 12 }, (_, i) => ({ type: types[i % 4], y: lerp(810, 980, r()), s: lerp(10, 17, r()), seed: 100 + i, rot: r() * 6 }));
  })();
  const sides = { triangle: 3, square: 4, diamond: 4, circle: 5 };
  function act5(ctx, g) {
    const a = actAlpha(g, A5);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'STOIC  ·  SYNKATATHESIS', g, A5[0] + 0.15, 560);
    const gy = 990;
    fig(ctx, 400, gy, 130, M.Pose.side, { alpha: tw(g, A5[0] + 0.1, A5[0] + 0.45, E.outCubic) });

    // the gate between impression and response
    const gk = tw(g, A5[0] + 0.25, A5[0] + 0.7, E.outExpo);
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(GATE.x, GATE.y - GATE.half * gk);
    ctx.lineTo(GATE.x, GATE.y + GATE.half * gk);
    ctx.stroke();
    ctx.restore();
    const mom0 = W('stoics', 7), ast = W('stoics', 11);
    if (gk > 0.3) {
      M.G.ring(ctx, GATE.x, GATE.y, 26, { stroke: C.white, lw: 2, k: tw(g, mom0, ast, E.linear), cap: 'round' });
      M.G.ring(ctx, GATE.x, GATE.y, 26, { stroke: C.g4, lw: 2, alpha: gk * 0.8 });
      ctx.save();
      ctx.beginPath();
      ctx.arc(GATE.x, GATE.y, 9, 0, M.TAU);
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      M.I.node(ctx, GATE.x, GATE.y, g - ast, { r: 9 });
    }
    M.T.label(ctx, 'IMPRESSION', 790, 1060, g - (A5[0] + 0.6), { size: 15, color: C.g2, tracking: '4px' });
    M.T.label(ctx, 'RESPONSE', 400, 1060, g - (A5[0] + 0.75), { size: 15, color: C.g2, tracking: '4px' });

    // impressions: three wait at the gate, then a rush that breaks on it
    const rush = W('yours', 0) - 0.08;
    SH.forEach((sh, i) => {
      let t0, x0, travel, waitX = null;
      if (i < 3) {
        t0 = W('stoics', 4) + i * 0.3;
        travel = 0.8;
        x0 = 930;
        waitX = 640 + i * 18;
      } else {
        t0 = rush + (i - 3) * 0.085;
        travel = 0.34;
        x0 = 980;
      }
      if (g < t0) return;
      const impact = i < 3 ? rush + 0.3 + i * 0.07 : t0 + travel;
      const y = i < 3 ? 845 + i * 50 : sh.y;
      if (g < impact) {
        let x;
        if (i < 3) {
          const arrive = tw(g, t0, t0 + travel, E.outCubic);
          const hit = tw(g, impact - 0.2, impact, E.inQuad);
          x = lerp(lerp(x0, waitX, arrive), GATE.x + sh.s + 4, hit);
        } else x = lerp(x0, GATE.x + sh.s + 4, E.inQuad(prog(g, t0, impact)));
        const ap = tw(g, t0, t0 + 0.15);
        M.G.shape(ctx, sh.type, x, y + M.noise(g * 2 + i, 3) * 3, sh.s, sh.rot + g * 1.5, { stroke: C.g1, lw: 2.5, alpha: ap });
      } else {
        // deflected: bounces back off the gate, splits in two and fades
        const k = prog(g, impact, impact + 0.5);
        if (k >= 1) return;
        const e = E.outCubic(k);
        ctx.save();
        ctx.globalAlpha *= 1 - E.inQuad(k);
        M.G.shape(ctx, sh.type, GATE.x + sh.s + 4 + 90 * e, y + (i % 2 ? 1 : -1) * 26 * e, sh.s * (1 - 0.6 * e), sh.rot + (i % 2 ? 3 : -3) * e, { stroke: C.g1, lw: 2.5 });
        ctx.restore();
        // a short flash where it touched the gate
        const f = 1 - prog(g, impact, impact + 0.25);
        if (f > 0) {
          ctx.save();
          ctx.globalAlpha *= f;
          ctx.strokeStyle = C.white;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(GATE.x, y - 14);
          ctx.lineTo(GATE.x, y + 14);
          ctx.stroke();
          ctx.restore();
        }
      }
    });
    // circle of control appears on "yours"
    const rk = tw(g, W('yours', 6) - 0.1, W('yours', 6) + 0.5, E.inOutCubic);
    if (rk > 0) M.G.ring(ctx, 400, gy - 66, 112, { stroke: C.white, lw: 2, k: rk, cap: 'round' });
  }

  // ---------------- Act 6: one ally ----------------
  const A6 = win('ally', 'five');
  function act6(ctx, g) {
    const a = actAlpha(g, A6);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'ASCH  ·  ONE ALLY', g, A6[0] + 0.15, 520);
    const P = drawCard(ctx, g, { s: 0.62, dy: -150, grow: [1, 1, 1, 1], lt: [-9, -9, -9, -9], hl: 1, guide: 0, nodeT: null, cMark: 1 });
    const one = W('ally', 3), voice = W('ally', 5);
    const allyK = tw(g, one - 0.1, one + 0.3, E.inOutCubic);
    const meK = tw(g, voice - 0.05, voice + 0.35, E.outCubic);
    const votes = [];
    for (let i = 0; i < 7; i++) {
      const ap = tw(g, A6[0] + i * 0.03, A6[0] + 0.3 + i * 0.03, E.outCubic);
      const me = i === ROW.me, ally = i === ROW.ally;
      const col = me ? C.white : ally ? mix(C.g2, C.white, allyK) : C.g2;
      const pose = me ? M.blendPose(M.Pose.frontDown, FRONT, meK) : FRONT;
      fig(ctx, ROW.x(i), ROW.y, ROW.h, pose, { alpha: ap, color: col });
      if (!me) votes.push({ i, k: ap, r: ally ? allyK : 0, col: ally ? mix(C.g2, C.white, allyK) : C.g2 });
      else votes.push({ i, k: meK, r: 1, col: C.white });
    }
    drawVotes(ctx, P, votes, g);
    M.I.tag(ctx, 'ALLY', ROW.x(ROW.ally), ROW.y - ROW.h - 26, 0, g - (one + 0.2), {});
    M.T.label(ctx, 'YOU', ROW.x(ROW.me), ROW.y + 34, g - A6[0], { size: 15, color: C.g1, tracking: '4px', dur: 0.01 });
  }

  // ---------------- Act 7: conformity falls ----------------
  const A7 = win('five', 'permission');
  function act7(ctx, g) {
    const a = actAlpha(g, A7);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'CONFORMITY', g, A7[0] + 0.15, 560);
    const base = 1060, px = 9, bw = 96;
    const grow = tw(g, A7[0] + 0.1, A7[0] + 0.6, E.outExpo);
    const fall = tw(g, W('five', 1) - 0.05, W('five', 4) + 0.15, E.inOutCubic);
    const v2 = lerp(32, 5, fall);
    ctx.save();
    ctx.strokeStyle = C.g3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(310, base);
    ctx.lineTo(lerp(310, 770, grow), base);
    ctx.stroke();
    ctx.fillStyle = C.g3;
    ctx.fillRect(440 - bw / 2, base - 32 * px * grow, bw, 32 * px * grow);
    ctx.fillStyle = C.white;
    ctx.fillRect(640 - bw / 2, base - v2 * px * grow, bw, v2 * px * grow);
    ctx.globalAlpha *= grow;
    M.T.number(ctx, '32%', 440, base - 32 * px * grow - 34, { size: 38, color: C.g1 });
    M.T.number(ctx, `${Math.round(v2)}%`, 640, base - v2 * px * grow - 34, { size: 38, color: C.white });
    ctx.restore();
    const fa = tw(g, A7[0] + 0.25, A7[0] + 0.55, E.outCubic);
    fig(ctx, 440, base + 100, 64, FRONT, { alpha: fa, color: C.g2 });
    fig(ctx, 618, base + 100, 64, FRONT, { alpha: fa });
    fig(ctx, 662, base + 100, 64, FRONT, { alpha: fa });
    M.T.label(ctx, 'ALONE', 440, base + 140, g - (A7[0] + 0.35), { size: 15, color: C.g2 });
    M.T.label(ctx, 'ONE ALLY', 640, base + 140, g - (A7[0] + 0.45), { size: 15, color: C.g1 });
  }

  // ---------------- Act 8: permission spreads ----------------
  const A8 = win('permission', 'first');
  const TREE = [
    [{ x: 540, y: 700 }],
    [{ x: 395, y: 880 }, { x: 685, y: 880 }],
    [{ x: 322, y: 1060 }, { x: 468, y: 1060 }, { x: 612, y: 1060 }, { x: 758, y: 1060 }],
  ];
  function act8(ctx, g) {
    const a = actAlpha(g, A8);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const lightT = [W('permission', 0) - 0.05, W('permission', 1) + 0.3, W('permission', 3) + 0.05];
    const h = 74;
    // edges
    for (let l = 1; l < 3; l++) {
      TREE[l].forEach((c, j) => {
        const p = TREE[l - 1][Math.floor(j / 2)];
        const A = { x: p.x, y: p.y + 14 }, B = { x: c.x, y: c.y - h - 14 };
        const ek = tw(g, A8[0] + 0.1 + l * 0.08, A8[0] + 0.45 + l * 0.08, E.outCubic);
        dashLine(ctx, A, B, ek, { color: C.g4, dash: [], lw: 2 });
        const pk = tw(g, lightT[l - 1] + 0.05, lightT[l], E.inOutCubic);
        dashLine(ctx, A, B, pk, { color: C.white, dash: [], lw: 2 });
      });
    }
    TREE.forEach((lvl, l) => {
      const ap = tw(g, A8[0] + 0.05 + l * 0.08, A8[0] + 0.35 + l * 0.08, E.outCubic);
      const lit = tw(g, lightT[l], lightT[l] + 0.2);
      lvl.forEach((n) => fig(ctx, n.x, n.y, h, FRONT, { alpha: ap, color: mix(C.g3, C.white, lit) }));
      ctx.save();
      ctx.globalAlpha *= lit;
      M.T.number(ctx, String(lvl.length), 880, lvl[0].y - h / 2, { size: 30, color: C.g2 });
      ctx.restore();
    });
  }

  // ---------------- Act 9: go first ----------------
  const A9 = win('first', 'cta');
  function act9(ctx, g) {
    const a = actAlpha(g, A9);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const gy = 1000, h = 112, go = W('first', 0) - 0.08, v = 165;
    const lk = tw(g, A9[0] + 0.05, A9[0] + 0.6, E.outExpo);
    ctx.save();
    ctx.strokeStyle = C.g4;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(170, gy);
    ctx.lineTo(lerp(170, 910, lk), gy);
    ctx.stroke();
    ctx.restore();
    M.I.node(ctx, 820, gy, g - W('first', 1), { r: 7, hollow: true });
    for (let i = 0; i < 6; i++) {
      const start = i === 0 ? go : go + 0.5 + (i - 1) * 0.24;
      const u = Math.max(0, g - start);
      const dist = u < 0.25 ? (v * u * u) / 0.5 : v * (u - 0.125);
      const amp = Math.min(1, u / 0.25);
      const x = 610 - i * 80 + dist;
      const edge = 1 - prog(x, 840, 910);
      const ap = tw(g, A9[0] + i * 0.04, A9[0] + 0.3 + i * 0.04, E.outCubic) * edge;
      if (ap <= 0) continue;
      const pose = amp > 0 ? M.walkPose(M.walkPhase(dist, h), amp) : M.Pose.side;
      fig(ctx, x, gy - 3, h, pose, { alpha: ap, color: i === 0 ? C.white : C.g2 });
    }
  }

  // ---------------- Act 10: CTA — pass it on ----------------
  const A10 = [ls('cta') - 0.08, TM.duration];
  const SEND = new M.I.Path([{ x: 372, y: 905 }, { x: 450, y: 790 }, { x: 540, y: 755 }, { x: 630, y: 790 }, { x: 708, y: 905 }]);
  /** geometric paper plane, nose pointing along angle a */
  const plane = (ctx, x, y, a, s, alpha) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(s, s);
    ctx.globalAlpha *= alpha;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4 / s;
    ctx.strokeStyle = C.white;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(-18, -15); ctx.lineTo(-7, 2); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(-7, 2); ctx.lineTo(-12, 15); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };
  function act10(ctx, g) {
    const a = env(g, A10[0], A10[1], 0.22, 0.75);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    chapter(ctx, 'PASS IT ON', g, A10[0] + 0.15, 600);
    const gy = 1000, h = 124;
    const send = W('cta', 0) + 0.15, arrive = W('cta', 3) + 0.4;
    const fa = tw(g, A10[0], A10[0] + 0.35, E.outCubic);
    const fb = tw(g, A10[0] + 0.12, A10[0] + 0.47, E.outCubic);
    const lit = tw(g, arrive - 0.05, arrive + 0.3);
    const calm = tw(g, W('cta', 8) - 0.1, W('cta', 8) + 0.45, E.inOutCubic);
    // sender raises an arm as the plane leaves
    const throwK = env(g, send - 0.15, send + 0.55, 0.15, 0.3);
    const sendPose = M.blendPose(FRONT, { ...FRONT, ra1: 2.0, ra2: 2.3 }, throwK);
    fig(ctx, 330, gy + (1 - fa) * 16, h, sendPose, { alpha: fa });
    fig(ctx, 750, gy + (1 - fb) * 16, h, M.blendPose(FRONT, M.Pose.frontCalm, calm), { alpha: fb, color: mix(C.g3, C.white, lit) });

    // trail + plane
    const u = tw(g, send, arrive, E.inOutCubic);
    if (g > send - 0.02) {
      SEND.draw(ctx, 0, u, { stroke: C.g2, lw: 2, dash: [2, 10], offset: -g * 20 });
      if (g < arrive + 0.05) {
        const p = SEND.at(u);
        plane(ctx, p.x, p.y, p.a, lerp(1.0, 1.3, Math.sin(u * Math.PI)), tw(g, send - 0.02, send + 0.12));
      }
    }
    M.I.node(ctx, 750, gy - h - 22, g - arrive, { r: 6 });
    M.T.label(ctx, 'YOU', 330, gy + 36, g - (A10[0] + 0.3), { size: 15, color: C.g1, tracking: '4px' });
    M.T.label(ctx, 'SOMEONE', 750, gy + 36, g - (arrive + 0.05), { size: 15, color: C.g1, tracking: '4px' });
  }

  // ---------------- subtitles ----------------
  function words(ctx, g) {
    ctx.globalAlpha = 1 - tw(g, TM.duration - 0.7, TM.duration - 0.05, E.inCubic);
    TM.lines.forEach((l, i) => {
      const next = TM.lines[i + 1];
      const first = l.words[0].s - 0.06, last = l.words[l.words.length - 1].s;
      if (g < first - 0.05) return;
      const t1 = next ? Math.min(Math.max(last + 0.3, next.start - 0.42), next.words[0].s - 0.06 - 0.32) : null;
      if (t1 != null && g > t1 + 0.7) return;
      M.T.words(ctx, { text: l.words.map((w) => w.w).join(' '), x: 540, y: TY, times: l.words.map((w) => w.s - 0.06), t1 }, g);
    });
  }

  const tl = new M.Timeline(TM.duration);
  [[A1, act1], [A2, act2], [A3, act3], [A4, act4], [A5, act5], [A6, act6], [A7, act7], [A8, act8], [A9, act9], [A10, act10]].forEach(([w, fn]) =>
    tl.add(w[0], w[1] - w[0], (ctx, lt, D, g) => fn(ctx, g))
  );
  tl.add(0, TM.duration, (ctx, lt, D, g) => words(ctx, g));

  // ---------------- sound cues (rendered by tts/mix.py) ----------------
  const cues = [];
  const cue = (t, type, gain = 1) => cues.push({ t: +t.toFixed(3), type, gain });
  cue(A1[0] + 0.2, 'tick');
  [0, 1, 2].forEach((i) => cue(W('asch', 6) - 0.05 + i * 0.1, 'tick', 0.8));
  cue(W('match', 2), 'pop');
  cue(W('room', 5) - 0.1, 'low', 0.7);
  for (let i = 0; i < 6; i++) cue(W('room', 5) - 0.12 + i * 0.04, 'tick', 0.35);
  for (let i = 0; i < 15; i++) cue(W('75', 1) - 0.25 + i * 0.045, 'tick', 0.3);
  cue(W('lines', 4), 'pop', 0.7);
  cue(ls('misjudged') - 0.05, 'low', 0.9);
  for (let i = 0; i < 6; i++) cue(W('half', 2) - 0.05 + i * 0.05, 'tick', 0.35);
  cue(W('quarter', 6) - 0.35, 'sweep', 0.6);
  cue(A5[0] + 0.25, 'tick');
  cue(W('stoics', 11), 'pop');
  for (let i = 3; i < 12; i++) cue(W('yours', 0) - 0.08 + (i - 3) * 0.085 + 0.34, 'shard', 0.55);
  for (let i = 0; i < 3; i++) cue(W('yours', 0) - 0.08 + 0.3 + i * 0.07, 'shard', 0.55);
  cue(W('yours', 6) - 0.1, 'chime', 0.7);
  cue(W('ally', 3) - 0.05, 'pop');
  cue(W('ally', 5), 'pop', 0.8);
  cue(W('five', 1) - 0.05, 'sweep', 0.8);
  cue(W('permission', 0) - 0.05, 'pop', 0.7);
  cue(W('permission', 1) + 0.3, 'pop', 0.7);
  cue(W('permission', 3) + 0.05, 'pop', 0.7);
  cue(W('first', 1), 'chime', 0.9);
  cue(W('cta', 0) + 0.15, 'sweep', 0.5);
  cue(W('cta', 3) + 0.4, 'pop', 0.9);
  cue(W('cta', 8) + 0.1, 'chime', 0.6);

  M.comps.main = { duration: TM.duration, render: (ctx, t) => tl.render(ctx, t), cues };
})();
