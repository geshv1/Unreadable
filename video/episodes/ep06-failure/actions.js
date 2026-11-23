/* Scene actions for Pt. 6 "Different comeback." — failure, rejection, problems.
   Same cinematic toolkit as Pt. 5. World coordinates (zoom ≈ 0.82): safe box ≈ world x 77–1015,
   bubbles/props above the heads at world y ≥ 640. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const say = (g, o) => V.darkBubble(g, Object.assign({ size: 56, font: `700 56px ${V.FONT.sans}` }, o));
  const C = (o) => V.X(Object.assign({ kind: 'crowd', pose: PO.stand }, o));
  const run = (t, phase = 0) => { const p = V.walkPose(t * 15 + phase, PO.stand, 15); return Object.assign(V.shift(p, 4, 0), { C: [p.C[0] + 8, p.C[1] + 2] }); };

  // ─────────────────────────────── COLD OPEN — square up, faceless, a dark crowd, figures past the lens
  const CROWD = [60, 150, 235, 430, 520, 610, 800, 890, 980, 1060];
  V.actions.coldOpen6 = function (tl) {
    const crowd = CROWD.map((x, i) => C({ depth: 'back', x, y: 1296, s: 0.56, alpha: 0.8, face: i % 2 ? 1 : -1, pose: V.breathe(i % 3 ? PO.stand : PO.scroll, tl, 0.8, 1.6, i) }));
    const [reactive, steady] = V.actions.squareUp(tl).figs.map((f) => Object.assign(f, { expr: null }));
    return {
      figs: [...crowd, reactive, steady],
      fg(g) {
        V.fgFigure(g, { x: V.lerp(-140, 150, tl / 2.6), y: 2380, s: 2.2, face: 1, pose: V.walkPose(tl * 5) }, 10, 0.95);
        V.fgFigure(g, { x: V.lerp(1240, 960, tl / 2.6), y: 2420, s: 2.3, face: -1, pose: V.walkPose(tl * 5 + 1) }, 12, 0.95);
      },
    };
  };

  // ─────────────────────────────── REJECTION — the door: knock again
  V.actions.doorRule = function (tl) {
    const knockAmt = (t0, t1) => (tl > t0 && tl < t1 ? Math.abs(Math.sin(((tl - t0) / 0.2) * Math.PI)) : 0);
    // Reactive: knocks, "no.", slides down the door
    let rPose, rFace = -1, rExpr = 'neutral';
    if (tl < 0.85) rPose = V.lerpPose(PO.stand, V.set(PO.knock, 'hF', [34, -98 + knockAmt(0.2, 0.8) * 8]), seg(tl, 0, 0.2));
    else if (tl < 1.9) { rPose = V.breathe(PO.stand, tl, 1, 2); rExpr = tl > 1.0 ? 'shock' : 'neutral'; }
    else { rFace = 1; rPose = poseAt(tl, [[1.9, PO.stand], [2.5, PO.sit]]); rExpr = 'tearful'; }
    const reactive = V.R({ x: tl > 1.9 ? 290 : 320, face: rFace, pose: rPose, expr: rExpr, beam: 1 - 0.4 * seg(tl, 2, 3.5) });
    // Steady: knocks, "no.", knocks again, "no.", knocks again: the door opens into warm light
    let sPose, sx = 760, sExpr = 'focus';
    const k1 = knockAmt(0.2, 0.8) + knockAmt(2.0, 2.4) + knockAmt(3.15, 3.55);
    if (tl < 3.85) sPose = V.set(PO.knock, 'hF', [34, -98 + k1 * 8]);
    else { sx = kf(tl, [[3.85, 760], [4.6, 860]], ease.inOut); sPose = V.walkPose((tl - 3.85) * 6); sExpr = 'smile'; }
    const steady = V.St({ x: sx, face: 1, pose: sPose, expr: sExpr, beamWarm: 0.7 * seg(tl, 3.6, 4.4) });
    const rOpen = tl > 0.9 && tl < 1.8 ? 0.12 : 0;
    const sOpen = tl > 0.9 && tl < 1.8 ? 0.12 : tl > 2.5 && tl < 2.95 ? 0.12 : tl > 3.6 ? ease.out(seg(tl, 3.6, 4.0)) : 0;
    return {
      figs: [reactive, steady],
      back(g) { V.door(g, 170, rOpen, 0); V.door(g, 930, sOpen, tl > 3.6 ? seg(tl, 3.6, 4.1) : 0); },
      front(g) {
        if (tl >= 0.95 && tl < 1.85) { say(g, { x: 175, y: 1150, text: 'no.', scale: V.pop(tl - 0.95, 0.14) }); say(g, { x: 905, y: 1150, text: 'no.', scale: V.pop(tl - 0.95, 0.14) }); }
        if (tl >= 2.55 && tl < 3.0) say(g, { x: 905, y: 1150, text: 'no.', scale: V.pop(tl - 2.55, 0.14) });
        if (tl >= 2.7) say(g, { red: true, x: 300, y: 760, text: 'not good enough.', scale: V.pop(tl - 2.7, 0.14) });
      },
    };
  };

  // ─────────────────────────────── FAILURE — the hurdle: fall seven, rise eight
  V.actions.hurdleRule = function (tl) {
    const FALL = 0.82;
    // Reactive: runs, clips it, falls, pounds the floor, kicks it, sits and quits
    let rPose, rx, ry = V.FLOOR, rExpr = 'focus';
    if (tl < 0.6) { rx = kf(tl, [[0, 110], [0.6, 280]], ease.lin); rPose = run(tl); }
    else if (tl < FALL) { const u = seg(tl, 0.6, FALL); rx = V.lerp(280, 340, u); ry = V.FLOOR - Math.sin(u * Math.PI) * 60; rPose = PO.leap; rExpr = 'shock'; }
    else if (tl < 2.0) { rx = 360; rPose = V.set(PO.allFours, 'hF', [28, -5 - Math.abs(Math.sin(tl * 9)) * 18 * seg(tl, 1.2, 1.3)]); rExpr = tl > 1.2 ? 'angry' : 'shock'; }
    else if (tl < 2.7) { rx = 360; rPose = poseAt(tl, [[2.0, PO.allFours], [2.3, PO.stand], [2.5, V.set(PO.kick, 'C', [-4, -90])], [2.7, PO.stand]]); rExpr = 'angry'; }
    else { rx = 360; rPose = poseAt(tl, [[2.7, PO.stand], [3.1, PO.sit]]); rExpr = 'shame'; }
    const reactive = V.R({ x: rx, y: ry, face: tl > 2.25 && tl < 2.7 ? -1 : 1, pose: rPose, expr: rExpr });
    // Steady: runs, clips it, falls, gets up, dusts off, walks back, runs again and clears it
    let sPose, sx, sy = V.FLOOR, sFace = 1, sExpr = 'focus';
    if (tl < 0.6) { sx = kf(tl, [[0, 580], [0.6, 750]], ease.lin); sPose = run(tl, 1); }
    else if (tl < 0.88) { const u = seg(tl, 0.6, 0.88); sx = V.lerp(750, 810, u); sy = V.FLOOR - Math.sin(u * Math.PI) * 60; sPose = PO.leap; }
    else if (tl < 1.7) { sx = 830; sPose = poseAt(tl, [[0.88, PO.allFours], [1.2, PO.allFours], [1.5, PO.kneel], [1.7, PO.stand]]); sExpr = tl < 1.2 ? 'strain' : 'focus'; }
    else if (tl < 2.0) { sx = 830; sPose = V.set(PO.dust, 'hF', [14, -56 + Math.sin(tl * 40) * 4]); }
    else if (tl < 2.7) { sFace = -1; sx = kf(tl, [[2.0, 830], [2.7, 600]], ease.inOut); sPose = V.walkPose(tl * 7); }
    else if (tl < 3.3) { sx = kf(tl, [[2.7, 600], [3.3, 740]], ease.in); sPose = run(tl, 1); }
    else if (tl < 3.8) { const u = seg(tl, 3.3, 3.8); sx = V.lerp(740, 930, u); sy = V.FLOOR - Math.sin(u * Math.PI) * 190; sPose = PO.leap; }
    else { sx = 930; sPose = poseAt(tl, [[3.8, PO.kneel], [4.1, PO.stand]]); sExpr = tl > 4.1 ? 'smile' : 'focus'; }
    const steady = V.St({ x: sx, y: sy, face: sFace, pose: sPose, expr: sExpr });
    return {
      figs: [reactive, steady],
      shake: tl > FALL && tl < FALL + 0.15 ? 6 : 0,
      back(g) {
        V.hurdle(g, 330, ease.out(seg(tl, 0.75, 0.95)) * (tl < 2.5 ? 1 : 1 + seg(tl, 2.5, 2.7) * 0.15));
        V.hurdle(g, 800, ease.out(seg(tl, 0.8, 1.0)) * (1 - ease.inOut(seg(tl, 2.2, 2.6))));
      },
      front(g) {
        if (tl >= 3.0) say(g, { red: true, x: 330, y: 760, text: 'this is stupid.', scale: V.pop(tl - 3.0, 0.14) });
      },
    };
  };

  // ─────────────────────────────── A PROBLEM — the block: break it into pieces
  V.actions.blockRule = function (tl) {
    const drop = -900 * (1 - ease.in(seg(tl, 0.0, 0.3)));
    // Reactive: pushes, nothing moves, sits against it
    let rPose, rFace = -1, rx = 300, rExpr = 'strain';
    if (tl < 0.4) { rPose = PO.stand; rExpr = 'shock'; }
    else if (tl < 1.4) { rx = kf(tl, [[0.4, 330], [0.6, 405]], ease.out); rPose = V.shift(PO.push, Math.sin(tl * 30) * 0.8, 0); }
    else { rFace = 1; rx = 300; rPose = poseAt(tl, [[1.4, PO.stand], [1.9, PO.sit]]); rExpr = 'shame'; }
    const reactive = V.R({ x: rx, face: rFace, pose: rPose, expr: rExpr });
    // Steady: looks, then one strike at a time; the block shrinks, the pile grows; ends standing on what's left
    const t0 = 0.95, per = 0.48;
    const hits = Math.max(0, Math.min(7, Math.floor((tl - t0) / per) + (tl > t0 ? 1 : 0)));
    const sH = 300 - hits * 31;
    const k = ((tl - t0) / per) % 1;
    let sPose = V.breathe(PO.stand, tl, 1, 2), sx = 720, sy = V.FLOOR, sExpr = 'focus';
    const hDown = V.set(PO.hammerDown, 'hF', [44, -sH / V.S + 6]);
    if (tl > t0 && tl < t0 + 7 * per) sPose = k < 0.55 ? V.lerpPose(hDown, PO.hammerUp, ease.inOut(k / 0.55)) : V.lerpPose(PO.hammerUp, hDown, ease.in((k - 0.55) / 0.45));
    else if (tl >= t0 + 7 * per) { sx = kf(tl, [[t0 + 7 * per, 720], [4.35, 880]], ease.inOut); sy = V.FLOOR - sH * seg(tl, 4.15, 4.35); sPose = tl < 4.35 ? PO.stepUp : PO.stand; sExpr = 'smile'; }
    const steady = V.St({ x: sx, y: sy, face: 1, pose: sPose, expr: sExpr });
    return {
      figs: [reactive, steady],
      mid(g) {
        g.save(); g.translate(0, drop);
        V.block(g, 175, 170, 300, 0);
        V.block(g, 880, 170, sH, Math.min(4, hits));
        g.restore();
      },
      front(g) {
        // the neat pile of pieces (stacked)
        for (let j = 0; j < hits; j++) V.brick(g, 560 + (j % 2 ? 3 : -3), V.FLOOR - 22 - j * 44, 0);
        if (tl > t0 && tl < t0 + 7 * per) { const h = V.figPoint(steady, 'hF'); const e = V.figPoint(steady, 'eF'); V.hammer(g, h, Math.atan2(h[1] - e[1], h[0] - e[0]) + Math.PI / 2); }
        if (tl >= 1.9) say(g, { red: true, x: 300, y: 740, text: 'why me?', scale: V.pop(tl - 1.9, 0.14) });
      },
    };
  };

  // ─────────────────────────────── THE EMAIL — ask what to fix
  V.actions.emailRule = function (tl) {
    const SLAM = 1.55;
    let rPose, rExpr = 'neutral', rFace = -1;
    if (tl < SLAM) { rPose = V.breathe(PO.type, tl, 0.8, 3); rExpr = tl > 1.0 ? 'shock' : 'neutral'; }
    else if (tl < 2.0) { rPose = poseAt(tl, [[SLAM, V.set(PO.type, 'hF', [36, -76])], [SLAM + 0.1, PO.type], [2.0, PO.facepalm]]); rExpr = 'angry'; }
    else { rFace = 1; rPose = poseAt(tl, [[2.0, PO.facepalm], [2.5, PO.sit]]); rExpr = 'shame'; }
    const reactive = V.R({ x: 330, face: rFace, pose: rPose, expr: rExpr, beam: 1 - 0.4 * seg(tl, 2, 3.5) });
    const typing = tl > 1.7 && tl < 3.0;
    const steady = V.St({ x: 700, face: 1, pose: typing ? V.set(PO.type, 'hF', [36 + Math.sin(tl * 40) * 1.5, -60 + Math.abs(Math.sin(tl * 33)) * 2]) : V.breathe(PO.type, tl, 0.8, 3),
      expr: tl > 3.2 ? 'smile' : 'focus', beamWarm: 0.4 * seg(tl, 2.5, 4) });
    return {
      figs: [reactive, steady],
      mid(g) {
        const top = V.desk(g, 175, tl < SLAM, 0.7);
        if (tl >= SLAM) V.laptopClosed(g, 175, top);
        V.desk(g, 870, true, 1);
      },
      front(g) {
        if (tl >= 0.2 && tl < 1.45) V.notification(g, 540, 720, 780, V.pop(tl - 0.2), 'MAIL', 'Unfortunately, we…', false);
        if (tl >= 2.1) say(g, { red: true, x: 270, y: 690, text: "I'm done.", scale: V.pop(tl - 2.1, 0.14) });
        if (tl >= 2.4) say(g, { x: 640, y: 820, text: 'what can I improve?', scale: V.pop(tl - 2.4, 0.14) });
      },
    };
  };

  // ─────────────────────────────── FIGHT NIGHT — get up. every time.
  V.actions.ringGetUp = function (tl) {
    const DOWN = 0.58, UP = 2.6, HIT = 3.0;
    let rPose, rExpr = 'angry';
    if (tl < 0.35) rPose = V.breathe(PO.fists, tl, 1.5, 9);
    else if (tl < 0.85) rPose = poseAt(tl, [[0.35, PO.guard], [DOWN, PO.cross2], [0.85, PO.guard]]);
    else if (tl < UP) { rPose = V.shift(poseAt(tl, [[0.85, PO.guard], [1.1, PO.cheer]]), 0, -Math.abs(Math.sin(tl * 9)) * 3, true); rExpr = tl < 1.6 ? 'laugh' : 'proud'; }
    else if (tl < HIT) { rPose = poseAt(tl, [[UP, PO.cheer], [UP + 0.2, PO.guard]]); rExpr = 'shock'; }
    else if (tl < 3.8) { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [3.8, PO.sit]]); rExpr = 'dizzy'; }
    else { rPose = poseAt(tl, [[3.8, PO.sit], [4.15, V.set(PO.sit, 'hF', [30, -70])]]); rExpr = 'neutral'; }
    const rx = kf(tl, [[0, 300], [DOWN, 430], [1.2, 410], [UP, 410], [HIT, 412], [3.5, 330], [4.8, 330]], ease.out);
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, beamWarm: 0.4 * seg(tl, 4.0, 4.8) });
    let sPose, sExpr = 'focus';
    if (tl < DOWN) sPose = V.breathe(PO.guard, tl, 1.2, 6);
    else if (tl < 2.1) { sPose = poseAt(tl, [[DOWN, PO.flinch], [DOWN + 0.25, PO.kneel], [2.1, V.breathe(PO.kneel, 2.1, 1.5, 3)]]); sExpr = tl < 1.3 ? 'strain' : 'focus'; }
    else if (tl < UP) sPose = poseAt(tl, [[2.1, PO.kneel], [UP, PO.guard]]);
    else if (tl < HIT) sPose = poseAt(tl, [[UP, PO.guard], [2.85, PO.guard], [HIT, V.set(PO.lunge, 'hF', [40, -104])]]);
    else if (tl < 3.8) sPose = poseAt(tl, [[HIT, V.set(PO.lunge, 'hF', [40, -104])], [3.25, PO.lunge], [3.6, PO.guard]]);
    else { sPose = poseAt(tl, [[3.8, PO.guard], [4.15, PO.offerHand]]); sExpr = 'smile'; }
    const sx = kf(tl, [[0, 660], [DOWN, 660], [0.9, 680], [UP, 680], [2.85, 660], [HIT, 600], [3.3, 600], [3.8, 560], [4.2, 520]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: sExpr, beamWarm: 0.5 * seg(tl, 2.6, 4.2) });
    return {
      figs: [reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 16 : tl > DOWN && tl < DOWN + 0.15 ? 9 : 0,
      front(g) {
        const sh = headPt(steady), h = headPt(reactive);
        if (tl > DOWN && tl < DOWN + 0.3) { g.save(); g.translate(sh[0] + 20, sh[1]); g.scale(0.6, 0.6); V.impact(g, 0, 0, (tl - DOWN) / 0.3); g.restore(); }
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
        if (tl >= 1.2 && tl < UP) say(g, { red: true, x: 330, y: 700, text: "it's over!", scale: V.pop(tl - 1.2, 0.14) });
      },
    };
  };
})();
