/* Scene actions for Pt. 8 "underperforming" (narrated, second person).
   red-cap stickman = the you who holds back ('reactive' rig), white = the you who goes anyway ('steady' rig).
   World coordinates; cam.y = 207 keeps everything inside the cinema panel (visible world ≈ y 558–1522). */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const C = (o) => V.X(Object.assign({ kind: 'crowd', pose: PO.stand }, o));
  const voice = (g, o) => V.bubble(g, Object.assign({ fill: '#15161c', color: '#C9CBD3', stroke: '#8d909a', size: 50, font: `italic 600 50px ${V.FONT.sans}` }, o));
  const ME = (o) => V.R(Object.assign({ x: 540, face: 1 }, o));      // the you who holds back
  const GO = (o) => V.St(Object.assign({ x: 540, face: -1 }, o));    // the you who goes anyway
  const room = (g, col) => { g.fillStyle = col; g.fillRect(-300, 500, 1700, V.FLOOR - 500); };
  const JUDGES = [[110, 1], [255, 1], [825, -1], [970, -1]];
  const judges = (tl, raiseAt, k = 0.7) => JUDGES.map(([x, face], i) => C({ depth: 'back', x, y: 1300, s: k, face,
    pose: V.lerpPose(V.breathe(PO.stand, tl, 1, 2, i), PO.cardUp, ease.out(seg(tl, raiseAt + i * 0.15, raiseAt + i * 0.15 + 0.25))) }));

  // ─────────────────────────────── HOOK — you, a spotlight, judges with score cards
  V.actions.u_hook = function (tl) {
    const js = judges(tl, 2.4);
    const me = ME({ pose: V.breathe(PO.stand, tl, 1.2, 2.2), expr: tl > 2.2 ? 'fear' : 'neutral', headTilt: Math.sin(tl * 1.4) * 0.08 });
    return {
      figs: [...js, me],
      back(g) { V.eyes(g, tl * 1.6, 34, -160, 1240, 620, 1120, 4, 0.8 * seg(tl, 0, 0.8)); },
      front(g) { js.forEach((f, i) => { const at = 2.4 + i * 0.15; if (tl > at + 0.15) V.scoreCard(g, V.figPoint(f, 'hF'), ['4', '3', '5', '4'][i], V.pop(tl - at - 0.15, 0.14)); }); },
    };
  };

  // ─────────────────────────────── YOUR BEST — not enough
  V.actions.u_best = function (tl) {
    const lift = ease.inOut(seg(tl, 0.4, 2.4));
    const pose = tl < 0.4 ? PO.liftLow : V.lerpPose(PO.liftLow, PO.liftKnee, lift);
    const me = ME({ x: 470, pose: V.shift(pose, Math.sin(tl * 38) * 0.6 * seg(tl, 0.6, 3.6), 0), expr: 'strain' });
    return {
      figs: [me],
      back(g) { room(g, '#120d12'); },
      front(g) {
        V.barbell(g, V.figPoint(me, 'hF'), seg(tl, 1.0, 3.6), tl);
        V.labelMeter(g, 690, 820, 300, 'YOUR BEST', 0.62 * ease.out(seg(tl, 0.3, 2.6)), V.COL.red, 0.86, 'ENOUGH');
      },
    };
  };

  // ─────────────────────────────── SO YOU DON'T TRY — bar down, a wall of plans
  const NOTES = [['GYM', 190, 715, -0.06], ['YOUTUBE', 380, 690, 0.05], ['BUSINESS', 590, 722, -0.03], ['BOOK', 790, 700, 0.07]];
  V.actions.u_noTry = function (tl) {
    let pose, x = 470, face = 1;
    if (tl < 0.32) pose = poseAt(tl, [[0, PO.liftKnee], [0.32, PO.liftLow]]);
    else if (tl < 0.6) pose = poseAt(tl, [[0.32, PO.liftLow], [0.6, PO.stand]]);
    else if (tl < 1.5) { face = -1; x = kf(tl, [[0.6, 470], [1.5, 300]], ease.inOut); pose = V.walkPose(tl * 6); }
    else { face = 1; x = 300; pose = poseAt(tl, [[1.5, PO.stand], [1.9, PO.sit]]); }
    const me = ME({ x, face, pose, expr: 'shame' });
    const barAt = tl < 0.32 ? V.figPoint(me, 'hF') : [560, V.FLOOR - 58];
    return {
      figs: [me],
      back(g) { room(g, '#16131c'); },
      front(g) {
        V.barbell(g, barAt, 0, tl);
        NOTES.forEach(([w, nx, ny, r], i) => { const at = 0.8 + i * 0.25; if (tl >= at) V.sticky(g, nx, ny, w, r, 1.2 * V.pop(tl - at, 0.14)); });
        V.counterPanel(g, 860, 1010, 'STARTED', 0);
      },
    };
  };

  // ─────────────────────────────── IF YOU NEVER START — the POST button
  V.actions.u_post = function (tl) {
    const closing = ease.in(seg(tl, 1.8, 2.15));
    const pose = tl < 1.8 ? V.set(PO.type, 'hF', [36, -60 + Math.sin(tl * 7) * 1.2]) : poseAt(tl, [[1.8, PO.type], [2.1, PO.flinch], [2.6, PO.stand]]);
    const me = ME({ x: 400, face: -1, pose, expr: tl < 0.6 ? 'neutral' : tl < 1.9 ? 'fear' : 'sleepy' });
    return {
      figs: [me],
      back(g) { room(g, '#10131f'); V.eyes(g, 9, 26, -160, 1240, 620, 1060, 6, 0.7 * (1 - seg(tl, 2.1, 3.0))); },
      mid(g) { V.desk(g, 230, true, 1); },
      front(g) { if (closing < 1) V.uploadCard(g, 735, 780, 0.9 * V.pop(tl, 0.16), ease.inOut(seg(tl, 0.2, 1.6)), closing, tl); },
    };
  };

  // ─────────────────────────────── NOT TRYING IS A PERFORMANCE — empty spotlight, zeros
  V.actions.u_zeros = function (tl, sc) {
    const js = judges(tl, 0.5);
    const t = tl + sc.start;
    return {
      figs: js,
      back(g) {
        V.drawBeam(g, 'reactive', 540, t, 540, 1 - 0.85 * ease.in(seg(tl, 2.6, 4.2)));
      },
      mid(g) { // the cap left on the floor where you should have been
        g.save(); g.translate(540, V.FLOOR - 26); g.scale(4.3, 4.3);
        g.beginPath(); g.moveTo(-14, 4); g.quadraticCurveTo(-13, -11, 0, -11); g.quadraticCurveTo(13, -11, 13.5, 4); g.closePath();
        g.fillStyle = '#d42a3c'; g.fill(); g.strokeStyle = '#16171c'; g.lineWidth = 1.6; g.stroke();
        g.beginPath(); g.moveTo(8, 3); g.quadraticCurveTo(20, 2, 26, 5); g.quadraticCurveTo(20, 7, 8, 6); g.closePath(); g.fillStyle = '#c22233'; g.fill(); g.stroke();
        g.restore();
      },
      front(g) { js.forEach((f, i) => { const at = 0.5 + i * 0.15; if (tl > at + 0.15) V.scoreCard(g, V.figPoint(f, 'hF'), '0', V.pop(tl - at - 0.15, 0.14), true); }); },
    };
  };

  // ─────────────────────────────── EVERYONE YOU ADMIRE
  V.actions.u_admired = function (tl) {
    const go = GO({ pose: V.shift(V.breathe(PO.cheer, tl, 1, 3), 0, -Math.abs(Math.sin(tl * 6)) * 2, true), expr: 'smile', beamWarm: 0.7 });
    const crowd = [[150, 1], [300, 1], [780, -1], [930, -1]].map(([x, face], i) => C({ depth: 'back', x, y: 1300, s: 0.7, face, pose: V.lerpPose(PO.clapOpen, PO.clap, 0.5 + 0.5 * Math.sin(tl * 14 + i)) }));
    return {
      figs: [...crowd, go],
      front(g) { V.confetti(g, tl, 120, 960, 1 - seg(tl, 1.6, 2.3), 8); },
    };
  };

  // ─────────────────────────────── FIRST VIDEO: 3 VIEWS
  V.actions.u_firstVideo = function (tl) {
    const go = GO({ x: 430, face: 1, pose: poseAt(tl, [[0, PO.phone], [0.5, PO.phone], [0.8, PO.shrug]]), expr: tl > 0.7 ? 'smile' : 'neutral' });
    return {
      figs: [go],
      back(g) { room(g, '#10131f'); },
      front(g) {
        if (tl < 0.75) { const h = V.figPoint(go, 'hF'); V.phone(g, h[0] + 6, h[1] - 30, 0.15, 96, 'on'); }
        V.counterPanel(g, 790, 860, 'VIEWS', 3, false);
      },
    };
  };

  // ─────────────────────────────── FIRST FIGHT: LOST
  V.actions.u_firstFight = function (tl) {
    const HIT = 0.25;
    const opp = V.X({ kind: 'other', x: 400, face: 1, pose: poseAt(tl, [[0, PO.guard], [HIT, PO.jab], [0.6, PO.guard]]) });
    const go = GO({ x: 640, pose: poseAt(tl, [[0, PO.guard], [HIT, PO.flinch], [0.5, PO.kneel], [1.0, PO.kneel], [1.4, PO.guard]]), expr: tl < 1 ? 'strain' : 'focus' });
    return {
      figs: [opp, go],
      shake: tl > HIT && tl < HIT + 0.15 ? 10 : 0,
      front(g) { const h = V.figPoint(go, 'H'); g.save(); g.translate(h[0] - 20, h[1]); g.scale(0.6, 0.6); V.impact(g, 0, 0, (tl - HIT) / 0.3); g.restore(); },
    };
  };

  // ─────────────────────────────── FIRST DAY: SHAKING
  V.actions.u_firstDay = function (tl) {
    const go = GO({ x: 540, face: 1, pose: V.shift(poseAt(tl, [[0, PO.liftChest], [0.5, PO.press]]), Math.sin(tl * 40) * 1.2, 0), expr: 'strain' });
    return {
      figs: [go],
      back(g) { room(g, '#120d12'); },
      front(g) { V.barbell(g, V.figPoint(go, 'hF'), 1.4, tl); },
    };
  };

  // ─────────────────────────────── THEY JUST STAYED — the curve
  V.actions.u_graph = function (tl) {
    const u = ease.inOut(seg(tl, 0.2, 4.4));
    const views = Math.round(3 + 3397 * Math.pow(u, 2.2));
    return {
      figs: [],
      back(g) { room(g, '#0b0b10'); },
      front(g) {
        // the line that never started: flat, red
        g.save(); g.strokeStyle = V.COL.red; g.lineWidth = 6; g.shadowColor = V.COL.red; g.shadowBlur = 12; g.beginPath(); g.moveTo(120, 1330); g.lineTo(120 + 840 * u, 1330); g.stroke(); g.restore();
        const p = V.growthCurve(g, 120, 1330, 960, 700, u);
        V.drawFigure(g, { kind: 'steady', x: p[0], y: p[1] - 4, s: 0.42, face: 1, pose: V.walkPose(tl * 7), expr: 'focus' });
        g.save(); g.font = `700 24px ${V.FONT.sans}`; g.letterSpacing = '4px'; g.textAlign = 'left';
        g.fillStyle = '#F4F5F7'; g.fillText('STARTED BADLY', 140, 690);
        g.fillStyle = V.COL.red; g.fillText('NEVER STARTED', 140, 1300); g.restore();
        V.counterPanel(g, 790, 1200, 'VIEWS', views.toLocaleString('en-US'), false);
      },
    };
  };

  // ─────────────────────────────── BE BAD IN PUBLIC — eyes become applause; you watch from the dark
  V.actions.u_public = function (tl) {
    const go = GO({ x: 600, pose: (() => { const p = tl / 0.55, k = p % 1, n = Math.floor(p); const a = k < 0.4 ? Math.sin((k / 0.4) * Math.PI) : 0; return V.lerpPose(V.breathe(PO.guard, tl, 1.4, 6), n % 3 === 2 ? PO.cross2 : PO.jab, a); })(),
      expr: 'focus', beamWarm: 0.7 * seg(tl, 2, 5) });
    const me = ME({ x: 220, pose: V.breathe(PO.stand, tl, 1, 2), expr: 'neutral', beam: 0.25, beamW: 0.7, tint: 0.3 });
    return {
      figs: [me, go],
      back(g) { V.eyes(g, 9, 30, -160, 1240, 620, 1080, 11, 0.75 * (1 - seg(tl, 2.0, 3.0))); },
      front(g) {
        if (tl > 2.0) {
          const r = V.rng(12);
          for (let i = 0; i < 16; i++) {
            const ph = ((tl - 2.0) * 0.5 + r()) % 1, x = -100 + r() * 1300, y = 1100 - ph * 500;
            g.save(); g.globalAlpha = Math.sin(ph * Math.PI) * seg(tl, 2.0, 2.6); V.heart(g, x, y, 1.1, 1); g.restore();
          }
        }
      },
    };
  };

  // ─────────────────────────────── START BADLY. START TODAY. — you step into the light
  V.actions.u_start = function (tl) {
    const step = ease.inOut(seg(tl, 0.4, 2.2));
    const me = ME({ x: V.lerp(260, 420, step), pose: tl < 0.4 ? PO.stand : tl < 2.2 ? V.walkPose(tl * 6) : poseAt(tl, [[2.2, PO.stand], [2.7, PO.guard]]),
      expr: tl > 2.4 ? 'focus' : 'neutral', beam: 0.3 + 0.7 * step, beamWarm: 0.5 * step, tint: 0.3 * (1 - step) });
    const go = GO({ x: 720, pose: V.breathe(PO.guard, tl, 1.2, 6), expr: tl > 2.6 ? 'smile' : 'focus', headTilt: tl > 2.6 && tl < 3.0 ? 0.18 : 0, beamWarm: 0.5 });
    return { figs: [me, go] };
  };

  // ─────────────────────────────── CTA — which one are you?
  V.actions.u_cta = function (tl) {
    return {
      figs: [ME({ x: 360, pose: V.breathe(PO.guard, tl, 1.4, 5), expr: 'focus' }), GO({ x: 720, pose: V.breathe(PO.guard, tl, 1.4, 5, 1), expr: 'focus' })],
      overlay(g) {
        const k = V.pop(tl - 0.2, 0.16);
        if (tl < 0.2) return;
        g.save(); g.translate(540, 1360); g.scale(k, k);
        g.fillStyle = '#F4F5F7'; V.roundRect(g, -300, -44, 600, 88, 44); g.fill();
        g.fillStyle = '#0d0e12'; g.font = `800 34px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '4px';
        g.fillText('FREE 2-MINUTE QUIZ →', 4, 2);
        g.fillStyle = '#C9CBD3'; g.font = `600 26px ${V.FONT.sans}`; g.letterSpacing = '6px'; g.fillText('LINK IN BIO · @GESHV1', 4, 74);
        g.restore();
      },
    };
  };
})();
