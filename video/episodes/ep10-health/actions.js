/* "Health is the one" — narrator cut. White jacked narrator (front rig) = host; red cap = "you".
   Every line gets its own illustrated world. World coordinates; cam.y = 207 keeps scenes inside the cinema panel
   (visible world ≈ y 680–1520 at zoom 0.9, x −60–1140; keep key content x 100–960). */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const F = V.FLOOR;
  const ME = (o) => V.R(Object.assign({ x: 540, face: 1, pose: PO.stand, beam: 0, noReflect: true }, o));
  const host = (tl, sc, o) => Object.assign({ kind: 'steady', front: true, jacked: true, x: 540, s: 1.2, beamW: 1.15, beam: 0.55 }, V.narratorLife(tl + sc.start), o);
  const lin = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
  const bg = (g, ...stops) => { g.fillStyle = lin(g, 520, F, stops); g.fillRect(-400, 400, 1900, F - 400); };
  const ground = (g, top, bottom, line = null) => { g.fillStyle = lin(g, F, F + 260, [top, bottom]); g.fillRect(-400, F, 1900, 400); if (line) { g.strokeStyle = line; g.lineWidth = 3; g.beginPath(); g.moveTo(-400, F); g.lineTo(1500, F); g.stroke(); } };
  const glow = (g, x, y, r, color) => { const p = g.createRadialGradient(x, y, 0, x, y, r); p.addColorStop(0, color); p.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = p; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  const pool = (g, x, color, r = 420) => { g.save(); g.translate(x, F + 10); g.scale(1, 0.18); glow(g, 0, 0, r, color); g.restore(); };
  const text = (g, s, x, y, size, color, o = {}) => {
    g.save(); g.font = `${o.weight || 800} ${size}px ${o.font || V.FONT.sans}`; g.fillStyle = color; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.ls) g.letterSpacing = o.ls; if (o.alpha != null) g.globalAlpha = o.alpha; g.fillText(s, x, y); g.restore();
  };
  const DEG = Math.PI / 180;

  // ── shared set pieces
  const BED_TOP = F - 150;
  const lying = (o) => ME(Object.assign({ y: BED_TOP - 36, s: 0.76, rot: -Math.PI / 2 }, o));
  function window_(g, x, y, w, h, sky, inner) {
    g.save(); g.fillStyle = sky; g.fillRect(x - w / 2, y - h / 2, w, h);
    g.beginPath(); g.rect(x - w / 2, y - h / 2, w, h); g.clip(); if (inner) inner(); g.restore();
    g.save(); g.strokeStyle = '#c9cbd3'; g.lineWidth = 10; g.strokeRect(x - w / 2, y - h / 2, w, h);
    g.lineWidth = 6; g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x, y + h / 2); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.stroke(); g.restore();
  }
  function rainIn(g, x, y, w, h, t, n = 26, col = 'rgba(180,200,230,0.5)') {
    const r = V.rng(5); g.save(); g.strokeStyle = col; g.lineWidth = 2.5;
    for (let i = 0; i < n; i++) { const rx = x - w / 2 + r() * w, sp = 700 + r() * 300, ry = y - h / 2 + ((r() * h + t * sp) % (h + 60)) - 30; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 6, ry + 26); g.stroke(); }
    g.restore();
  }
  function zzz(g, x, y, t) {
    for (let i = 0; i < 3; i++) { const u = ((t * 0.9 + i / 3) % 1); text(g, 'z', x + u * 70 + i * 6, y - u * 150, 30 + u * 34, '#e8eaee', { font: V.FONT.serif, weight: 400, alpha: Math.sin(u * Math.PI) * 0.9 }); }
  }
  function bill(g, x, y, rot, k = 1) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k);
    g.fillStyle = '#8fd49a'; g.strokeStyle = '#1d4a28'; g.lineWidth = 3; V.roundRect(g, -38, -18, 76, 36, 4); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, 0, 11, 0, 6.283); g.stroke(); text(g, '$', 0, 1, 16, '#1d4a28');
    g.restore();
  }
  // tile icons for the four basics (outline glyphs)
  function basicIcon(g, kind, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'sleep') { g.beginPath(); g.arc(0, 0, 26, 0.6, 5.7); g.arc(12, -6, 20, 5.2, 1.2, true); g.closePath(); g.fill(); }
    else if (kind === 'water') { g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(18, -6, 24, 6, 24, 12); g.arc(0, 12, 24, 0, Math.PI); g.bezierCurveTo(-24, 6, -18, -6, 0, -30); g.fill(); }
    else if (kind === 'sun') { g.beginPath(); g.arc(0, 0, 14, 0, 6.283); g.fill(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(Math.cos(a) * 21, Math.sin(a) * 21); g.lineTo(Math.cos(a) * 31, Math.sin(a) * 31); g.stroke(); } }
    else if (kind === 'move') { g.beginPath(); g.arc(6, -26, 7, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(2, -16); g.lineTo(-4, 6); g.moveTo(0, -12); g.lineTo(16, -4); g.moveTo(0, -12); g.lineTo(-16, -6); g.moveTo(-4, 6); g.lineTo(10, 16); g.lineTo(8, 30); g.moveTo(-4, 6); g.lineTo(-16, 20); g.lineTo(-28, 18); g.stroke(); }
    g.restore();
  }
  const BASICS = ['sleep', 'water', 'sun', 'move'];
  function tile(g, kind, x, y, k, lit, size = 130) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = lit ? 'rgba(127,224,160,0.18)' : 'rgba(14,15,20,0.85)'; g.strokeStyle = lit ? '#7fe0a0' : 'rgba(255,255,255,0.35)'; g.lineWidth = 4;
    if (lit) { g.shadowColor = '#7fe0a0'; g.shadowBlur = 24; }
    V.roundRect(g, -size / 2, -size / 2, size, size, 24); g.fill(); g.stroke(); g.shadowBlur = 0;
    basicIcon(g, kind, 0, 0, size / 130, lit ? '#7fe0a0' : 'rgba(255,255,255,0.45)');
    g.restore();
  }

  // ─────────────────────────────── 1 · A HEALTHY MAN WANTS A THOUSAND THINGS — wishes orbit the narrator
  const WISH6 = [[175, 790, 'car'], [905, 790, 'money'], [135, 1030, 'followers'], [945, 1030, 'plane'], [215, 1260, 'trophy'], [865, 1260, 'watch']];
  const MINI = ['car', 'money', 'followers', 'plane', 'trophy', 'watch', 'heart'];
  V.actions.h_healthy = function (tl, sc) {
    const n = host(tl, sc, { gesture: V.frontGesture(tl, [[0, 'idle'], [0.5, 'explain'], [2.05, 'palms']]), s: kf(tl, [[0, 1.18], [3.3, 1.24]], ease.inOut) });
    return {
      figs: [n],
      back(g) {
        bg(g, '#14213f', '#3a2440', '#6a3326'); ground(g, '#2a1714', '#0c0807');
        glow(g, 540, 1000, 520, 'rgba(255,190,120,0.30)');
        V.geo(g, 'ring', 540, 1010, 330, tl * 0.2, 'rgba(255,220,170,0.7)', 0.35, 4);
        V.geo(g, 'ring', 540, 1010, 420, -tl * 0.12, 'rgba(255,220,170,0.5)', 0.18, 3);
        pool(g, 540, 'rgba(255,214,170,0.35)');
      },
      front(g) {
        WISH6.forEach(([x, y, kind], i) => { const at = 0.35 + i * 0.2; V.wish(g, kind, x + Math.sin(tl * 1.4 + i) * 8, y + Math.cos(tl * 1.7 + i) * 8, 0.9 * V.pop(tl - at, 0.18)); });
        if (tl > 2.15) {           // "…a THOUSAND things": the sky fills with small wishes
          for (let i = 0; i < 22; i++) {
            const a = i / 22 * 6.283 + tl * 0.35, r = 380 + (i % 3) * 55, x = 540 + Math.cos(a) * r * 1.05, y = 1010 + Math.sin(a) * r * 0.62;
            if (Math.abs(x - 540) < 210 && y > 740) continue;
            V.icon(g, MINI[i % MINI.length], x, y, 0.36 * V.pop(tl - 2.15 - i * 0.025, 0.14), 0.85);
          }
        }
      },
    };
  };

  // ─────────────────────────────── 2 · A SICK MAN WANTS ONLY ONE — hospital bed, the list falls, one wish
  function hospital(g, tl) {
    bg(g, '#173640', '#0f262d', '#0a171b'); ground(g, '#1d3036', '#0b1316', 'rgba(255,255,255,0.12)');
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2; for (let x = -100; x < 1200; x += 120) { g.beginPath(); g.moveTo(x, 1120); g.lineTo(x, F); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-300, 1120); g.lineTo(1400, 1120); g.stroke(); g.restore();
    window_(g, 610, 830, 260, 200, '#0c1a2a', () => { rainIn(g, 610, 830, 260, 200, tl, 22); });
    g.save(); g.strokeStyle = 'rgba(220,230,240,0.5)'; g.lineWidth = 3; for (let y = 740; y < 930; y += 22) { g.beginPath(); g.moveTo(482, y); g.lineTo(738, y); g.stroke(); } g.restore();
    g.save(); g.fillStyle = 'rgba(224,52,74,0.85)'; g.fillRect(140, 760, 70, 22); g.fillRect(164, 736, 22, 70); g.restore();   // wall cross
    glow(g, 540, 700, 600, 'rgba(160,220,230,0.10)');
  }
  V.actions.h_sick = function (tl) {
    const me = lying({ x: 690, pose: V.shift(PO.lie, 0, Math.sin(tl * 1.6) * 0.8), expr: tl < 1.1 ? 'sleepy' : 'tearful' });
    return {
      figs: [me],
      back(g) {
        hospital(g, tl);
        g.save(); g.translate(360, 0); g.scale(-1, 1); V.ivStand(g, 180, tl); g.restore();
        g.save(); g.strokeStyle = '#c9cbd3'; g.lineWidth = 7; g.beginPath(); g.moveTo(900, 980); g.lineTo(900, F - 4); g.moveTo(850, F - 4); g.lineTo(950, F - 4); g.stroke(); g.restore();
        V.heartMonitor(g, 900, 910, tl, 96, '#7fe0a0');
      },
      mid(g) { V.bed(g, 280, 730, BED_TOP, true, '#5a6b7a'); V.pillow(g, 340, BED_TOP - 4); },
      front(g) {
        V.bedBlanket(g, 470, 730, BED_TOP, '#8aa2b4');
        // last scene's wishes drop away, greyed
        if (tl < 0.8) WISH6.forEach(([x, y, kind], i) => { const u = seg(tl, i * 0.05, 0.55 + i * 0.05); V.icon(g, kind, x, y + 520 * u * u, 0.75, (1 - u) * 0.8); });
        const k = V.pop(tl - 1.2, 0.2);
        if (k > 0) {
          const h = V.figPoint(me, 'H');
          g.save(); g.fillStyle = 'rgba(18,19,26,0.9)'; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3;
          [[h[0] + 40, h[1] - 70, 9], [h[0] + 70, h[1] - 120, 14]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r * k, 0, 6.283); g.fill(); g.stroke(); });
          g.restore();
          const bx = h[0] + 130, by = h[1] - 250;
          V.wish(g, 'heart', bx, by, 1.15 * k);
          glow(g, bx, by, 200 * k, `rgba(224,52,74,${0.25 * k})`);
          text(g, 'HEALTHY AGAIN', bx, by + 105, 22, '#F4F5F7', { ls: '4px', alpha: seg(tl, 1.4, 1.6) });
        }
      },
    };
  };

  // ─────────────────────────────── 3 · RIGHT NOW, YOU WANT MORE MONEY — neon city, money rain, he points at you
  function skyline(g, seed, col, win, y0 = F, hMin = 220, hMax = 520) {
    const r = V.rng(seed); let x = -260;
    while (x < 1340) { const w = 80 + r() * 120, h = hMin + r() * (hMax - hMin), top = y0 - h;
      g.fillStyle = col; g.fillRect(x, top, w, h);
      for (let wy = top + 24; wy < y0 - 30; wy += 38) for (let wx = x + 14; wx < x + w - 18; wx += 28) { const v = r(); if (v > 0.72) { g.fillStyle = win[Math.floor(v * 10) % win.length]; g.fillRect(wx, wy, 12, 18); } }
      x += w + 8; }
  }
  const BILLS = Array.from({ length: 34 }, (_, i) => { const r = V.rng(100 + i); return [r() * 1300 - 120, r(), 0.7 + r() * 0.6, r() * 6, r() < 0.14]; });
  V.actions.h_money = function (tl, sc) {
    const gesture = V.frontGesture(tl, [[0, 'explain'], [0.78, 'point']]);
    const point = kf(tl, [[0, 0], [0.8, 0], [1.05, 1], [2.3, 1]], ease.inOut);
    const n = host(tl, sc, { gesture, point, firm: point > 0.5, s: kf(tl, [[0, 1.18], [1.0, 1.2], [2.3, 1.3]], ease.inOut), beam: 0.4 });
    const drawBills = (g, front) => BILLS.forEach(([x, r, k, ph, fr]) => { if (fr !== front) return; const y = 560 + ((r * 1000 + tl * (260 + k * 120)) % 1000); bill(g, x + Math.sin(tl * 2 + ph) * 20, y, Math.sin(tl * 3 + ph) * 0.8, k * (front ? 1.15 : 0.9)); });
    return {
      figs: [n],
      back(g) {
        bg(g, '#090b20', '#1a0d33', '#3a0f33'); ground(g, '#140a1c', '#050308', 'rgba(255,80,180,0.35)');
        glow(g, 540, 1200, 700, 'rgba(255,60,160,0.12)');
        skyline(g, 7, '#0c0a18', ['rgba(255,80,180,0.6)', 'rgba(80,220,255,0.55)', 'rgba(255,214,150,0.35)'], F, 260, 560);
        const fl = Math.sin(tl * 23) > -0.85 ? 1 : 0.4;
        g.save(); g.globalAlpha = fl; g.shadowColor = '#4cf2a0'; g.shadowBlur = 30; text(g, '$', 870, 840, 150, '#7dffbf', { font: V.FONT.serif, weight: 400 }); g.restore();
        drawBills(g, false);
        pool(g, 540, 'rgba(255,120,200,0.30)');
      },
      front(g) { drawBills(g, true); },
    };
  };

  // ─────────────────────────────── 4 · MORE FOLLOWERS — the counter runs, hearts rise from the phone
  V.actions.h_followers = function (tl) {
    const me = ME({ x: 330, pose: V.breathe(PO.phone, tl, 0.8, 4), expr: 'grin', headTilt: 0.05 });
    const u = ease.inOut(seg(tl, 0.05, 1.05));
    const val = Math.round(1240 + (98700 - 1240) * Math.pow(u, 1.6));
    const h = V.figPoint(me, 'hF');
    return {
      figs: [me],
      back(g) {
        bg(g, '#1a0b36', '#2c0f4f', '#120626'); ground(g, '#1a0c2c', '#07040c');
        glow(g, 700, 900, 520, 'rgba(170,90,255,0.22)');
        for (let i = 0; i < 6; i++) V.geo(g, 'circle', 120 + i * 180, 760 + Math.sin(tl * 2 + i) * 20, 8, 0, 'rgba(255,255,255,0.35)', 1, 3);
      },
      front(g) {
        V.phone(g, h[0] + 6, h[1] - 30, 0.15, 96, 'on');
        for (let i = 0; i < 9; i++) { const v = ((tl * 1.3 + i / 9) % 1); V.heart(g, h[0] + 20 + Math.sin(i * 2.3 + tl * 3) * 50 + v * 120, h[1] - 60 - v * 460, 1.2 + (i % 3) * 0.4, Math.sin(v * Math.PI)); }
        g.save(); g.translate(760, 930); const k = V.pop(tl, 0.16); g.scale(1.25 * k, 1.25 * k); V.counterPanel(g, 0, 0, 'FOLLOWERS', val.toLocaleString('en-US'), true); g.restore();
        V.notification && tl > 0.35 && V.icon(g, 'followers', 760, 1110 + (1 - V.pop(tl - 0.35, 0.16)) * 30, 1.1, V.pop(tl - 0.35, 0.16));
      },
    };
  };

  // ─────────────────────────────── 5 · A BETTER CAR — red car slides into the showroom
  V.actions.h_car = function (tl) {
    const u = ease.out(seg(tl, 0, 0.5)), cx = V.lerp(-420, 620, u), moving = 1 - seg(tl, 0.35, 0.55);
    const me = ME({ x: 220, pose: poseAt(tl, [[0, PO.stand], [0.45, PO.stand], [0.7, PO.present]]), expr: tl > 0.5 ? 'grin' : 'shock' });
    const CS = 3.9, cy = F - 25 * CS;
    return {
      figs: [me],
      back(g) {
        bg(g, '#0b0b10', '#15151d', '#1d1d27'); ground(g, '#24242e', '#0b0b10', 'rgba(255,255,255,0.25)');
        g.save(); g.fillStyle = lin(g, 560, F, ['rgba(255,240,220,0.25)', 'rgba(255,240,220,0.02)']);
        g.beginPath(); g.moveTo(560, 560); g.lineTo(680, 560); g.lineTo(980, F); g.lineTo(260, F); g.closePath(); g.fill(); g.restore();
        pool(g, 620, 'rgba(255,240,220,0.4)', 460);
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-200, 700 + i * 130); g.lineTo(1300, 700 + i * 130); g.stroke(); } g.restore();
      },
      front(g) {
        if (moving > 0) { g.save(); g.globalAlpha = 0.5 * moving; g.strokeStyle = '#ffffff'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { const y = cy - 70 + i * 22; g.beginPath(); g.moveTo(cx - 240 - i * 30, y); g.lineTo(cx - 200 - 160 * moving, y); g.stroke(); } g.restore(); }
        g.save(); g.translate(cx, F); g.scale(1, -0.5); g.globalAlpha = 0.25; V.icon(g, 'car', 0, -25 * CS, CS); g.restore();   // floor reflection
        V.icon(g, 'car', cx, cy, CS);
        if (tl > 0.5) { const k = V.pop(tl - 0.5, 0.15); g.save(); g.globalAlpha = 0.8 * (1 - seg(tl, 0.5, 1.2)); V.geo(g, 'ring', cx, cy - 20, 240 * k, 0, '#F2C14E', 0.6, 4); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── 6 · BUT GET SICK FOR ONE WEEK… — rain, fever, the calendar flips
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  V.actions.h_sickWeek = function (tl) {
    const me = lying({ x: 770, pose: V.shift(PO.lie, Math.sin(tl * 40) * 0.35, 0), expr: 'sleepy', tint: 0.15 });
    const per = 0.25, d = Math.min(6, Math.floor(Math.max(0, tl - 0.2) / per)), flip = (Math.max(0, tl - 0.2) % per) / per;
    return {
      figs: [me],
      back(g) {
        bg(g, '#0e1526', '#0a0f1c', '#06080e'); ground(g, '#101522', '#05070b', 'rgba(255,255,255,0.1)');
        window_(g, 780, 820, 280, 240, '#0b1424', () => { rainIn(g, 780, 820, 280, 240, tl, 34); if (Math.sin(tl * 6) > 0.97) { g.fillStyle = 'rgba(200,220,255,0.25)'; g.fillRect(600, 650, 400, 400); } });
        glow(g, 780, 820, 360, 'rgba(120,160,230,0.12)');
        // wall calendar
        g.save(); g.translate(270, 830);
        g.fillStyle = '#f4f5f7'; g.strokeStyle = '#16171c'; g.lineWidth = 4; V.roundRect(g, -95, -105, 190, 210, 10); g.fill(); g.stroke();
        g.fillStyle = V.COL.red; g.fillRect(-95, -105, 190, 52); g.restore();
        text(g, 'DAY ' + (d + 1), 270, 752, 26, '#fff', { ls: '3px' });
        g.save(); g.translate(270, 790); g.scale(1, 1 - (d < 6 ? ease.in(flip) * 0.95 : 0)); text(g, DAYS[d], 0, 60, 58, '#16171c'); g.restore();
        for (let i = 0; i <= d; i++) { g.save(); g.strokeStyle = V.COL.red; g.lineWidth = 4; const x = 200 + i * 23; g.beginPath(); g.moveTo(x - 7, 912); g.lineTo(x + 7, 926); g.moveTo(x + 7, 912); g.lineTo(x - 7, 926); g.stroke(); g.restore(); }
      },
      mid(g) { V.bed(g, 360, 810, BED_TOP, true, '#3a4256'); V.pillow(g, 420, BED_TOP - 4); },
      front(g) {
        V.bedBlanket(g, 550, 810, BED_TOP, '#3a4660');
        const h = V.figPoint(me, 'H');
        V.sweat(g, h[0], h[1], tl, 1, 4);
        V.thermometer(g, 560, 1010, 0.35 + 0.6 * ease.inOut(seg(tl, 0.1, 1.9)));
        text(g, (37.1 + 2.4 * ease.inOut(seg(tl, 0.1, 1.9))).toFixed(1) + '°', 640, 900, 40, '#ff4660', { align: 'left' });
      },
    };
  };

  // ─────────────────────────────── 7 · AND THE WHOLE LIST DISAPPEARS — strike, strike, gone
  const LIST = [['MORE MONEY', 'money'], ['FOLLOWERS', 'followers'], ['NEW CAR', 'car'], ['TRAVEL', 'plane'], ['PROMOTION', 'trophy'], ['NICE WATCH', 'watch']];
  V.actions.h_list = function (tl) {
    const gone = ease.in(seg(tl, 1.2, 1.8));
    return {
      figs: [],
      back(g) {
        bg(g, '#1c140c', '#120d08', '#080604'); ground(g, '#2a1e14', '#0a0705');
        glow(g, 540, 760, 640, 'rgba(255,190,120,0.18)');
        g.save(); g.fillStyle = '#3a2a1c'; g.fillRect(-300, 1290, 1700, 110); g.restore();   // desk top
      },
      front(g) {
        g.save(); g.translate(540, 1010 - gone * 40); g.rotate(-0.03 + gone * 0.1); g.globalAlpha = 1 - gone;
        g.fillStyle = '#efe7d3'; g.strokeStyle = '#16171c'; g.lineWidth = 4; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30;
        V.roundRect(g, -270, -300, 540, 600, 14); g.fill(); g.shadowBlur = 0; g.stroke();
        text(g, 'Things I want', 0, -240, 52, '#16171c', { font: '"Cormorant Garamond", serif', weight: 'italic 600' });
        LIST.forEach(([s, ic], i) => {
          const y = -150 + i * 78, at = 0.15 + i * 0.13, st = ease.out(seg(tl, at, at + 0.14));
          V.icon(g, ic, -190, y, 0.42, 1 - st * 0.6);
          text(g, s, -140, y, 32, st > 0.5 ? 'rgba(22,23,28,0.45)' : '#16171c', { align: 'left' });
          if (st > 0) { g.strokeStyle = V.COL.red; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-230, y + 2); g.lineTo(-230 + 460 * st, y - 4); g.stroke(); }
        });
        g.restore();
        if (gone > 0) {               // paper turns to drifting flakes
          const r = V.rng(77);
          for (let i = 0; i < 70; i++) { const x0 = 280 + r() * 520, y0 = 720 + r() * 580, v = gone * (0.6 + r() * 0.8);
            g.save(); g.globalAlpha = (1 - gone) * 0.9 + 0.1 * (1 - v); g.fillStyle = r() < 0.15 ? V.COL.red : '#efe7d3';
            g.translate(x0 + v * (180 + r() * 300), y0 - v * (260 + r() * 300)); g.rotate(v * 6 + r()); g.fillRect(-7, -5, 14, 10); g.restore(); }
        }
      },
    };
  };

  // ─────────────────────────────── 8 · SUDDENLY YOU'D TRADE EVERYTHING — the heart outweighs it all
  V.actions.h_trade = function (tl) {
    const LAND = 0.95;
    const tilt = tl < LAND ? -0.85 : V.lerp(-0.85, 1, 1 - Math.exp(-(tl - LAND) * 9) * Math.cos((tl - LAND) * 16));
    const sx = 540, sy = 930, a = tilt * 0.32, rx = sx + Math.cos(a) * 300, ry = sy + Math.sin(a) * 300;
    const jolt = tl > LAND && tl < LAND + 0.3 ? Math.sin((tl - LAND) / 0.3 * Math.PI) * 30 : 0;
    return {
      figs: [],
      shake: tl > LAND && tl < LAND + 0.14 ? 9 : 0,
      back(g) {
        bg(g, '#1e1b17', '#14120f', '#0b0a08'); ground(g, '#2c2823', '#0c0b09', 'rgba(242,193,78,0.35)');
        for (const x of [20, 1060]) { g.save(); g.fillStyle = lin(g, 640, F, ['#3a352d', '#1d1a15']); g.fillRect(x - 55, 660, 110, F - 660); g.fillStyle = '#F2C14E'; g.globalAlpha = 0.7; g.fillRect(x - 70, 640, 140, 22); g.fillRect(x - 70, F - 26, 140, 22); g.restore(); }
        glow(g, 540, 900, 520, 'rgba(242,193,78,0.14)');
        pool(g, 540, 'rgba(242,193,78,0.3)');
      },
      front(g) {
        V.scale(g, sx, sy, tilt,
          (px, py) => { const j = -jolt; V.icon(g, 'money', px - 50, py - 26 + j, 0.85); V.icon(g, 'car', px + 40, py - 22 + j * 1.2, 0.75); V.icon(g, 'trophy', px - 20, py - 92 + j * 1.4, 0.8); V.icon(g, 'watch', px + 62, py - 84 + j * 1.1, 0.6); },
          (px, py) => { if (tl >= LAND) { glow(g, px, py - 40, 200, 'rgba(224,52,74,0.35)'); V.heart(g, px, py - 38, 3.4 * (1 + 0.06 * Math.sin(tl * 9))); } });
        if (tl < LAND) { const u = ease.in(seg(tl, 0.35, LAND)); const hy = V.lerp(560, ry + 112 - 38, u); if (tl > 0.3) { glow(g, rx, hy, 180, 'rgba(224,52,74,0.3)'); V.heart(g, rx, hy, 3.4 * V.pop(tl - 0.3, 0.12)); } }
      },
    };
  };

  // ─────────────────────────────── 9 · JUST TO BREATHE EASY — open sky, lungs fill
  V.actions.h_breathe = function (tl) {
    const k = 0.5 - 0.5 * Math.cos(tl * 3.6);
    const me = ME({ x: 800, s: 0.62, pose: V.lerpPose(PO.stand, PO.inhale, k), expr: 'smile' });
    return {
      figs: [me],
      back(g) {
        bg(g, '#3d7fb8', '#78b6df', '#cfe9f6');
        const r = V.rng(9); for (let i = 0; i < 6; i++) { const x = ((r() * 1500 + tl * (30 + r() * 30)) % 1600) - 300, y = 690 + r() * 260; g.save(); g.globalAlpha = 0.75; g.fillStyle = '#ffffff'; for (const [dx, dy, rr] of [[0, 0, 46], [44, 8, 36], [-44, 10, 34], [16, -24, 34]]) { g.beginPath(); g.arc(x + dx, y + dy, rr, 0, 6.283); g.fill(); } g.restore(); }
        g.fillStyle = '#5fa65a'; g.beginPath(); g.moveTo(-400, F + 10); g.quadraticCurveTo(300, F - 150, 1500, F - 20); g.lineTo(1500, 1800); g.lineTo(-400, 1800); g.closePath(); g.fill();
        g.fillStyle = '#3f8445'; g.beginPath(); g.moveTo(-400, F + 60); g.quadraticCurveTo(700, F - 60, 1500, F + 40); g.lineTo(1500, 1800); g.lineTo(-400, 1800); g.closePath(); g.fill();
      },
      front(g) {
        const lx = 430, ly = 960;
        glow(g, lx, ly, 330, `rgba(255,255,255,${0.3 + 0.3 * k})`);
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 5; g.lineCap = 'round';
        for (let i = 0; i < 5; i++) { const u = (tl * 0.9 + i / 5) % 1, x = V.lerp(-60 + i * 30, lx - 10, u), y = V.lerp(700 + i * 40, ly - 170, u); g.globalAlpha = Math.sin(u * Math.PI) * 0.8; g.beginPath(); g.moveTo(x - 50, y); g.quadraticCurveTo(x - 25, y - 16, x, y); g.stroke(); }
        g.restore();
        V.lungs(g, lx, ly, k, 2.1);
      },
    };
  };

  // ─────────────────────────────── 10 · TO SLEEP THROUGH THE NIGHT — moonlit room, the clock runs to morning
  function bedroom(g, tl, warm) {
    bg(g, '#101a3a', '#0b1230', '#070a18'); ground(g, '#0e1430', '#05070f', 'rgba(255,255,255,0.08)');
    window_(g, 800, 820, 250, 250, warm > 0 ? `rgb(${V.lerp(14, 240, warm)},${V.lerp(26, 150, warm)},${V.lerp(64, 90, warm)})` : '#0e1a40', () => {
      g.fillStyle = '#f4f1e0'; g.shadowColor = '#f4f1e0'; g.shadowBlur = 40; g.globalAlpha = 1 - warm; g.beginPath(); g.arc(850, 770, 46, 0, 6.283); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#0e1a40'; g.globalAlpha = 1 - warm; g.beginPath(); g.arc(868, 760, 40, 0, 6.283); g.fill(); g.globalAlpha = 1; g.shadowBlur = 0;
      if (warm > 0) { g.fillStyle = '#ffd38a'; g.beginPath(); g.arc(800, 945 - warm * 70, 50, 0, 6.283); g.fill(); }
    });
    g.save(); g.fillStyle = warm > 0 ? `rgba(255,200,120,${0.10 + 0.12 * warm})` : 'rgba(170,190,255,0.10)';
    g.beginPath(); g.moveTo(675, 945); g.lineTo(925, 945); g.lineTo(760, F); g.lineTo(380, F); g.closePath(); g.fill(); g.restore();
    if (warm > 0) glow(g, 540, 1000, 700, `rgba(255,170,90,${0.18 * warm})`);
  }
  V.actions.h_sleep = function (tl) {
    const me = lying({ x: 700, pose: V.shift(PO.lie, 0, -Math.sin(tl * 1.5) * 0.7), expr: 'sleepy' });
    const warm = ease.inOut(seg(tl, 1.15, 1.65));
    return {
      figs: [me],
      back(g) { bedroom(g, tl, warm); V.wallClock(g, 300, 820, 78, 23 + 8 * ease.inOut(seg(tl, 0.05, 1.5))); },
      mid(g) { V.bed(g, 290, 740, BED_TOP, true, '#2b3f6b'); V.pillow(g, 350, BED_TOP - 4); },
      front(g) { V.bedBlanket(g, 480, 740, BED_TOP, '#2f4a80'); const h = V.figPoint(me, 'H'); zzz(g, h[0] + 30, h[1] - 50, tl); },
    };
  };

  // ─────────────────────────────── 11 · TO WALK WITHOUT PAIN — dawn park, the limp fades into a stride
  V.actions.h_walk = function (tl) {
    const heal = ease.inOut(seg(tl, 0.45, 1.25));
    const ph = tl * 9.5, x = V.lerp(170, 800, tl / 1.77);
    const limp = (1 - heal) * Math.max(0, Math.sin(ph)) * 5;
    const me = ME({ x, s: 0.9, pose: V.shift(V.walkPose(ph, PO.stand, V.lerp(5, 12, heal)), 0, limp), expr: heal < 0.5 ? 'strain' : 'smile' });
    const knee = V.figPoint(me, 'kF');
    return {
      figs: [me],
      back(g) {
        bg(g, '#2a2452', '#7a4a6a', '#f2955c');
        V.sunrise(g, 720, 1230, 0.45 + 0.35 * tl / 1.77);
        g.fillStyle = '#3a2848'; g.beginPath(); g.moveTo(-400, 1240); g.quadraticCurveTo(200, 1120, 600, 1220); g.quadraticCurveTo(900, 1290, 1500, 1180); g.lineTo(1500, F); g.lineTo(-400, F); g.closePath(); g.fill();
        g.fillStyle = '#261a32';
        for (const [tx, h] of [[60 - tl * 20, 330], [1010 - tl * 20, 380], [880 - tl * 12, 250]]) { g.fillRect(tx - 10, F - h, 20, h); g.beginPath(); g.arc(tx, F - h, 90, 0, 6.283); g.arc(tx - 60, F - h + 50, 70, 0, 6.283); g.arc(tx + 60, F - h + 50, 70, 0, 6.283); g.fill(); }
        ground(g, '#3a2a30', '#120c10');
        g.save(); g.strokeStyle = 'rgba(255,210,170,0.35)'; g.lineWidth = 4; g.setLineDash([40, 30]); g.lineDashOffset = tl * 200; g.beginPath(); g.moveTo(-300, F + 40); g.lineTo(1400, F + 40); g.stroke(); g.restore();
      },
      front(g) {
        if (heal < 1) { const p = 0.6 + 0.4 * Math.sin(tl * 14); glow(g, knee[0], knee[1], 70, `rgba(224,52,74,${0.75 * (1 - heal) * p})`); }
      },
    };
  };

  // ─────────────────────────────── 12 · HEALTH IS THE ONE — the narrator presents a giant 1
  V.actions.h_one = function (tl, sc) {
    const n = host(tl, sc, { x: 300, s: 1.1, gesture: V.frontGesture(tl, [[0, 'explain'], [0.25, 'present']]), look: tl > 0.25 && tl < 0.9 ? [0.6, 0] : [0, 0] });
    const k = V.pop(tl - 0.1, 0.2);
    return {
      figs: [n],
      back(g) {
        bg(g, '#06261e', '#05190f', '#020a07'); ground(g, '#082018', '#020806');
        glow(g, 760, 1000, 560, 'rgba(127,224,160,0.18)');
        V.geo(g, 'ring', 760, 1020, 330, tl * 0.25, 'rgba(127,224,160,1)', 0.35, 4);
        pool(g, 300, 'rgba(200,255,220,0.25)');
      },
      front(g) {
        g.save(); g.translate(760, 1340); g.scale(k, k); V.bigDigit(g, '1', 0, 0, 760, '#F4F5F7'); g.restore();
        if (tl > 0.4) { const kk = V.pop(tl - 0.4, 0.15); V.heart(g, 760, 1385, 2.2 * kk * (1 + 0.08 * Math.sin(tl * 10))); }
      },
    };
  };

  // ─────────────────────────────── 13 · EVERYTHING ELSE IS THE ZEROS BEHIND IT — 1 0 0 0 0 0
  const ZX = [140, 290, 440, 590, 740, 890], ZICON = ['money', 'car', 'followers', 'plane', 'trophy'];
  const ZY = 1170, ZS = 300;
  function zeroRow(g, tl, o = {}) {
    const grey = o.grey || 0;
    const col = (a) => `rgba(${Math.round(V.lerp(244, 120, grey))},${Math.round(V.lerp(245, 122, grey))},${Math.round(V.lerp(247, 130, grey))},${a})`;
    for (let i = 1; i < 6; i++) {
      const at = o.all ? -1 : 0.15 + (i - 1) * 0.2, k = V.pop(tl - at, 0.16);
      if (k <= 0) continue;
      const x = o.zx ? o.zx(i) : ZX[i];
      g.save(); g.translate(x, ZY); g.scale(k, k); V.bigDigit(g, '0', 0, 0, ZS, col(1), o.zAlpha != null ? o.zAlpha : 1); g.restore();
      if (o.icons !== false) V.icon(g, ZICON[i - 1], x, ZY + 90, 0.55 * k, (1 - grey * 0.75) * (o.iconAlpha != null ? o.iconAlpha : 1));
    }
  }
  function zeroSet(g, tl, desat = 0) {
    bg(g, `rgb(${V.lerp(8, 22, desat)},${V.lerp(32, 24, desat)},${V.lerp(42, 28, desat)})`, `rgb(${V.lerp(4, 12, desat)},${V.lerp(14, 12, desat)},${V.lerp(18, 14, desat)})`, '#030505');
    ground(g, '#081418', '#020405');
    g.save(); g.strokeStyle = `rgba(127,224,220,${0.08 * (1 - desat)})`; g.lineWidth = 2; for (let y = 760; y < F; y += 70) { g.beginPath(); g.moveTo(-300, y); g.lineTo(1400, y); g.stroke(); } g.restore();
    glow(g, 140, 1060, 300, `rgba(127,224,160,${0.2 * (1 - desat)})`);
  }
  V.actions.h_zeros = function (tl) {
    return {
      figs: [],
      back(g) { zeroSet(g, tl); },
      front(g) {
        V.bigDigit(g, '1', ZX[0], ZY, ZS + 40, '#7fe0a0');
        V.heart(g, ZX[0], ZY + 90, 1.6 * (1 + 0.08 * Math.sin(tl * 9)));
        text(g, 'HEALTH', ZX[0], ZY + 160, 22, '#7fe0a0', { ls: '4px' });
        zeroRow(g, tl);
        if (tl > 1.35) { const k = V.pop(tl - 1.35, 0.16); g.save(); g.translate(540, 790); g.scale(k, k); text(g, '= 100,000', 0, 0, 104, '#F4F5F7', { font: '"Cormorant Garamond", serif', weight: 'italic 500' }); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── 14 · LOSE THE ONE, AND IT'S ALL WORTH NOTHING — the 1 cracks and falls
  V.actions.h_lose = function (tl) {
    const FALL0 = 0.45, LAND = 0.86, SLAM = 2.2;
    const desat = ease.inOut(seg(tl, 0.7, 1.6));
    const grey = ease.inOut(seg(tl, 1.15, 1.7));
    const merge = ease.in(seg(tl, 1.75, SLAM));
    const z = tl - SLAM, bk = z < 0 ? 0 : z < 0.12 ? V.lerp(2.4, 1, ease.in(z / 0.12)) : 1 + 0.03 * Math.sin(tl * 6);
    return {
      figs: [],
      shake: (tl > LAND && tl < LAND + 0.12 ? 7 : 0) + (z > 0 && z < 0.2 ? 12 : 0),
      back(g) { zeroSet(g, tl, desat); },
      front(g) {
        // the one: tremble, crack, topple off the edge
        const f = ease.in(seg(tl, FALL0, LAND));
        if (tl < LAND + 0.3) {
          const tr = tl < FALL0 ? Math.sin(tl * 60) * 3 * seg(tl, 0.05, 0.3) : 0;
          g.save(); g.translate(ZX[0] + 60 + tr - f * 40, ZY + f * 380); g.rotate(-f * 1.3); g.globalAlpha = 1 - seg(tl, LAND, LAND + 0.3);
          V.bigDigit(g, '1', -60, 0, ZS + 40, '#7fe0a0');
          if (tl > 0.25) { g.strokeStyle = '#0a1a12'; g.lineWidth = 5; g.beginPath(); g.moveTo(-70, -230); g.lineTo(-52, -160); g.lineTo(-74, -110); g.lineTo(-56, -40); g.stroke(); }
          g.restore();
          V.heart(g, ZX[0], ZY + 90 + f * 300, 1.6, 1 - seg(tl, LAND - 0.2, LAND + 0.1));
        }
        if (tl < SLAM) zeroRow(g, tl, { all: true, grey, zx: (i) => V.lerp(ZX[i], 540, merge), zAlpha: 1 - merge * 0.6, iconAlpha: 1 - seg(tl, 1.4, 1.9) });
        if (tl < 1.3) text(g, '= 100,000', 540, 790, 104, '#F4F5F7', { font: '"Cormorant Garamond", serif', weight: 'italic 500', alpha: 1 - seg(tl, 0.6, 1.0) });
        if (bk > 0) {
          g.save(); g.translate(540, 1010); g.scale(bk, bk);
          g.strokeStyle = V.COL.red; g.lineWidth = 42; g.shadowColor = V.COL.red; g.shadowBlur = 50;
          g.beginPath(); g.ellipse(0, 0, 140, 200, 0, 0, 6.283); g.stroke(); g.shadowBlur = 0; g.strokeStyle = '#ffd0d5'; g.lineWidth = 8; g.stroke(); g.restore();
          text(g, 'WORTH', 540, 1290, 26, '#9a9da7', { ls: '6px', alpha: seg(tl, SLAM + 0.15, SLAM + 0.35) });
        }
        if (z > 0 && z < 0.4) { g.save(); g.globalAlpha = 1 - z / 0.4; g.fillStyle = '#fff'; g.fillRect(-400, 400, 1900, 1200); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── 15 · YOU DON'T NEED A MIRACLE — a glowing cure, crossed out
  V.actions.h_miracle = function (tl, sc) {
    const shakeHead = tl > 0.35 && tl < 1.1 ? Math.sin((tl - 0.35) * 14) * 0.07 * (1 - seg(tl, 0.8, 1.1)) : 0;
    const n = host(tl, sc, { x: 320, s: 1.12, gesture: V.frontGesture(tl, [[0, 'explain'], [0.5, 'palms']]), headTilt: shakeHead, smile: false });
    const xk = ease.out(seg(tl, 0.85, 1.05)), xk2 = ease.out(seg(tl, 0.98, 1.18));
    const bx = 790, by = 1060 + Math.sin(tl * 2.2) * 12;
    return {
      figs: [n],
      back(g) {
        bg(g, '#1e0f36', '#160a28', '#0a0512'); ground(g, '#140a20', '#05030a');
        glow(g, bx, by, 360, `rgba(120,230,255,${0.22 * (1 - xk2 * 0.6)})`);
        pool(g, 320, 'rgba(220,200,255,0.25)');
      },
      front(g) {
        g.save(); g.translate(bx, by); g.globalAlpha = 1 - xk2 * 0.45;
        g.fillStyle = 'rgba(150,240,255,0.25)'; g.strokeStyle = '#e8eaee'; g.lineWidth = 6;
        g.beginPath(); g.moveTo(-28, -170); g.lineTo(28, -170); g.lineTo(28, -100); g.quadraticCurveTo(110, -60, 110, 30); g.quadraticCurveTo(110, 120, 0, 120); g.quadraticCurveTo(-110, 120, -110, 30); g.quadraticCurveTo(-110, -60, -28, -100); g.closePath(); g.fill(); g.stroke();
        g.save(); g.clip(); g.fillStyle = '#5ef0ff'; g.shadowColor = '#5ef0ff'; g.shadowBlur = 30; g.beginPath(); g.moveTo(-120, -10 + Math.sin(tl * 5) * 6); g.quadraticCurveTo(0, -30 - Math.sin(tl * 5) * 6, 120, -10); g.lineTo(120, 130); g.lineTo(-120, 130); g.closePath(); g.fill(); g.restore();
        g.fillStyle = '#c9a36b'; g.fillRect(-34, -198, 68, 30); g.strokeRect(-34, -198, 68, 30);
        for (let i = 0; i < 7; i++) { const a = tl * 1.6 + i * 0.9, r = 150 + (i % 3) * 30; const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.7 - 20; g.fillStyle = '#ffffff'; g.globalAlpha = (0.5 + 0.5 * Math.sin(tl * 6 + i)) * (1 - xk2); g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 4, y); g.lineTo(x, y + 12); g.lineTo(x - 4, y); g.closePath(); g.fill(); }
        g.restore();
        text(g, 'MIRACLE CURE', bx, by + 165, 24, '#c8f6ff', { ls: '5px', alpha: 1 - xk2 * 0.5 });
        g.save(); g.strokeStyle = V.COL.red; g.lineWidth = 18; g.lineCap = 'round'; g.shadowColor = V.COL.red; g.shadowBlur = 20;
        if (xk > 0) { g.beginPath(); g.moveTo(bx - 150, by - 180); g.lineTo(bx - 150 + 300 * xk, by - 180 + 340 * xk); g.stroke(); }
        if (xk2 > 0) { g.beginPath(); g.moveTo(bx + 150, by - 180); g.lineTo(bx + 150 - 300 * xk2, by - 180 + 340 * xk2); g.stroke(); }
        g.restore();
      },
    };
  };

  // ─────────────────────────────── 16 · YOU NEED THE BORING BASICS — plain concrete, four tiles
  const TILE4 = [[175, 920], [175, 1170], [905, 920], [905, 1170]];
  V.actions.h_basics = function (tl, sc) {
    const n = host(tl, sc, { gesture: V.frontGesture(tl, [[0, 'explain'], [0.75, 'count']]), s: kf(tl, [[0, 1.14], [1.7, 1.2]], ease.inOut), beam: 0.4 });
    return {
      figs: [n],
      back(g) {
        bg(g, '#2b2b2e', '#222224', '#151516'); ground(g, '#262628', '#0d0d0e', 'rgba(255,255,255,0.12)');
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 3; for (let x = -120; x < 1300; x += 240) { g.beginPath(); g.moveTo(x, 600); g.lineTo(x, F); g.stroke(); } g.restore();
        pool(g, 540, 'rgba(255,255,255,0.18)');
      },
      front(g) {
        TILE4.forEach(([x, y], i) => { tile(g, BASICS[i], x, y, V.pop(tl - (0.35 + i * 0.14), 0.16), false); });
      },
    };
  };

  // ─────────────────────────────── 17 · SLEEP. WATER. SUNLIGHT. MOVEMENT. — four worlds, one per word
  const BEATS = [0, 1.055, 1.872, 2.93];
  function pushup(t) {
    const down = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / 0.5));
    const hx = V.lerp(54, 35, down);
    return [Object.assign({}, PO.stand, { hB: [hx - 2, -86], hF: [hx, -87], fB: [0, -4], fF: [3, -4], hd: [2, -1], eB: [0.4, 1], eF: [0.4, 1] }), (58 + 10 * down) * DEG];
  }
  V.actions.h_four = function (tl) {
    const b = tl < BEATS[1] ? 0 : tl < BEATS[2] ? 1 : tl < BEATS[3] ? 2 : 3, bt = tl - BEATS[b];
    let figs = [], back, mid, front;
    if (b === 0) {
      const me = lying({ x: 700, pose: V.shift(PO.lie, 0, -Math.sin(tl * 1.5) * 0.7), expr: 'sleepy' });
      figs = [me];
      back = (g) => bedroom(g, tl, 0);
      mid = (g) => { V.bed(g, 290, 740, BED_TOP, true, '#2b3f6b'); V.pillow(g, 350, BED_TOP - 4); };
      front = (g) => { V.bedBlanket(g, 480, 740, BED_TOP, '#2f4a80'); const h = V.figPoint(me, 'H'); zzz(g, h[0] + 30, h[1] - 50, tl); };
    } else if (b === 1) {
      const me = ME({ x: 330, face: 1, pose: V.lerpPose(PO.stand, PO.drink, ease.out(seg(bt, 0, 0.3))), expr: 'smile' });
      figs = [me];
      const lvl = ease.out(seg(bt, 0.05, 0.75));
      back = (g) => { bg(g, '#0c4a6a', '#08344c', '#041a26'); ground(g, '#0a2a3a', '#03101a', 'rgba(140,220,255,0.3)'); glow(g, 720, 1050, 460, 'rgba(120,220,255,0.2)'); };
      front = (g) => {
        V.glass(g, V.figPoint(me, 'hF'));
        const gx = 720, top = 840, bot = 1330, w0 = 140, w1 = 115;
        g.save(); g.beginPath(); g.moveTo(gx - w0, top); g.lineTo(gx + w0, top); g.lineTo(gx + w1, bot); g.lineTo(gx - w1, bot); g.closePath();
        g.fillStyle = 'rgba(200,235,255,0.12)'; g.fill(); g.save(); g.clip();
        const wy = V.lerp(bot, top + 60, lvl);
        g.fillStyle = 'rgba(90,200,255,0.75)'; g.beginPath(); g.moveTo(gx - 200, wy); for (let x = -200; x <= 200; x += 20) g.lineTo(gx + x, wy + Math.sin(x * 0.05 + bt * 10) * 8); g.lineTo(gx + 200, bot + 10); g.lineTo(gx - 200, bot + 10); g.closePath(); g.fill();
        for (let i = 0; i < 8; i++) { const u = (bt * 1.2 + i / 8) % 1; g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(gx - 80 + i * 22, V.lerp(bot - 10, wy + 10, u), 5, 0, 6.283); g.fill(); }
        g.restore();
        g.strokeStyle = '#e8eaee'; g.lineWidth = 7; g.beginPath(); g.moveTo(gx - w0, top); g.lineTo(gx - w1, bot); g.lineTo(gx + w1, bot); g.lineTo(gx + w0, top); g.stroke(); g.restore();
        if (bt < 0.6) { g.save(); g.fillStyle = 'rgba(120,210,255,0.9)'; g.fillRect(gx - 9, 560, 18, V.lerp(0, 1, seg(bt, 0, 0.15)) * (V.lerp(bot, top + 60, lvl) - 560)); g.restore(); }
      };
    } else if (b === 2) {
      const me = ME({ x: 340, face: 1, pose: V.lerpPose(PO.stand, PO.armsUp, ease.out(seg(bt, 0.05, 0.35))), expr: 'smile' });
      figs = [me];
      back = (g) => { bg(g, '#3a1d4a', '#b0503a', '#f6a24e'); V.sunrise(g, 720, 1260, 0.55 + 0.45 * ease.out(seg(bt, 0, 0.8))); glow(g, 720, 1100, 700, 'rgba(255,200,120,0.25)'); ground(g, '#5a2e22', '#1a0c08'); };
      front = (g) => { g.save(); g.globalAlpha = 0.5; g.strokeStyle = '#ffd38a'; g.lineWidth = 6; for (let i = 0; i < 10; i++) { const a = -Math.PI + i * Math.PI / 9 + bt * 0.2; g.beginPath(); g.moveTo(720 + Math.cos(a) * 160, 1150 + Math.sin(a) * 160); g.lineTo(720 + Math.cos(a) * 240, 1150 + Math.sin(a) * 240); g.stroke(); } g.restore(); };
    } else {
      const [p, rot] = pushup(bt + 0.25);
      const me = ME({ x: 280, s: 1.0, rot, pose: p, expr: 'focus' });
      figs = [me];
      back = (g) => { bg(g, '#0f3a24', '#0b2a1a', '#06160d'); ground(g, '#143220', '#04100a', 'rgba(127,224,160,0.35)'); glow(g, 540, 1200, 600, 'rgba(127,224,160,0.14)');
        g.save(); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-300, F + 30 + i * 40); g.lineTo(1400, F + 30 + i * 40); g.stroke(); } g.restore(); };
      front = (g) => { const v = Math.round(1 + bt * 4); text(g, 'REPS', 800, 950, 30, '#9a9da7', { ls: '6px' }); text(g, String(v), 800, 1060, 170, '#7fe0a0', { font: '"Cormorant Garamond", serif', weight: 'italic 600' }); };
    }
    const flash = 1 - seg(bt, 0, 0.12);
    return {
      figs,
      back, mid,
      front(g) {
        if (front) front(g);
        BASICS.forEach((kind, i) => tile(g, kind, 540 + (i - 1.5) * 165, 735, 1, i <= b, 110));
        if (b > 0 && flash > 0) { g.save(); g.globalAlpha = flash * 0.5; g.fillStyle = '#fff'; g.fillRect(-400, 400, 1900, 1200); g.restore(); }
      },
    };
  };

  // ─────────────────────────────── 18 · EVERY SINGLE DAY — sun and moon wheel round, the streak fills
  V.actions.h_daily = function (tl) {
    const u = seg(tl, 0.1, 1.35), days = u * 7, n = Math.min(7, Math.floor(days + 0.5));
    const day = 0.5 - 0.5 * Math.cos(days * 2 * Math.PI);
    const ang = Math.PI + days * 2 * Math.PI;
    const mix = (a, b2) => a.map((v, i) => Math.round(V.lerp(v, b2[i], day)));
    const sky1 = mix([10, 16, 40], [70, 140, 200]), sky2 = mix([6, 10, 24], [180, 210, 230]);
    return {
      figs: [],
      back(g) {
        bg(g, `rgb(${sky1})`, `rgb(${sky2})`);
        const cx = 540, cy = 1330, R = 460;
        g.save(); g.fillStyle = '#FFC46B'; g.shadowColor = '#FFB347'; g.shadowBlur = 40; g.beginPath(); g.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R * 0.9, 56, 0, 6.283); g.fill();
        g.fillStyle = '#f4f1e0'; g.shadowColor = '#f4f1e0'; g.beginPath(); g.arc(cx - Math.cos(ang) * R, cy - Math.sin(ang) * R * 0.9, 40, 0, 6.283); g.fill(); g.restore();
        g.fillStyle = '#123020'; g.beginPath(); g.moveTo(-400, 1300); g.quadraticCurveTo(540, 1200, 1500, 1300); g.lineTo(1500, 1800); g.lineTo(-400, 1800); g.closePath(); g.fill();
      },
      front(g) {
        const k = V.pop(tl, 0.16); g.save(); g.translate(540, 1200); g.scale(1.3 * k, 1.3 * k); V.streak(g, 0, 0, n); g.restore();
        if (n >= 7) text(g, '7 / 7', 540, 1370, 34, '#7fe0a0', { ls: '6px', alpha: seg(tl, 1.3, 1.45) });
      },
    };
  };

  // ─────────────────────────────── 19 · YOU DON'T NOTICE HEALTH… UNTIL IT'S GONE — the battery drains behind your back
  V.actions.h_notice = function (tl) {
    const GONE = 1.92;
    const lvl = tl < GONE ? V.lerp(1, 0.04, ease.in(seg(tl, 0.15, GONE))) : 0;
    const turned = tl > GONE + 0.05;
    const me = ME({ x: 600, face: turned ? -1 : 1,
      pose: turned ? poseAt(tl, [[GONE + 0.05, PO.flinch], [GONE + 0.5, PO.stand]]) : V.set(PO.type, 'hF', [36, -60 + Math.sin(tl * 7) * 1.2]),
      expr: turned ? 'shock' : 'focus' });
    const blink = tl > GONE ? (Math.sin(tl * 16) > 0 ? 1 : 0.35) : 1;
    return {
      figs: [me],
      back(g) {
        bg(g, '#0d1322', '#0a0e19', '#06080d'); ground(g, '#0e1220', '#04060a', 'rgba(255,255,255,0.08)');
        window_(g, 720, 800, 480, 250, '#0a1020', () => { skyline(g, 31, '#060912', ['rgba(255,214,150,0.4)', 'rgba(170,190,230,0.3)'], 935, 80, 210); });
        glow(g, 780, 1120, 300, 'rgba(159,195,255,0.18)');
        if (tl > GONE) glow(g, 300, 1000, 600, `rgba(224,52,74,${0.18 * blink})`);
      },
      mid(g) { V.desk(g, 770, true, 1); },
      front(g) {
        g.save(); g.globalAlpha = blink; V.battery(g, 250, 930, lvl, 0.78); g.restore();
        text(g, 'HEALTH', 242, 845, 24, '#9a9da7', { ls: '6px' });
        text(g, Math.round(lvl * 100) + '%', 242, 1020, 40, lvl > 0.2 ? '#F4F5F7' : '#ff4660', { alpha: blink });
        if (turned) { const h = V.figPoint(me, 'H'); text(g, '!', h[0] + 10, h[1] - 120, 90, '#ff4660', { font: V.FONT.serif, weight: 400, alpha: V.pop(tl - GONE - 0.05, 0.12) }); }
      },
    };
  };

  // ─────────────────────────────── 20 · PROTECT IT WHILE YOU STILL HAVE IT — hand on heart, then the point
  V.actions.h_protect = function (tl, sc) {
    const gesture = V.frontGesture(tl, [[0, 'chest'], [0.72, 'point']]);
    const point = kf(tl, [[0, 0], [0.72, 0], [0.98, 1], [2.1, 1]], ease.inOut);
    const n = host(tl, sc, { x: 600, gesture, point, firm: true, smile: false, s: kf(tl, [[0, 1.2], [2.0, 1.32]], ease.inOut), beamWarm: 0.6 });
    const k = V.pop(tl - 0.15, 0.2);
    return {
      figs: [n],
      back(g) {
        bg(g, '#241632', '#6a2a36', '#c0603a'); V.sunrise(g, 600, 1240, 0.5 + 0.3 * tl / 2);
        ground(g, '#3a1c1a', '#0e0606');
        pool(g, 600, 'rgba(255,200,150,0.35)');
      },
      front(g) {
        if (k <= 0) return;
        const x = 200, y = 930;
        glow(g, x, y, 220 * k, 'rgba(224,52,74,0.3)');
        g.save(); g.translate(x, y); g.scale(k, k);
        g.fillStyle = 'rgba(14,15,20,0.85)'; g.strokeStyle = '#F4F5F7'; g.lineWidth = 6;
        g.beginPath(); g.moveTo(0, -130); g.quadraticCurveTo(70, -100, 110, -100); g.quadraticCurveTo(115, 40, 0, 130); g.quadraticCurveTo(-115, 40, -110, -100); g.quadraticCurveTo(-70, -100, 0, -130); g.closePath(); g.fill(); g.stroke();
        g.restore();
        V.heart(g, x, y - 4, 3 * k * (1 + 0.07 * Math.sin(tl * 9)));
      },
    };
  };

  // ─────────────────────────────── 21 · CTA — learn to be unreadable
  V.actions.h_cta = function (tl, sc) {
    const n = host(tl, sc, { x: 230, s: 1.08, gesture: V.frontGesture(tl, [[0, 'present']]), look: [0.4, 0], beam: 0.9 });
    return {
      figs: [n],
      back(g) { bg(g, '#120c14', '#1e0c16', '#2a0c14'); ground(g, '#1a0a10', '#060204'); V.geo(g, 'ring', 640, 930, 330, tl * 0.2, 'rgba(224,52,74,1)', 0.35, 4); },
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
