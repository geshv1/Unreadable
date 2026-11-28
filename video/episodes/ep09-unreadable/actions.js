/* "Underperforming" — narrator cut. White jacked narrator (front rig) = host; red cap = "you".
   World coordinates; cam.y = 207 keeps scenes inside the cinema panel (visible world ≈ x -120–1200, y 558–1522). */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const C = (o) => V.X(Object.assign({ kind: 'crowd', pose: PO.stand }, o));
  const ALLY = (o) => V.X(Object.assign({ kind: 'ally', pose: PO.stand }, o));
  const ME = (o) => V.R(Object.assign({ x: 540, face: 1 }, o));
  const bg = (g, top, bottom) => { const gr = g.createLinearGradient(0, 520, 0, V.FLOOR); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(-400, 480, 1900, V.FLOOR - 480); };
  const pool = (g, x, color, r = 420) => { g.save(); g.translate(x, V.FLOOR + 10); g.scale(1, 0.18); const p = g.createRadialGradient(0, 0, 0, 0, 0, r); p.addColorStop(0, color); p.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = p; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill(); g.restore(); };
  const studio = (g, tl, x = 540) => {
    bg(g, '#1b1430', '#3d1020');
    V.geo(g, 'ring', x, 900, 310, tl * 0.15, 'rgba(255,255,255,0.5)', 0.3, 4);
    V.geo(g, 'triangle', 150 + Math.sin(tl) * 10, 760, 40, tl * 0.5, '#E0344A', 0.75);
    V.geo(g, 'square', 940, 720 + Math.sin(tl * 1.3) * 12, 28, -tl * 0.4, '#F4F5F7', 0.55);
    V.geo(g, 'circle', 880, 1120, 16, 0, '#F2C14E', 0.7, 5);
    pool(g, x, 'rgba(255,214,170,0.32)');
  };
  // host: the composed narrator, front-facing; life (lips, blinks, nods, brows, breathing) from the voiceover timing
  const host = (tl, sc, o) => Object.assign({ kind: 'steady', front: true, jacked: true, x: 540, s: 1.2, beamW: 1.15 }, V.narratorLife(tl + sc.start), o);
  const JUDGES = [[120, 1], [265, 1], [815, -1], [960, -1]];
  const judges = (tl, raiseAt) => JUDGES.map(([x, face], i) => C({ depth: 'back', x, y: 1300, s: 0.7, face,
    pose: V.lerpPose(V.breathe(PO.stand, tl, 1, 2, i), PO.cardUp, ease.out(seg(tl, raiseAt + i * 0.1, raiseAt + i * 0.1 + 0.2))) }));

  // ─────────────────────────────── OPENER — one rep, up, a cuff adjust, then he talks to you
  const DEG = Math.PI / 180;
  function pushup(t) {
    const down = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / 0.55));
    const hx = V.lerp(54, 35, down);
    return [Object.assign({}, PO.stand, { hB: [hx - 2, -86], hF: [hx, -87], fB: [0, -4], fF: [3, -4], hd: [2, -1], eB: [0.4, 1], eF: [0.4, 1] }), (58 + 10 * down) * DEG];
  }
  V.actions.v_opener = function (tl, sc) {
    let n;
    if (tl < 0.55) { const [p, rot] = pushup(tl); n = V.St({ x: 300, face: 1, jacked: true, s: 1.1, rot, pose: p, expr: 'focus', noReflect: true }); }
    else if (tl < 0.88) {
      const u = ease.out(seg(tl, 0.55, 0.85)), [p0, r0] = pushup(0.55);
      n = V.St({ x: V.lerp(300, 540, u), face: 1, jacked: true, s: V.lerp(1.1, 1.2, u), rot: V.lerp(r0, 0, u), pose: V.lerpPose(p0, PO.stand, u), expr: 'neutral', noReflect: u < 0.8 });
    } else {
      const gesture = V.frontGesture(tl, [[0.88, 'cuff'], [1.25, 'explain'], [2.0, 'palms']]);
      n = host(tl, sc, { gesture, turn: V.lerp(0.35, 1, ease.out(seg(tl, 0.88, 1.02))), s: kf(tl, [[0.88, 1.2], [2.84, 1.3]], ease.inOut) });
    }
    return { figs: [n], back(g) { studio(g, tl); } };
  };

  // ─────────────────────────────── JUDGES — score cards around a tiny you
  V.actions.v_judges = function (tl) {
    const js = judges(tl, 0.35);
    const me = ME({ y: V.FLOOR - 130, s: 0.85, pose: V.breathe(PO.stand, tl, 1, 2), expr: 'fear', noReflect: true, headTilt: Math.sin(tl * 3) * 0.08 });
    return {
      figs: [...js, me],
      back(g) { bg(g, '#0e1d26', '#0a0a10'); V.eyes(g, tl * 2, 26, -160, 1240, 620, 1060, 4, 0.7); V.geo(g, 'square', 540, V.FLOOR - 65, 100, 0, '#e8eaee', 1, 5, '#1c1e27'); pool(g, 540, 'rgba(224,52,74,0.3)', 360); },
      front(g) { js.forEach((f, i) => { const at = 0.35 + i * 0.1; if (tl > at + 0.15) V.scoreCard(g, V.figPoint(f, 'hF'), ['4', '3', '5', '4'][i], V.pop(tl - at - 0.15, 0.12)); }); },
    };
  };

  // ─────────────────────────────── YOUR BEST… NOT ENOUGH — the bar won't go past the knees
  V.actions.v_barbell = function (tl) {
    const drop = tl > 3.1;
    const pose = drop ? poseAt(tl, [[3.1, PO.liftKnee], [3.3, PO.stand]]) : tl < 0.3 ? PO.liftLow : V.lerpPose(PO.liftLow, PO.liftKnee, ease.inOut(seg(tl, 0.3, 1.8)));
    const me = ME({ x: 440, pose: V.shift(pose, drop ? 0 : Math.sin(tl * 38) * 0.6 * seg(tl, 0.6, 3.1), 0), expr: drop ? 'shame' : 'strain' });
    const flash = tl > 2.0 && tl < 2.9 ? 0.5 + 0.5 * Math.sin(tl * 20) : 0;
    return {
      figs: [me],
      back(g) { bg(g, '#1a0d12', '#0a0a0e'); },
      front(g) {
        V.barbell(g, drop ? [500, V.FLOOR - 58] : V.figPoint(me, 'hF'), drop ? 0 : seg(tl, 0.9, 3.1), tl);
        V.labelMeter(g, 650, 820, 330, 'YOUR BEST', 0.62 * ease.out(seg(tl, 0.2, 1.8)), V.COL.red, 0.88, 'ENOUGH');
        if (flash) { g.save(); g.globalAlpha = flash; g.strokeStyle = V.COL.red; g.lineWidth = 6; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(650 + 330 * 0.88, 780); g.lineTo(650 + 330 * 0.88, 870); g.stroke(); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── 'PREPARING' — a tower of plans, the flag out of reach
  const STACK = ['PLAN', 'RESEARCH', 'MORE RESEARCH', 'NEW PLAN', 'BETTER PLAN'];
  V.actions.v_preparing = function (tl) {
    const per = 0.32, n = Math.min(STACK.length, Math.floor(tl / per) + 1), k = (tl / per) % 1;
    const pose = k < 0.5 ? V.lerpPose(PO.place, PO.pickLow, k * 2) : V.lerpPose(PO.pickLow, V.set(PO.place, 'hF', [40, -70 - n * 8]), (k - 0.5) * 2);
    const me = ME({ x: 320, pose, expr: 'focus' });
    return {
      figs: [me],
      back(g) {
        bg(g, '#141a26', '#0b0b10');
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
        for (let x = -200; x < 1300; x += 80) { g.beginPath(); g.moveTo(x, 520); g.lineTo(x, V.FLOOR); g.stroke(); }
        for (let y = 560; y < V.FLOOR; y += 80) { g.beginPath(); g.moveTo(-300, y); g.lineTo(1400, y); g.stroke(); }
        g.restore();
        g.fillStyle = '#1c1e27'; g.fillRect(830, 1070, 140, 330); g.strokeStyle = '#e8eaee'; g.lineWidth = 5; g.strokeRect(830, 1070, 140, 330);
        V.flag(g, 900, 1070, 200, tl);
      },
      front(g) { for (let i = 0; i < n; i++) V.labelBox(g, 560 + (i % 2 ? 6 : -6), V.FLOOR - 40 - i * 82, 250, 80, STACK[i], i === n - 1 ? V.pop(tl - (n - 1) * per, 0.1) : 1); },
    };
  };

  // ─────────────────────────────── IF YOU NEVER START — the POST button, the eyes close
  V.actions.v_post = function (tl) {
    const closing = ease.in(seg(tl, 1.6, 1.95));
    const pose = tl < 1.6 ? V.set(PO.type, 'hF', [36, -60 + Math.sin(tl * 7) * 1.2]) : poseAt(tl, [[1.6, PO.type], [1.9, PO.flinch], [2.4, PO.stand]]);
    const me = ME({ x: 400, face: -1, pose, expr: tl < 0.4 ? 'neutral' : tl < 1.7 ? 'fear' : 'sleepy' });
    return {
      figs: [me],
      back(g) { bg(g, '#10131f', '#08080c'); V.eyes(g, 9, 26, -160, 1240, 620, 1060, 6, 0.75 * (1 - seg(tl, 1.95, 2.7))); },
      mid(g) { V.desk(g, 230, true, 1); },
      front(g) { if (closing < 1) V.uploadCard(g, 735, 780, 0.9 * V.pop(tl, 0.14), ease.inOut(seg(tl, 0.15, 1.4)), closing, tl); },
    };
  };

  // ─────────────────────────────── CONFESS — "I know. I did it for years."
  V.actions.v_confess = function (tl, sc) {
    const n = host(tl, sc, { gesture: V.frontGesture(tl, [[0, 'chest'], [1.0, 'steeple']]), s: 1.32, headTilt: -0.06 });
    return { figs: [n], back(g) { studio(g, tl); } };
  };

  // ─────────────────────────────── NOT TRYING IS A PERFORMANCE — empty spotlight, the cap on the floor
  V.actions.v_spotlight = function (tl, sc) {
    const js = judges(tl, 1.0);
    return {
      figs: js,
      back(g) { bg(g, '#0c0c10', '#08080a'); V.drawBeam(g, 'reactive', 540, tl + sc.start, 540, 1); },
      mid(g) {
        g.save(); g.translate(540, V.FLOOR - 26); g.scale(4.3, 4.3);
        g.beginPath(); g.moveTo(-14, 4); g.quadraticCurveTo(-13, -11, 0, -11); g.quadraticCurveTo(13, -11, 13.5, 4); g.closePath();
        g.fillStyle = '#d42a3c'; g.fill(); g.strokeStyle = '#16171c'; g.lineWidth = 1.6; g.stroke();
        g.beginPath(); g.moveTo(8, 3); g.quadraticCurveTo(20, 2, 26, 5); g.quadraticCurveTo(20, 7, 8, 6); g.closePath(); g.fillStyle = '#c22233'; g.fill(); g.stroke();
        g.restore();
      },
      front(g) { js.forEach((f, i) => { const at = 1.0 + i * 0.1; if (tl > at + 0.15) V.scoreCard(g, V.figPoint(f, 'hF'), '0', V.pop(tl - at - 0.15, 0.12), true); }); },
    };
  };

  // ─────────────────────────────── ALWAYS SCORES ZERO — a giant zero lands
  V.actions.v_zero = function (tl) {
    const k = tl < 0.12 ? V.lerp(2.4, 1, ease.in(tl / 0.12)) : 1 + 0.04 * Math.sin(tl * 6);
    const me = ME({ x: 250, pose: V.breathe(PO.sit, tl, 1, 1.6), expr: 'shame', tint: 0.3, beam: 0.35 });
    return {
      figs: [me],
      shake: tl < 0.2 ? 12 : 0,
      back(g) { bg(g, '#14080c', '#08080a'); },
      front(g) {
        g.save(); g.translate(620, 930); g.scale(k, k);
        g.strokeStyle = V.COL.red; g.lineWidth = 46; g.shadowColor = V.COL.red; g.shadowBlur = 50;
        g.beginPath(); g.ellipse(0, 0, 150, 210, 0, 0, 6.283); g.stroke();
        g.shadowBlur = 0; g.strokeStyle = '#ffd0d5'; g.lineWidth = 8; g.stroke();
        g.restore();
        if (tl < 0.4) { g.save(); g.globalAlpha = 1 - tl / 0.4; g.fillStyle = '#fff'; g.fillRect(-400, 400, 1900, 1200); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── EVERYONE YOU ADMIRE — statues sink back to ground level
  V.actions.v_admire = function (tl, sc) {
    const sink = ease.inOut(seg(tl, 1.3, 2.3));        // "…was bad first": back to the start
    const H = [260, 340, 200].map((h) => h * (1 - sink));
    const xs = [520, 720, 920];
    const poses = [PO.cheer, PO.flex, PO.guard];
    const statues = xs.map((x, i) => ALLY({ x, y: V.FLOOR - H[i], s: 0.72, face: -1, pose: V.breathe(poses[i], tl, 0.6, 2, i), noReflect: true }));
    const n = host(tl, sc, { x: 220, s: 1.05, gesture: V.frontGesture(tl, [[0, 'present']]), look: [0.5, 0] });
    return {
      figs: [...statues, n],
      back(g) {
        bg(g, '#1a1530', '#0d0b14');
        xs.forEach((x, i) => {
          g.save(); g.fillStyle = '#2a2838'; g.strokeStyle = '#F2C14E'; g.lineWidth = 4;
          g.fillRect(x - 70, V.FLOOR - H[i], 140, H[i]); g.strokeRect(x - 70, V.FLOOR - H[i], 140, H[i]);
          const gl = g.createRadialGradient(x, V.FLOOR - H[i] - 120, 10, x, V.FLOOR - H[i] - 120, 220); gl.addColorStop(0, `rgba(242,193,78,${0.25 * (1 - sink)})`); gl.addColorStop(1, 'rgba(242,193,78,0)');
          g.fillStyle = gl; g.fillRect(x - 230, V.FLOOR - H[i] - 340, 460, 460); g.restore();
        });
      },
    };
  };

  // ─────────────────────────────── FIRST VIDEO / FIRST FIGHT / FIRST DAY — fast cuts
  V.actions.v_firstVideo = function (tl) {
    const go = V.St({ x: 430, face: 1, pose: poseAt(tl, [[0, PO.phone], [0.9, PO.phone], [1.2, PO.shrug]]), expr: tl > 1.1 ? 'smile' : 'neutral' });
    return {
      figs: [go],
      back(g) { bg(g, '#0f1626', '#08080c'); },
      front(g) { if (tl < 1.15) { const h = V.figPoint(go, 'hF'); V.phone(g, h[0] + 6, h[1] - 30, 0.15, 96, 'on'); } V.counterPanel(g, 790, 860, 'VIEWS', tl > 0.9 ? 3 : 0, false); },
    };
  };
  V.actions.v_firstFight = function (tl) {
    const HIT = 0.35;
    const opp = V.X({ kind: 'other', x: 400, face: 1, pose: poseAt(tl, [[0, PO.guard], [HIT, PO.jab], [0.7, PO.guard]]) });
    const go = V.St({ x: 640, pose: poseAt(tl, [[0, PO.guard], [HIT, PO.flinch], [0.6, PO.kneel], [1.3, PO.kneel], [1.8, PO.guard]]), expr: tl < 1.3 ? 'strain' : 'focus' });
    return {
      figs: [opp, go],
      shake: tl > HIT && tl < HIT + 0.15 ? 10 : 0,
      front(g) { const h = V.figPoint(go, 'H'); g.save(); g.translate(h[0] - 20, h[1]); g.scale(0.6, 0.6); V.impact(g, 0, 0, (tl - HIT) / 0.3); g.restore(); },
    };
  };
  V.actions.v_firstDay = function (tl) {
    const go = V.St({ x: 540, face: 1, pose: V.shift(poseAt(tl, [[0, PO.liftChest], [0.5, PO.press]]), Math.sin(tl * 40) * 1.2, 0), expr: 'strain' });
    return { figs: [go], back(g) { bg(g, '#1a0d12', '#0a0a0e'); }, front(g) { V.barbell(g, V.figPoint(go, 'hF'), 1.4, tl); } };
  };

  // ─────────────────────────────── THEY JUST STAYED — the curve
  V.actions.v_stayed = function (tl) {
    const u = ease.inOut(seg(tl, 0.1, 2.2));
    const views = Math.round(3 + 3397 * Math.pow(u, 2.2));
    return {
      figs: [],
      back(g) { bg(g, '#0b0b10', '#08080a'); },
      front(g) {
        g.save(); g.strokeStyle = V.COL.red; g.lineWidth = 6; g.shadowColor = V.COL.red; g.shadowBlur = 12; g.beginPath(); g.moveTo(120, 1330); g.lineTo(120 + 840 * u, 1330); g.stroke(); g.restore();
        const p = V.growthCurve(g, 120, 1330, 960, 700, u);
        V.drawFigure(g, { kind: 'steady', x: p[0], y: p[1] - 4, s: 0.42, face: 1, pose: V.walkPose(tl * 8), expr: 'focus' });
        g.save(); g.font = `700 24px ${V.FONT.sans}`; g.letterSpacing = '4px'; g.textAlign = 'left';
        g.fillStyle = '#F4F5F7'; g.fillText('STAYED', 140, 690); g.fillStyle = V.COL.red; g.fillText('QUIT', 140, 1300); g.restore();
        V.counterPanel(g, 790, 1200, 'VIEWS', views.toLocaleString('en-US'), false);
      },
    };
  };

  // ─────────────────────────────── BE BAD IN PUBLIC. START TODAY. — he steps in and points at you
  V.actions.v_public = function (tl, sc) {
    const gesture = V.frontGesture(tl, [[0, 'palms'], [1.15, 'point']]);
    const point = kf(tl, [[0, 0], [1.15, 0], [1.4, 1], [2.75, 1]], ease.inOut);
    const n = host(tl, sc, { gesture, point, s: kf(tl, [[0, 1.2], [1.15, 1.22], [2.4, 1.45]], ease.inOut) });
    return { figs: [n], back(g) { studio(g, tl); } };
  };

  // ─────────────────────────────── CTA — learn to be unreadable
  V.actions.v_cta = function (tl, sc) {
    const n = host(tl, sc, { x: 230, s: 1.08, gesture: V.frontGesture(tl, [[0, 'present']]), look: [0.4, 0], beam: 0.9 });
    return {
      figs: [n],
      back(g) { bg(g, '#120c14', '#2a0c14'); V.geo(g, 'ring', 640, 930, 330, tl * 0.2, 'rgba(224,52,74,1)', 0.35, 4); },
      front(g) {
        V.bookCover(g, V.img.cover, 640, 930, 560, V.pop(tl, 0.2), -0.04 + Math.sin(tl * 1.5) * 0.01);
        if (tl > 1.0) {
          const k = V.pop(tl - 1.0, 0.16);
          g.save(); g.translate(640, 1290); g.scale(k, k);
          g.fillStyle = '#F4F5F7'; V.roundRect(g, -190, -38, 380, 76, 38); g.fill();
          g.fillStyle = '#0d0e12'; g.font = `800 32px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '5px';
          g.fillText('LINK IN BIO →', 4, 2); g.restore();
        }
      },
    };
  };
})();
