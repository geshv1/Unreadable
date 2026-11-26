/* Scene actions for Pt. 8 (narrated format). World coordinates; the camera (cam.y = 207) lifts the floor so the
   scene sits inside the cinema panel (screen y 560–1330). Visible world band ≈ y 558–1522. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const pill = (g, x, y, text, k = 1, red = false) => {
    g.save(); g.translate(x, y); g.scale(k, k);
    g.font = `700 40px ${V.FONT.sans}`; const w = g.measureText(text).width + 44;
    g.fillStyle = 'rgba(14,15,20,0.95)'; g.strokeStyle = red ? V.COL.red : '#e8eaee'; g.lineWidth = 3;
    V.roundRect(g, -w / 2, -30, w, 60, 30); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '3px'; g.fillText(text, 2, 2);
    g.restore();
  };

  // ─────────────────────────────── HOOK — two men in their spotlights
  V.actions.hook8 = function (tl) {
    return {
      figs: [
        V.R({ pose: V.breathe(PO.stand, tl, 1.2, 2.2, 0) }),
        V.St({ pose: V.breathe(PO.stand, tl, 1.2, 2.0, 1.7) }),
      ],
    };
  };

  // ─────────────────────────────── MIRROR — split screen, 365 days
  function room(g, x0, x1, wall, light, tile) {
    g.save();
    g.fillStyle = wall; g.fillRect(x0, 500, x1 - x0, V.FLOOR - 500);
    g.strokeStyle = tile; g.lineWidth = 2;
    for (let y = 560; y < V.FLOOR; y += 70) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    for (let x = x0; x < x1; x += 70) { g.beginPath(); g.moveTo(x, 500); g.lineTo(x, V.FLOOR); g.stroke(); }
    const cx = (x0 + x1) / 2;
    g.save(); g.filter = 'blur(14px)'; g.fillStyle = light.replace('A', '0.16');
    g.beginPath(); g.moveTo(cx - 120, 650); g.lineTo(cx + 120, 650); g.lineTo(cx + 260, V.FLOOR); g.lineTo(cx - 260, V.FLOOR); g.closePath(); g.fill(); g.restore();
    g.fillStyle = light.replace('A', '1'); g.shadowColor = light.replace('A', '1'); g.shadowBlur = 30; g.fillRect(cx - 120, 630, 240, 12); g.shadowBlur = 0;
    g.restore();
  }
  function mirror(g, cx, f) {
    const x0 = cx - 120, y0 = 690, w = 240, h = 300;
    g.save();
    g.fillStyle = 'rgba(10,12,20,0.85)'; g.fillRect(x0, y0, w, h);
    g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    V.drawFigure(g, Object.assign({}, f, { x: cx, y: 1210, s: 0.62, alpha: 0.5, face: -(f.face || 1) }));
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(x0, y0 + h); g.lineTo(x0 + 80, y0); g.lineTo(x0 + 130, y0); g.lineTo(x0 + 50, y0 + h); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = '#c9cbd3'; g.lineWidth = 7; g.strokeRect(x0, y0, w, h);
    g.fillStyle = '#e8eaee'; g.fillRect(cx - 170, 1130, 340, 16);
    g.fillStyle = '#1c1e26'; g.fillRect(cx - 160, 1146, 320, V.FLOOR - 1146);
  }
  V.actions.mirror8 = function (tl) {
    const days = Math.max(1, Math.round(365 * ease.inOut(seg(tl, 0.1, 2.4))));
    const reactive = V.R({ pose: V.breathe(PO.slump, tl, 1, 2), expr: 'sleepy', beam: 0 });
    const steady = V.St({ pose: V.breathe(PO.stand, tl, 1, 2), expr: 'focus', beam: 0 });
    return {
      figs: [reactive, steady],
      back(g) {
        room(g, -300, 540, '#121a2e', 'rgba(170,200,255,A)', 'rgba(255,255,255,0.04)');
        room(g, 540, 1400, '#2a2016', 'rgba(255,210,150,A)', 'rgba(255,255,255,0.04)');
        mirror(g, 320, reactive); mirror(g, 700, steady);
        g.fillStyle = '#050507'; g.fillRect(536, 500, 8, 1100);
      },
      front(g) {
        g.save(); g.translate(540, 650);
        g.fillStyle = '#0d0e12'; g.strokeStyle = V.COL.red; g.lineWidth = 6; g.shadowColor = 'rgba(224,52,74,0.7)'; g.shadowBlur = 20;
        g.beginPath(); g.arc(0, 0, 62, 0, 6.283); g.fill(); g.stroke(); g.shadowBlur = 0;
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 44px ${V.FONT.sans}`; g.fillText(String(days), 0, -6);
        g.fillStyle = '#9a9da7'; g.font = `700 16px ${V.FONT.sans}`; g.letterSpacing = '4px'; g.fillText('DAYS', 2, 26);
        g.restore();
      },
    };
  };

  // ─────────────────────────────── BEDROOM — 6:00, phone first, dopamine before daylight
  const TOP = V.FLOOR - 150;
  V.actions.bedroom8 = function (tl) {
    const reactive = V.R({ x: 610, y: TOP - 38, rot: -Math.PI / 2, s: 0.8, noReflect: true, beam: 0,
      pose: V.shift(PO.lieScroll, 0, Math.sin(tl * 3) * 0.6), expr: tl % 1.6 < 0.12 ? 'neutral' : 'sleepy' });
    return {
      figs: [reactive],
      back(g) {
        g.fillStyle = '#0e1326'; g.fillRect(-300, 500, 1700, V.FLOOR - 500);
        // window: moon + skyline
        const wx = 770, wy = 640, ww = 230, wh = 250;
        g.fillStyle = '#070a16'; g.fillRect(wx, wy, ww, wh);
        g.fillStyle = '#f4f5f7'; g.beginPath(); g.arc(wx + 160, wy + 60, 24, 0, 6.283); g.fill();
        g.fillStyle = '#070a16'; g.beginPath(); g.arc(wx + 170, wy + 52, 22, 0, 6.283); g.fill();
        const r = V.rng(5); g.fillStyle = '#111628';
        for (let x = wx; x < wx + ww; x += 28) { const h = 50 + r() * 110; g.fillRect(x, wy + wh - h, 26, h); }
        g.fillStyle = 'rgba(255,210,140,0.7)'; for (let i = 0; i < 12; i++) g.fillRect(wx + 8 + r() * (ww - 16), wy + wh - 20 - r() * 110, 4, 5);
        g.strokeStyle = '#3f4558'; g.lineWidth = 7; g.strokeRect(wx, wy, ww, wh);
        g.lineWidth = 4; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
        g.save(); g.filter = 'blur(16px)'; g.fillStyle = 'rgba(150,170,255,0.07)';
        g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww, wy + wh); g.lineTo(wx + ww + 60, V.FLOOR); g.lineTo(wx - 260, V.FLOOR); g.closePath(); g.fill(); g.restore();
        // nightstand + 6:00
        g.fillStyle = '#151a2c'; g.strokeStyle = '#2c3248'; g.lineWidth = 4; g.fillRect(800, 1250, 130, 150); g.strokeRect(800, 1250, 130, 150);
        g.fillStyle = '#0a0b10'; V.roundRect(g, 812, 1196, 106, 54, 8); g.fill();
        g.fillStyle = V.COL.red; g.shadowColor = V.COL.red; g.shadowBlur = 14; g.font = `800 38px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('6:00', 866, 1225); g.shadowBlur = 0;
      },
      mid(g) { V.bed(g, 100, 640, TOP, true); V.pillow(g, 170, TOP - 4); },
      front(g) {
        V.bedBlanket(g, 300, 640, TOP, '#3a3f58');
        const h = V.figPoint(reactive, 'hF');
        V.phone(g, h[0] + 6, h[1] - 6, 0, 90, 'on');
        const hd = V.figPoint(reactive, 'H');
        g.save(); g.globalCompositeOperation = 'lighter';
        const rg = g.createRadialGradient(hd[0], hd[1], 4, hd[0], hd[1], 220); rg.addColorStop(0, 'rgba(140,180,255,0.42)'); rg.addColorStop(1, 'rgba(140,180,255,0)');
        g.fillStyle = rg; g.fillRect(hd[0] - 230, hd[1] - 230, 460, 460); g.restore();
        if (tl > 0.6) pill(g, h[0] + 40, h[1] - 150, '12 NEW', V.pop(tl - 0.6, 0.14));
        if (tl > 1.1) pill(g, h[0] + 190, h[1] - 70, 'FOR YOU', V.pop(tl - 1.1, 0.14));
        if (tl > 3.0) { // dopamine: +1s and hearts drifting up
          const rr = V.rng(9);
          for (let i = 0; i < 10; i++) {
            const ph = ((tl - 3.0) * 0.9 + rr()) % 1, x = h[0] - 40 + rr() * 120, y = h[1] - 40 - ph * 260;
            g.save(); g.globalAlpha = Math.sin(ph * Math.PI);
            if (i % 2) { g.fillStyle = V.COL.red; g.font = `800 34px ${V.FONT.sans}`; g.textAlign = 'center'; g.fillText('+1', x, y); }
            else V.heart(g, x, y, 0.9, 1);
            g.restore();
          }
        }
      },
    };
  };
})();
