/* Scene actions for Pt. 8 "seen trying" (narrated format). World coordinates; cam.y = 207 keeps the scene
   inside the cinema panel (visible world ≈ y 558–1522). */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const say = (g, o) => V.bubble(g, Object.assign({ fill: '#15161c', color: '#C9CBD3', stroke: '#8d909a', size: 52, font: `italic 600 52px ${V.FONT.sans}` }, o));

  // ─────────────────────────────── HOOK — eyes in the dark
  V.actions.hookEyes = function (tl) {
    const look = Math.sin(tl * 1.3);
    return {
      figs: [
        V.R({ pose: V.breathe(PO.stand, tl, 1.2, 2.2, 0), headTilt: look * 0.12 }),
        V.St({ pose: V.breathe(PO.stand, tl, 1.2, 2.0, 1.7) }),
      ],
      back(g) {
        V.eyes(g, tl * 1.6, 46, -160, 1240, 620, 1180, 4, 0.9 * seg(tl, 0, 0.6));
      },
    };
  };

  // ─────────────────────────────── IDEA BOARD — a plan for everything, nothing started
  const NOTES = [['GYM', 170, 715, -0.06], ['BUSINESS', 350, 690, 0.05], ['YOUTUBE', 560, 725, -0.03], ['BOOK', 760, 700, 0.07], ['RUN 5K', 240, 870, 0.04], ['SPANISH', 680, 880, -0.05]];
  V.actions.ideaBoard = function (tl) {
    const reactive = V.R({ x: 470, face: -1, pose: V.breathe(tl < 1.6 ? PO.stand : PO.cross, tl, 1, 2.4), expr: 'proud', headTilt: -0.15 + Math.sin(tl * 3) * 0.05, beam: 0.85 });
    return {
      figs: [reactive],
      back(g) {
        g.fillStyle = '#16131c'; g.fillRect(-300, 500, 1700, V.FLOOR - 500);
        g.save(); g.filter = 'blur(20px)'; const lg = g.createRadialGradient(470, 780, 20, 470, 780, 520); lg.addColorStop(0, 'rgba(255,214,150,0.16)'); lg.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = lg; g.fillRect(-100, 300, 1200, 1100); g.restore();
      },
      front(g) {
        NOTES.forEach(([w, x, y, r], i) => { const at = 0.15 + i * 0.22; if (tl >= at) V.sticky(g, x, y, w, r, 1.2 * V.pop(tl - at, 0.14)); });
        V.counterPanel(g, 880, 1000, 'STARTED', 0);
      },
    };
  };

  // ─────────────────────────────── POST — never presses start
  V.actions.postButton = function (tl) {
    const closing = ease.in(seg(tl, 1.55, 1.9));
    const rPose = tl < 1.5 ? V.set(PO.type, 'hF', [36, -60 + Math.sin(tl * 7) * 1.2]) : poseAt(tl, [[1.5, PO.type], [1.75, PO.flinch], [2.2, PO.slump]]);
    const reactive = V.R({ x: 400, face: -1, pose: rPose, expr: tl < 0.6 ? 'neutral' : tl < 1.6 ? 'fear' : 'shame' });
    return {
      figs: [reactive],
      back(g) { g.fillStyle = '#10131f'; g.fillRect(-300, 500, 1700, V.FLOOR - 500); },
      mid(g) { V.desk(g, 230, true, 1); },
      front(g) { if (closing < 1) V.uploadCard(g, 735, 780, 0.9 * V.pop(tl, 0.16), ease.inOut(seg(tl, 0.2, 1.4)), closing, tl); },
    };
  };

  // ─────────────────────────────── JUDGES — what will they think?
  V.actions.judges = function (tl) {
    const shrink = ease.inOut(seg(tl, 0.2, 2.4));
    const reactive = V.R({ x: 540, pose: V.lerpPose(PO.stand, PO.slump, shrink), expr: 'fear', tint: 0.35 * shrink, beam: 1 - 0.5 * shrink, beamW: 1 - 0.3 * shrink, headTilt: 0.12 * shrink });
    const giants = [
      { x: V.lerp(60, 150, ease.out(seg(tl, 0, 1.2))), y: 1640, s: 2.05, face: 1, pose: V.breathe(PO.cross, tl, 1.5, 1.6) },
      { x: V.lerp(1020, 930, ease.out(seg(tl, 0.2, 1.4))), y: 1660, s: 2.1, face: -1, pose: V.breathe(PO.point, tl, 1.5, 1.8) },
    ];
    return {
      figs: [reactive],
      back(g) {
        g.fillStyle = '#0d0a10'; g.fillRect(-300, 500, 1700, V.FLOOR - 500);
        for (const f of giants) {
          g.save(); g.filter = 'blur(4px)'; g.globalAlpha = 0.95 * seg(tl, 0, 0.5); V.drawFigure(g, Object.assign({ kind: 'crowd' }, f)); g.restore();
          const h = V.figPoint(Object.assign({ kind: 'shadow' }, f), 'H');
          g.save(); g.translate(h[0], h[1]); g.scale(2, 2); V.eyes(g, 9, 1, 0, 0, 0, 0, 7, seg(tl, 0.4, 0.8), true); g.restore();
        }
      },
      front(g) {
        if (tl >= 0.7) say(g, { x: 250, y: 760, text: 'cringe.', scale: V.pop(tl - 0.7, 0.14) });
        if (tl >= 1.3) say(g, { x: 840, y: 820, text: 'lol', scale: V.pop(tl - 1.3, 0.14) });
        if (tl >= 1.9) say(g, { x: 540, y: 640, text: 'who does he think he is?', size: 46, font: `italic 600 46px ${V.FONT.sans}`, scale: V.pop(tl - 1.9, 0.14) });
      },
    };
  };
})();
