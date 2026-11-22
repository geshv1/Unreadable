/* "The Donkey and the Lion" — 4:3 (1440×1080). Hard work vs. mind, opportunity and heart.
   Macnamara, Hambrick & Oswald 2014 · Wiseman, The Luck Factor (newspaper test) · Duckworth et al. 2007 (West Point). */
(function () {
  const M = window.M;
  const TM = M.TIMINGS && M.TIMINGS.lion;
  if (!TM) return;
  const { C, lerp, tw, E, prog, env, mix, K, O } = M;
  const { ls, W } = K.track(TM);
  const P = M.Pose;
  const WD = 1440, HT = 1080, GY = 770;
  const fig = (ctx, x, y, h, pose, o = {}) => M.figure(ctx, { x, y, h, pose, ...o });
  const num = (ctx, s, x, y, o) => M.T.number(ctx, s, x, y, o);
  const lab = (ctx, text, x, y, t, o = {}) => M.T.label(ctx, text, x, y, t, { size: 16, color: C.g2, tracking: '4px', ...o });
  const chap = (ctx, text, lt) => M.T.label(ctx, text, 720, 110, lt - 0.12, { size: 18, color: C.g1, tracking: '6px' });
  const fin = (lt, t0 = 0, d = 0.3) => tw(lt, t0, t0 + d, E.outCubic);
  const ground = (ctx, lt, x0 = 150, x1 = 1290, y = GY) => {
    const k = tw(lt, -0.1, 0.35, E.outExpo);
    K.line(ctx, [{ x: lerp((x0 + x1) / 2, x0, k), y }, { x: lerp((x0 + x1) / 2, x1, k), y }], { color: C.g3, lw: 2.5 });
  };
  const flipX = (ctx, x, fn) => { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); fn(); ctx.restore(); };
  const bigText = (ctx, text, x, y, size, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = `800 ${size}px ${o.fam || M.FONT}`;
    ctx.letterSpacing = o.tracking || '0px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (o.outline) { ctx.strokeStyle = o.color || C.white; ctx.lineWidth = o.lw || 3; ctx.strokeText(text, x, y); }
    else { ctx.fillStyle = o.color || C.white; ctx.fillText(text, x, y); }
    ctx.restore();
  };

  // ---------------- 1 hook: the donkey works harder ----------------
  function s1(ctx, g, lt) {
    ground(ctx, 1);
    // ground dashes scroll under the working donkey
    ctx.save();
    ctx.fillStyle = C.g4;
    for (let i = 0; i < 14; i++) { const x = 160 + ((i * 60 - g * 120) % 840 + 840) % 840; ctx.fillRect(x, GY + 14, 28, 3); }
    ctx.restore();
    O.cart(ctx, 300, GY, 200, g, { pole: 70 });
    O.donkey(ctx, 600, GY, 240, g * 7, { walk: 1, low: true });
    for (let i = 0; i < 4; i++) {
      const q = ((g * 1.3 + i / 4) % 1);
      ctx.save();
      ctx.globalAlpha *= (1 - q) * 0.9;
      ctx.fillStyle = C.g1;
      const sx = 800 + q * 50 + i * 6, sy = GY - 260 + q * 40 - Math.sin(q * Math.PI) * 30;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, M.TAU);
      ctx.moveTo(sx - 5, sy); ctx.lineTo(sx, sy - 12); ctx.lineTo(sx + 5, sy);
      ctx.fill();
      ctx.restore();
    }
    O.lion(ctx, 1110, GY, 230, g * 2, { mode: 'lie' });
    // z z z
    for (let i = 0; i < 3; i++) {
      const q = ((g * 0.6 + i / 3) % 1);
      ctx.save();
      ctx.globalAlpha *= Math.sin(q * Math.PI) * 0.8;
      ctx.font = `600 ${20 + i * 6}px ${M.FONT}`;
      ctx.fillStyle = C.g2;
      ctx.fillText('z', 1210 + q * 40, GY - 160 - q * 90);
      ctx.restore();
    }
    lab(ctx, 'WORKS ALL DAY', 520, GY + 44, lt + 0.4, { color: C.white });
    lab(ctx, 'RESTS', 1110, GY + 44, lt + 0.3);
  }

  // ---------------- 2 why isn't the donkey king ----------------
  function s2(ctx, g, lt) {
    ground(ctx, lt);
    O.donkey(ctx, 560, GY, 270, 0, { alpha: fin(lt, 0) });
    const k = W('why', 5) - 0.1;
    const drop = tw(lt, 0.05, 0.6, E.outBack);
    const tilt = tw(g, k, k + 0.4, E.outBack);
    const hx = 560 + 0.66 * 270 + 20, hy = GY - 0.42 * 270 - 0.3 * 270 - 115;
    O.crown(ctx, hx, lerp(120, hy, drop) - tilt * 40, 90, { rot: tilt * 0.5 + Math.sin(g * 20) * 0.08 * tilt, alpha: fin(lt, 0.05) });
    const qk = tw(g, k, k + 0.3, E.outBack);
    if (qk > 0) bigText(ctx, '?', 980, 380, 220 * M.clamp(qk), { outline: true, lw: 4 });
  }

  // ---------------- 3 what society says ----------------
  function s3(ctx, g, lt) {
    ground(ctx, lt);
    // billboard
    const bk = tw(lt, 0, 0.45, E.outExpo);
    K.line(ctx, [{ x: 560, y: GY }, { x: 560, y: lerp(GY, 300, bk) }], { color: C.g3, lw: 5 });
    K.line(ctx, [{ x: 880, y: GY }, { x: 880, y: lerp(GY, 300, bk) }], { color: C.g3, lw: 5 });
    ctx.save();
    ctx.globalAlpha *= fin(lt, 0.2);
    ctx.fillStyle = C.white;
    ctx.fillRect(430, 150, 580, 160);
    ctx.restore();
    bigText(ctx, 'WORK HARDER.', 720, 232, 64, { color: C.bg, alpha: fin(lt, 0.3), tracking: '-1px' });
    lab(ctx, 'WHAT SOCIETY SAYS', 720, 345, lt - 0.35, { color: C.g1 });
    // the line of carriers
    const hw = W('society', 3) - 0.1;
    for (let i = 0; i < 5; i++) {
      const x = 250 + i * 160, ap = fin(lt, 0.1 + i * 0.06);
      const pose = M.walkPose(g * 6, 0.6, { ra1: 2.9, ra2: 3.1, la1: 2.9, la2: 3.1 });
      const f = fig(ctx, x, GY, 150, pose, { alpha: ap, color: i === 4 ? C.white : C.g2 });
      const n = i === 4 ? 1 + Math.round(2 * tw(g, hw, hw + 0.5)) : 1;
      ctx.save();
      ctx.globalAlpha *= ap;
      for (let b = 0; b < n; b++) { ctx.fillStyle = b % 2 ? C.g1 : i === 4 ? C.white : C.g2; ctx.fillRect(f.handR.x - 26, f.handR.y - 42 - b * 40, 52, 38); }
      ctx.restore();
    }
  }

  // ---------------- 4 eighty-eight studies ----------------
  function s4(ctx, g, lt) {
    chap(ctx, 'MACNAMARA, HAMBRICK & OSWALD  ·  2014', lt);
    const t0 = W('study', 2) - 0.25;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 11; i++) {
      const n = j * 11 + i;
      const k = tw(g, t0 + n * 0.008, t0 + 0.25 + n * 0.008, E.outBack);
      if (k <= 0) continue;
      O.doc(ctx, 720 + (i - 5) * 66, 220 + j * 72, 40 * M.clamp(k), { color: n % 9 === 0 ? C.white : C.g2 });
    }
    lab(ctx, 'META-ANALYSIS', 720, 790, lt - 0.6, { color: C.g1 });
  }

  // ---------------- 5 twelve percent ----------------
  function s5(ctx, g, lt) {
    const t12 = W('study', 7) - 0.1;
    const k = tw(lt, 0, 0.6, E.inOutCubic);
    const pop = 30 * tw(g, t12, t12 + 0.4, E.outBack);
    O.pie(ctx, 560, 460, 240, 0.12, k, { pop });
    lab(ctx, 'DIFFERENCES IN PERFORMANCE', 560, 760, lt - 0.3);
    const a = tw(g, t12, t12 + 0.3);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha *= a;
      num(ctx, `${Math.round(12 * tw(g, t12, t12 + 0.6))}%`, 1000, 380, { size: 110, weight: 800 });
      ctx.restore();
      lab(ctx, 'EXPLAINED BY PRACTICE', 1000, 460, g - t12 - 0.1, { color: C.white, size: 18 });
      lab(ctx, '88%  ·  EVERYTHING ELSE', 1000, 520, g - t12 - 0.35, { size: 16 });
      K.dash(ctx, { x: 700, y: 260 }, { x: 900, y: 370 }, tw(g, t12 + 0.1, t12 + 0.4), { color: C.g2, dash: [2, 7] });
    }
  }

  // ---------------- 6 hours vs how ----------------
  function s6(ctx, g, lt) {
    const how = W('mind', 2) - 0.1;
    const spin = g * 2.4;
    O.clock(ctx, 460, 450, 160, spin, { alpha: fin(lt, 0), color: mix(C.white, C.g2, tw(g, how, how + 0.4)) });
    lab(ctx, 'HOURS', 460, 660, lt - 0.1, { color: C.g1 });
    const hk = tw(g, how - 0.05, how + 0.35, E.inOutCubic);
    if (hk > 0) M.I.arrow(ctx, 660, 450, 800, 450, hk, { lw: 4, head: 18 });
    const on = tw(g, how + 0.25, how + 0.5);
    O.bulb(ctx, 990, 440, 260, on, { alpha: tw(g, how - 0.1, how + 0.2) });
    lab(ctx, 'HOW', 990, 660, g - (how + 0.2), { color: C.white });
  }

  // ---------------- 7 the lion rests ----------------
  function s7(ctx, g, lt) {
    ground(ctx, lt);
    const d = tw(lt, 0, 1.45, E.inOutSine);
    const ang = Math.PI * (1 - d);
    O.sun(ctx, 720 + Math.cos(ang) * 470, 560 - Math.sin(ang) * 380, 30, g, { alpha: fin(lt, 0.05) });
    K.dash(ctx, { x: 250, y: 560 }, { x: 1190, y: 560 }, 0, {});
    O.rock(ctx, 720, GY, 560, { alpha: fin(lt, 0) });
    O.lion(ctx, 720, GY - 128, 250, g * 2, { mode: 'lie', alpha: fin(lt, 0.1) });
    lab(ctx, 'MOST OF THE DAY', 720, GY + 44, lt - 0.3, { color: C.g1 });
  }

  // ---------------- 8 watch · wait · strike ----------------
  function s8(ctx, g, lt) {
    ground(ctx, lt);
    const wa = W('rest', 8) - 0.1, wt = W('rest', 10) - 0.1, st = W('rest', 13) - 0.15;
    const tx = 1100, ty = GY - 120;
    const hit = tw(g, st, st + 0.45, E.inOutCubic);
    O.target(ctx, tx, ty, 90, { alpha: fin(lt, 0.1) });
    if (hit < 1) {
      const lx = lerp(380, 920, hit), ly = GY - Math.sin(hit * Math.PI) * 220;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(Math.sin(hit * Math.PI * 2) * -0.25 * (hit > 0 ? 1 : 0));
      ctx.translate(-lx, -ly);
      const h = O.lion(ctx, lx, ly, 230, g * 2, { mode: hit > 0 ? 'stand' : 'crouch', alpha: fin(lt, 0) });
      ctx.restore();
      const sk = tw(g, wa, wa + 0.35, E.outCubic) * (1 - hit);
      if (sk > 0) K.dash(ctx, { x: h.head.x + 40, y: h.head.y }, { x: tx - 90, y: ty }, sk, { color: C.white, dash: [3, 9] });
    } else {
      O.lion(ctx, 920, GY, 230, 0, { mode: 'stand' });
      M.I.node(ctx, tx, ty, g - (st + 0.45), { r: 0.1 });
      M.I.node(ctx, tx, ty, g - (st + 0.55), { r: 0.1 });
    }
    const hk = tw(g, wt - 0.05, wt + 0.25, E.outBack) * (1 - tw(g, st, st + 0.2));
    if (hk > 0) O.hourglass(ctx, 720, 300, 120 * M.clamp(hk), tw(g, wt, st), tw(g, wt, wt + 0.35, E.inOutCubic) * Math.PI);
    lab(ctx, 'WATCH', 420, GY + 44, g - wa, { color: g < wt ? C.white : C.g3 });
    lab(ctx, 'WAIT', 720, GY + 44, g - wt, { color: g < st ? C.white : C.g3 });
    lab(ctx, 'STRIKE', 1100, GY + 44, g - st, { color: C.white });
  }

  // ---------------- 9 the newspaper ----------------
  const NP = { x: 720, y: 450, w: 520, h: 600 };
  function s9(ctx, g, lt) {
    chap(ctx, 'RICHARD WISEMAN  ·  THE LUCK FACTOR', lt);
    const hl = W('paper', 9) - 0.1;
    O.newspaper(ctx, NP.x, NP.y + (1 - fin(lt, 0, 0.4)) * 40, NP.w, NP.h, tw(lt, 0.15, 1.2), { alpha: fin(lt, 0), msg: tw(g, hl, hl + 0.45, E.outExpo) });
  }

  // ---------------- 10 counting ----------------
  function s10(ctx, g, lt) {
    const counted = Math.floor(lt * 5.5);
    O.newspaper(ctx, 520, 450, 440, 520, 1, { msg: 1, counted, alpha: 1 });
    // the missed message pulses
    const pulse = (Math.sin(g * 6) + 1) / 2;
    ctx.save();
    ctx.globalAlpha *= 0.5 * pulse;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    ctx.strokeRect(520 - 220 + 10, 450 + 260 - 520 * 0.2 - 22, 440 - 20, 520 * 0.2 + 12);
    ctx.restore();
    num(ctx, String(Math.min(43, counted)), 1010, 380, { size: 120, weight: 800 });
    lab(ctx, 'PHOTOS COUNTED', 1010, 470, lt - 0.1, { color: C.g1 });
    fig(ctx, 1010, GY, 190, P.sitDown && { ...P.side, lean: 0.18, hd: 0.04, hf: 0.03, ra1: 0.9, ra2: 1.7 }, { color: C.g2, dir: -1, alpha: fin(lt, 0.1) });
  }

  // ---------------- 11 lucky / unlucky ----------------
  function s11(ctx, g, lt) {
    ground(ctx, lt);
    K.line(ctx, [{ x: 720, y: 160 }, { x: 720, y: lerp(160, GY, fin(lt, 0, 0.4)) }], { color: C.g4, lw: 3 });
    const lu = W('lucky', 0) - 0.1, un = W('lucky', 4) - 0.1, kc = W('lucky', 6) - 0.1;
    // lucky: head up, sees it
    fig(ctx, 430, GY, 220, { ...P.side, hd: -0.02, hf: 0.0 }, { alpha: fin(g - lu + 0.3, 0) });
    O.eye(ctx, 430, 360, 110, tw(g, lu, lu + 0.3, E.outBack));
    K.check(ctx, 560, 300, 60, tw(g, W('lucky', 2), W('lucky', 2) + 0.3));
    lab(ctx, 'LUCKY', 430, GY + 44, g - lu, { color: C.white, size: 18 });
    // unlucky: head down, tallying forever
    const ua = fin(g - un + 0.4, 0);
    fig(ctx, 1010, GY, 220, { ...P.side, lean: 0.2, hd: 0.045, hf: 0.03, ra1: 0.8, ra2: 1.6 }, { dir: -1, color: C.g2, alpha: ua });
    const tallies = Math.floor(Math.max(0, g - un) * (g > kc ? 9 : 5));
    ctx.save();
    ctx.globalAlpha *= ua;
    ctx.strokeStyle = C.g1;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < Math.min(tallies, 30); i++) {
      const grp = Math.floor(i / 5), j = i % 5, gx = 860 + (grp % 4) * 80, gy = 280 + Math.floor(grp / 4) * 80;
      ctx.beginPath();
      if (j < 4) { ctx.moveTo(gx + j * 14, gy); ctx.lineTo(gx + j * 14, gy + 50); }
      else { ctx.moveTo(gx - 8, gy + 40); ctx.lineTo(gx + 52, gy + 10); }
      ctx.stroke();
    }
    ctx.restore();
    lab(ctx, 'UNLUCKY', 1010, GY + 44, g - un, { size: 18 });
  }

  // ---------------- 12 not luck: attention ----------------
  function s12(ctx, g, lt) {
    const lk = W('attn', 2) - 0.05, at = W('attn', 4) - 0.1;
    O.clover(ctx, 440, 420, 190, { alpha: fin(lt, 0) * (1 - 0.6 * tw(g, lk + 0.3, lk + 0.6)) });
    const sk = tw(g, lk + 0.1, lk + 0.4, E.inOutCubic);
    if (sk > 0) K.line(ctx, [{ x: 300, y: 260 }, { x: lerp(300, 580, sk), y: lerp(260, 600, sk) }], { lw: 6 });
    lab(ctx, 'LUCK', 440, 680, lt - 0.1, { color: C.g2 });
    const ang = g * 2.6;
    O.radar(ctx, 980, 430, 190, ang, { alpha: fin(lt, 0.1) });
    const blips = [[0.5, 0.6], [2.3, 0.35], [4.1, 0.8], [5.4, 0.5]];
    blips.forEach(([a, r], i) => {
      const bx = 980 + Math.cos(a) * 190 * r, by = 430 + Math.sin(a) * 190 * r;
      const since = ((ang - a) % M.TAU + M.TAU) % M.TAU;
      const glow = Math.max(0, 1 - since / 2.5);
      ctx.save();
      ctx.globalAlpha *= fin(lt, 0.2) * (0.25 + 0.75 * glow);
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, M.TAU);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.restore();
      if (i === 0 && g > at) { M.G.ring(ctx, bx, by, 22, { stroke: C.white, lw: 3 }); M.I.node(ctx, bx, by, g - at, { r: 0.1 }); }
    });
    lab(ctx, 'ATTENTION', 980, 680, g - at, { color: C.white, size: 18 });
  }

  // ---------------- 13 West Point, the first summer ----------------
  function s13(ctx, g, lt) {
    chap(ctx, 'DUCKWORTH ET AL.  ·  2007', lt);
    ground(ctx, lt);
    O.chevrons(ctx, 720, 230, 70, 3, { alpha: fin(lt, 0.1) });
    lab(ctx, 'WEST POINT  ·  BEAST BARRACKS', 720, 330, lt - 0.2, { color: C.g1 });
    const sun = tw(g, W('grit', 8) - 0.2, W('grit', 10), E.outCubic);
    O.sun(ctx, 1180, 220, 40 * (0.6 + 0.4 * sun), g, { alpha: 0.4 + 0.6 * sun });
    const surv = W('grit', 6) - 0.1;
    const quit = [1, 4, 6];
    for (let i = 0; i < 8; i++) {
      const x = 230 + i * 130;
      const q = quit.includes(i) ? tw(g, surv + i * 0.08, surv + 0.5 + i * 0.08, E.inOutCubic) : 0;
      const pose = q > 0 ? M.blendPose(M.walkPose(g * 9 + i * 0.4, 1.2, { lean: 0.15 }), P.sideDown, q) : M.walkPose(g * 9 + i * 0.4, 1.2, { lean: 0.15 });
      const gr = i === 7;
      fig(ctx, x, GY, 150, pose, { alpha: fin(lt, 0.05 + i * 0.03) * (1 - 0.7 * q), color: gr ? C.white : C.g2 });
    }
    const gk = W('grit', 3) - 0.1;
    if (g > gk) { O.heart(ctx, 230 + 7 * 130, GY - 205, 40, { alpha: tw(g, gk, gk + 0.3) }); lab(ctx, 'GRIT', 230 + 7 * 130, GY + 44, g - gk, { color: C.white }); }
  }

  // ---------------- 14 grit beat entrance scores ----------------
  function s14(ctx, g, lt) {
    lab(ctx, 'WHO MADE IT THROUGH THE SUMMER?', 720, 230, lt - 0.05, { color: C.g1, size: 18 });
    const bt = W('grit', 11) - 0.15;
    const rows = [{ y: 400, name: 'GRIT', v: 1, col: C.white }, { y: 560, name: 'ENTRANCE SCORES', v: 0.55, col: C.g3 }];
    rows.forEach((r, i) => {
      const k = tw(g, bt - 0.1 + i * 0.1, bt + 0.6 + i * 0.1, E.outExpo);
      lab(ctx, r.name, 330, r.y - 50, lt - i * 0.08, { align: 'left', color: i ? C.g2 : C.white, size: 17 });
      ctx.save();
      ctx.fillStyle = C.g5;
      ctx.fillRect(330, r.y - 20, 780, 40);
      ctx.fillStyle = r.col;
      ctx.fillRect(330, r.y - 20, 780 * r.v * k, 40);
      ctx.restore();
    });
    if (g > bt + 0.4) O.heart(ctx, 1160, 400, 46, { alpha: tw(g, bt + 0.4, bt + 0.7) });
    lab(ctx, 'BETTER PREDICTOR', 720, 690, g - (bt + 0.5), { color: C.white });
  }

  // ---------------- 15 the lion's heart ----------------
  function s15(ctx, g, lt) {
    ground(ctx, lt);
    const ln = W('heart', 2) - 0.1, ht = W('heart', 3) - 0.1;
    const L = O.lion(ctx, 660, GY, 320, g, { mode: 'stand', alpha: fin(lt, 0), roar: tw(g, ht, ht + 0.2) * (1 - tw(g, ht + 0.6, ht + 0.9)) });
    const ck = tw(g, ln - 0.25, ln + 0.25, E.outBack);
    O.crown(ctx, L.head.x, lerp(80, L.top + 4, ck), 96, { alpha: tw(g, ln - 0.3, ln) });
    const beat = 1 + 0.12 * Math.max(0, Math.sin((g - ht) * 9)) * (g > ht ? 1 : 0);
    const hk = tw(g, ht - 0.05, ht + 0.25, E.outBack);
    if (hk > 0) {
      O.heart(ctx, L.chest.x + 60, L.chest.y + 10, 70 * beat * M.clamp(hk), { color: C.bg });
      O.heart(ctx, L.chest.x + 60, L.chest.y + 10, 56 * beat * M.clamp(hk), {});
      for (let i = 0; i < 2; i++) M.I.node(ctx, L.chest.x + 60, L.chest.y + 10, g - ht - i * 0.35, { r: 0.1 });
    }
  }

  // ---------------- 16 work hard · think harder · never quit ----------------
  function s16(ctx, g, lt) {
    const T = [W('end', 0) - 0.1, W('end', 2) - 0.1, W('end', 4) - 0.1];
    const X = [380, 720, 1060];
    X.forEach((x, i) => {
      const k = tw(g, T[i], T[i] + 0.35, E.outBack);
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha *= M.clamp(k);
      ctx.strokeStyle = C.g3;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 150, 210 + (1 - M.clamp(k)) * 30, 300, 420, 20);
      ctx.stroke();
      ctx.restore();
      if (i === 0) O.donkey(ctx, x + 10, 560, 170, g * 7, { walk: 1, low: true, alpha: M.clamp(k) });
      if (i === 1) O.bulb(ctx, x, 420, 200, tw(g, T[1] + 0.25, T[1] + 0.5), { alpha: M.clamp(k) });
      if (i === 2) {
        const beat = 1 + 0.1 * Math.max(0, Math.sin(g * 9));
        O.heart(ctx, x, 430, 130 * beat, { alpha: M.clamp(k) });
      }
      lab(ctx, ['WORK HARD', 'THINK HARDER', 'NEVER QUIT'][i], x, 690, g - T[i] - 0.1, { color: C.white, size: 18 });
    });
  }

  // ---------------- 17 donkey or lion ----------------
  function s17(ctx, g, lt) {
    ground(ctx, lt);
    const d = W('cta', 0) - 0.1, l = W('cta', 2) - 0.1, f = W('cta', 8) - 0.1;
    const fade = tw(g, f, f + 0.4);
    O.donkey(ctx, 360, GY, 240, 0, { alpha: fin(lt, 0) * (1 - 0.5 * fade), color: mix(C.g2, C.white, tw(g, d, d + 0.2) * (1 - tw(g, l, l + 0.2))) });
    flipX(ctx, 1080, () => O.lion(ctx, 1080, GY, 240, g, { mode: 'stand', alpha: fin(lt, 0.05) * (1 - 0.5 * fade), color: mix(C.g2, C.white, tw(g, l, l + 0.2)) }));
    bigText(ctx, 'VS', 720, 520, 90, { outline: true, alpha: fin(lt, 0.15) * (1 - fade) });
    lab(ctx, 'DONKEY', 360, GY + 44, g - d, { color: C.white, size: 18 });
    lab(ctx, 'LION', 1080, GY + 44, g - l, { color: C.white, size: 18 });
    const qk = tw(g, f, f + 0.35, E.outBack);
    if (qk > 0) {
      bigText(ctx, '?', 720, 470, 240 * M.clamp(qk));
      lab(ctx, 'WHAT TYPE OF FIGHTER?', 720, 640, g - f, { color: C.white, size: 18 });
    }
  }

  // ---------------- 18 the quiz ----------------
  function s18(ctx, g, lt) {
    const x = 720, y = 460, w = 400, h = 580;
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
    ctx.fillRect(x - w / 2 + 40, y - h / 2 + 56, w - 80, 6);
    ctx.fillStyle = C.white;
    ctx.fillRect(x - w / 2 + 40, y - h / 2 + 56, (w - 80) * lerp(0.15, 0.7, tw(lt, 0.3, 1.4)), 6);
    ctx.restore();
    lab(ctx, 'WHAT TYPE OF FIGHTER', x, y - h / 2 + 104, lt - 0.1, { color: C.white, size: 17 });
    lab(ctx, 'ARE YOU?', x, y - h / 2 + 134, lt - 0.18, { color: C.white, size: 17 });
    // two answers: donkey or lion icons
    [[-1, 'donkey'], [1, 'lion']].forEach(([s, kind], i) => {
      const bx = x + s * 90, by = y + 40, k = tw(lt, 0.25 + i * 0.1, 0.55 + i * 0.1, E.outBack);
      if (k <= 0) return;
      const sel = kind === 'lion' && lt > 0.9;
      ctx.save();
      ctx.globalAlpha *= M.clamp(k);
      ctx.beginPath();
      ctx.roundRect(bx - 75, by - 80, 150, 170, 20);
      ctx.fillStyle = sel ? C.white : C.bg;
      ctx.fill();
      ctx.strokeStyle = sel ? C.white : C.g2;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      if (kind === 'donkey') O.donkey(ctx, bx - 5, by + 60, 100, 0, { alpha: M.clamp(k), color: C.g1 });
      else O.lion(ctx, bx - 8, by + 60, 100, g, { alpha: M.clamp(k), color: sel ? C.bg : C.g1, far: sel ? C.g2 : C.g3, face: sel ? C.g3 : C.g2 });
    });
    const tk = tw(lt, 0.2, 1.6);
    M.G.ring(ctx, x + w / 2 + 120, y - 120, 64, { stroke: C.g4, lw: 6 });
    M.G.ring(ctx, x + w / 2 + 120, y - 120, 64, { stroke: C.white, lw: 6, k: 1 - tk * 0.25, cap: 'round' });
    num(ctx, '2:00', x + w / 2 + 120, y - 120, { size: 28, weight: 600 });
    lab(ctx, 'MINUTES', x + w / 2 + 120, y - 30, lt - 0.3, { size: 13 });
  }

  // ---------------- 19 link in bio ----------------
  function s19(ctx, g, lt) {
    const bob = Math.sin(lt * 7) * 8;
    const k = tw(lt, 0, 0.35, E.outBack);
    M.I.arrow(ctx, 720, 470 + bob, 720, 330 + bob, M.clamp(k), { lw: 6, head: 30 });
    M.T.words(ctx, { text: 'LINK IN BIO', x: 720, y: 570, size: 88, weight: 800, emWeight: 800, color: C.white, tracking: '2px', t0: 0.05, stagger: 0.08 }, lt);
    lab(ctx, 'THE 2-MINUTE FIGHTER QUIZ', 720, 660, lt - 0.4, { color: C.g1, size: 17 });
    O.crown(ctx, 720, 230 + bob * 0.3, 80, { alpha: fin(lt, 0.3) });
  }

  // ---------------- sequence ----------------
  const S = [
    { t: 0, fn: s1 },
    { t: ls('why') - 0.08, fn: s2, tr: 'slide' },
    { t: ls('society') - 0.08, fn: s3, tr: 'wipe' },
    { t: ls('study') - 0.08, fn: s4, tr: 'up', z: { x: 720, y: 460 } },
    { t: W('study', 4) - 0.2, fn: s5, tr: 'zoom' },
    { t: ls('mind') - 0.08, fn: s6, tr: 'slide' },
    { t: ls('rest') - 0.08, fn: s7, tr: 'iris', iris: { x: 720, y: 560 } },
    { t: W('rest', 7) - 0.15, fn: s8, tr: 'slide' },
    { t: ls('paper') - 0.08, fn: s9, tr: 'wipe', z: { x: 720, y: 690 } },
    { t: ls('quote') - 0.1, fn: s10, tr: 'zoom' },
    { t: ls('lucky') - 0.08, fn: s11, tr: 'slide' },
    { t: ls('attn') - 0.08, fn: s12, tr: 'up' },
    { t: ls('grit') - 0.08, fn: s13, tr: 'iris' },
    { t: W('grit', 10) - 0.25, fn: s14, tr: 'slide', z: { x: 1160, y: 400 } },
    { t: ls('heart') - 0.08, fn: s15, tr: 'zoom' },
    { t: ls('end') - 0.08, fn: s16, tr: 'wipe' },
    { t: ls('cta') - 0.08, fn: s17, tr: 'iris' },
    { t: W('cta', 13) - 0.2, fn: s18, tr: 'slide' },
    { t: W('cta', 15) - 0.3, fn: s19, tr: 'up' },
  ];
  const seq = K.seq(S, WD, HT, 0.42);

  // chapter badge, top-left
  const CH = [[ls('society'), 'THE MYTH'], [ls('mind'), 'THE MIND'], [ls('rest'), 'OPPORTUNITY'], [ls('grit'), 'THE HEART'], [ls('end'), null]];
  function badge(ctx, g) {
    for (let i = 0; i < 4; i++) {
      const t0 = CH[i][0], t1 = CH[i + 1][0];
      if (g < t0 - 0.1 || g > t1) continue;
      const a = tw(g, t0 - 0.1, t0 + 0.2) * (1 - tw(g, t1 - 0.25, t1));
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.font = `800 20px ${M.FONT}`;
      ctx.letterSpacing = '5px';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.white;
      ctx.fillText(CH[i][1], 70, 70);
      for (let j = 0; j < 4; j++) { ctx.fillStyle = j <= i ? C.white : C.g4; ctx.fillRect(70 + j * 30, 92, 24, 4); }
      ctx.restore();
    }
  }

  const tl = new M.Timeline(TM.duration, WD, HT);
  tl.add(0, TM.duration, (ctx, lt, D, g) => {
    ctx.globalAlpha = 1 - tw(g, TM.duration - 0.6, TM.duration - 0.02, E.inCubic);
    seq(ctx, g);
  });
  tl.add(0, TM.duration, (ctx, lt, D, g) => badge(ctx, g));
  tl.add(0, TM.duration, (ctx, lt, D, g) => K.caps2(ctx, g, TM, { x: 720, y: 945, small: 40, big: 72, mid: 50, maxW: 1100, hookY: 260, hookSmall: 50, hookBig: 110 }));

  // ---------------- sound ----------------
  const cues = [];
  const cue = (t, type, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), type, gain });
  cue(0.02, 'low', 0.6);
  for (let i = 0; i < 4; i++) cue(0.3 + i * 0.45, 'tick', 0.25);
  S.slice(1).forEach((s) => cue(s.t - 0.2, 'sweep', s.tr === 'iris' || s.tr === 'zoom' ? 0.4 : 0.22));
  cue(W('why', 5) - 0.1, 'pop', 0.8);
  cue(W('society', 3) - 0.1, 'low', 0.6);
  for (let i = 0; i < 12; i++) cue(W('study', 2) - 0.25 + i * 0.06, 'tick', 0.15);
  cue(W('study', 7) - 0.1, 'pop', 1);
  cue(W('mind', 2), 'chime', 0.6);
  cue(W('rest', 8) - 0.1, 'tick', 0.7);
  cue(W('rest', 10) - 0.1, 'tick', 0.7);
  cue(W('rest', 13) - 0.15, 'sweep', 0.6);
  cue(W('rest', 13) + 0.3, 'low', 1.1);
  cue(W('paper', 9) - 0.1, 'pop', 0.8);
  TM.lines.find((l) => l.id === 'quote').words.forEach((w) => {
    const n = w.w.replace(/[^A-Za-z0-9]/g, '').length;
    for (let i = 0; i < n; i += 2) cue(w.s - 0.06 + i / 30, 'tick', 0.16);
  });
  cue(W('lucky', 2), 'pop', 0.7);
  cue(W('attn', 2) + 0.1, 'shard', 0.6);
  cue(W('attn', 4) - 0.1, 'chime', 0.6);
  cue(W('grit', 3) - 0.1, 'pop', 0.7);
  cue(W('grit', 11) - 0.15, 'sweep', 0.4);
  cue(W('heart', 2) - 0.1, 'chime', 0.7);
  cue(W('heart', 3) - 0.1, 'low', 1.1);
  [0, 2, 4].forEach((i) => cue(W('end', i) - 0.1, 'pop', 0.8));
  cue(W('cta', 8) - 0.1, 'pop', 0.7);
  cue(W('cta', 13) - 0.2 + 0.9, 'pop', 0.8);
  cue(W('cta', 15) - 0.3, 'low', 0.8);
  cue(W('cta', 15), 'chime', 0.9);

  M.comps.lion = { duration: TM.duration, width: WD, height: HT, render: (ctx, t) => tl.render(ctx, t), cues };
})();
