/* The stage: near-black background, stars, reflective floor with perspective grid,
   red/white spotlights that follow the characters, dust, reflections, labels. */
(function () {
  const V = window.V;
  const W = V.W, H = V.H;

  // ---- stars (static positions, slow twinkle)
  const STARS = (() => {
    const r = V.rng(7), a = [];
    for (let i = 0; i < 170; i++) a.push({ x: r() * W, y: r() * (V.FLOOR - 40), rad: 1.2 + r() * 2.6, o: 0.18 + r() * 0.34, ph: r() * 6.28 });
    return a;
  })();

  V.drawBackground = function (g, t) {
    g.fillStyle = V.COL.bg; g.fillRect(0, 0, W, H);
    // faint central haze so the frame never reads as pure black
    const hz = g.createRadialGradient(W / 2, V.FLOOR - 300, 50, W / 2, V.FLOOR - 300, 900);
    hz.addColorStop(0, 'rgba(60,62,78,0.22)'); hz.addColorStop(1, 'rgba(11,11,15,0)');
    g.fillStyle = hz; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c9ccd6';
    for (const s of (V.ep && V.ep.stars === false) ? [] : STARS) {
      g.globalAlpha = s.o * (0.75 + 0.25 * Math.sin(t * 1.3 + s.ph));
      g.beginPath(); g.arc(s.x, s.y, s.rad, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
  };

  // ---- floor + grid (cached)
  let gridCache = null;
  function buildGrid() {
    const c = V.makeCanvas(W, H - V.FLOOR), x = c.getContext('2d');
    const h = H - V.FLOOR, cx = W / 2;
    x.strokeStyle = '#3a3c48'; x.lineWidth = 2;
    for (let i = -14; i <= 14; i++) {
      x.beginPath(); x.moveTo(cx + i * 62, 0); x.lineTo(cx + i * 62 * 3.2, h); x.stroke();
    }
    let y = 12, gap = 26;
    while (y < h) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); y += gap; gap *= 1.45; }
    x.globalCompositeOperation = 'destination-in';
    const m = x.createRadialGradient(cx, 0, 0, cx, 0, h * 1.3);
    m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = m; x.fillRect(0, 0, W, h);
    return c;
  }
  V.drawFloor = function (g) {
    const fg = g.createLinearGradient(0, V.FLOOR, 0, H);
    fg.addColorStop(0, '#17181e'); fg.addColorStop(1, '#07070a');
    g.fillStyle = fg; g.fillRect(-400, V.FLOOR, W + 800, H - V.FLOOR + 700);
    if (!gridCache) gridCache = buildGrid();
    if (!(V.ep && V.ep.grid === false)) g.drawImage(gridCache, 0, V.FLOOR);
    g.strokeStyle = '#34363f'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-200, V.FLOOR); g.lineTo(W + 200, V.FLOOR); g.stroke();
  };

  // ---- spotlights
  const BEAM = {
    reactive: { c0: 'rgba(224,52,74,0.05)', c1: 'rgba(224,52,74,0.30)', c2: 'rgba(240,72,92,0.50)', pool: 'rgba(240,72,92,0.55)', dust: '#ff9aa4' },
    steady: { c0: 'rgba(236,240,246,0.05)', c1: 'rgba(226,230,238,0.22)', c2: 'rgba(242,244,248,0.38)', pool: 'rgba(242,244,248,0.45)', dust: '#ffffff' },
  };
  V.drawBeam = function (g, kind, x, t, home, intensity = 1, width = 1, warm = 0) {
    const b = BEAM[kind]; if (!b) return;
    const topX = home + (x - home) * 0.55;
    const flick = 0.93 + 0.07 * Math.sin(t * 5.3 + (kind === 'steady' ? 2 : 0)) * Math.sin(t * 2.1);
    g.save();
    g.globalAlpha = flick * intensity;
    g.filter = 'blur(14px)';
    const gr = g.createLinearGradient(0, -700, 0, V.FLOOR);
    gr.addColorStop(0, b.c0); gr.addColorStop(0.55, b.c1); gr.addColorStop(1, b.c2);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(topX - 30 - 34, -700); g.lineTo(topX + 30 + 34, -700); g.lineTo(x + 205 * width, V.FLOOR + 6); g.lineTo(x - 205 * width, V.FLOOR + 6); g.closePath(); g.fill();
    if (warm > 0) {
      g.globalAlpha = flick * intensity * warm;
      const wg = g.createLinearGradient(0, -700, 0, V.FLOOR);
      wg.addColorStop(0, 'rgba(255,200,140,0.04)'); wg.addColorStop(1, 'rgba(255,196,130,0.42)');
      g.fillStyle = wg; g.fill();
      g.globalAlpha = flick * intensity;
    }
    g.filter = 'none';
    // pool of light on the floor
    g.save(); g.translate(x, V.FLOOR + 4); g.scale(1, 0.16);
    const pg = g.createRadialGradient(0, 0, 0, 0, 0, 300 * width);
    pg.addColorStop(0, b.pool); pg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = pg; g.beginPath(); g.arc(0, 0, 300 * width, 0, 6.283); g.fill(); g.restore();
    // dust in the beam
    const r = V.rng(kind === 'steady' ? 33 : 11);
    g.fillStyle = b.dust;
    for (let i = 0; i < ((V.ep && V.ep.dust === false) ? 0 : 18); i++) {
      const per = 9 + r() * 7, off = r() * per, u = ((t + off) % per) / per;
      const yy = V.FLOOR - 60 - r() * 700 - u * 160;
      const wv = (yy + 40) / (V.FLOOR + 40);
      const xx = V.lerp(topX, x, wv) + (r() - 0.5) * 330 * wv + u * 20;
      g.globalAlpha = flick * Math.sin(u * Math.PI) * 0.85;
      g.beginPath(); g.arc(xx, yy, 2 + r() * 2.6, 0, 6.283); g.fill();
    }
    g.restore();
  };

  // ---- shadows + reflections
  let refCanvas = null;
  V.drawReflections = function (g, figs) {
    const h = H - V.FLOOR;
    if (!refCanvas) refCanvas = V.makeCanvas(W, h);
    const x = refCanvas.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, W, h);
    x.save();
    // world y -> canvas y = FLOOR - y  (mirror about the floor line)
    x.translate(0, V.FLOOR); x.scale(1, -1);
    for (const f of figs) if (!f.noReflect) V.drawFigure(x, f);
    x.restore();
    x.globalCompositeOperation = 'destination-in';
    const m = x.createLinearGradient(0, 0, 0, h * 0.75);
    m.addColorStop(0, 'rgba(0,0,0,0.9)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = m; x.fillRect(0, 0, W, h);
    g.save(); g.globalAlpha = 0.3; g.filter = 'blur(5px)';
    g.drawImage(refCanvas, 0, V.FLOOR + 4);
    g.restore();
    // contact shadows
    for (const f of figs) {
      if ((f.y != null && f.y !== V.FLOOR) || f.noReflect) continue;
      g.save(); g.translate(f.x, V.FLOOR - 2); g.scale(1, 0.12); g.filter = 'blur(6px)';
      g.fillStyle = 'rgba(0,0,0,0.75)'; g.beginPath(); g.arc(0, 0, 135 * (f.s || 1), 0, 6.283); g.fill(); g.restore();
    }
  };

  // ---- labels under the floor
  V.drawLabels = function (g, z = 1, px = 0, only = null, y = 1452, names = null) {
    const lx = (x) => 540 + (x - px - 540) * z;
    const fs = Math.round(38 * Math.min(1, 0.2 + z)) * (names ? 0.82 : 1);
    g.save();
    g.font = `700 ${fs}px ${V.FONT.sans}`;
    g.letterSpacing = `${Math.round(fs * 0.32)}px`;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 12;
    const N = names || { reactive: 'REACTIVE', steady: 'STEADY' };
    if (only !== 'steady') { g.fillStyle = V.COL.red; g.fillText(N.reactive, (only ? 540 : lx(V.POS.reactive)) + fs * 0.16, y); }
    if (only !== 'reactive') { g.fillStyle = '#F4F5F7'; g.fillText(N.steady, (only ? 540 : lx(V.POS.steady)) + fs * 0.16, y); }
    g.restore();
  };
})();
