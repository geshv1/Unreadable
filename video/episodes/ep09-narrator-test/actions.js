/* Narrator-format test. World coordinates; cam.y = 207 keeps the scene inside the cinema panel
   (visible world ≈ x -120–1200, y 558–1522). White stickman = narrator; red cap = "you". */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const C = (o) => V.X(Object.assign({ kind: 'crowd', pose: PO.stand }, o));
  const bg = (g, top, bottom) => { const gr = g.createLinearGradient(0, 520, 0, V.FLOOR); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(-400, 480, 1900, V.FLOOR - 480); };
  const pool = (g, x, color, r = 420) => { g.save(); g.translate(x, V.FLOOR + 10); g.scale(1, 0.18); const p = g.createRadialGradient(0, 0, 0, 0, 0, r); p.addColorStop(0, color); p.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = p; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill(); g.restore(); };
  const narrator = (tl, sc, o) => V.St(Object.assign({ x: 540, face: 1, expr: 'talk', mouth: V.speaking(tl + sc.start) }, o));

  // ─────────────────────────────── STUDIO — the narrator talks to you
  V.actions.n_studio = function (tl, sc) {
    let pose;
    if (tl < 1.2) pose = V.lerpPose(PO.stand, PO.wave, Math.sin(V.clamp(tl / 1.2) * Math.PI) * 0.9 + 0.1 * Math.sin(tl * 12));
    else if (tl < 3.1) pose = poseAt(tl, [[1.2, PO.stand], [1.45, PO.pointYou], [3.1, PO.pointYou]]);
    else pose = V.lerpPose(PO.explain, PO.present, 0.5 + 0.5 * Math.sin(tl * 4));
    const n = narrator(tl, sc, { pose: V.breathe(pose, tl, 0.8, 3), headTilt: tl > 3.2 ? 0.08 * Math.sin(tl * 2) : 0 });
    return {
      figs: [n],
      back(g) {
        bg(g, '#1b1430', '#3d1020');
        V.geo(g, 'ring', 540, 900, 310, tl * 0.1, 'rgba(255,255,255,0.5)', 0.35, 4);
        V.geo(g, 'triangle', 150 + Math.sin(tl) * 10, 760, 46, tl * 0.4, '#E0344A', 0.8);
        V.geo(g, 'square', 930, 720 + Math.sin(tl * 1.3) * 12, 32, -tl * 0.3, '#F4F5F7', 0.6);
        V.geo(g, 'circle', 880, 1120, 20, 0, '#F2C14E', 0.7, 5);
        V.geo(g, 'circle', 200, 1160, 12, 0, '#F4F5F7', 0.5, 4);
        pool(g, 540, 'rgba(255,214,170,0.35)');
      },
    };
  };

  // ─────────────────────────────── WATCHED — tiny you on a box stage, phones up, giant eyes
  V.actions.n_watched = function (tl, sc) {
    const PLAT = 140;
    const me = V.R({ x: 540, y: V.FLOOR - PLAT, s: 0.85, face: 1, pose: V.lerpPose(PO.stand, PO.slump, ease.inOut(seg(tl, 1.2, 3.2))), expr: 'fear', beam: 0.9, noReflect: true,
      tint: 0.25 * seg(tl, 1.4, 3.2) });
    const crowd = [[110, 1], [230, 1], [850, -1], [970, -1]].map(([x, face], i) => C({ x, s: 0.8, face, pose: V.breathe(PO.phoneUp, tl, 1, 2, i) }));
    const head = V.figPoint(me, 'H');
    return {
      figs: [...crowd, me],
      back(g) {
        bg(g, '#0e1d26', '#0a0a10');
        const blink = (k) => (((tl + k * 0.9) % 2.6) < 0.1 ? 0.1 : 1);
        V.bigEye(g, 250, 720, 1.1, head, blink(0)); V.bigEye(g, 540, 640, 1.4, head, blink(1)); V.bigEye(g, 830, 720, 1.1, head, blink(2));
        V.geo(g, 'square', 540, V.FLOOR - PLAT / 2, 110, 0, '#e8eaee', 1, 5, '#1c1e27');
        pool(g, 540, 'rgba(224,52,74,0.35)', 380);
      },
      front(g) {
        crowd.forEach((f) => {
          const h = V.figPoint(f, 'hF');
          V.phone(g, h[0], h[1] - 30, 0, 90, 'on');
          g.save(); g.fillStyle = '#ff2a44'; g.shadowColor = '#ff2a44'; g.shadowBlur = Math.floor(tl * 2.4) % 2 ? 0 : 16; g.beginPath(); g.arc(h[0] - 10, h[1] - 64, 6, 0, 6.283); g.fill(); g.restore();
        });
      },
    };
  };

  // ─────────────────────────────── PREPARING — stacking plans, never climbing
  const STACK = ['PLAN', 'RESEARCH', 'MORE RESEARCH', 'NEW PLAN', 'BETTER PLAN'];
  V.actions.n_preparing = function (tl, sc) {
    const per = 0.42, n = Math.min(STACK.length, Math.floor(tl / per) + 1), k = (tl / per) % 1;
    const pose = k < 0.5 ? V.lerpPose(PO.place, PO.pickLow, k * 2) : V.lerpPose(PO.pickLow, V.set(PO.place, 'hF', [40, -70 - n * 8]), (k - 0.5) * 2);
    const me = V.R({ x: 330, face: 1, pose, expr: 'focus', beam: 0.85 });
    return {
      figs: [me],
      back(g) {
        bg(g, '#141a26', '#0b0b10');
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
        for (let x = -200; x < 1300; x += 80) { g.beginPath(); g.moveTo(x, 520); g.lineTo(x, V.FLOOR); g.stroke(); }
        for (let y = 560; y < V.FLOOR; y += 80) { g.beginPath(); g.moveTo(-300, y); g.lineTo(1400, y); g.stroke(); }
        g.restore();
        // the goal: up on a platform, out of reach
        V.geo(g, 'square', 900, 1150, 80, 0, '#e8eaee', 0.9, 5, '#1c1e27');
        g.fillStyle = '#1c1e27'; g.fillRect(830, 1150, 140, 250); g.strokeStyle = '#e8eaee'; g.lineWidth = 5; g.strokeRect(830, 1070, 140, 330);
        V.flag(g, 900, 1070, 200, tl);
      },
      front(g) {
        for (let i = 0; i < n; i++) V.labelBox(g, 560 + (i % 2 ? 6 : -6), V.FLOOR - 40 - i * 82, 250, 80, STACK[i], i === n - 1 ? V.pop(tl - (n - 1) * per, 0.12) : 1);
      },
    };
  };

  // ─────────────────────────────── CONFESS — "I know. I did it too."
  V.actions.n_confess = function (tl, sc) {
    const n = narrator(tl, sc, { x: 600, pose: V.breathe(PO.sitBox, tl, 0.8, 2), expr: tl < 1.0 ? 'talk' : 'talk', headTilt: -0.05 });
    if (V.speaking(tl + sc.start) === 0) n.expr = 'smile';
    return {
      figs: [n],
      back(g) {
        bg(g, '#1b1430', '#3d1020');
        V.geo(g, 'ring', 560, 900, 300, tl * 0.1, 'rgba(255,255,255,0.5)', 0.3, 4);
        pool(g, 600, 'rgba(255,214,170,0.35)');
      },
      mid(g) { V.labelBox(g, 560, V.FLOOR - 80, 200, 160, 'PLAN'); },
    };
  };

  // ─────────────────────────────── CTA — learn to be unreadable
  V.actions.n_cta = function (tl, sc) {
    const n = narrator(tl, sc, { x: 190, pose: V.breathe(PO.present, tl, 0.8, 3), beam: 0.9 });
    return {
      figs: [n],
      back(g) {
        bg(g, '#120c14', '#2a0c14');
        V.geo(g, 'ring', 620, 930, 330, tl * 0.2, 'rgba(224,52,74,1)', 0.35, 4);
      },
      front(g) {
        V.bookCover(g, V.img.cover, 640, 930, 560, V.pop(tl, 0.2), -0.04);
        const k = V.pop(tl - 0.3, 0.16);
        if (tl > 0.3) {
          g.save(); g.translate(640, 1290); g.scale(k, k);
          g.fillStyle = '#F4F5F7'; V.roundRect(g, -190, -38, 380, 76, 38); g.fill();
          g.fillStyle = '#0d0e12'; g.font = `800 32px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '5px';
          g.fillText('LINK IN BIO →', 4, 2); g.restore();
        }
      },
    };
  };
})();
