/* Scene actions for Pt. 4 "Different ego." — wins and losses.
   World coordinates (zoom 0.82 applied by the player): safe box ≈ world x 77–1015, props above heads at y ≥ 600. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const say = (g, o) => V.darkBubble(g, o);

  function ropePose(t0, tl) {
    const per = 0.46, u = (((tl - t0) / per) % 1 + 1) % 1;
    const lift = Math.max(0, Math.sin(u * Math.PI * 2 - Math.PI)) * 6;
    const p = V.shift(PO.rope, 0, -lift, true);
    const w = Math.sin(u * Math.PI * 2) * 2.5;
    p.hB = [p.hB[0] - w * 0.3, p.hB[1] + w]; p.hF = [p.hF[0] + w * 0.3, p.hF[1] + w];
    return [p, u];
  }
  function shadowbox(tl, per = 0.55) {
    const p = tl / per, k = p % 1, n = Math.floor(p);
    const amt = k < 0.4 ? Math.sin((k / 0.4) * Math.PI) : 0;
    return V.shift(V.lerpPose(V.breathe(PO.guard, tl, 1.4, 6), n % 3 === 2 ? PO.cross2 : PO.jab, amt), Math.sin(tl * 6) * 1.2, 0, true);
  }
  const chestOf = (f) => { const c = V.figPoint(f, 'C'); return [c[0] + 10 * (f.face || 1), c[1] + 70]; };

  // ─────────────────────────────── RULE I — THE WIN: a win is a test too
  V.actions.winRule = function (tl) {
    // Reactive: celebrates, head swells, sits back
    const big = 1 + 0.9 * ease.out(seg(tl, 1.4, 3.0));
    let rPose;
    if (tl < 1.0) rPose = V.breathe(PO.stand, tl, 1, 2.5);
    else if (tl < 3.4) rPose = V.shift(poseAt(tl, [[1.0, PO.stand], [1.25, PO.cheer]]), 0, -Math.abs(Math.sin(tl * 9)) * 3, true);
    else rPose = poseAt(tl, [[3.4, PO.cheer], [3.9, PO.sit]]);
    const reactive = V.R({ x: 310, pose: rPose, expr: tl < 0.9 ? 'neutral' : 'grin', headScale: big + Math.sin(tl * 7) * 0.03 * seg(tl, 1.4, 3) });

    // Steady: looks at it, sets it down, back to the rope
    let sPose, rope = null;
    if (tl < 1.6) sPose = V.breathe(PO.stand, tl, 1, 2.5);
    else if (tl < 2.3) sPose = poseAt(tl, [[1.6, PO.stand], [1.95, V.set(PO.pickLow, 'hF', [30, -8])], [2.3, PO.rope]]);
    else { const [p, u] = ropePose(2.3, tl); sPose = p; rope = u; }
    const steady = V.St({ pose: sPose, expr: 'neutral', headTilt: tl > 1.0 && tl < 1.6 ? 0.25 : 0 });

    return {
      figs: [reactive, steady],
      front(g) {
        if (tl < 2.4) V.confetti(g, tl, 90, 1000, 1 - seg(tl, 1.8, 2.4), 5);
        // medals drop onto both
        const drop = (1 - ease.out(seg(tl, 0.45, 0.8))) * -320;
        if (tl >= 0.45) {
          const rc = chestOf(reactive); V.medal(g, V.figPoint(reactive, 'neck'), [rc[0], rc[1] + drop]);
          if (tl < 1.95) { const sc = chestOf(steady); V.medal(g, V.figPoint(steady, 'neck'), [sc[0], sc[1] + drop]); }
        }
        if (tl >= 1.95) V.medalFlat(g, 520);
        if (rope !== null) V.jumpRope(g, V.figPoint(steady, 'hB'), V.figPoint(steady, 'hF'), rope, 800, V.FLOOR + 14);
        if (tl >= 0.15 && tl < 1.4) V.resultCard(g, 540, 700, 700, V.pop(tl - 0.15), 'WIN', '#0d0e12');
        if (tl >= 1.9 && tl < 3.6) say(g, { red: true, x: 400, y: 660, text: "I'm built different", scale: V.pop(tl - 1.9, 0.14) });
        if (tl >= 3.8) say(g, { red: true, x: 330, y: 760, text: 'skip training', scale: V.pop(tl - 3.8, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE II — THE LOSS: a loss is a step (or a place to sit)
  V.actions.lossRule = function (tl) {
    const dy = -900 * (1 - ease.in(seg(tl, 1.0, 1.25)));
    // Reactive: shocked -> sits on his L, face in hands, rain cloud
    const rPose = tl < 1.45 ? V.breathe(PO.stand, tl, 1, 2.5) : poseAt(tl, [[1.45, PO.stand], [1.9, PO.sitHigh]]);
    const reactive = V.R({ x: 300, pose: tl > 1.9 ? V.breathe(PO.sitHigh, tl, 1, 1.6) : rPose, expr: tl < 0.2 ? 'neutral' : tl < 1.5 ? 'fear' : 'shame' });
    // Steady: steps onto the foot of his L, then onto the top of it
    const sx = kf(tl, [[0, 880], [1.6, 880], [2.2, 800], [2.5, 800], [3.05, 676]], ease.inOut);
    const sh = kf(tl, [[0, 0], [1.6, 0], [2.2, 72], [2.5, 72], [3.05, 204]], ease.inOut);
    const stepping = (tl > 1.6 && tl < 2.2) || (tl > 2.5 && tl < 3.05);
    const steady = V.St({ x: sx, y: V.FLOOR - sh, pose: stepping ? PO.stepUp : V.breathe(PO.stand, tl, 1, 2.5), expr: tl < 0.2 ? 'neutral' : 'neutral' });

    return {
      figs: [reactive, steady],
      mid(g) {
        if (tl >= 1.0) {
          V.letterL(g, 150, 66, 262, 236, 88, dy);          // Reactive's L: a chair
          V.letterL(g, 640, 70, 204, 236, 72, dy);          // Steady's L: a step
        }
      },
      front(g) {
        if (tl >= 0.15 && tl < 1.25) V.resultCard(g, 540, 700, 700, V.pop(tl - 0.15), 'LOSS', V.COL.red);
        const h = headPt(reactive);
        if (tl > 2.2) V.rainCloud(g, h[0] - 10, h[1] - 190, tl, V.pop(tl - 2.2));
        if (tl >= 3.0) say(g, { red: true, x: 270, y: 700, text: 'not fair.', scale: V.pop(tl - 3.0, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE III — THEIR WIN: their win isn't your loss
  V.actions.envyRule = function (tl) {
    const THROW = 3.4;
    let rPose = V.breathe(PO.phone, tl, 1, 3), rPhone = true;
    if (tl >= THROW) { rPose = poseAt(tl, [[THROW, PO.phone], [THROW + 0.12, V.set(PO.shout, 'hF', [36, -60])], [THROW + 0.6, PO.slump]]); rPhone = false; }
    const reactive = V.R({ pose: rPose, expr: tl < 1.9 ? 'neutral' : tl < THROW ? 'angry' : 'shame', beam: 1 - 0.65 * seg(tl, 1.9, 3.0) });
    let sPose = V.breathe(PO.phone, tl, 1, 3);
    if (tl > 2.8) sPose = tl < 3.1 ? poseAt(tl, [[2.8, PO.phone], [3.1, PO.guard]]) : shadowbox(tl);
    const steady = V.St({ pose: sPose, expr: 'neutral' });

    return {
      figs: [reactive, steady],
      front(g) {
        const on = tl >= 0.3 ? 'on' : 'off';
        if (rPhone) { const rh = V.figPoint(reactive, 'hF'); V.phone(g, rh[0] + 4, rh[1] - 30, 0.18, 96, on); }
        else {
          const u = ease.in(seg(tl, THROW + 0.05, THROW + 0.22));
          const x = V.lerp(430, 470, u), y = V.lerp(1130, V.FLOOR - 14, u);
          if (u < 1) V.phone(g, x, y, 0.18 + u * 1.4, 96, 'on');
          else { g.save(); g.fillStyle = '#0d0e12'; g.strokeStyle = '#cfd2da'; g.lineWidth = 3; V.roundRect(g, 440, V.FLOOR - 16, 74, 14, 5); g.fill(); g.stroke(); g.restore(); }
        }
        if (tl < 2.8) { const sh = V.figPoint(steady, 'hF'); V.phone(g, sh[0] - 4, sh[1] - 30, -0.18, 96, on); }
        if (tl >= 2.0 && tl < 2.9) { const sh = V.figPoint(steady, 'hF'); const u = seg(tl, 2.0, 2.9); V.heart(g, sh[0] - 10, sh[1] - 90 - u * 130, 1.6 + u * 0.6, 1 - u * u); }
        if (tl >= 0.3 && tl < 1.85) V.notification(g, 540, 700, 760, V.pop(tl - 0.3), 'FEED', '@rival went pro.', false);
        if (tl >= 2.1 && tl < 3.8) say(g, { red: true, x: 300, y: 700, text: 'why not me?', scale: V.pop(tl - 2.1, 0.14) });
        if (tl >= 2.3 && tl < 3.9) say(g, { x: 760, y: 700, text: 'good for him.', scale: V.pop(tl - 2.3, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE IV — THE SCOREBOARD: don't ride it
  const RESULTS = ['W', 'L', 'W', 'L', 'L', 'W', 'L'];
  const T0 = 0.3, GAP = 0.62;
  function moodAt(t) { // underdamped spring chasing +1 (W) / -1 (L)
    let v = 0, vel = 0; const dt = 1 / 60;
    for (let s = 0; s < t; s += dt) {
      const i = Math.floor((s - T0) / GAP);
      const target = i < 0 ? 0 : RESULTS[Math.min(i, RESULTS.length - 1)] === 'W' ? 0.95 : -0.95;
      vel += (90 * (target - v) - 9 * vel) * dt; v += vel * dt;
    }
    return V.clamp(v, -1.15, 1.15);
  }
  V.actions.scoreboardRule = function (tl) {
    const v = moodAt(tl);
    const rPose = V.lerpPose(PO.slump, PO.cheer, V.clamp((v + 1) / 2));
    const reactive = V.R({ pose: V.shift(rPose, 0, v > 0.4 ? -Math.abs(Math.sin(tl * 10)) * 3 : 0, true), expr: v > 0.3 ? 'grin' : v < -0.3 ? 'shame' : 'neutral', headScale: 1 + Math.max(0, v) * 0.2 });
    const steady = V.St({ pose: shadowbox(tl), expr: 'neutral' });
    return {
      figs: [reactive, steady],
      front(g) {
        const N = Math.max(2, Math.floor(tl * 20));
        const rs = [], ss = [];
        for (let i = 0; i < N; i++) { const t = (i / 20); rs.push(moodAt(t) / 1.15); ss.push(Math.sin(t * 9) * 0.03); }
        rs.max = ss.max = 5 * 20;
        V.moodGraph(g, 320, 780, rs, V.COL.red);
        V.moodGraph(g, 700, 780, ss, '#f4f5f7');
        const i = Math.floor((tl - T0) / GAP);
        if (i >= 0 && i < RESULTS.length) V.chip(g, 540, 645, RESULTS[i], V.pop(tl - T0 - i * GAP, 0.14));
      },
    };
  };

  // ─────────────────────────────── RING — the rematch: celebrates early, gets caught
  V.actions.ringEgo = function (tl) {
    const JAB = 0.55, HIT = 2.25;
    let rPose, rExpr = 'angry';
    if (tl < 0.4) rPose = V.breathe(PO.fists, tl, 1.5, 9);
    else if (tl < 0.8) rPose = poseAt(tl, [[0.4, PO.guard], [JAB, PO.jab], [0.8, PO.guard]]);
    else if (tl < HIT) { rPose = V.shift(poseAt(tl, [[0.8, PO.guard], [1.05, PO.cheer]]), 0, -Math.abs(Math.sin(tl * 9)) * 3, true); rExpr = 'grin'; }
    else { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [3.2, PO.stumble], [3.7, PO.tired]]); rExpr = 'dizzy'; }
    const rx = kf(tl, [[0, 300], [JAB, 440], [1.2, 422], [HIT, 420], [HIT + 0.45, 300], [3.7, 290]], ease.out);
    const head = tl < HIT ? 1 + 0.35 * ease.out(seg(tl, 1.0, 1.8)) : 1.35 - 0.35 * ease.out(seg(tl, HIT, HIT + 0.5));
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, headScale: head });

    let sPose;
    if (tl < JAB) sPose = V.breathe(PO.guard, tl, 1.2, 6);
    else if (tl < 1.5) sPose = poseAt(tl, [[JAB, PO.guard], [JAB + 0.08, PO.flinch], [0.95, PO.flinch], [1.5, PO.guard]]);
    else sPose = poseAt(tl, [[1.5, PO.guard], [2.05, V.breathe(PO.guard, 2.05, 1.2, 6)], [HIT, V.set(PO.lunge, 'hF', [40, -104])], [2.45, V.set(PO.lunge, 'hF', [40, -104])], [2.9, PO.guard]]);
    const sx = kf(tl, [[0, 660], [JAB, 660], [0.75, 676], [1.6, 670], [2.05, 668], [HIT, 600], [2.45, 600], [3.0, 650]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: 'neutral', headTilt: tl > 1.2 && tl < 1.45 ? 0.18 : 0 });

    return {
      figs: [reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 16 : tl > JAB && tl < JAB + 0.1 ? 5 : 0,
      front(g) {
        const sh = headPt(steady);
        if (tl > JAB && tl < JAB + 0.25) { g.save(); g.translate(sh[0] + 20, sh[1]); g.scale(0.45, 0.45); V.impact(g, 0, 0, (tl - JAB) / 0.25); g.restore(); }
        if (tl >= 1.0 && tl < HIT) say(g, { red: true, x: 330, y: 680, text: 'too easy!', scale: V.pop(tl - 1.0, 0.14) });
        const h = headPt(reactive);
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
      },
    };
  };
})();
