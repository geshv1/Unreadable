/* Scene actions — OVERTHINKING. Each situation: shared moment (0–SH) → REACTIVE beat (RB–SB) → STEADY beat (SB–RULE)
   → rule (RULE–end). The side that isn't speaking dims (spotlight down + soft veil) so the eye always knows where to look.
   World coords; the episode zooms out to ≈0.74, so world x 80–1000 maps inside the safe box. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const SH = 1.1, RB = SH, SB = 5.3, RULE = 9.4;
  const say = (g, o) => V.darkBubble(g, Object.assign({ size: 58, font: `700 58px ${V.FONT.sans}` }, o));

  // ── shared helpers
  // spotlight intensity per side: the speaking side stays lit, the other drops to 0.3
  const focusAmt = (tl) => ({
    r: seg(tl, SB, SB + 0.35) - seg(tl, RULE, RULE + 0.35),   // 1 = Reactive side dimmed
    s: seg(tl, RB, RB + 0.35) - seg(tl, SB, SB + 0.35),       // 1 = Steady side dimmed
  });
  function veil(g, side, amt) {
    if (amt <= 0.01) return;
    g.save();
    const left = side === 'left';
    const gr = g.createLinearGradient(left ? 500 : 580, 0, left ? 620 : 460, 0);
    gr.addColorStop(0, `rgba(5,5,8,${(0.62 * amt).toFixed(3)})`); gr.addColorStop(1, 'rgba(5,5,8,0)');
    g.fillStyle = gr;
    if (left) g.fillRect(-700, -600, 1320, 3000); else g.fillRect(460, -600, 1400, 3000);
    g.restore();
  }
  const showWin = (tl, a, b, fi = 0.15, fo = 0.25) => V.clamp(Math.min((tl - a) / fi, (b - tl) / fo));
  function zees(g, x, y, tl, t0) {
    for (let i = 0; i < 3; i++) {
      const ph = (((tl - t0) * 0.55 + i / 3) % 1 + 1) % 1;
      g.save(); g.globalAlpha = Math.sin(Math.PI * ph) * 0.85 * V.clamp((tl - t0) / 0.4);
      g.fillStyle = '#d7dae2'; g.font = `italic 400 ${Math.round(52 + ph * 36)}px ${V.FONT.serif}`; g.textAlign = 'center';
      g.fillText('z', x + ph * 60 + i * 6, y - ph * 150); g.restore();
    }
  }
  const phoneGlowFace = (g, f, a = 1) => { const h = V.figPoint(f, 'H'); g.save(); g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(h[0], h[1], 4, h[0], h[1], 150); r.addColorStop(0, `rgba(140,180,255,${0.35 * a})`); r.addColorStop(1, 'rgba(140,180,255,0)'); g.fillStyle = r; g.fillRect(h[0] - 160, h[1] - 160, 320, 320); g.restore(); };

  // ─────────────────────────────── 1. THE TEXT — "ok."
  const TOP = V.FLOOR - 150;   // mattress top
  const lying = (o) => Object.assign({ y: TOP - 36, s: 0.76, noReflect: true }, o);
  V.actions.otText = function (tl) {
    const F = focusAmt(tl);
    const reactive = V.R(lying({ x: 490, rot: -Math.PI / 2, pose: V.shift(PO.lieScroll, 0, Math.sin(tl * 3) * 0.6), expr: tl < 0.5 ? 'neutral' : 'nervous', look: tl > RB ? Math.sin(tl * 1.7) * 0.6 : 0, beamX: 300, beam: 1 - 0.7 * F.r, beamW: 0.85 }));
    const down = seg(tl, SB + 1.1, SB + 1.5);                 // Steady puts the phone away and turns in
    const sPose = V.lerpPose(V.shift(PO.lieScroll, 0, Math.sin(tl * 2.2) * 0.4), V.shift(PO.lie, 0, -Math.sin(tl * 1.1) * 0.6), ease.inOut(down));
    const sExpr = tl > SB + 1.6 ? 'sleepy' : tl > SB + 0.3 ? 'smile' : 'neutral';
    const steady = V.St(lying({ x: 590, rot: Math.PI / 2, face: -1, pose: sPose, expr: sExpr, beamX: 800, beam: 1 - 0.7 * F.s, beamWarm: 0.55 * seg(tl, SB + 1.4, RULE), beamW: 0.85 }));
    const hours = 23.783 + 2.15 * ease.inOut(seg(tl, RB + 0.2, SB)) + 0.5 * seg(tl, SB, 11);
    return {
      figs: [reactive, steady],
      mid(g) {
        V.bed(g, 80, 530, TOP, true); V.pillow(g, 140, TOP - 4);
        V.bed(g, 560, 1000, TOP, false); V.pillow(g, 940, TOP - 4);
      },
      front(g) {
        V.bedBlanket(g, 270, 530, TOP, '#5a2730'); V.bedBlanket(g, 560, 830, TOP, '#3a3c46');
        const h = V.figPoint(reactive, 'hF'); V.phone(g, h[0] + 6, h[1] - 6, 0, 90, 'on'); phoneGlowFace(g, reactive, 1 + 0.3 * seg(tl, RB, SB));
        if (down < 0.5) { const hs = V.figPoint(steady, 'hF'); V.phone(g, hs[0] - 6, hs[1] - 6, 0, 90, 'on'); phoneGlowFace(g, steady, 1 - 2 * down); }
        else V.phone(g, 905, TOP - 12, Math.PI / 2, 74, 'down');
        V.wallClock(g, 540, 690, 62, hours);
        veil(g, 'left', F.r); veil(g, 'right', F.s);
        // the message
        const n = showWin(tl, 0.12, RB + 0.5);
        if (n > 0) { g.save(); g.globalAlpha = n; V.notification(g, 540, 930, 600, V.pop(tl - 0.12, 0.18), 'MESSAGES', 'ok.', false); g.restore(); }
        // Reactive's spiral (one thought at a time, max 3)
        [['is she mad?', RB + 0.35], ['what did I do?', RB + 1.35], ['call her??', RB + 2.45]].forEach(([text, t0], k) => {
          const a = showWin(tl, t0, SB + 0.2);
          if (a > 0) { g.save(); g.globalAlpha = a; say(g, { red: true, x: 330, y: 1060 - k * 100, text, scale: V.pop(tl - t0, 0.16) }); g.restore(); }
        });
        // Steady: one thought, then sleep
        const sa = showWin(tl, SB + 0.35, RULE + 0.2);
        if (sa > 0) { g.save(); g.globalAlpha = sa; say(g, { x: 740, y: 990, text: 'ok means ok.', scale: V.pop(tl - SB - 0.35, 0.16) }); g.restore(); }
        if (tl > SB + 1.7) zees(g, 950, 1150, tl, SB + 1.7);
      },
    };
  };

  // ─────────────────────────────── 2. THE COMEBACK — "nice shoes, bro."
  function curl(tl, ph = 0) { const u = (Math.sin(tl * 4.2 + ph) + 1) / 2; return V.lerpPose(PO.curlDown, PO.curlUp, ease.inOut(u)); }
  V.actions.otComeback = function (tl) {
    const F = focusAmt(tl);
    // the third figure: charcoal, light outline, no spotlight
    let xx, xFace = -1, xPose = V.breathe(PO.talkA, tl, 1, 3), xWalk = false;
    if (tl < RB) xx = 540;
    else if (tl < SB) { xx = kf(tl, [[RB, 540], [RB + 1.7, 1180]], ease.in); xFace = 1; xWalk = true; }
    else if (tl < SB + 0.55) { xx = kf(tl, [[SB, 1180], [SB + 0.55, 545]], ease.out); xFace = -1; xWalk = true; }
    else if (tl < SB + 2.5) { xx = 545; xFace = 1; xPose = tl < SB + 1.6 ? V.breathe(PO.talkA, tl, 1, 3) : poseAt(tl, [[SB + 1.6, PO.talkA], [SB + 1.9, PO.handsUp], [SB + 2.3, PO.stand]]); }
    else { xx = kf(tl, [[SB + 2.5, 545], [SB + 4.2, 1180]], ease.in); xFace = 1; xWalk = true; }
    if (xWalk) xPose = V.walkPose(tl * 9);
    const xExpr = tl > SB + 1.6 && tl < SB + 2.5 ? 'neutral' : 'sneer';
    const other = V.X({ x: xx, y: V.FLOOR - 26, s: 0.8, face: xFace, pose: xPose, expr: xExpr, depth: 'back', alpha: V.clamp((1060 - xx) / 140) });

    // Reactive: freeze + fake laugh, then the replay two hours later
    let rPose, rExpr = 'neutral';
    if (tl < RB) rPose = V.breathe(PO.stand, tl, 1, 3);
    else if (tl < RB + 1.6) { rPose = poseAt(tl, [[RB, PO.stand], [RB + 0.3, PO.flinch], [RB + 0.8, V.set(PO.clapOpen, 'hd', [2, 1])], [RB + 1.6, PO.clapOpen]]); rExpr = tl < RB + 0.35 ? 'shock' : 'nervous'; }
    else if (tl < SB) { const k = Math.floor((tl - RB - 1.6) / 0.38), u = ((tl - RB - 1.6) / 0.38) % 1; rPose = V.lerpPose(k % 2 ? PO.wild2 : PO.wild, k % 2 ? PO.wild : PO.wild2, ease.inOut(u)); rExpr = 'shout'; }
    else rPose = poseAt(tl, [[SB, PO.wild], [SB + 0.5, PO.slump]]), rExpr = 'shame';
    const reactive = V.R({ x: 300, pose: rPose, expr: rExpr, mouth: Math.abs(Math.sin(tl * 9)), beam: 1 - 0.7 * F.r });
    const ghost = tl > RB + 1.6 && tl < SB ? V.X({ x: 545, face: -1, s: 0.84, y: V.FLOOR - 26, pose: V.breathe(PO.stand, tl, 1, 3), alpha: 0.22 * V.clamp((tl - RB - 1.6) / 0.3), noReflect: true }) : null;

    // Steady: quiet curls; one calm line when it's said to him
    let sPose = curl(tl), sExpr = 'focus';
    if (tl > SB + 0.4 && tl < SB + 2.6) { sPose = poseAt(tl, [[SB + 0.4, curl(SB + 0.4)], [SB + 0.8, PO.stand], [SB + 2.2, PO.stand], [SB + 2.6, curl(SB + 2.6)]]); sExpr = tl > SB + 1.3 ? 'smile' : 'neutral'; }
    const steady = V.St({ x: 765, pose: sPose, expr: sExpr, beam: 1 - 0.7 * F.s });
    return {
      figs: [other, ...(ghost ? [ghost] : []), reactive, steady],
      front(g) {
        V.dumbbell(g, V.figPoint(steady, 'hF'), 0);
        veil(g, 'left', F.r); veil(g, 'right', F.s);
        const a1 = showWin(tl, 0.15, RB + 0.15);
        if (a1 > 0) { g.save(); g.globalAlpha = a1; say(g, { x: 540, y: 790, text: 'nice shoes, bro.', scale: V.pop(tl - 0.15, 0.16) }); g.restore(); }
        const a2 = showWin(tl, RB + 0.45, RB + 1.55);
        if (a2 > 0) { g.save(); g.globalAlpha = a2; say(g, { red: true, x: 330, y: 850, text: 'haha… thanks?', scale: V.pop(tl - RB - 0.45, 0.16) }); g.restore(); }
        const a3 = showWin(tl, RB + 1.75, SB + 0.1);
        if (a3 > 0) { g.save(); g.globalAlpha = a3; V.jagged(g, 330, 735, 190, 96, 'I SHOULD’VE\nSAID…', { size: 46, seed: 8, scale: V.pop(tl - RB - 1.75, 0.16), shake: 6 }); g.restore(); }
        const a4 = showWin(tl, SB + 0.55, SB + 1.5);
        if (a4 > 0) { g.save(); g.globalAlpha = a4; say(g, { x: 540, y: 790, text: 'nice shoes, bro.', scale: V.pop(tl - SB - 0.55, 0.16) }); g.restore(); }
        const a5 = showWin(tl, SB + 1.4, RULE + 0.4);
        if (a5 > 0) { g.save(); g.globalAlpha = a5; say(g, { x: 760, y: 820, text: 'thanks. comfy.', scale: V.pop(tl - SB - 1.4, 0.16) }); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── 3. THE START — 47 tabs vs one messy rep
  const BAR_Y = 797, BX = 760;
  const HANG = { C: [0, -91], P: [-1, -56], hB: [-8, -131], hF: [6, -131], fB: [-5, -9], fF: [5, -5], hd: [0, -1], kB: [1, 0.2], kF: [1, 0.2], eB: [-1, 0.2], eF: [1, 0.2] };
  const PULL = { C: [0, -91], P: [-1, -57], hB: [-8, -100], hF: [6, -100], fB: [-3, -15], fF: [7, -11], hd: [0, -2], kB: [1, 0.2], kF: [1, 0.2], eB: [-1, 0.25], eF: [1, 0.25] };
  // a rep from `a` (hanging) to the top and back; returns {pose, y}; messy = pauses + wobble on the way up
  function rep(tl, a, up, hold, downD, messy) {
    let u;
    if (tl < a + up) { u = (tl - a) / up; if (messy) u = u < 0.45 ? ease.out(u / 0.45) * 0.55 : u < 0.6 ? 0.55 - 0.05 * Math.sin((u - 0.45) / 0.15 * Math.PI) : 0.55 + 0.45 * ease.inOut((u - 0.6) / 0.4); else u = ease.inOut(u); }
    else if (tl < a + up + hold) u = 1;
    else u = 1 - ease.inOut(V.clamp((tl - a - up - hold) / downD));
    return { pose: V.lerpPose(HANG, PULL, u), y: V.lerp(BAR_Y + 563, BAR_Y + 430, u), u };
  }
  function trees(g) {
    g.save(); g.strokeStyle = '#c9cbd3'; g.lineCap = 'round';
    for (const x of [BX - 135, BX + 135]) {
      g.lineWidth = 14; g.beginPath(); g.moveTo(x, V.FLOOR - 2); g.lineTo(x + (x < BX ? -6 : 6), BAR_Y - 120); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(x, BAR_Y - 40); g.lineTo(x + (x < BX ? -60 : 60), BAR_Y - 140); g.stroke();
      const cx = x + (x < BX ? -24 : 24);
      for (const [dx, dy, r] of [[-52, -170, 62], [44, -178, 66], [-4, -232, 72]]) { g.beginPath(); g.arc(cx + dx, BAR_Y + dy, r, 0, 6.283); g.fillStyle = '#1b1c23'; g.fill(); g.lineWidth = 5; g.stroke(); }
      g.fillStyle = '#1b1c23'; g.beginPath(); g.arc(cx - 4, BAR_Y - 190, 58, 0, 6.283); g.fill();
    }
    g.strokeStyle = '#16171c'; g.lineWidth = 15; g.beginPath(); g.moveTo(BX - 140, BAR_Y); g.lineTo(BX + 140, BAR_Y); g.stroke();
    g.strokeStyle = '#d5d7dd'; g.lineWidth = 9; g.beginPath(); g.moveTo(BX - 140, BAR_Y); g.lineTo(BX + 140, BAR_Y); g.stroke();
    g.restore();
  }
  function calendar(g, x, y, week, k) {
    g.save(); g.translate(x, y); g.scale(k * 0.84, k * 0.84);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 24;
    g.fillStyle = '#f4f5f7'; V.roundRect(g, -100, -90, 200, 190, 18); g.fill(); g.shadowBlur = 0;
    g.fillStyle = V.COL.red; V.roundRect(g, -100, -90, 200, 56, 18); g.fill(); g.fillRect(-100, -60, 200, 26);
    g.fillStyle = '#fff'; g.font = `800 36px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '6px'; g.fillText('MON', 4, -62); g.letterSpacing = '0px';
    g.fillStyle = '#16171c'; g.font = `800 40px ${V.FONT.sans}`; g.fillText('WEEK', 0, 0);
    g.font = `800 64px ${V.FONT.sans}`; g.fillText(String(week), 0, 58);
    g.restore();
  }
  V.actions.otStart = function (tl) {
    const F = focusAmt(tl);
    const typing = V.set(PO.type, 'hF', [36 + Math.sin(tl * 40) * 1.5, -60 + Math.abs(Math.sin(tl * 33)) * 2]);
    const rPose = tl < RB ? V.breathe(PO.stand, tl, 1, 3) : tl < RB + 0.35 ? V.lerpPose(PO.stand, typing, ease.inOut((tl - RB) / 0.35)) : typing;
    const rExpr = tl < RB ? 'neutral' : tl < SB ? (Math.sin(tl * 2.3) > 0.6 ? 'fear' : 'nervous') : 'nervous';
    const reactive = V.R({ x: 330, face: -1, pose: rPose, expr: rExpr, beam: 1 - 0.7 * F.r });
    // Steady: stands under the bar, then one slow, messy first rep; later a cleaner one
    let sPose = V.breathe(PO.stand, tl, 1, 3), sy = V.FLOOR, sExpr = 'neutral', wob = 0, look = -0.3;
    const J = SB + 0.6;
    if (tl >= SB && tl < J) { sPose = poseAt(tl, [[SB, PO.stand], [SB + 0.35, PO.squat], [J, PO.armsUp]]); sExpr = 'focus'; }
    else if (tl >= J && tl < J + 0.2) { const u = ease.out((tl - J) / 0.2); sPose = V.lerpPose(PO.armsUp, HANG, u); sy = V.lerp(V.FLOOR, BAR_Y + 563, u); sExpr = 'focus'; }
    else if (tl >= J + 0.2 && tl < J + 2.3) { const r = rep(tl, J + 0.35, 1.45, 0.25, 0.25, true); sPose = r.pose; sy = r.y; sExpr = r.u > 0.3 ? 'strain' : 'focus'; wob = Math.sin(tl * 7) * 0.05 * (1 - r.u * 0.5); }
    else if (tl >= J + 2.3 && tl < J + 2.55) { const u = ease.in((tl - J - 2.3) / 0.25); sPose = V.lerpPose(HANG, PO.squat, u); sy = V.lerp(BAR_Y + 563, V.FLOOR, u); sExpr = 'pant'; }
    else if (tl >= J + 2.55 && tl < RULE) { sPose = poseAt(tl, [[J + 2.55, PO.squat], [J + 2.9, PO.stand], [J + 3.1, PO.fists], [RULE, PO.fists]]); sExpr = 'smile'; look = 0; }
    else if (tl >= RULE) { // cleaner rep in the rule beat
      const a = RULE + 0.1;
      if (tl < a + 0.2) { const u = ease.out((tl - a) / 0.2); sPose = V.lerpPose(PO.fists, HANG, V.clamp(u)); sy = V.lerp(V.FLOOR, BAR_Y + 563, V.clamp(u)); }
      else { const r = rep(tl, a + 0.25, 0.55, 0.15, 0.45, false); sPose = r.pose; sy = r.y; }
      sExpr = 'focus';
    }
    const steady = V.St({ x: BX, y: sy, face: -1, pose: sPose, expr: sExpr, look, rot: wob, beam: 1 - 0.7 * F.s, beamX: BX, beamWarm: 0.5 * seg(tl, J + 2.5, RULE) });
    const week = 1 + Math.min(5, Math.floor(Math.max(0, tl - RB - 0.3) / 0.62));
    return {
      figs: [reactive, steady],
      mid(g) {
        trees(g);
        const top = V.desk(g, 175, true, 0.8 + 0.2 * Math.sin(tl * 3));
        if (tl < RB + 0.2) V.phone(g, 230, top - 12, Math.PI / 2, 70, 'down');
      },
      front(g) {
        veil(g, 'left', F.r); veil(g, 'right', F.s);
        if (tl > 0.1) calendar(g, 515, 965, tl < RB ? 1 : week, V.pop(tl - 0.1, 0.18) * (1 + 0.06 * Math.max(0, 1 - ((tl - RB - 0.3) % 0.62) / 0.15) * (tl > RB + 0.3 && tl < SB ? 1 : 0)));
        [['best program?', RB + 0.35], ['what if I fail?', RB + 1.6]].forEach(([text, t0], k) => {
          const a = showWin(tl, t0, SB + 0.2);
          if (a > 0) { g.save(); g.globalAlpha = a; say(g, { red: true, x: 400, y: 760 - k * 100, text, scale: V.pop(tl - t0, 0.16) }); g.restore(); }
        });
        const a = showWin(tl, J + 2.4, RULE + 0.3);
        if (a > 0) { g.save(); g.globalAlpha = a; say(g, { x: BX, y: 640, text: 'one rep.', scale: V.pop(tl - J - 2.4, 0.16) }); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── PAYOFF — square up again, gloves touch
  V.actions.otPayoff = function (tl, sc) {
    const st = V.actions.squareUp(tl, sc);
    const k = Math.sin(seg(tl, 0.0, 0.7) * Math.PI);
    st.figs.forEach((f) => { f.pose = V.lerpPose(f.pose, V.set(PO.jab, 'hF', [41, -98]), k * 0.95); });
    st.figs[0].expr = tl < 0.8 ? 'neutral' : 'focus';
    st.figs[1].expr = 'focus';
    return st;
  };
})();
