/* Scene actions for Pt. 4 "Different ego." — wins and losses (v2: tighter timing, more expressions & objects).
   World coordinates (zoom 0.82 applied by the player): safe box ≈ world x 77–1015, props above heads at y ≥ 600. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const say = (g, o) => V.darkBubble(g, o);

  function ropePose(t0, tl) {
    const per = 0.44, u = (((tl - t0) / per) % 1 + 1) % 1;
    const lift = Math.max(0, Math.sin(u * Math.PI * 2 - Math.PI)) * 6;
    const p = V.shift(PO.rope, 0, -lift, true);
    const w = Math.sin(u * Math.PI * 2) * 2.5;
    p.hB = [p.hB[0] - w * 0.3, p.hB[1] + w]; p.hF = [p.hF[0] + w * 0.3, p.hF[1] + w];
    return [p, u];
  }
  function shadowbox(tl, per = 0.5) {
    const p = tl / per, k = p % 1, n = Math.floor(p);
    const amt = k < 0.4 ? Math.sin((k / 0.4) * Math.PI) : 0;
    return V.shift(V.lerpPose(V.breathe(PO.guard, tl, 1.4, 6), n % 3 === 2 ? PO.cross2 : PO.jab, amt), Math.sin(tl * 6) * 1.2, 0, true);
  }
  const chestOf = (f) => { const c = V.figPoint(f, 'C'); return [c[0] + 10 * (f.face || 1), c[1] + 70]; };
  const bounce = (p, tl, a = 3, hz = 9) => V.shift(p, 0, -Math.abs(Math.sin(tl * hz)) * a, true);

  // ─────────────────────────────── RULE I — THE WIN (4.2s)
  V.actions.winRule = function (tl) {
    // Reactive: shock -> laughing cheer -> kisses the gold -> head swells -> selfie with flashes -> rest day
    let rPose, rExpr;
    if (tl < 0.5) { rPose = PO.stand; rExpr = tl < 0.15 ? 'neutral' : 'shock'; }
    else if (tl < 1.3) { rPose = bounce(poseAt(tl, [[0.5, PO.stand], [0.7, PO.cheer]]), tl); rExpr = 'laugh'; }
    else if (tl < 1.9) { rPose = poseAt(tl, [[1.3, PO.cheer], [1.5, PO.kissMedal]]); rExpr = 'proud'; }
    else if (tl < 3.25) { rPose = poseAt(tl, [[1.9, PO.kissMedal], [2.1, PO.selfie]]); rExpr = 'proud'; }
    else { rPose = poseAt(tl, [[3.25, PO.selfie], [3.6, PO.sit]]); rExpr = 'proud'; }
    const big = 1 + 0.8 * ease.out(seg(tl, 1.4, 2.6));
    const reactive = V.R({ x: 310, pose: rPose, expr: rExpr, headScale: big + Math.sin(tl * 8) * 0.03 * seg(tl, 1.4, 2.6) });

    // Steady: a small smile, a humble bow, gold goes in the bag, back to the rope
    let sPose, rope = null, sFace = -1, sExpr = 'neutral';
    if (tl < 0.9) { sPose = V.breathe(PO.stand, tl, 1, 2.5); sExpr = tl > 0.4 ? 'smile' : 'neutral'; }
    else if (tl < 1.45) { sPose = poseAt(tl, [[0.9, PO.stand], [1.1, PO.bow], [1.45, PO.stand]]); sExpr = 'smile'; }
    else if (tl < 2.25) { sFace = 1; sPose = poseAt(tl, [[1.45, PO.stand], [1.8, V.set(PO.pickLow, 'hF', [36, -16])], [2.25, PO.stand]]); }
    else if (tl < 2.5) { sPose = poseAt(tl, [[2.25, PO.stand], [2.5, PO.rope]]); sExpr = 'focus'; }
    else { const [p, u] = ropePose(2.5, tl); sPose = p; rope = u; sExpr = 'focus'; }
    const steady = V.St({ pose: sPose, face: sFace, expr: sExpr });

    return {
      figs: [reactive, steady],
      mid(g) { V.gymBag(g, 885, seg(tl, 1.6, 1.9) - seg(tl, 2.1, 2.4)); },
      front(g) {
        if (tl < 1.7) V.confetti(g, tl, 90, 1000, 1 - seg(tl, 1.2, 1.7), 5);
        const drop = (1 - ease.out(seg(tl, 0.3, 0.6))) * -320;
        if (tl >= 0.3) {
          const rc = chestOf(reactive);
          const kiss = tl > 1.4 && tl < 2.0 ? V.figPoint(reactive, 'hF') : null;
          V.medal(g, V.figPoint(reactive, 'neck'), kiss ? [kiss[0] + 6, kiss[1] + 10] : [rc[0], rc[1] + drop]);
          if (tl < 1.7) { const sc = chestOf(steady); V.medal(g, V.figPoint(steady, 'neck'), [sc[0], sc[1] + drop]); }
          else if (tl < 2.05) { const h = V.figPoint(steady, 'hF'); V.medal(g, [h[0], h[1] - 70], [h[0], h[1] + 10], 0.9); }
        }
        if (tl > 2.1 && tl < 3.3) { const h = V.figPoint(reactive, 'hF'); V.phone(g, h[0] + 6, h[1] - 34, -0.2, 96, 'on');
          for (const f0 of [2.25, 2.55, 2.85]) V.flash(g, h[0] + 8, h[1] - 40, (tl - f0) / 0.25, 0.9); }
        if (rope !== null) V.jumpRope(g, V.figPoint(steady, 'hB'), V.figPoint(steady, 'hF'), rope, 800, V.FLOOR + 14);
        if (tl >= 0.1 && tl < 1.05) V.resultCard(g, 540, 700, 700, V.pop(tl - 0.1), 'WIN', '#0d0e12');
        if (tl >= 1.8 && tl < 3.3) say(g, { red: true, x: 400, y: 640, text: "I'm built different", scale: V.pop(tl - 1.8, 0.14) });
        if (tl >= 3.35) say(g, { red: true, x: 330, y: 760, text: 'rest day.', scale: V.pop(tl - 3.35, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE II — THE LOSS (4.2s): a loss is a step (or a place to sit)
  V.actions.lossRule = function (tl) {
    const dy = -900 * (1 - ease.in(seg(tl, 0.7, 0.95)));
    let rPose, rExpr;
    if (tl < 0.5) { rPose = PO.stand; rExpr = tl < 0.12 ? 'neutral' : 'shock'; }
    else if (tl < 1.9) { rPose = poseAt(tl, [[0.5, PO.stand], [0.62, PO.kneel]]); rExpr = 'tearful'; }
    else { rPose = poseAt(tl, [[1.9, PO.kneel], [2.3, PO.sitHigh]]); rExpr = 'tearful'; }
    const reactive = V.R({ x: 300, pose: tl > 2.3 ? V.breathe(PO.sitHigh, tl, 1, 1.6) : rPose, expr: rExpr });
    const sx = kf(tl, [[0, 880], [1.05, 880], [1.55, 800], [1.75, 800], [2.25, 676]], ease.inOut);
    const sh = kf(tl, [[0, 0], [1.05, 0], [1.55, 72], [1.75, 72], [2.25, 204]], ease.inOut);
    const stepping = (tl > 1.05 && tl < 1.55) || (tl > 1.75 && tl < 2.25);
    let sPose = stepping ? PO.stepUp : tl > 2.5 ? V.breathe(PO.cross, tl, 0.8, 2) : V.breathe(PO.stand, tl, 1, 2.5);
    const steady = V.St({ x: sx, y: V.FLOOR - sh, pose: sPose, expr: tl < 0.12 ? 'neutral' : tl < 0.6 ? 'shock' : 'focus' });
    return {
      figs: [reactive, steady],
      mid(g) {
        if (tl >= 0.7) { V.letterL(g, 150, 66, 262, 236, 88, dy); V.letterL(g, 640, 70, 204, 236, 72, dy); }
      },
      front(g) {
        if (tl >= 0.1 && tl < 0.95) V.resultCard(g, 540, 700, 700, V.pop(tl - 0.1), 'LOSS', V.COL.red);
        const h = headPt(reactive);
        if (tl > 2.4) V.rainCloud(g, h[0] - 10, h[1] - 190, tl, V.pop(tl - 2.4));
        if (tl >= 2.8) say(g, { red: true, x: 270, y: 700, text: 'not fair.', scale: V.pop(tl - 2.8, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE III — THEIR WIN (4.0s)
  V.actions.envyRule = function (tl) {
    const THROW = 2.62;
    let rPose = V.breathe(PO.phone, tl, 1, 3), rPhone = true, rExpr = tl < 1.25 ? 'neutral' : 'jealous';
    if (tl >= THROW) { rPose = poseAt(tl, [[THROW, PO.throwBack], [THROW + 0.16, PO.throwFwd], [3.15, PO.throwFwd], [3.45, PO.facepalm]]); rPhone = false; rExpr = tl < 3.3 ? 'angry' : 'shame'; }
    else if (tl > 2.45) rPose = poseAt(tl, [[2.45, PO.phone], [THROW, PO.throwBack]]);
    const reactive = V.R({ pose: rPose, expr: rExpr, beam: 1 - 0.6 * seg(tl, 1.25, 2.4) });
    let sPose = V.breathe(PO.phone, tl, 1, 3), sExpr = tl < 1.25 ? 'neutral' : 'smile', bell = false;
    if (tl > 2.05 && tl < 2.85) { const k = ((tl - 2.05) / 0.2) % 1; sPose = V.lerpPose(PO.clapOpen, PO.clap, Math.sin(k * Math.PI)); }
    else if (tl >= 2.85) { const k = ((tl - 2.85) / 0.6) % 1; sPose = V.lerpPose(PO.curlDown, PO.curlUp, Math.sin(k * Math.PI)); sExpr = 'focus'; bell = true; }
    const steady = V.St({ pose: sPose, expr: sExpr });
    return {
      figs: [reactive, steady],
      front(g) {
        const on = tl >= 0.2 ? 'on' : 'off';
        if (rPhone) { const rh = V.figPoint(reactive, 'hF'); V.phone(g, rh[0] + 4, rh[1] - 30, 0.18, 96, on); }
        else {
          const u = ease.in(seg(tl, THROW + 0.12, THROW + 0.32));
          if (u < 1) { const h = V.figPoint(reactive, 'hF'); V.phone(g, V.lerp(h[0], 470, u), V.lerp(h[1], V.FLOOR - 14, u), 0.18 + u * 2.4, 96, 'on'); }
          else V.crackedPhone(g, 470);
        }
        if (tl < 2.05) { const sh = V.figPoint(steady, 'hF'); V.phone(g, sh[0] - 4, sh[1] - 30, -0.18, 96, on); }
        if (bell) V.dumbbell(g, V.figPoint(steady, 'hF'), 0.15);
        if (tl > 2.05 && tl < 2.85) { const h = V.figPoint(steady, 'hF'); V.clapMarks(g, h[0], h[1] - 20, ((tl - 2.05) / 0.2) % 1); }
        if (tl >= 1.35 && tl < 2.1) { const sh = V.figPoint(steady, 'hF'); const u = seg(tl, 1.35, 2.1); V.heart(g, sh[0] - 10, sh[1] - 90 - u * 130, 1.6 + u * 0.6, 1 - u * u); }
        if (tl >= 0.2 && tl < 1.25) V.notification(g, 540, 700, 760, V.pop(tl - 0.2), 'FEED', '@rival went pro.', false);
        if (tl >= 1.4 && tl < 2.7) say(g, { red: true, x: 300, y: 700, text: 'why not me?', scale: V.pop(tl - 1.4, 0.14) });
        if (tl >= 1.55 && tl < 2.9) say(g, { x: 760, y: 700, text: 'good for him.', scale: V.pop(tl - 1.55, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE IV — THE SCOREBOARD (4.0s)
  const RESULTS = ['W', 'L', 'W', 'L', 'L', 'W', 'L'];
  const T0 = 0.2, GAP = 0.5;
  function moodAt(t) {
    let v = 0, vel = 0; const dt = 1 / 60;
    for (let s = 0; s < t; s += dt) {
      const i = Math.floor((s - T0) / GAP);
      const target = i < 0 ? 0 : RESULTS[Math.min(i, RESULTS.length - 1)] === 'W' ? 0.95 : -0.95;
      vel += (130 * (target - v) - 11 * vel) * dt; v += vel * dt;
    }
    return V.clamp(v, -1.15, 1.15);
  }
  V.actions.scoreboardRule = function (tl) {
    const v = moodAt(tl);
    const i = Math.floor((tl - T0) / GAP);
    let rPose, rExpr;
    if (v > 0.3) { rPose = V.shift(V.lerpPose(PO.stand, PO.cheer, V.clamp(v)), 0, -Math.abs(Math.sin(tl * 10)) * 3, true); rExpr = 'laugh'; }
    else if (v < -0.3) { rPose = V.lerpPose(PO.stand, i % 2 ? PO.facepalm : PO.slump, V.clamp(-v)); rExpr = i % 2 ? 'shame' : 'tearful'; }
    else { rPose = PO.stand; rExpr = 'neutral'; }
    const reactive = V.R({ pose: rPose, expr: rExpr, headScale: 1 + Math.max(0, v) * 0.2 });
    const steady = V.St({ pose: shadowbox(tl), expr: 'focus' });
    return {
      figs: [reactive, steady],
      front(g) {
        const N = Math.max(2, Math.floor(tl * 20));
        const rs = [], ss = [];
        for (let k = 0; k < N; k++) { const t = k / 20; rs.push(moodAt(t) / 1.15); ss.push(Math.sin(t * 9) * 0.03); }
        rs.max = ss.max = 4 * 20;
        V.moodGraph(g, 320, 780, rs, V.COL.red);
        V.moodGraph(g, 700, 780, ss, '#f4f5f7');
        if (i >= 0 && i < RESULTS.length) V.chip(g, 540, 645, RESULTS[i], V.pop(tl - T0 - i * GAP, 0.12));
      },
    };
  };

  // ─────────────────────────────── RING — the rematch (3.3s)
  V.actions.ringEgo = function (tl) {
    const JAB = 0.45, HIT = 1.95;
    let rPose, rExpr = 'angry';
    if (tl < 0.32) rPose = V.breathe(PO.fists, tl, 1.5, 9);
    else if (tl < 0.7) rPose = poseAt(tl, [[0.32, PO.guard], [JAB, PO.jab], [0.7, PO.guard]]);
    else if (tl < HIT) { rPose = bounce(poseAt(tl, [[0.7, PO.guard], [0.92, PO.cheer]]), tl); rExpr = tl < 1.3 ? 'laugh' : 'proud'; }
    else { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [2.9, PO.stumble], [3.3, PO.tired]]); rExpr = 'dizzy'; }
    const rx = kf(tl, [[0, 300], [JAB, 440], [1.1, 422], [HIT, 420], [HIT + 0.4, 300], [3.3, 290]], ease.out);
    const head = tl < HIT ? 1 + 0.35 * ease.out(seg(tl, 0.9, 1.6)) : 1.35 - 0.35 * ease.out(seg(tl, HIT, HIT + 0.45));
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, headScale: head });
    let sPose;
    if (tl < JAB) sPose = V.breathe(PO.guard, tl, 1.2, 6);
    else if (tl < 1.3) sPose = poseAt(tl, [[JAB, PO.guard], [JAB + 0.08, PO.flinch], [0.85, PO.flinch], [1.3, PO.guard]]);
    else sPose = poseAt(tl, [[1.3, PO.guard], [1.78, V.breathe(PO.guard, 1.78, 1.2, 6)], [HIT, V.set(PO.lunge, 'hF', [40, -104])], [2.15, V.set(PO.lunge, 'hF', [40, -104])], [2.6, PO.guard]]);
    const sx = kf(tl, [[0, 660], [JAB, 660], [0.65, 676], [1.4, 670], [1.78, 668], [HIT, 600], [2.15, 600], [2.7, 650]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: tl > JAB && tl < 0.9 ? 'strain' : 'focus', headTilt: tl > 1.05 && tl < 1.25 ? 0.18 : 0 });
    return {
      figs: [reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 16 : tl > JAB && tl < JAB + 0.1 ? 5 : 0,
      front(g) {
        const sh = headPt(steady);
        if (tl > JAB && tl < JAB + 0.25) { g.save(); g.translate(sh[0] + 20, sh[1]); g.scale(0.45, 0.45); V.impact(g, 0, 0, (tl - JAB) / 0.25); g.restore(); }
        if (tl >= 0.85 && tl < HIT) say(g, { red: true, x: 330, y: 680, text: 'too easy!', scale: V.pop(tl - 0.85, 0.14) });
        const h = headPt(reactive);
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
      },
    };
  };
})();
