/* Scene actions — "Different eyes." (envy, humility, staying a student).
   Every scene is one lead in his own world; props sit beside him at head height, never above the text.
   Motion: anticipation before a move, a fast action, then settle (ease-out), plus breathing and blinks. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const say = (g, o) => V.darkBubble(g, Object.assign({ size: 48, font: `700 48px ${V.FONT.sans}` }, o));
  const showWin = (tl, a, b, fi = 0.14, fo = 0.2) => V.clamp(Math.min((tl - a) / fi, (b - tl) / fo));
  const alphaDo = (g, a, fn) => { if (a <= 0) return; g.save(); g.globalAlpha = a; fn(); g.restore(); };
  const bob = (p, tl, hz = 2.2, h = 3) => V.shift(p, 0, -Math.abs(Math.sin(tl * Math.PI * hz)) * h, true);   // boxer's bounce
  const C = (o) => V.X(Object.assign({ pose: PO.stand }, o));   // charcoal third figure (friend / coach)

  // ── props
  function postCard(g, cx, cy, k, likes, liked, likeK) {
    const w = 250, h = 336;
    g.save(); g.translate(cx, cy); g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 30;
    g.fillStyle = '#101117'; V.roundRect(g, -w / 2, -h / 2, w, h, 24); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = '#2c2e37'; g.lineWidth = 3; g.stroke();
    // header
    g.fillStyle = '#2f313b'; g.beginPath(); g.arc(-92, -134, 20, 0, 6.283); g.fill();
    g.fillStyle = '#8a8d98'; g.beginPath(); g.arc(-92, -139, 7, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(-92, -122, 11, 7, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#F4F5F7'; g.font = `700 30px ${V.FONT.sans}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('marco', -62, -134);
    g.fillStyle = '#7d808b'; g.font = `500 24px ${V.FONT.sans}`; g.textAlign = 'right'; g.fillText('2h', 104, -134);
    // photo: a car under a street light
    g.fillStyle = '#191a21'; V.roundRect(g, -106, -100, 212, 150, 12); g.fill();
    const lg = g.createRadialGradient(40, -90, 4, 40, -90, 150); lg.addColorStop(0, 'rgba(255,220,170,0.25)'); lg.addColorStop(1, 'rgba(255,220,170,0)');
    g.fillStyle = lg; V.roundRect(g, -106, -100, 212, 150, 12); g.fill();
    g.save(); g.translate(0, -12); g.strokeStyle = '#e8eaee'; g.lineWidth = 4; g.lineJoin = 'round'; g.fillStyle = '#2a2c35';
    g.beginPath(); g.moveTo(-78, 26); g.lineTo(-78, 8); g.quadraticCurveTo(-74, 0, -56, -2); g.lineTo(-34, -24); g.lineTo(26, -24); g.lineTo(48, -2); g.quadraticCurveTo(76, 0, 80, 12); g.lineTo(80, 26); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-28, -18); g.lineTo(-4, -18); g.lineTo(-4, -4); g.lineTo(-44, -4); g.closePath(); g.moveTo(4, -18); g.lineTo(22, -18); g.lineTo(38, -4); g.lineTo(4, -4); g.closePath(); g.fillStyle = 'rgba(200,215,255,0.35)'; g.fill();
    for (const x of [-46, 48]) { g.beginPath(); g.arc(x, 28, 14, 0, 6.283); g.fillStyle = '#0d0e12'; g.fill(); g.stroke(); g.beginPath(); g.arc(x, 28, 5, 0, 6.283); g.fillStyle = '#9a9da7'; g.fill(); }
    g.fillStyle = 'rgba(255,230,160,0.9)'; g.beginPath(); g.ellipse(76, 8, 4, 3, 0, 0, 6.283); g.fill();
    g.restore();
    // caption + likes
    g.fillStyle = '#F4F5F7'; g.font = `700 34px ${V.FONT.sans}`; g.textAlign = 'left'; g.fillText('first car.', -104, 86);
    const hk = 1 + 0.45 * Math.sin(V.clamp(likeK) * Math.PI);
    g.save(); g.translate(-86, 132); g.scale(0.95 * hk, 0.95 * hk);
    g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-26, -4, -14, -26, 0, -12); g.bezierCurveTo(14, -26, 26, -4, 0, 14); g.closePath();
    if (liked) { g.fillStyle = V.COL.red; g.fill(); } else { g.strokeStyle = '#c9cbd3'; g.lineWidth = 4; g.stroke(); }
    g.restore();
    g.fillStyle = '#c9cbd3'; g.font = `600 28px ${V.FONT.sans}`; g.fillText(likes.toLocaleString('en-US'), -60, 134);
    g.restore();
  }
  function clipCard(g, cx, cy, text, a) {
    const w = 210, h = 300;
    alphaDo(g, a, () => {
      g.save(); g.translate(cx, cy);
      g.fillStyle = '#14151b'; V.roundRect(g, -w / 2, -h / 2, w, h, 20); g.fill(); g.strokeStyle = '#2c2e37'; g.lineWidth = 3; g.stroke();
      g.fillStyle = V.COL.red; g.beginPath(); g.moveTo(-82, -118); g.lineTo(-66, -108); g.lineTo(-82, -98); g.closePath(); g.fill();
      g.fillStyle = '#F4F5F7'; g.font = `800 34px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      text.split('\n').forEach((l, i, arr) => g.fillText(l, 0, (i - (arr.length - 1) / 2) * 40));
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(-84, 122, 168, 5); g.fillStyle = '#F4F5F7'; g.fillRect(-84, 122, 168 * 0.35, 5);
      g.restore();
    });
  }
  function closedBook(g, p, rot = 0, k = 1) {
    g.save(); g.translate(p[0], p[1]); g.rotate(rot); g.scale(k, k);
    g.fillStyle = '#3a1a20'; g.strokeStyle = '#e8eaee'; g.lineWidth = 4; V.roundRect(g, -30, -40, 60, 80, 6); g.fill(); g.stroke();
    g.fillStyle = '#e8eaee'; g.fillRect(-30, -40, 8, 80);
    g.fillStyle = '#c9cbd3'; g.fillRect(-12, -18, 34, 5); g.fillRect(-12, -6, 26, 5);
    g.restore();
  }
  const SPINE = ['#2a2c35', '#3a1a20', '#20262f', '#34353e', '#2b1f2a'];
  function bookStack(g, x, n, popT) {
    const r = V.rng(17);
    for (let i = 0; i < n; i++) {
      const w = 116 + r() * 34, dx = (r() - 0.5) * 14, y = V.FLOOR - 18 * (i + 1);
      const k = i === n - 1 ? V.pop(popT, 0.14) : 1;
      g.save(); g.translate(x + dx, y + 9); g.scale(k, k);
      g.fillStyle = SPINE[i % SPINE.length]; g.strokeStyle = '#5a5d68'; g.lineWidth = 2.5; V.roundRect(g, -w / 2, -9, w, 18, 3); g.fill(); g.stroke();
      g.fillStyle = 'rgba(232,234,238,0.55)'; g.fillRect(-w / 2 + 12, -2, w * 0.3, 3);
      g.restore();
    }
  }
  function ropes(g, x0, x1) {
    g.save(); g.lineCap = 'round';
    for (const y of [1010, 1090, 1170]) { g.strokeStyle = '#2a171c'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.strokeStyle = 'rgba(224,52,74,0.16)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y - 3); g.lineTo(x1, y - 3); g.stroke(); }
    g.restore();
  }
  const phoneIn = (g, f, a = 1) => { const h = V.figPoint(f, 'hF'); V.phone(g, h[0] + 4 * f.face, h[1] - 26, -0.16 * f.face, 92, 'on'); const H = V.figPoint(f, 'H'); g.save(); g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(H[0], H[1], 4, H[0], H[1], 140); r.addColorStop(0, `rgba(140,180,255,${0.28 * a})`); r.addColorStop(1, 'rgba(140,180,255,0)'); g.fillStyle = r; g.fillRect(H[0] - 150, H[1] - 150, 300, 300); g.restore(); };

  // ─────────────────────────────── 1. THE POST — Reactive keeps score
  V.actions.evPostR = function (tl) {
    let p = V.breathe(PO.phone, tl, 1.2, 3);
    if (tl > 0.95 && tl < 3.3) p = V.lerpPose(p, V.set(V.set(PO.phone, 'hF', [19, -74]), 'hd', [5, 4]), ease.inOut(seg(tl, 0.95, 1.25)));   // leans in
    if (tl >= 3.3) p = poseAt(tl, [[3.3, V.set(PO.phone, 'hd', [5, 4])], [3.42, V.set(PO.phone, 'hF', [24, -92])], [3.62, PO.phone], [4.1, V.set(PO.slump, 'hF', [12, -60])]]);   // swipes it away, sinks
    const jealous = seg(tl, 1.0, 1.3) * (1 - seg(tl, 3.6, 3.9));
    const reactive = V.R({ x: 400, pose: p, expr: tl < 1.0 ? 'neutral' : tl < 3.6 ? 'jealous' : 'shame', blush: 0.32 * jealous, look: tl > 1 && tl < 3.3 ? 0.8 : 0 });
    const slideIn = ease.out(seg(tl, 0.08, 0.42)), out = ease.in(seg(tl, 3.34, 3.58));
    return {
      figs: [reactive],
      front(g) {
        phoneIn(g, reactive);
        const k = (0.9 + 0.1 * slideIn) * (1 + 0.07 * ease.inOut(seg(tl, 1.0, 1.35)));
        if (slideIn > 0 && out < 1) alphaDo(g, slideIn * (1 - out), () => postCard(g, 655, 935 + 120 * (1 - slideIn) - 520 * out, k, 1204, false, 0));
        alphaDo(g, showWin(tl, 1.4, 2.45), () => say(g, { red: true, x: 330, y: 780, text: 'must be nice.', scale: V.pop(tl - 1.4) }));
        alphaDo(g, showWin(tl, 2.5, 4.8), () => say(g, { red: true, x: 330, y: 780, text: 'he got lucky.', scale: V.pop(tl - 2.5) }));
      },
    };
  };

  // ─────────────────────────────── 1. THE POST — Steady asks how
  V.actions.evPostS = function (tl) {
    let p = V.breathe(PO.phone, tl, 1.1, 2.6);
    if (tl > 1.0 && tl < 1.3) p = V.set(p, 'hF', [17 + 3 * Math.sin(seg(tl, 1.0, 1.3) * Math.PI), -70 + 2 * Math.sin(seg(tl, 1.0, 1.3) * Math.PI)]);   // thumb taps like
    if (tl >= 3.1) p = poseAt(tl, [[3.1, PO.phone], [3.45, PO.read]]);
    const steady = V.St({ x: 690, pose: p, expr: tl < 0.5 ? 'neutral' : tl < 3.1 ? 'smile' : 'focus', look: tl < 1.7 ? 0.8 : 0 });
    const slideIn = ease.out(seg(tl, 0.08, 0.42)), cardOut = seg(tl, 1.55, 1.75);
    return {
      figs: [steady],
      front(g) {
        if (tl < 3.25) phoneIn(g, steady, 1 - seg(tl, 3.0, 3.25)); else V.notebook(g, V.figPoint(steady, 'hF'), tl, true);
        if (slideIn > 0 && cardOut < 1) alphaDo(g, slideIn * (1 - cardOut), () => postCard(g, 435, 935 + 120 * (1 - slideIn), 0.9 + 0.1 * slideIn, tl > 1.12 ? 1205 : 1204, tl > 1.12, (tl - 1.12) / 0.3));
        if (tl > 1.12 && tl < 1.7) V.heart(g, 435 - 40, 900 - (tl - 1.12) * 160, 1.6, 1 - seg(tl, 1.32, 1.7));
        alphaDo(g, showWin(tl, 1.6, 2.5), () => say(g, { x: 600, y: 780, text: 'congrats. how?', scale: V.pop(tl - 1.6) }));
        alphaDo(g, showWin(tl, 2.55, 3.55), () => V.bubble(g, { x: 560, y: 780, text: '5am. every day.', size: 48, font: `700 48px ${V.FONT.sans}`, fill: '#2c2e37', color: '#ffffff', scale: V.pop(tl - 2.55) }));
        if (tl > 3.5) alphaDo(g, seg(tl, 3.5, 3.7), () => say(g, { x: 600, y: 780, text: 'noted.', scale: V.pop(tl - 3.5) }));
      },
    };
  };

  // ─────────────────────────────── 2. SPARRING — the exchange both get
  // who = the lead's x/face; coach on the other side. Returns lead + coach poses for the first 1.3s.
  function exchange(tl, lead) {
    let lp = bob(PO.guard, tl, 2.4, 4), cp = bob(PO.guard, tl + 0.2, 2.0, 3), hit = 0, lx = 0;
    if (tl > 0.16 && tl < 0.5) lp = poseAt(tl, [[0.16, V.shift(PO.guard, -2, 1)], [0.3, PO.jab], [0.5, PO.guard]], ease.out);       // lead jabs
    if (tl > 0.22 && tl < 0.56) cp = poseAt(tl, [[0.22, PO.guard], [0.34, PO.slip], [0.56, PO.guard]]);                              // coach slips
    if (tl > 0.48 && tl < 0.8) cp = poseAt(tl, [[0.48, PO.guard], [0.62, PO.jab], [0.8, PO.guard]], ease.out);                         // counter
    if (tl > 0.62 && tl < 1.25) { const u = seg(tl, 0.62, 1.25); lp = V.lerpPose(lead === 'reactive' ? PO.stumble : PO.flinch, PO.guard, ease.inOut(u)); hit = 1 - u; lx = -(lead === 'reactive' ? 46 : 22) * Math.sin(u * Math.PI * 0.5 + Math.PI * 0.5) * (1 - u * 0.4); }
    const step = kf(tl, [[0.14, 0], [0.3, 42], [0.5, 0]], ease.inOut);          // lead steps in with the jab
    const cstep = kf(tl, [[0.44, 0], [0.62, 70], [0.95, 0]], ease.inOut);       // coach steps in with the counter
    return { lp, cp, hit, lx: lx + (tl < 0.6 ? step : 0), cstep };
  }

  V.actions.evSparR = function (tl) {
    const E = exchange(tl, 'reactive');
    let rp = E.lp, rx = 330 + E.lx, face = 1, expr = tl < 0.62 ? 'focus' : tl < 1.3 ? 'angry' : 'sneer';
    let cp = E.cp, cExpr = 'focus';
    if (tl >= 1.25) cp = poseAt(tl, [[1.25, PO.guard], [1.45, PO.point], [2.3, PO.point], [2.6, PO.stand], [3.05, PO.handsUp], [3.4, PO.stand]]), cExpr = tl > 3.0 ? 'neutral' : 'focus';
    if (tl >= 1.25 && tl < 2.9) rp = poseAt(tl, [[1.25, PO.guard], [1.5, PO.stand], [1.95, PO.stand], [2.15, PO.talkA], [2.6, PO.talkA], [2.9, PO.stand]]);
    if (tl >= 2.9) { face = tl < 3.0 ? 1 : -1; /* clean turn: a squashed in-between reads as a glitch */ rx = tl < 3.05 ? 330 : kf(tl, [[3.05, 330], [4.4, 220]], ease.inOut); rp = tl < 3.05 ? PO.stand : tl < 4.4 ? V.walkPose((tl - 3.05) * 6.5) : V.breathe(PO.stand, tl, 1, 3); expr = 'sneer'; }
    const reactive = V.R({ x: rx, face, pose: rp, expr });
    const coach = C({ x: 650 - E.cstep, face: -1, pose: cp, expr: cExpr });
    return {
      figs: [coach, reactive],
      shake: E.hit > 0.85 ? 10 : 0,
      back(g) { ropes(g, 60, 900); },
      front(g) {
        if (tl > 0.62 && tl < 1.0) { const h = V.figPoint(reactive, 'H'); V.impact(g, h[0] + 18, h[1], (tl - 0.62) / 0.32); }
        alphaDo(g, showWin(tl, 1.4, 2.4), () => say(g, { x: 660, y: 780, text: 'hands up.', scale: V.pop(tl - 1.4) }));
        alphaDo(g, showWin(tl, 2.05, 3.05), () => say(g, { red: true, x: 330, y: 780, text: 'I know.', scale: V.pop(tl - 2.05) }));
        alphaDo(g, showWin(tl, 3.15, 4.6), () => say(g, { red: true, x: 420, y: 780, text: 'he’s just older.', scale: V.pop(tl - 3.15) }));
      },
    };
  };

  V.actions.evSparS = function (tl) {
    const E = exchange(tl, 'steady');
    let sp = E.lp, sx = 750 - E.lx, sExpr = tl < 0.62 ? 'focus' : tl < 1.3 ? 'pant' : 'focus';
    let cp = E.cp, cExpr = 'focus';
    // advice, then the demo: coach slips twice, Steady copies a beat later; then the real test
    if (tl >= 1.25 && tl < 2.4) { cp = poseAt(tl, [[1.25, PO.guard], [1.45, PO.point], [2.2, PO.point], [2.4, PO.guard]]); sp = poseAt(tl, [[1.25, PO.guard], [1.5, PO.stand], [2.05, PO.stand], [2.2, V.set(PO.stand, 'hd', [2, 4])], [2.35, PO.stand]]); sExpr = tl > 2.1 ? 'smile' : 'focus'; }
    if (tl >= 2.4 && tl < 3.1) {
      if (tl < 2.5) sp = V.lerpPose(PO.stand, PO.guard, ease.inOut(seg(tl, 2.35, 2.5)));
      const sl = (t0, u) => poseAt(u, [[t0, PO.guard], [t0 + 0.14, PO.slip], [t0 + 0.3, PO.guard]]);
      cp = tl < 2.75 ? sl(2.42, tl) : sl(2.77, tl);
      sp = tl < 2.83 ? sl(2.5, tl) : sl(2.85, tl);
    }
    if (tl >= 3.1) {
      cp = poseAt(tl, [[3.1, PO.guard], [3.25, PO.jab], [3.45, PO.guard], [3.7, V.set(PO.stand, 'hd', [1, 3])], [4.1, PO.stand]], ease.out);
      sp = poseAt(tl, [[3.1, PO.guard], [3.22, PO.slip], [3.4, PO.guard], [3.52, V.set(PO.jab, 'hF', [38, -98])], [3.7, PO.guard]], ease.out);
      sExpr = 'focus'; cExpr = tl > 3.65 ? 'smile' : 'focus';
    }
    const steady = V.St({ x: sx, pose: sp, expr: sExpr });
    const coach = C({ x: 430 + E.cstep, face: 1, pose: cp, expr: cExpr });
    return {
      figs: [coach, steady],
      shake: E.hit > 0.85 ? 6 : 0,
      back(g) { ropes(g, 180, 1020); },
      front(g) {
        if (tl > 0.62 && tl < 0.95) { const h = V.figPoint(steady, 'H'); V.impact(g, h[0] - 18, h[1], (tl - 0.62) / 0.3); }
        alphaDo(g, showWin(tl, 1.4, 2.3), () => say(g, { x: 420, y: 780, text: 'hands up.', scale: V.pop(tl - 1.4) }));
        alphaDo(g, showWin(tl, 2.4, 3.2), () => say(g, { x: 700, y: 780, text: 'show me again.', scale: V.pop(tl - 2.4) }));
        if (tl > 3.6) alphaDo(g, seg(tl, 3.6, 3.75) * (1 - seg(tl, 4.4, 4.6)), () => say(g, { x: 420, y: 780, text: 'good.', scale: V.pop(tl - 3.6) }));
      },
    };
  };

  // ─────────────────────────────── 3. THE BOOK — "I know all that." vs one book a month
  const CLIPS = ['10 SECRETS\nOF THE RICH', 'MILLIONAIRE\nAT 19', 'DO THIS\nEVERY DAY', 'THE ONE\nMINDSET', 'STOP\nDOING THIS'];
  V.actions.evBookR = function (tl) {
    let rp = V.breathe(PO.stand, tl, 1, 3), rExpr = 'neutral';
    if (tl > 0.8) { rp = poseAt(tl, [[0.8, PO.stand], [1.05, PO.cross], [2.2, PO.cross], [2.45, PO.phone]]); rExpr = tl < 2.3 ? 'sneer' : tl < 3.3 ? 'neutral' : 'sleepy'; }
    if (tl > 2.45) { const u = ((tl - 2.55) / 0.38) % 1; rp = V.set(PO.phone, 'hF', [17, -70 - (tl > 2.55 ? 6 * Math.max(0, Math.sin(u * Math.PI * 2)) : 0)]); }
    const reactive = V.R({ x: 350, pose: rp, expr: rExpr, look: tl > 2.45 ? 0.8 : 0 });
    // the friend: offers, shrugs, drops it, leaves
    let fx = 650, fp = poseAt(tl, [[0, PO.stand], [0.25, PO.offerHand], [1.5, PO.offerHand], [1.75, PO.handsUp], [1.95, PO.stand]]), fFace = -1, fAlpha = 1;
    if (tl > 1.95) { fFace = 1; fx = kf(tl, [[1.95, 650], [2.75, 900]], ease.in); fp = V.walkPose((tl - 1.95) * 9.5); fAlpha = 1 - seg(tl, 2.35, 2.7); }
    const friend = C({ x: fx, face: fFace, pose: fp, alpha: fAlpha, expr: tl < 1.6 ? 'smile' : 'neutral' });
    return {
      figs: [friend, reactive],
      front(g) {
        if (tl < 1.85) closedBook(g, V.add(V.figPoint(friend, 'hF'), [-6, -24]), -0.1);
        else { const u = seg(tl, 1.85, 2.0), y = V.lerp(V.figPoint(friend, 'hF')[1] - 24, V.FLOOR - 12, ease.in(u)); closedBook(g, [585, Math.min(V.FLOOR - 12, y)], V.lerp(-0.1, -Math.PI / 2, ease.in(u)), 1); }
        if (tl > 2.45) phoneIn(g, reactive);
        alphaDo(g, showWin(tl, 0.2, 1.0), () => say(g, { x: 660, y: 780, text: 'read this.', scale: V.pop(tl - 0.2) }));
        alphaDo(g, showWin(tl, 1.0, 2.3), () => say(g, { red: true, x: 380, y: 780, text: 'I know all that.', scale: V.pop(tl - 1.0) }));
        // endless clips: one at a time, each swiped up after 0.38s
        if (tl > 2.5) for (let k = 0; k < CLIPS.length; k++) {
          const d = tl - (2.55 + k * 0.38); if (d < 0 || d > 0.38) continue;
          const inK = ease.out(V.clamp(d / 0.1)), outK = ease.in(V.clamp((d - 0.29) / 0.09));
          clipCard(g, 590, 960 + 50 * (1 - inK) - 110 * outK, CLIPS[k], inK * (1 - outK));
        }
      },
    };
  };

  const READ = { C: [4, -84], P: [-4, -50], hB: [16, -74], hF: [22, -76], fB: [16, -5], fF: [24, -5], hd: [3, 5], kB: [1, -0.2], kF: [1, -0.2], eB: [0, 1], eF: [0, 1] };
  V.actions.evBookS = function (tl) {
    const steady = V.St({ x: 690, pose: V.breathe(READ, tl, 0.8, 2.2), expr: tl > 3.85 ? 'smile' : 'focus', beamWarm: 0.5 * seg(tl, 0.5, 4.2) });
    const n = Math.min(12, Math.max(0, Math.floor((tl - 0.45) / 0.3) + 1)), last = 0.45 + (n - 1) * 0.3;
    return {
      figs: [steady],
      mid(g) { V.stool(g, 690, V.FLOOR - 198); },
      front(g) {
        const flipT = ((tl - 0.2) / 0.6) % 1;
        V.book(g, V.figPoint(steady, 'hF'), tl > 0.2 && flipT < 0.35 ? flipT / 0.35 : 0, -1);
        if (n > 0) {
          bookStack(g, 470, n, tl - last);
          g.save(); g.fillStyle = '#d6d8df'; g.font = `700 34px ${V.FONT.sans}`; g.letterSpacing = '6px'; g.textAlign = 'center';
          g.fillText(`MONTH ${n}`, 476, V.FLOOR - 18 * n - 34); g.restore();
        }
        if (tl > 3.85) V.bulb(g, 690, 820, 1.5 * V.pop(tl - 3.85, 0.2));
      },
    };
  };

  // ─────────────────────────────── FINALE — both ready to fight, up on their toes
  V.actions.evReady = function (tl) {
    const toes = (t, hz, h) => -Math.abs(Math.sin(t * Math.PI * hz)) * h;
    // Reactive: fast, loose bounce, shoulders rolling, a cocky head bob, one twitchy feint
    let rp = V.set(V.set(PO.guard, 'C', [3, -85]), 'hd', [2, 1]);
    const feint = Math.sin(seg(tl, 1.05, 1.3) * Math.PI);
    rp = V.lerpPose(rp, V.set(PO.jab, 'hF', [30, -100]), feint * 0.7);
    rp = V.shift(rp, Math.sin(tl * 9) * 1.6, toes(tl, 2.7, 7), true);
    rp.hB = [rp.hB[0] + Math.sin(tl * 11) * 1.8, rp.hB[1] + Math.cos(tl * 13) * 1.4];
    const rx = V.POS.reactive + 10 + 12 * Math.sin(tl * 3.6);
    // Steady: tight, even rhythm, chin down, eyes locked, a small step in
    let sp = V.set(V.set(PO.guard, 'C', [-2, -85]), 'hd', [1, 2]);
    sp = V.shift(sp, 0, toes(tl + 0.15, 2.1, 4.5), true);
    const sx = V.POS.steady - 6 - 10 * ease.inOut(seg(tl, 0.4, 1.4)) - 4 * Math.sin(tl * 2.6);
    return {
      figs: [
        V.R({ x: rx, pose: rp, expr: tl < 1.0 ? 'grin' : 'angry', headTilt: 0.05 * Math.sin(tl * 4.5) }),
        V.St({ x: sx, pose: sp, expr: 'focus', look: 0.4 }),
      ],
    };
  };

  // ─────────────────────────────── CTA — the pawn and the king in the mirror (the quiz's picture)
  const PAWN = new Image();
  V.assetsReady = new Promise((res) => {
    // loaded as a data URL (assets/images/pawn-mirror.js): a file:// image would taint the canvas
    const sc = document.createElement('script'); sc.src = '../assets/images/pawn-mirror.js';
    sc.onload = () => { PAWN.onload = res; PAWN.onerror = res; PAWN.src = V.ASSET_PAWN; }; sc.onerror = res;
    document.head.appendChild(sc);
  });
  V.actions.evPawn = function (tl) {
    return {
      figs: [],
      overlay(g) {
        g.save();
        g.fillStyle = '#030305'; g.fillRect(0, 0, V.W, V.H);   // the picture's own black, so it blends in
        // top: the quiz question (from the picture)
        const kTop = 0.97 + 0.03 * ease.out(V.clamp(tl / 0.35));
        g.save(); g.translate(540, 430); g.scale(kTop, kTop); g.translate(-540, -430);
        g.drawImage(PAWN, 0, 120, 1178, 400, 540 - 1178 * 0.74 / 2, 300, 1178 * 0.74, 400 * 0.74);
        g.restore();
        // the call to action
        g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 14;
        const a1 = ease.out(V.clamp((tl - 0.35) / 0.25)), a2 = ease.out(V.clamp((tl - 0.6) / 0.25));
        g.globalAlpha = a1; g.fillStyle = '#F4F5F7'; g.font = `400 44px ${V.FONT.sans}`;
        g.fillText('Free 2-min quiz — link in bio.', 540, 660 + 10 * (1 - a1));
        g.globalAlpha = a2; g.fillStyle = '#D6D8DF'; g.font = `700 32px ${V.FONT.sans}`; g.letterSpacing = '6px';
        g.fillText('THE FIX: UNREADABLE', 543, 716 + 10 * (1 - a2)); g.letterSpacing = '0px';
        g.globalAlpha = 1; g.shadowBlur = 0;
        // bottom: pawn + mirror, slow push-in, the king's red glow breathing
        const z = 1 + 0.04 * ease.inOut(V.clamp(tl / 3));
        const W = 1178 * 0.56, Hh = 1260 * 0.56, x0 = 540 - W / 2, y0 = 752;
        g.save(); g.translate(546, 1060); g.scale(z, z); g.translate(-546, -1060);
        g.drawImage(PAWN, 0, 600, 1178, 1260, x0, y0, W, Hh);
        g.globalCompositeOperation = 'lighter';
        const gl = g.createRadialGradient(x0 + 600 * 0.56, y0 + 520 * 0.56, 10, x0 + 600 * 0.56, y0 + 520 * 0.56, 230);
        gl.addColorStop(0, `rgba(224,52,74,${(0.10 + 0.07 * Math.sin(tl * 3)).toFixed(3)})`); gl.addColorStop(1, 'rgba(224,52,74,0)');
        g.fillStyle = gl; g.fillRect(x0, y0, W, Hh);
        g.restore();
        g.restore();
      },
    };
  };
})();
