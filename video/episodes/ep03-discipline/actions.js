/* Scene actions for Pt. 3 "Different discipline." — consistency & mind strength.
   World coordinates (the episode zoom is applied by the player). With zoom 0.82 the TikTok-safe box
   (screen x 150–930) is world x ≈ 77–1015, and world y ≥ 600 stays clear of the text block. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const VOICE = { fill: '#15161c', stroke: '#8d909a', color: '#C9CBD3' };   // the inner voice: grey, italic
  const voice = (g, o) => V.bubble(g, Object.assign({}, VOICE, { size: 52, font: `italic 600 52px ${V.FONT.sans}` }, o));
  const say = (g, o) => V.darkBubble(g, o);

  // ─────────────────────────────── RULE I — 5:30 AM: motivation is a mood
  V.actions.alarmRule = function (tl) {
    const ringing = tl < 1.65;
    // Reactive: groggy -> sits down -> blanket
    const rPose = tl < 1.55 ? V.breathe(PO.slump, tl, 1.2, 2) : poseAt(tl, [[1.55, PO.slump], [2.05, PO.sit]]);
    const reactive = V.R({ x: 300, pose: tl > 2.05 ? V.breathe(PO.sit, tl, 0.8, 1.6) : rPose, expr: 'sleepy' });

    // Steady: wakes at the alarm, stretches, then skips rope to the end
    let sPose, ropePhase = null;
    if (tl < 1.05) sPose = V.breathe(PO.slump, tl, 1.2, 2);
    else if (tl < 1.75) sPose = poseAt(tl, [[1.05, PO.slump], [1.4, PO.armsUp], [1.75, PO.rope]]);
    else {
      const per = 0.46, u = ((tl - 1.75) / per) % 1;
      ropePhase = u;
      const lift = Math.max(0, Math.sin(u * Math.PI * 2 - Math.PI)) * 6;   // feet leave the floor as the rope passes under
      sPose = V.shift(PO.rope, 0, -lift, true);
      const w = Math.sin(u * Math.PI * 2) * 2.5;
      sPose.hB = [sPose.hB[0] - w * 0.3, sPose.hB[1] + w]; sPose.hF = [sPose.hF[0] + w * 0.3, sPose.hF[1] + w];
    }
    const steady = V.St({ pose: sPose, expr: tl < 1.05 ? 'sleepy' : 'neutral' });

    return {
      figs: [reactive, steady],
      front(g) {
        if (ropePhase !== null) {
          const a = V.figPoint(steady, 'hB'), b = V.figPoint(steady, 'hF');
          V.jumpRope(g, a, b, ropePhase, 800, V.FLOOR + 14);
        }
        if (tl > 1.85) V.blanket(g, 316, 1150, 300, ease.out(seg(tl, 1.85, 2.15)));
        if (tl >= 0.15 && tl < 1.9) V.alarmCard(g, 540, 700, 760, V.pop(tl - 0.15), '5:30 AM', 'now', ringing ? 1 : 0, tl);
        const h = headPt(reactive);
        if (tl >= 2.3 && tl < 3.9) say(g, { red: true, x: 330, y: 800, text: '5 more min', tail: [h[0] + 6, h[1] - 95], scale: V.pop(tl - 2.3, 0.14) });
        if (tl >= 3.9) say(g, { red: true, x: 400, y: 800, text: "I'll start Monday", tail: [h[0] + 6, h[1] - 95], scale: V.pop(tl - 3.9, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE II — BRICKS: consistency beats intensity
  const R_PILE = [[140, 0, -0.05], [146, 1, 0.12], [128, 2, -0.18], [150, 3, 0.22], [138, 4, -0.3]];
  V.actions.bricksRule = function (tl) {
    // Steady: one brick per beat
    const per = 0.55, t0 = 0.25;
    const p = Math.max(0, (tl - t0) / per), n = Math.min(9, Math.floor(p)), k = p % 1;
    const slotY = (j) => V.FLOOR - 22 - j * 44;
    const placing = n < 9 && tl >= t0;
    let sPose = PO.stand;
    if (placing) {
      const target = [(950 - 740) / V.S - 2, (slotY(n) - V.FLOOR) / V.S];
      const place = V.set(V.set(PO.place, 'hF', target), 'C', [6, -88]);
      sPose = k < 0.45 ? V.lerpPose(PO.place, PO.pickLow, ease.inOut(k / 0.45)) : V.lerpPose(PO.pickLow, place, ease.inOut((k - 0.45) / 0.55));
    } else sPose = V.breathe(PO.stand, tl, 1, 2.5);
    const steady = V.St({ x: 740, face: 1, pose: sPose, expr: 'neutral' });

    // Reactive: burst of five bricks, phone, collapse
    const rp = (tl - t0) / 0.24, rn = Math.max(0, Math.min(5, Math.floor(rp))), rk = rp % 1;
    let rPose;
    if (tl < t0) rPose = PO.stand;
    else if (rn < 5) rPose = rk < 0.5 ? V.lerpPose(PO.place, PO.pickLow, rk * 2) : V.lerpPose(PO.pickLow, V.set(PO.place, 'hF', [44, -60]), (rk - 0.5) * 2);
    else if (tl < 1.75) rPose = poseAt(tl, [[1.45, V.set(PO.place, 'hF', [44, -60])], [1.75, PO.phone]]);
    else rPose = V.breathe(PO.phone, tl, 1, 2.5);
    const collapsed = tl > 3.4;
    const reactive = V.R({ x: 330, face: -1, pose: rPose, expr: tl < 1.6 ? 'grin' : collapsed ? 'shame' : 'neutral', blush: collapsed ? 0.5 : 0 });

    return {
      figs: [reactive, steady],
      mid(g) {
        // supplies at their feet
        V.brick(g, 862, V.FLOOR - 22, 0); V.brick(g, 236, V.FLOOR - 22, 0);
      },
      front(g) {
        // Steady's stack + brick in hand
        for (let j = 0; j < n; j++) V.brick(g, 950 + (j % 2 ? 3 : -3), slotY(j), 0);
        if (placing && k >= 0.45) { const hnd = V.figPoint(steady, 'hF'); V.brick(g, hnd[0], hnd[1] - 6, 0); }
        // Reactive's messy pile (falls at 3.4)
        const fall = ease.in(seg(tl, 3.4, 3.85));
        for (let j = 0; j < rn; j++) {
          const [x, row, rot] = R_PILE[j];
          const y0 = V.FLOOR - 22 - row * 42;
          const y = V.lerp(y0, V.FLOOR - 22, fall), xx = x + fall * (j % 2 ? 70 : -40) * (row / 4), rr = rot + fall * (j % 2 ? 1.4 : -1.4) * (row > 0);
          V.brick(g, Math.max(124, xx), y, row ? rr : rot);
        }
        if (tl >= t0 && rn < 5 && rk >= 0.5) { const hnd = V.figPoint(reactive, 'hF'); V.brick(g, hnd[0], hnd[1] - 6, 0.3); }
        // day counters
        V.caption(g, 900, 820, `DAY ${Math.max(1, n)}`, '#F4F5F7', 48);
        V.caption(g, 200, 820, collapsed ? 'DAY 0' : `DAY ${Math.max(1, rn)}`, collapsed ? V.COL.red : '#F4F5F7', 48, collapsed ? V.pop(tl - 3.4) : 1);
        // bubbles
        if (tl >= 0.3 && tl < 1.7) say(g, { red: true, x: 400, y: 690, text: 'NEW ME!', scale: V.pop(tl - 0.3, 0.14) });
        if (tl >= 3.95) say(g, { red: true, x: 420, y: 690, text: 'Monday. For real.', scale: V.pop(tl - 3.95, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE III — THE HOLD: the mind quits first
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  V.actions.holdRule = function (tl) {
    const QUIT = 2.85;
    const secs = Math.floor(tl * 12);
    // Reactive
    let rPose, rExpr = 'neutral';
    if (tl < QUIT) { rPose = V.shift(poseAt(tl, [[0, PO.stand], [0.4, PO.squat]]), Math.sin(tl * 37) * 0.5 * seg(tl, 1.2, 2.8), 0); rExpr = tl > 1.2 ? 'strain' : 'neutral'; }
    else { rPose = poseAt(tl, [[QUIT, PO.squat], [QUIT + 0.35, PO.sit]]); rPose = V.breathe(rPose, tl, 1.6, 9); rExpr = 'pant'; }
    const reactive = V.R({ pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 14) });
    // Steady: holds, trembles a little, answers the voice
    const sPose = V.shift(poseAt(tl, [[0, PO.stand], [0.4, PO.squat]]), Math.sin(tl * 41) * 0.6 * seg(tl, 2, 3), 0);
    const steady = V.St({ pose: sPose, expr: tl > 2.0 ? 'strain' : 'neutral' });

    return {
      figs: [reactive, steady],
      front(g) {
        const rh = headPt(reactive), sh = headPt(steady);
        if (tl > 1.5 && tl < QUIT) V.sweat(g, rh[0], rh[1], tl, 0.8, 4);
        if (tl > 2.0) V.sweat(g, sh[0], sh[1], tl, 1.1, 6);
        const rSecs = Math.min(secs, Math.floor(QUIT * 12));
        V.timerPanel(g, 320, 700, clock(rSecs), tl >= QUIT ? 'quit' : 'run', tl >= QUIT ? V.pop(tl - QUIT) : 1);
        V.timerPanel(g, 700, 700, clock(secs), 'run');
        // the same voice for both
        if (tl >= 1.4 && tl < 2.2) voice(g, { x: 250, y: 860, text: 'stop.', scale: V.pop(tl - 1.4, 0.14) });
        if (tl >= 2.2 && tl < QUIT + 0.6) voice(g, { x: 330, y: 860, text: "you're done.", scale: V.pop(tl - 2.2, 0.14) });
        if (tl >= 1.4 && tl < 3.1) voice(g, { x: 760, y: 860, text: 'stop.', scale: V.pop(tl - 1.4, 0.14) });
        if (tl >= 3.1) say(g, { x: 700, y: 860, text: 'one more.', scale: V.pop(tl - 3.1, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE IV — NO AUDIENCE: train when no one claps
  V.actions.aloneRule = function (tl) {
    const STOP = 2.3;
    // Reactive performs for the camera, then deflates
    let rPose, rExpr = 'grin';
    if (tl < 0.9) rPose = poseAt(tl, [[0, PO.guard], [0.3, PO.flex], [0.9, PO.flex]]);
    else if (tl < STOP) {
      const p = (tl - 0.9) / 0.28, k = p % 1, n = Math.floor(p);
      rPose = V.lerpPose(PO.guard, n % 2 ? PO.cross2 : PO.jab, Math.sin(k * Math.PI));
    } else { rPose = poseAt(tl, [[STOP, PO.guard], [STOP + 0.4, PO.slump], [3.2, PO.slump], [3.7, PO.sit]]); rExpr = tl > 2.5 ? 'shame' : 'neutral'; }
    const reactive = V.R({ x: 350, face: -1, pose: rPose, expr: rExpr });
    // Steady: alone, steady combos the whole time
    const p = tl / 0.55, k = p % 1, n = Math.floor(p);
    const amt = k < 0.4 ? Math.sin((k / 0.4) * Math.PI) : 0;
    const sPose = V.shift(V.lerpPose(V.breathe(PO.guard, tl, 1.4, 6), n % 3 === 2 ? PO.cross2 : PO.jab, amt), Math.sin(tl * 6) * 1.2, 0, true);
    const steady = V.St({ pose: sPose, expr: 'neutral' });

    return {
      figs: [reactive, steady],
      front(g) {
        const top = V.tripodPhone(g, 150, tl < STOP + 0.3, tl, true);
        if (tl >= 0.35 && tl < 2.0) say(g, { red: true, x: 420, y: 760, text: '#grindset', scale: V.pop(tl - 0.35, 0.14) });
        if (tl >= STOP && tl < 3.5) say(g, { x: 290, y: 760, text: '0 views', tail: [top[0] + 10, top[1] - 6], scale: V.pop(tl - STOP, 0.14) });
        if (tl >= 3.5) say(g, { red: true, x: 420, y: 760, text: "what's the point", scale: V.pop(tl - 3.5, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RING — 6 months later: Reactive gasses, Steady stays sharp
  V.actions.ringGas = function (tl) {
    const HIT = 2.05, per = 0.25;
    let rPose, rExpr = 'shout';
    if (tl < 1.0) { const q = tl / per; rPose = V.lerpPose(PO.fists, Math.floor(q) % 2 ? PO.wild2 : PO.wild, Math.sin((q % 1) * Math.PI)); }
    else if (tl < HIT) { rPose = V.breathe(poseAt(tl, [[1.0, PO.fists], [1.3, PO.tired]]), tl, 3, 13); rExpr = 'pant'; }
    else { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [3.0, PO.stumble], [3.5, PO.tired]]); rExpr = 'dizzy'; }
    const rx = kf(tl, [[0, 300], [1.0, 372], [HIT, 350], [HIT + 0.45, 250], [3.5, 240]], ease.out);
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 16) });

    let sPose;
    if (tl < 1.0) { const q = tl / per; sPose = V.lerpPose(PO.guard, V.shift(PO.slip, Math.floor(q) % 2 ? 3 : -2, 0), Math.sin((q % 1) * Math.PI) * 0.9); }
    else sPose = poseAt(tl, [[1.0, PO.guard], [1.85, V.breathe(PO.guard, 1.85, 1.2, 6)], [HIT, V.set(PO.lunge, 'hF', [40, -100])], [2.25, V.set(PO.lunge, 'hF', [40, -100])], [2.7, PO.guard]]);
    const sx = kf(tl, [[0, 672], [1.0, 660], [1.85, 650], [HIT, 598], [2.25, 598], [2.8, 650]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: 'neutral' });

    return {
      figs: [reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 16 : 0,
      front(g) {
        const h = headPt(reactive);
        if (tl > 1.0 && tl < HIT) V.sweat(g, h[0], h[1], tl, 1.4, 8);
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
      },
    };
  };
})();
