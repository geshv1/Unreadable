/* "Chapter One" — 4:3 landscape (1440×1080). One continuous timeline; the camera glides from scene to scene.
   Quoidbach, Gilbert & Wilson 2013 (Science): the end of history illusion. Message: don't mock anyone's life. */
(function () {
  const M = window.M;
  const TM = M.TIMINGS && M.TIMINGS.tomorrow;
  if (!TM) return;
  const { C, lerp, tw, E, prog, env, mix, K } = M;
  const { ls, W } = K.track(TM);
  const P = M.Pose;
  const WD = 1440, HT = 1080, GY = 700, GAPX = 1600;
  const fig = (ctx, x, y, h, pose, o = {}) => M.figure(ctx, { x, y, h, pose, ...o });
  const num = (ctx, s, x, y, o) => M.T.number(ctx, s, x, y, o);
  const side = P.side;
  const LAUGH = { ...side, lean: -0.2, hd: -0.012, hf: -0.01, ra1: 1.35, ra2: 1.5, la1: 0.45, la2: 2.0, ll1: 0.12, rl1: -0.08 };
  const HUG = { ...side, lean: 0.34, hd: 0.045, hf: 0.035, ll1: 2.5, ll2: 0.3, rl1: 2.45, rl2: 0.28, la1: 0.05, la2: 1.85, ra1: 0.12, ra2: 1.95 };

  // ---------- scenes on the timeline ----------
  const SC = ['hook', 'study', 'every', 'name', 'others', 'me', 'gym', 'concl', 'cta'];
  const arrive = SC.map((id, i) => (i === 0 ? 0 : ls(id) - 0.12));
  const camX = (g) => {
    let x = 0;
    for (let i = 1; i < SC.length; i++) x += E.inOutCubic(prog(g, arrive[i] - 0.3, arrive[i] + 0.25)) * GAPX;
    return x;
  };
  const title = (ctx, g, label, text, t0, o = {}) => {
    const x = o.x ?? 1060;
    M.T.label(ctx, label, x, o.ly ?? 300, g - t0, { size: o.ls ?? 19, color: C.g1, tracking: '7px' });
    M.T.words(ctx, { text, x, y: o.ty ?? 375, size: o.size ?? 72, weight: 700, emWeight: 700, color: C.white, emColor: C.white, tracking: '-1px', maxW: o.maxW ?? 520, lineH: (o.size ?? 72) * 1.05, t0: t0 + 0.1, stagger: 0.09 }, g);
  };
  const tag = (ctx, g, text, x, t0, o = {}) => M.T.label(ctx, text, x, o.y ?? 752, g - t0, { size: o.size ?? 16, color: o.color || C.g2, tracking: '4px' });
  const fadeIn = (g, t0, d = 0.3) => tw(g, t0, t0 + d, E.outCubic);

  // ---------------- S0 hook: someone's chapter one ----------------
  function s0(ctx, g) {
    const laugh = W('hook', 1) - 0.08;
    const lk = tw(g, laugh - 0.1, laugh + 0.2);
    const shake = lk * Math.sin(g * 34) * 0.035;
    fig(ctx, 330, GY, 230, M.blendPose(side, { ...LAUGH, lean: LAUGH.lean + shake }, lk), { y: GY - Math.abs(Math.sin(g * 17)) * 4 * lk });
    // "HA" floating off the laugher
    for (let i = 0; i < 7; i++) {
      const t0 = laugh + i * 0.24;
      const k = prog(g, t0, t0 + 0.9);
      if (k <= 0 || k >= 1) continue;
      ctx.save();
      ctx.globalAlpha *= Math.sin(k * Math.PI);
      ctx.font = `600 ${26 + (i % 3) * 4}px ${M.FONT}`;
      ctx.letterSpacing = '2px';
      ctx.fillStyle = C.g2;
      ctx.textAlign = 'center';
      ctx.fillText('HA', 330 + [30, 110, 70][i % 3] + k * 40, GY - 270 - k * 100 - [0, 34, 70][i % 3]);
      ctx.restore();
    }
    // the one on the ground
    fig(ctx, 640, GY, 230, HUG, { dir: -1, color: C.g2 });
    tag(ctx, g, 'TODAY', 480, 0.1);
    title(ctx, g, "SOMEONE'S LIFE", 'CHAPTER 1', W('hook', 4) - 0.15);
  }

  // ---------------- S1 the 2013 study ----------------
  function s1(ctx, g) {
    const a0 = arrive[1];
    title(ctx, g, 'QUOIDBACH · GILBERT · WILSON', '2013', W('study', 1) - 0.1, { ls: 17 });
    tag(ctx, g, 'SCIENCE', 1060, W('study', 1) + 0.3, { y: 450, color: C.g2 });
    // 19,000 people
    const pk = W('study', 4) - 0.1, focus = W('study', 6) - 0.1, crowdIn = a0 - 0.25;
    const crowdOut = tw(g, focus, focus + 0.4, E.inOutCubic);
    if (crowdOut < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - crowdOut;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) {
        const i = r * 11 + c;
        const ap = tw(g, crowdIn + i * 0.018, crowdIn + 0.25 + i * 0.018, E.outBack);
        if (ap <= 0) continue;
        fig(ctx, 160 + c * 58, 470 + r * 92, 62, P.front, { alpha: M.clamp(ap), color: (i * 5) % 7 === 0 ? C.white : C.g2 });
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= (1 - crowdOut) * fadeIn(g, pk);
      num(ctx, `${Math.round(lerp(0, 19, tw(g, pk, pk + 0.9, E.outExpo)))},000`, 450, 270, { size: 64, weight: 500 });
      ctx.restore();
      M.T.label(ctx, 'PEOPLE  ·  AGES 18–68', 450, 322, g - (pk + 0.3), { size: 16, color: C.g2 });
    }
    // one person, two decades
    if (crowdOut > 0) {
      const now = 450, past = 140, fut = 760;
      ctx.save();
      ctx.globalAlpha *= crowdOut;
      fig(ctx, now, GY, 190, P.front);
      tag(ctx, g, 'NOW', now, focus + 0.1, { color: C.white });
      const ck = tw(g, W('study', 7) - 0.15, W('study', 10), E.inOutCubic);
      if (ck > 0) {
        const arc = new M.I.Path([{ x: now - 30, y: GY - 10 }, { x: (now + past) / 2, y: GY - 230 }, { x: past, y: GY - 10 }]);
        arc.draw(ctx, 0, ck, { stroke: C.white, lw: 3 });
        M.T.label(ctx, 'CHANGED', (now + past) / 2, GY - 270, g - W('study', 7), { size: 18, color: C.white, tracking: '5px' });
        tag(ctx, g, '−10 YRS', past, W('study', 9) - 0.2);
      }
      const fk = tw(g, W('study', 19) - 0.25, W('study', 21) + 0.1, E.inOutCubic);
      if (fk > 0) {
        const arc = new M.I.Path([{ x: now + 30, y: GY - 10 }, { x: (now + fut) / 2, y: GY - 230 }, { x: fut, y: GY - 10 }]);
        arc.draw(ctx, 0, fk, { stroke: C.g1, lw: 3, dash: [3, 10] });
        M.T.label(ctx, 'WILL CHANGE?', (now + fut) / 2, GY - 270, g - (W('study', 19) - 0.1), { size: 18, color: C.g1, tracking: '5px' });
        tag(ctx, g, '+10 YRS', fut, W('study', 20));
      }
      ctx.restore();
    }
  }

  // ---------------- S2 every age: the gap ----------------
  const AGE = (age) => lerp(170, 1210, (age - 18) / 50);
  const LIVED = (age) => lerp(300, 520, Math.pow((age - 18) / 50, 0.8));
  const EXPECT = (age) => lerp(500, 625, Math.pow((age - 18) / 50, 0.8));
  function s2(ctx, g) {
    const a0 = arrive[2];
    // legend
    const la = fadeIn(g, a0 + 0.1);
    ctx.save();
    ctx.globalAlpha *= la;
    K.line(ctx, [{ x: 170, y: 215 }, { x: 215, y: 215 }], { color: C.white, lw: 3 });
    K.dash(ctx, { x: 520, y: 215 }, { x: 565, y: 215 }, 1, { color: C.g1, dash: [4, 7], lw: 3 });
    ctx.restore();
    M.T.label(ctx, 'CHANGE THEY LIVED', 230, 215, g - (a0 + 0.1), { size: 15, color: C.white, align: 'left', tracking: '3px' });
    M.T.label(ctx, 'CHANGE THEY EXPECTED', 580, 215, g - (a0 + 0.2), { size: 15, color: C.g1, align: 'left', tracking: '3px' });
    M.T.label(ctx, 'SCHEMATIC', 1210, 215, g - (a0 + 0.3), { size: 13, color: C.g3, align: 'right', tracking: '3px' });
    // age axis
    [18, 28, 38, 48, 58, 68].forEach((age, i) => tag(ctx, g, String(age), AGE(age), a0 + 0.1 + i * 0.05, { size: 16 }));
    M.T.label(ctx, 'AGE', 1260, 752, g - (a0 + 0.5), { size: 13, color: C.g3, tracking: '3px' });
    // lines
    const lk = tw(g, W('every', 1) - 0.1, W('every', 2) + 0.5, E.inOutCubic);
    const ek = tw(g, W('every', 4) - 0.1, W('every', 7) + 0.1, E.inOutCubic);
    const curve = (fn, k) => {
      const pts = [];
      for (let age = 18; age <= 18 + 50 * k + 0.001; age += 1) pts.push({ x: AGE(age), y: fn(age) });
      return pts;
    };
    // gap shading
    const sk = tw(g, W('every', 5) - 0.1, W('every', 7) + 0.3);
    if (sk > 0) {
      ctx.save();
      ctx.globalAlpha *= sk * 0.09;
      ctx.beginPath();
      curve(LIVED, 1).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      curve(EXPECT, 1).reverse().forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.restore();
      const ax = AGE(38);
      M.I.arrow(ctx, ax, EXPECT(38) - 8, ax, LIVED(38) + 10, sk, { lw: 2.5, head: 12 });
      M.T.label(ctx, 'THE GAP', ax + 18, (LIVED(38) + EXPECT(38)) / 2, g - (W('every', 6)), { size: 15, color: C.white, align: 'left', tracking: '4px' });
    }
    if (lk > 0) K.line(ctx, curve(LIVED, lk), { color: C.white, lw: 3.5 });
    if (ek > 0) {
      ctx.save();
      ctx.setLineDash([4, 8]);
      K.line(ctx, curve(EXPECT, ek), { color: C.g1, lw: 3.5 });
      ctx.restore();
    }
  }

  // ---------------- S3 the end of history illusion ----------------
  function s3(ctx, g) {
    const a0 = arrive[3];
    title(ctx, g, 'PSYCHOLOGISTS CALL IT', 'THE END OF HISTORY ILLUSION', W('name', 4) - 0.2, { size: 58, maxW: 470, ty: 380, ly: 270 });
    const now = 430;
    fig(ctx, now, GY, 200, P.side, { alpha: fadeIn(g, a0) });
    tag(ctx, g, 'NOW', now, a0 + 0.15, { color: C.white });
    K.line(ctx, [{ x: 100, y: GY }, { x: lerp(100, now, fadeIn(g, a0, 0.4)), y: GY }], { color: C.white, lw: 4 });
    // the wall where they think history stops
    const wk = tw(g, W('name', 4) - 0.1, W('name', 4) + 0.25, E.outBack);
    const crack = tw(g, W('name', 7) - 0.05, W('name', 7) + 0.45, E.inOutCubic);
    const wx = 560;
    if (wk > 0) {
      ctx.save();
      ctx.globalAlpha *= 1 - crack;
      ctx.fillStyle = C.white;
      const h = 230 * M.clamp(wk);
      ctx.fillRect(wx - 6, GY - h - crack * 30, 12, h / 2);
      ctx.fillRect(wx - 6 + crack * 18, GY - h / 2 + crack * 40, 12, h / 2);
      ctx.restore();
      tag(ctx, g, '"THE END"', wx, W('name', 4), { color: C.g1, y: 752 });
    }
    if (crack > 0) {
      K.dash(ctx, { x: wx, y: GY }, { x: 860, y: GY }, crack, { color: C.white, dash: [6, 10], lw: 4 });
      M.I.arrow(ctx, 840, GY, 880, GY, crack, { lw: 4, head: 14 });
    }
  }

  // ---------------- S4 we freeze others ----------------
  function s4(ctx, g) {
    const a0 = arrive[4];
    title(ctx, g, 'WE DO IT TO OTHERS', 'FROZEN', W('others', 6) - 0.1);
    fig(ctx, 300, GY, 220, { ...side, lean: 0.04, hd: 0.01 }, { alpha: fadeIn(g, a0) });
    const ok = fadeIn(g, W('others', 4) - 0.2);
    const fz = W('others', 7) - 0.05;
    const frozen = tw(g, fz, fz + 0.2);
    fig(ctx, 640, GY, 220, HUG, { dir: -1, alpha: ok, color: mix(C.g2, C.g3, frozen) });
    // the snapshot
    const sk = tw(g, fz - 0.02, fz + 0.22, E.outCubic);
    if (sk > 0) {
      const s = lerp(1.25, 1, sk), cx = 640, cy = GY - 105, w = 280 * s, h = 270 * s;
      ctx.save();
      ctx.globalAlpha *= M.clamp(sk);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 5;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      const flash = 1 - prog(g, fz, fz + 0.35);
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.35 * flash})`;
        ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      }
      ctx.restore();
      M.T.label(ctx, 'THEIR WORST DAY', 640, GY - 270, g - (W('others', 11) - 0.15), { size: 17, color: C.white, tracking: '5px' });
    }
    K.dash(ctx, { x: 345, y: GY - 205 }, { x: 495, y: GY - 150 }, fadeIn(g, W('others', 4)), { color: C.g3, dash: [2, 8] });
  }

  // ---------------- S5 my chapter one ----------------
  function s5(ctx, g) {
    const a0 = arrive[5];
    title(ctx, g, 'MY CHAPTER 1', 'BEFORE', a0 + 0.15);
    // grades falling
    const gk = W('me', 4) - 0.15;
    const bars = [175, 135, 90, 40];
    bars.forEach((h, i) => {
      const k = tw(g, gk + i * 0.1, gk + 0.35 + i * 0.1, E.outExpo);
      ctx.save();
      ctx.fillStyle = i === 3 ? C.white : C.g2;
      ctx.fillRect(140 + i * 62, GY - h * k, 44, h * k);
      ctx.restore();
    });
    tag(ctx, g, 'GRADES', 233, gk + 0.2);
    const dk = tw(g, W('me', 5) - 0.1, W('me', 5) + 0.4, E.inOutCubic);
    if (dk > 0) M.I.arrow(ctx, 150, GY - 215, 390, GY - 70, dk, { lw: 2.5, head: 13, color: C.g1 });
    // the wrong crowd
    const wk = W('me', 10) - 0.15;
    [560, 640, 770, 850].forEach((x, i) => {
      const me = i === 1;
      const ap = me ? fadeIn(g, a0 + 0.1) : fadeIn(g, wk + i * 0.06);
      fig(ctx, x, GY, me ? 200 : 190, me ? M.blendPose(P.front, P.frontDown, tw(g, W('me', 5), W('me', 5) + 0.4)) : P.frontDown, { alpha: ap, color: me ? C.white : C.g3 });
    });
    tag(ctx, g, 'ME', 640, a0 + 0.25, { color: C.white });
  }

  // ---------------- S6 the boxing gym ----------------
  function s6(ctx, g) {
    const a0 = arrive[6];
    title(ctx, g, 'THEN', 'THE GYM', W('gym', 5) - 0.2);
    // ring: platform, two posts, three ropes
    const rk = fadeIn(g, a0 + 0.05, 0.4);
    const L = 520, R = 880;
    ctx.save();
    ctx.globalAlpha *= rk;
    ctx.fillStyle = C.g5;
    ctx.fillRect(L - 20, GY - 26, R - L + 40, 26);
    ctx.strokeStyle = C.g2;
    ctx.lineWidth = 2;
    ctx.strokeRect(L - 20, GY - 26, R - L + 40, 26);
    ctx.restore();
    K.line(ctx, [{ x: L, y: GY - 26 }, { x: L, y: GY - 26 - 250 * rk }], { color: C.white, lw: 7 });
    K.line(ctx, [{ x: R, y: GY - 26 }, { x: R, y: GY - 26 - 250 * rk }], { color: C.white, lw: 7 });
    [210, 150, 90].forEach((h, i) => K.line(ctx, [{ x: L, y: GY - 26 - h }, { x: lerp(L, R, tw(g, a0 + 0.15 + i * 0.06, a0 + 0.5 + i * 0.06, E.outExpo)), y: GY - 26 - h }], { color: C.g1, lw: 3 }));
    // walking in
    const w0 = W('gym', 2) - 0.25, w1 = W('gym', 6) + 0.15;
    const u = tw(g, w0, w1, E.inOutSine);
    const x = lerp(150, 700, u);
    const onRing = prog(x, 470, 540);
    const amp = Math.min(1, prog(g, w0, w0 + 0.2)) * (1 - prog(g, w1 - 0.2, w1));
    fig(ctx, x, GY - 26 * onRing, 210, amp > 0 ? M.walkPose(M.walkPhase(u * 550, 210), amp) : side, { alpha: fadeIn(g, a0) });
  }

  // ---------------- S7 chapter two ----------------
  function s7(ctx, g) {
    const a0 = arrive[7];
    title(ctx, g, "SOMEONE'S LIFE", 'CHAPTER 2', W('concl', 2) - 0.1);
    // the laugher, now small and grey
    fig(ctx, 260, GY, 190, { ...side, lean: 0.05 }, { alpha: fadeIn(g, a0) * 0.9, color: C.g3 });
    // the one on the ground stands up
    const up = tw(g, W('concl', 2) - 0.15, W('concl', 4) + 0.1, E.inOutCubic);
    const turn = up > 0.6;
    const pose = turn ? M.blendPose(side, P.front, prog(up, 0.6, 1)) : M.blendPose(HUG, side, up / 0.6);
    fig(ctx, 520, GY, 240, pose, { dir: -1, alpha: fadeIn(g, a0), color: mix(C.g2, C.white, up) });
    // tomorrow, ahead of them
    const tk = tw(g, W('concl', 10) - 0.25, W('concl', 10) + 0.4, E.inOutCubic);
    if (tk > 0) {
      K.dash(ctx, { x: 600, y: GY - 2 }, { x: 900, y: GY - 2 }, tk, { color: C.white, dash: [6, 10], lw: 4 });
      M.I.node(ctx, 900, GY, g - (W('concl', 10) + 0.1), { r: 10, hollow: true });
      tag(ctx, g, 'TOMORROW', 900, W('concl', 10), { color: C.white });
      M.T.label(ctx, '?', 900, GY - 48, g - (W('concl', 10) + 0.2), { size: 30, color: C.white, weight: 600, tracking: '0px' });
    }
  }

  // ---------------- S8 CTA ----------------
  function s8(ctx, g) {
    const a0 = arrive[8];
    // 20 rounds
    const r0 = W('cta', 1) - 0.1;
    for (let i = 0; i < 20; i++) {
      const c = i % 5, r = Math.floor(i / 5), x = 170 + c * 74, y = 250 + r * 74;
      const ap = tw(g, a0 + 0.05 + i * 0.01, a0 + 0.3 + i * 0.01, E.outBack);
      const lit = tw(g, r0 + i * 0.035, r0 + 0.12 + i * 0.035);
      if (ap <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= M.clamp(ap);
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, M.TAU);
      ctx.strokeStyle = mix(C.g3, C.white, lit);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      if (lit > 0.5) { ctx.fillStyle = C.white; ctx.fill(); }
      ctx.restore();
      num(ctx, String(i + 1), x, y + 1, { size: 17, weight: 600, color: lit > 0.5 ? C.bg : C.g2 });
    }
    M.T.label(ctx, '20 ROUNDS FROM THE RING', 318, 560, g - (r0 + 0.4), { size: 16, color: C.g1, tracking: '4px' });
    // cover
    const img = M.IMG && M.IMG.cover;
    const iw = img ? img.naturalWidth : 642, ih = img ? img.naturalHeight : 1039;
    const h = 540, w = (h * iw) / ih, x = 900 - w / 2, y = 655 - h;
    const s0 = tw(g, a0 + 0.1, a0 + 0.6, E.outExpo);
    const name = W('cta', 8) - 0.05;
    const bump = env(g, name, name + 0.5, 0.12, 0.35) * 0.035;
    ctx.save();
    ctx.translate(900, y + h / 2 + (1 - s0) * 25);
    ctx.scale(lerp(0.92, 1, s0) + bump, lerp(0.92, 1, s0) + bump);
    ctx.translate(-900, -(y + h / 2));
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
      const gr = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.16)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.translate(sx, y + h / 2);
      ctx.rotate(0.35);
      ctx.translate(-sx, -(y + h / 2));
      ctx.fillRect(sx - 80, y - 200, 160, h + 400);
      ctx.restore();
    }
    const hk = tw(g, r0 + 0.2, r0 + 0.65, E.inOutCubic);
    if (hk > 0) {
      const k = w / iw, rx = x + 40 * k, ry = y + 816 * k, rw = 220 * k, rh = 40 * k, per = 2 * (rw + rh);
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
    // link in bio
    const lb = W('cta', 9) - 0.1;
    const lk = tw(g, lb, lb + 0.3, E.outBack);
    if (lk > 0.002) {
      const bob = Math.sin((g - lb) * 7) * 6 * M.clamp(lk);
      M.I.arrow(ctx, 318, 650 + bob, 318, 605 + bob, M.clamp(lk), { lw: 3.5, head: 15 });
      M.T.label(ctx, 'LINK IN BIO', 318, 675, g - lb, { size: 22, color: C.white, tracking: '7px', weight: 600 });
    }
  }

  const SCENES = [s0, s1, s2, s3, s4, s5, s6, s7, s8];
  function world(ctx, g) {
    const cx = camX(g);
    // the timeline: one continuous line with a moving ruler
    ctx.save();
    K.line(ctx, [{ x: 0, y: GY }, { x: WD, y: GY }], { color: C.g3, lw: 2.5 });
    ctx.strokeStyle = C.g4;
    ctx.lineWidth = 2;
    const step = 40, off = ((cx % step) + step) % step;
    for (let x = -off; x <= WD; x += step) {
      const wx = Math.round(x + cx);
      const major = Math.abs(wx % 400) < 1;
      ctx.beginPath();
      ctx.moveTo(x, GY + 10);
      ctx.lineTo(x, GY + (major ? 24 : 16));
      ctx.stroke();
    }
    ctx.restore();
    SCENES.forEach((fn, i) => {
      const dx = i * GAPX - cx;
      if (dx < -GAPX || dx > GAPX) return;
      ctx.save();
      ctx.translate(dx, 0);
      fn(ctx, g);
      ctx.restore();
    });
  }

  const tl = new M.Timeline(TM.duration, WD, HT);
  tl.add(0, TM.duration, (ctx, lt, D, g) => {
    ctx.globalAlpha = 1 - tw(g, TM.duration - 0.6, TM.duration - 0.02, E.inCubic);
    world(ctx, g);
  });
  tl.add(0, TM.duration, (ctx, lt, D, g) => K.subtitles(ctx, g, TM, { x: 720, y: 880, maxW: 1000, size: 46, maxWords: 11 }));

  // ---------------- sound cues ----------------
  const cues = [];
  const cue = (t, type, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), type, gain });
  cue(0.02, 'low', 0.5);
  for (let i = 0; i < 5; i++) cue(W('hook', 1) - 0.08 + i * 0.24, 'tick', 0.35);
  cue(W('hook', 4) - 0.1, 'pop', 0.8);
  for (let i = 1; i < SC.length; i++) cue(arrive[i] - 0.3, 'sweep', 0.22);
  cue(W('study', 1) - 0.1, 'tick', 0.8);
  for (let i = 0; i < 10; i++) cue(W('study', 4) - 0.1 + i * 0.06, 'tick', 0.2);
  cue(W('study', 7) - 0.1, 'pop', 0.6);
  cue(W('study', 19) - 0.2, 'pop', 0.6);
  cue(W('every', 5) - 0.1, 'low', 0.6);
  cue(W('name', 4) - 0.1, 'low', 0.8);
  cue(W('name', 7) - 0.05, 'shard', 0.9);
  cue(W('others', 7) - 0.05, 'zap', 0.25);
  cue(W('others', 7) - 0.05, 'pop', 1);
  for (let i = 0; i < 4; i++) cue(W('me', 4) - 0.15 + i * 0.1, 'tick', 0.4);
  cue(W('me', 10) - 0.15, 'low', 0.5);
  cue(W('gym', 6) - 0.1, 'bell', 0.8);
  cue(W('concl', 2) - 0.1, 'low', 0.7);
  cue(W('concl', 10), 'chime', 0.8);
  for (let i = 0; i < 20; i += 2) cue(W('cta', 1) - 0.1 + i * 0.035, 'tick', 0.3);
  cue(W('cta', 8) - 0.05, 'chime', 0.7);
  cue(W('cta', 9) - 0.1, 'pop', 0.9);

  M.comps.tomorrow = { duration: TM.duration, width: WD, height: HT, render: (ctx, t) => tl.render(ctx, t), cues };
})();
