/* Scene actions for Pt. 7 "Different focus." — where your attention goes.
   Same cinematic toolkit as Pt. 5/6. World coordinates (zoom ≈ 0.82): safe box ≈ world x 77–1015,
   bubbles/props above heads at world y ≥ 640. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const say = (g, o) => V.darkBubble(g, Object.assign({ size: 56, font: `700 56px ${V.FONT.sans}` }, o));
  const C = (o) => V.X(Object.assign({ kind: 'crowd', pose: PO.stand }, o));
  const TOP = V.FLOOR - 150;   // mattress top
  function ropePose(t0, tl) {
    const per = 0.44, u = (((tl - t0) / per) % 1 + 1) % 1;
    const p = V.shift(PO.rope, 0, -Math.max(0, Math.sin(u * Math.PI * 2 - Math.PI)) * 6, true);
    const w = Math.sin(u * Math.PI * 2) * 2.5;
    p.hB = [p.hB[0] - w * 0.3, p.hB[1] + w]; p.hF = [p.hF[0] + w * 0.3, p.hF[1] + w];
    return [p, u];
  }
  const phoneGlowFace = (g, f, a = 1) => { const h = V.figPoint(f, 'H'); g.save(); g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(h[0], h[1], 4, h[0], h[1], 150); r.addColorStop(0, `rgba(140,180,255,${0.35 * a})`); r.addColorStop(1, 'rgba(140,180,255,0)'); g.fillStyle = r; g.fillRect(h[0] - 160, h[1] - 160, 320, 320); g.restore(); };
  const lying = (o) => Object.assign({ y: TOP - 36, s: 0.76, noReflect: true }, o);

  // ─────────────────────────────── COLD OPEN
  const CROWD = [60, 150, 235, 430, 520, 610, 800, 890, 980, 1060];
  V.actions.coldOpen7 = function (tl) {
    const crowd = CROWD.map((x, i) => C({ depth: 'back', x, y: 1296, s: 0.56, alpha: 0.8, face: i % 2 ? 1 : -1, pose: V.breathe(i % 3 ? PO.stand : PO.scroll, tl, 0.8, 1.6, i) }));
    const [reactive, steady] = V.actions.squareUp(tl).figs.map((f) => Object.assign(f, { expr: null }));
    return {
      figs: [...crowd, reactive, steady],
      mid(g) { crowd.forEach((f, k) => { if (k % 3 === 0) { const h = V.figPoint(f, 'hF'); g.save(); g.fillStyle = 'rgba(160,200,255,0.85)'; g.shadowColor = '#9fc3ff'; g.shadowBlur = 26; V.roundRect(g, h[0] - 12, h[1] - 44, 24, 40, 5); g.fill(); g.restore(); } }); },
      fg(g) {
        V.fgFigure(g, { x: V.lerp(-140, 150, tl / 2.6), y: 2380, s: 2.2, face: 1, pose: V.walkPose(tl * 5) }, 10, 0.95);
        V.fgFigure(g, { x: V.lerp(1240, 960, tl / 2.6), y: 2420, s: 2.3, face: -1, pose: V.walkPose(tl * 5 + 1) }, 12, 0.95);
      },
    };
  };

  // ─────────────────────────────── MORNING — win the first hour
  V.actions.morning7 = function (tl) {
    const reactive = V.R(lying({ x: 490, rot: -Math.PI / 2, pose: V.shift(PO.lieScroll, 0, Math.sin(tl * 3) * 0.6), expr: tl % 1.8 < 0.12 ? 'sleepy' : 'neutral', beamX: 300, beam: 0.6, beamW: 0.85 }));
    let sPose, rope = null, held = null;
    if (tl < 1.5) sPose = poseAt(tl, [[0, PO.stand], [0.4, PO.armsUp], [1.2, PO.armsUp], [1.5, PO.stand]]);
    else if (tl < 2.5) { sPose = poseAt(tl, [[1.5, PO.stand], [1.75, PO.drink], [2.25, PO.drink], [2.5, PO.stand]]); held = 'glass'; }
    else if (tl < 2.75) sPose = poseAt(tl, [[2.5, PO.stand], [2.75, PO.rope]]);
    else { const [p, u] = ropePose(2.75, tl); sPose = p; rope = u; }
    const steady = V.St({ x: 740, pose: sPose, expr: tl < 0.4 ? 'sleepy' : tl > 2.75 ? 'focus' : 'smile', beamWarm: 0.5 });
    return {
      figs: [reactive, steady],
      mid(g) { V.bed(g, 80, 530, TOP, true); V.pillow(g, 140, TOP - 4); },
      front(g) {
        V.bedBlanket(g, 270, 530, TOP, '#5a2730');
        const h = V.figPoint(reactive, 'hF'); V.phone(g, h[0] + 6, h[1] - 6, 0, 90, 'on'); phoneGlowFace(g, reactive);
        if (held) V.glass(g, V.figPoint(steady, 'hF'));
        if (rope !== null) V.jumpRope(g, V.figPoint(steady, 'hB'), V.figPoint(steady, 'hF'), rope, 800, V.FLOOR + 14);
        if (tl >= 1.6) say(g, { red: true, x: 300, y: 980, text: 'just checking…', scale: V.pop(tl - 1.6, 0.14) });
      },
    };
  };

  // ─────────────────────────────── THE PINGS — guard your attention
  const PINGS = [0.4, 1.0, 1.6, 2.2, 2.8, 3.4];
  V.actions.pings7 = function (tl) {
    const last = PINGS.filter((p) => tl >= p);
    const since = last.length ? tl - last[last.length - 1] : 9;
    const checking = since < 0.4;
    const rPose = checking ? V.lerpPose(PO.type, PO.phone, Math.sin(V.clamp(since / 0.4) * Math.PI)) : V.set(PO.type, 'hF', [36 + Math.sin(tl * 40) * 1.5, -60 + Math.abs(Math.sin(tl * 33)) * 2]);
    const reactive = V.R({ x: 330, face: -1, pose: rPose, expr: checking ? 'shock' : tl > 2.5 ? 'shame' : 'neutral' });
    // Steady: one buzz, the phone goes in the box, then deep work
    let sPose = V.set(PO.type, 'hF', [36 + Math.sin(tl * 40) * 1.5, -60 + Math.abs(Math.sin(tl * 33)) * 2]), boxing = tl > 0.45 && tl < 1.05;
    if (boxing) sPose = poseAt(tl, [[0.45, PO.type], [0.7, V.set(PO.type, 'hF', [48, -66])], [1.05, PO.type]]);
    const steady = V.St({ x: 700, face: 1, pose: sPose, expr: 'focus', beamWarm: 0.45 * seg(tl, 1, 4) });
    const rWork = 0.05 + 0.13 * seg(tl, 0, 4.6), sWork = 0.06 + 0.94 * ease.inOut(seg(tl, 1.0, 4.3));
    return {
      figs: [reactive, steady],
      mid(g) {
        const top = V.desk(g, 175, true, 0.7);
        if (!checking) V.phone(g, 245, top - 12, Math.PI / 2, 70, since < 1.2 ? 'on' : 'down');
        const st = V.desk(g, 870, true, 1);
        V.phoneBox(g, 930, st, tl < 0.65 ? 1 : tl < 0.95 ? 1 - seg(tl, 0.8, 0.95) : 0);
        if (tl < 0.7) V.phone(g, 930, st - 30, 0, 60, tl > 0.4 ? 'on' : 'down');
      },
      front(g) {
        if (checking) { const h = V.figPoint(reactive, 'hF'); V.phone(g, h[0] - 4, h[1] - 30, -0.18, 96, 'on'); }
        if (last.length) V.badge(g, 290, 1150, [3, 7, 12, 19, 26, 34][last.length - 1], V.pop(since, 0.12));
        V.progressBar(g, 300, 790, 260, rWork, V.COL.red);
        V.progressBar(g, 780, 790, 260, sWork, '#F4F5F7');
      },
    };
  };

  // ─────────────────────────────── THE SLOT MACHINE — easy now, hard later
  const PULLS = [0.3, 1.1, 1.9, 2.7, 3.5];
  V.actions.slot7 = function (tl) {
    const last = PULLS.filter((p) => tl >= p);
    const since = last.length ? tl - last[last.length - 1] : 9;
    const pulling = since < 0.35;
    const spinning = since < 0.7;
    const drained = seg(tl, 0.8, 4.2);
    const rPose = pulling ? V.lerpPose(PO.lever, PO.leverDown, Math.sin(V.clamp(since / 0.35) * Math.PI)) : V.breathe(PO.lever, tl, 1, 3);
    const reactive = V.R({ x: 385, face: -1, pose: rPose, expr: last.length === 1 && since > 0.7 && since < 1.2 ? 'laugh' : drained > 0.5 ? 'sleepy' : 'neutral', tint: 0.5 * drained, beam: 1 - 0.45 * drained });
    // Steady: reads, page after page, an idea lights up
    const flipT = ((tl - 0.6) / 1.2) % 1;
    const steady = V.St({ x: 720, face: -1, pose: V.breathe(PO.read, tl, 0.8, 2), expr: tl > 3.4 ? 'smile' : 'focus', beamWarm: 0.6 * seg(tl, 0.5, 4.2), beam: 1 + 0.1 * seg(tl, 1, 4) });
    const win = last.length === 1 && since > 0.7 && since < 1.4 ? 1 - Math.abs(since - 1.05) / 0.35 : 0;
    return {
      figs: [reactive, steady],
      mid(g) {
        V.slotMachine(g, 180, tl, spinning, last.length === 1 ? [0, 0, 0] : [last.length % 3, (last.length + 1) % 3, 2], Math.max(0, win), pulling ? Math.sin(V.clamp(since / 0.35) * Math.PI) : 0);
      },
      front(g) {
        V.book(g, V.figPoint(steady, 'hF'), tl > 0.6 && flipT < 0.3 ? flipT / 0.3 : 0, -1);
        if (tl >= 3.4) V.bulb(g, 700, 850, 1.7 * V.pop(tl - 3.4, 0.2));
        if (win > 0.1) V.heart(g, 180, 960 - (since - 0.7) * 120, 1.8, win);
        if (tl >= 2.0) say(g, { red: true, x: 380, y: 760, text: 'one more.', scale: V.pop(tl - 2.0, 0.14) });
      },
    };
  };

  // ─────────────────────────────── NIGHT — hours don't come back
  V.actions.night7 = function (tl) {
    const hours = 23 + 3.5 * ease.inOut(seg(tl, 0.2, 4.4));
    const reactive = V.R(lying({ x: 490, rot: -Math.PI / 2, pose: V.shift(PO.lieScroll, 0, Math.sin(tl * 3) * 0.6), expr: tl > 2.5 ? 'sleepy' : 'neutral', beamX: 300, beam: 0.45, beamW: 0.85 }));
    const steady = V.St(lying({ x: 590, rot: Math.PI / 2, face: -1, pose: V.shift(PO.lie, 0, -Math.sin(tl * 1.1) * 0.6), expr: 'sleepy', beamX: 800, beam: 0.8, beamWarm: 0.6, beamW: 0.85 }));
    return {
      figs: [reactive, steady],
      mid(g) {
        V.bed(g, 80, 530, TOP, true); V.pillow(g, 140, TOP - 4);
        V.bed(g, 560, 1000, TOP, false); V.pillow(g, 940, TOP - 4);
      },
      front(g) {
        V.bedBlanket(g, 270, 530, TOP, '#5a2730'); V.bedBlanket(g, 560, 860, TOP, '#3a3c46');
        const h = V.figPoint(reactive, 'hF'); V.phone(g, h[0] + 6, h[1] - 6, 0, 90, 'on'); phoneGlowFace(g, reactive, 1.2);
        V.wallClock(g, 540, 820, 78, hours);
        if (tl >= 1.6) say(g, { red: true, x: 300, y: 980, text: 'one more video', scale: V.pop(tl - 1.6, 0.14) });
      },
    };
  };

  // ─────────────────────────────── FIGHT NIGHT — focus wins fights
  V.actions.ringFocus = function (tl) {
    const FLASH = 1.1, HIT = 2.3;
    const crowd = [[110, 1], [195, -1], [880, 1], [965, -1]].map(([x, face], i) => C({ depth: 'back', x, y: 1300, s: 0.7, face, pose: V.breathe(PO.scroll, tl, 0.8, 1.6, i) }));
    let rPose, rExpr = 'focus', look = 0, tilt = 0;
    if (tl < FLASH) rPose = V.breathe(PO.guard, tl, 1.4, 6);
    else if (tl < HIT) { rPose = poseAt(tl, [[FLASH, PO.guard], [1.35, PO.wave]]); rExpr = 'grin'; look = -1; tilt = -0.25; }
    else if (tl < 3.3) { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [3.3, PO.stumble]]); rExpr = 'dizzy'; }
    else { rPose = poseAt(tl, [[3.3, PO.stumble], [3.8, PO.guard]]); rExpr = 'shame'; tilt = Math.sin(tl * 10) * 0.1 * (1 - seg(tl, 3.3, 4.2)); }
    const rx = kf(tl, [[0, 390], [HIT, 400], [HIT + 0.45, 290], [4.8, 300]], ease.out);
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, look, headTilt: tilt });
    let sPose = V.breathe(PO.guard, tl, 1.2, 6);
    if (tl > 2.05 && tl < 3.1) sPose = poseAt(tl, [[2.05, PO.guard], [HIT, V.set(PO.lunge, 'hF', [40, -104])], [2.5, V.set(PO.lunge, 'hF', [40, -104])], [3.0, PO.guard]]);
    const sx = kf(tl, [[0, 660], [2.05, 650], [HIT, 600], [2.5, 600], [3.1, 650]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: 'focus', beamWarm: 0.4 * seg(tl, 2.6, 4.4) });
    return {
      figs: [...crowd, reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 16 : 0,
      mid(g) { crowd.forEach((f) => { const h = V.figPoint(f, 'hF'); g.save(); g.fillStyle = 'rgba(160,200,255,0.85)'; g.shadowColor = '#9fc3ff'; g.shadowBlur = 26; V.roundRect(g, h[0] - 12, h[1] - 44, 24, 40, 5); g.fill(); g.restore(); }); },
      front(g) {
        V.flash(g, 150, 1060, (tl - FLASH) / 0.3, 1.2);
        V.flash(g, 190, 1040, (tl - FLASH - 0.35) / 0.3, 0.9);
        const h = headPt(reactive);
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
      },
    };
  };
})();
