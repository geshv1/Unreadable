/* Scene actions for Pt. 6 "Same day. Different control." — one day, a live CONTROL meter.
   World coordinates; zoom 0.76 (characters ≈ 400px). Screen-safe box ≈ world x 27–1053; meters sit in
   screen y 670–775, so world props above the heads stay at y ≥ 640. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const say = (g, o) => V.darkBubble(g, Object.assign({ size: 56, font: `700 56px ${V.FONT.sans}` }, o));
  const STRANGER = (o) => V.X(Object.assign({ kind: 'other', s: 0.9 }, o));

  // ─────────────────────────────── HOOK — both square up, no faces
  V.actions.hook6 = function (tl) {
    const st = V.actions.squareUp(tl);
    st.figs.forEach((f) => (f.expr = null));
    return st;
  };

  // ─────────────────────────────── 8:12 AM — STREET: emotion is a leash
  V.actions.street6 = function (tl) {
    // coffee guy walks right->left, bumps Steady (0.35) and Reactive (0.9), never notices, sips, walks off
    const sx = kf(tl, [[0, 1000], [1.3, 120], [2.6, -220]], ease.lin);
    const sipping = tl > 1.5 && tl < 2.1;
    const sPose = sipping ? V.lerpPose(V.walkPose(tl * 8), PO.sip, Math.sin(seg(tl, 1.5, 2.1) * Math.PI)) : V.set(V.walkPose(tl * 8), 'hF', [18, -70]);
    const guy = STRANGER({ x: sx, face: -1, pose: sPose });

    // Steady: walks on; small jolt, a nod, keeps going
    const stX = kf(tl, [[0, 660], [4.2, 770]], ease.lin);
    const jolt = Math.sin(seg(tl, 0.28, 0.45) * Math.PI) * 4;
    const steady = V.St({ x: stX, face: 1, pose: V.shift(V.walkPose(tl * 6.5 + 1.5), -jolt, 0), expr: 'neutral',
      headTilt: tl > 0.55 && tl < 0.9 ? 0.2 : 0 });

    // Reactive: bumped, turns, the leash drags him toward a man who isn't even looking; yelling at nobody
    let rx = 320, rPose, rFace = 1, rExpr = 'neutral';
    if (tl < 0.9) rPose = V.breathe(PO.stand, tl, 1, 2);
    else if (tl < 1.15) { rPose = PO.flinch; rExpr = 'shock'; }
    else {
      rFace = -1; rExpr = 'shout';
      rx = kf(tl, [[1.15, 320], [1.5, 250], [2.4, 230]], ease.out);
      const drag = Math.sin(seg(tl, 1.15, 1.9) * Math.PI);
      const shout = V.lerpPose(PO.shout, V.set(PO.shout, 'hF', [32, -112]), 0.5 + 0.5 * Math.sin(tl * 16));
      rPose = V.lerpPose(shout, PO.dragged, drag);
    }
    const reactive = V.R({ x: rx, face: rFace, pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 22) });

    return {
      figs: [guy, reactive, steady],
      shake: tl > 1.15 && tl < 1.32 ? 7 : 0,
      front(g) {
        V.coffee(g, V.figPoint(guy, 'hF'), 1);
        if (tl >= 1.0 && tl < 2.6) {
          const a = V.figPoint(guy, 'hF'), b = V.figPoint(reactive, 'neck');
          V.leash(g, [a[0], a[1] + 30], b, tl < 1.15 ? 60 : 8, (tl < 2.2 ? 1 : 1 - seg(tl, 2.2, 2.6)) * Math.min(1, (tl - 1.0) / 0.08), 38 * V.pop(tl - 1.0));
        }
        if (tl >= 1.45) V.jagged(g, 380, 770, 170, 66, 'SAY THAT\nAGAIN?!', { size: 44, scale: V.pop(tl - 1.45), seed: 8, shake: 10, rot: -0.03 });
      },
    };
  };

  // ─────────────────────────────── 1:40 PM — PHONE: a feint is a question
  const MSGS = ['what??', 'what did I do', 'ANSWER ME'];
  V.actions.phone6 = function (tl) {
    const typing = tl > 1.2 && tl < 2.7;
    let rPose = V.breathe(PO.phone, tl, 1, 3), rExpr = 'neutral', rPhone = true;
    if (typing) { rPose = Object.assign({}, rPose, { hF: [rPose.hF[0] + Math.sin(tl * 60) * 1.6, rPose.hF[1] + Math.abs(Math.sin(tl * 45)) * 2] }); rExpr = tl > 2.0 ? 'shout' : 'angry'; }
    if (tl >= 2.7 && tl < 3.15) rExpr = 'shock';
    if (tl >= 3.15) { rPose = poseAt(tl, [[3.15, PO.phone], [3.5, PO.slump], [3.75, PO.facepalm]]); rExpr = 'shame'; rPhone = tl < 3.4; }
    const reactive = V.R({ pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 18) });

    // Steady: reads, face-down on the desk, back to the laptop
    let sPose, sFace = -1, sPhone = tl < 1.6;
    if (tl < 1.25) sPose = V.breathe(PO.phone, tl, 1, 3);
    else if (tl < 1.6) { sFace = 1; sPose = poseAt(tl, [[1.25, PO.phone], [1.6, PO.type]]); }
    else { sFace = 1; sPose = V.set(PO.type, 'hF', [36 + Math.sin(tl * 40) * 1.5, -60 + Math.abs(Math.sin(tl * 33)) * 2]); }
    const steady = V.St({ face: sFace, pose: sPose, expr: tl < 1.25 ? 'neutral' : 'focus' });

    return {
      figs: [reactive, steady],
      mid(g) {
        const top = V.desk(g, 870, true, tl > 1.4 ? 1 : 0.4);
        if (!sPhone) { g.save(); g.fillStyle = '#0d0e12'; g.strokeStyle = '#cfd2da'; g.lineWidth = 3; V.roundRect(g, 912, top - 20, 60, 12, 4); g.fill(); g.stroke(); g.restore(); }
      },
      front(g) {
        if (rPhone) { const h = V.figPoint(reactive, 'hF'); V.phone(g, h[0] + 4, h[1] - 30, 0.18, 96, tl > 0.2 ? 'on' : 'off'); }
        if (sPhone) { const h = V.figPoint(steady, 'hF'); V.phone(g, h[0] - 4, h[1] - 30, -0.18, 96, tl > 0.2 ? 'on' : 'off'); }
        if (tl >= 0.2 && tl < 1.2) V.notification(g, 540, 770, 780, V.pop(tl - 0.2), 'MESSAGES', 'we need to talk');
        if (tl >= 2.75 && tl < 3.9) V.notification(g, 540, 770, 780, V.pop(tl - 2.75), 'MESSAGES', 'lol about the trip', false);
        if (typing) {
          const t0 = 1.3, gap = 0.45;
          const n = Math.min(3, Math.floor((tl - t0) / gap) + 1);
          for (let i = Math.max(0, n - 2); i < n; i++) {           // one at a time, newest two on screen
            const m = V.measureBubble(g, MSGS[i], 56, `700 56px ${V.FONT.sans}`);
            say(g, { red: true, x: 60 + m.w / 2, y: i === n - 1 ? 800 : 712, text: MSGS[i], scale: V.pop(tl - t0 - i * gap, 0.12) });
          }
        }
      },
    };
  };

  // ─────────────────────────────── 4:05 PM — WORK: your reaction is their data
  V.actions.work6 = function (tl) {
    const onR = tl < 1.75;
    const scanning = (tl > 0.25 && tl < 1.55) || (tl > 1.85 && tl < 2.75);
    const shaking = tl > 2.95;
    const boss = V.X({ kind: 'other', depth: 'back', x: 510, y: 1322, s: 0.74, tie: true, face: onR ? -1 : 1,
      pose: shaking ? V.set(V.set(PO.point, 'hF', [22, -94]), 'hB', [26, -90 + Math.abs(Math.sin(tl * 22)) * 6]) : V.set(V.set(PO.point, 'hF', [24, -100]), 'C', [2, -88]) });
    const ei = Math.floor((tl - 0.25) / 0.4) % 3;
    const rExpr = tl < 0.25 ? 'neutral' : tl < 1.55 ? ['angry', 'fear', 'shame'][ei] : 'shame';
    const reactive = V.R({ face: 1, pose: V.breathe(tl < 1.55 && ei === 1 ? PO.flinch : PO.type, tl, 1, 5), expr: rExpr, blush: tl > 0.25 ? 1 : 0 });
    const steady = V.St({ face: 1, pose: V.set(PO.type, 'hF', [36 + Math.sin(tl * 40) * 1.5, -60 + Math.abs(Math.sin(tl * 33)) * 2]), expr: 'neutral' });
    return {
      figs: [boss, reactive, steady],
      mid(g) { V.desk(g, 480, true, 0.8); V.desk(g, 870, true, 1); },
      front(g) {
        const hand = V.figPoint(boss, 'hF');
        const target = onR ? reactive : steady;
        const th = headPt(target);
        let ang = Math.atan2(th[1] - hand[1], th[0] - hand[0]);
        if (shaking) ang += Math.sin(tl * 40) * 0.25;
        const tip = [hand[0] + Math.cos(ang) * 50, hand[1] + Math.sin(ang) * 50 - 4];
        if (scanning) V.laser(g, tip, target.x + 60, 920 + 360 * (0.5 + 0.5 * Math.sin(tl * 7)), 120);
        V.scanner(g, hand, ang, 0.72);
        const rs = { progress: seg(tl, 0.25, 1.5), tags: [] };
        if (tl >= 1.5) { rs.result = 'DATA'; rs.scale = V.pop(tl - 1.5); }
        V.readout(g, V.POS.reactive + 40, 745, rs);
        const ss = { progress: 0.22 * seg(tl, 1.85, 2.6), label: tl > 1.85 ? 'READING…' : 'WAITING…', barColor: '#e8eaee', t: tl };
        if (tl >= 2.7) { ss.result = 'NODATA'; ss.glitch = 1 - seg(tl, 2.7, 3.6) * 0.7; ss.scale = V.pop(tl - 2.7); }
        V.readout(g, V.POS.steady + 60, 745, ss);
        if (tl >= 3.05) say(g, { x: 520, y: 840, text: '…broken?', scale: V.pop(tl - 3.05, 0.14) });
      },
    };
  };

  // ─────────────────────────────── 9:30 PM — SPARRING: silence is pressure
  V.actions.spar6 = function (tl) {
    const HIT = 1.95, per = 0.45;
    let rPose, rExpr = 'pant';
    if (tl < 1.55) { const q = (tl + 0.1) / per; rPose = V.lerpPose(PO.tired, Math.floor(q) % 2 ? PO.wild2 : PO.wild, Math.sin((q % 1) * Math.PI)); }
    else if (tl < HIT) rPose = V.breathe(PO.tired, tl, 3, 13);
    else { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [3.0, PO.stumble], [3.8, PO.tired]]); rExpr = 'dizzy'; }
    const rx = kf(tl, [[0, 330], [1.5, 380], [HIT, 372], [HIT + 0.45, 262], [3.8, 250]], ease.out);
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 16) });
    let sPose;
    if (tl < 1.55) { const q = (tl + 0.1) / per; sPose = V.lerpPose(PO.guard, V.shift(PO.slip, Math.floor(q) % 2 ? 3 : -2, 0), Math.sin((q % 1) * Math.PI) * 0.9); }
    else sPose = poseAt(tl, [[1.55, PO.guard], [1.8, PO.guard], [HIT, V.set(PO.lunge, 'hF', [40, -100])], [2.15, V.set(PO.lunge, 'hF', [40, -100])], [2.6, PO.guard]]);
    const sx = kf(tl, [[0, 668], [1.55, 655], [1.8, 652], [HIT, 600], [2.15, 600], [2.7, 650]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: 'focus' });
    return {
      figs: [reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 14 : 0,
      front(g) {
        const h = headPt(reactive);
        if (tl < 1.6) V.sweat(g, h[0], h[1], tl, 1.2, 8);
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
        for (const [k, at] of [[0, 0.55], [1, 1.0], [2, 1.45]]) {
          if (tl >= at && tl < at + 0.45) V.caption(g, 560 + (k % 2 ? 40 : -10), 760 - k * 12, 'MISS', '#F4F5F7', 54, V.pop(tl - at, 0.1));
        }
      },
    };
  };

  // ─────────────────────────────── 11:48 PM — THE QUIET MOMENT (slow)
  V.actions.night6 = function (tl) {
    const TOP = V.FLOOR - 150;
    const breathR = Math.sin(tl * 1.6) * 0.8, breathS = Math.sin(tl * 1.1) * 0.6;
    const reactive = V.R({ x: 500, y: TOP - 40, rot: -Math.PI / 2, s: 0.82, pose: V.shift(PO.lie, 0, -breathR), expr: tl % 2.6 < 0.12 ? 'sleepy' : 'neutral',
      noReflect: true, beamX: 290, beam: 0.3, beamW: 0.8 });
    const steady = V.St({ x: 580, y: TOP - 40, rot: Math.PI / 2, s: 0.82, face: -1, pose: V.shift(PO.lie, 0, -breathS), expr: 'sleepy',
      noReflect: true, beamX: 800, beamWarm: 0.6, beam: 0.85, beamW: 0.8 });
    return {
      figs: [reactive, steady],
      mid(g) {
        V.bed(g, 40, 545, TOP, true); V.pillow(g, 105, TOP - 4);
        V.bed(g, 555, 1045, TOP, false); V.pillow(g, 980, TOP - 4);
      },
      front(g) {
        V.bedBlanket(g, 190, 545, TOP, '#5a2730');
        V.bedBlanket(g, 555, 905, TOP, '#3a3c46');
        if (tl >= 0.9) say(g, { red: true, x: 330, y: 880, text: "should've said…", font: `italic 600 56px ${V.FONT.sans}`, scale: V.pop(tl - 0.9, 0.2) });
      },
    };
  };

  // ─────────────────────────────── THE LESSON — one breath before you react
  V.actions.lesson6 = function (tl) {
    const inhale = Math.sin(V.clamp(tl / 2.0) * Math.PI);
    const reactive = V.R({ pose: V.lerpPose(PO.stand, PO.inhale, inhale), expr: inhale > 0.5 ? 'sleepy' : 'neutral' });
    const steady = V.St({ pose: V.breathe(PO.stand, tl, 1, 2), expr: 'neutral' });
    return { figs: [reactive, steady] };
  };

  // ─────────────────────────────── NEXT DAY, 8:12 AM — the callback: day one
  V.actions.callback6 = function (tl) {
    const BUMP = 0.62, SNAP = 1.6;
    const gx = kf(tl, [[0, -120], [BUMP, 250], [2.0, 470], [3.2, 470]], ease.lin);
    const looking = tl > 2.0;
    const gPose = looking ? V.breathe(PO.stand, tl, 1, 2) : V.set(V.walkPose(tl * 8), 'hF', [18, -70]);
    const guy = STRANGER({ x: gx, face: looking ? -1 : 1, pose: gPose, headTilt: looking ? 0.15 : 0 });
    // Reactive: bumped, pauses, one visible breath, the leash snaps, he walks on
    let rPose, rExpr = 'neutral';
    if (tl < BUMP) rPose = V.walkPose(tl * 7);
    else if (tl < 0.8) { rPose = PO.flinch; rExpr = 'angry'; }
    else if (tl < SNAP) { rPose = V.lerpPose(PO.stand, PO.inhale, Math.sin(seg(tl, 0.8, SNAP) * Math.PI / 2)); rExpr = 'sleepy'; }
    else { rPose = poseAt(tl, [[SNAP, PO.inhale], [2.0, PO.stand]]); rExpr = tl > 2.0 ? 'smile' : 'neutral'; }
    const reactive = V.R({ x: kf(tl, [[0, 250], [BUMP, 320]], ease.lin), pose: rPose, expr: rExpr, beam: 0.55 + 0.35 * seg(tl, SNAP, 2.6), beamWarm: 0.6 * seg(tl, SNAP, 2.8) });
    const steady = V.St({ pose: V.breathe(PO.stand, tl, 1, 2), expr: tl > 2.1 ? 'smile' : 'neutral', headTilt: tl > 2.2 && tl < 2.6 ? 0.18 : 0 });
    return {
      figs: [guy, reactive, steady],
      front(g) {
        V.coffee(g, V.figPoint(guy, 'hF'), 1);
        const a = V.figPoint(guy, 'hF'), b = V.figPoint(reactive, 'neck');
        if (tl >= 0.7 && tl < SNAP) V.leash(g, [a[0], a[1] + 30], b, 50, 0.25 + 0.5 * seg(tl, 0.7, SNAP) + 0.15 * Math.sin(tl * 30), 38);
        if (tl >= SNAP) V.leashDissolve(g, [a[0], a[1] + 30], b, seg(tl, SNAP, SNAP + 0.8));
        if (tl >= 2.15) say(g, { x: 520, y: 790, text: '?', scale: V.pop(tl - 2.15, 0.14) });
      },
    };
  };
})();
