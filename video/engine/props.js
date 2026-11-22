/* Reusable props: speech bubbles, jagged shout bubble, phone, notification, leash, scanner,
   readout screen, sweat, impact. All in screen px. */
(function () {
  const V = window.V;

  function withScale(g, cx, cy, k, fn) { g.save(); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy); fn(); g.restore(); }

  // Rounded speech/message bubble. o: {x,y (centre), text, size, fill, color, tail:[x,y]|null, pad, rot, scale, font, maxW}
  V.bubble = function (g, o) {
    const size = o.size || 32;
    g.save();
    g.font = o.font || `600 ${size}px ${V.FONT.sans}`;
    const tw = g.measureText(o.text).width;
    const w = tw + (o.padX || size * 0.9) * 2, h = size * 1.9;
    g.translate(o.x, o.y); if (o.rot) g.rotate(o.rot); const k = o.scale == null ? 1 : o.scale; g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 16; g.shadowOffsetY = 4;
    g.fillStyle = o.fill || '#F4F5F7';
    V.roundRect(g, -w / 2, -h / 2, w, h, h * 0.45); g.fill();
    if (o.tail) {
      const tx = o.tail[0] - o.x, ty = o.tail[1] - o.y;
      g.beginPath(); g.moveTo(Math.sign(tx) * w * 0.12 - 14, h / 2 - 4); g.lineTo(Math.sign(tx) * w * 0.12 + 14, h / 2 - 4); g.lineTo(tx / k, ty / k); g.closePath(); g.fill();
    }
    g.shadowColor = 'transparent';
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 3; V.roundRect(g, -w / 2, -h / 2, w, h, h * 0.45); g.stroke(); }
    g.fillStyle = o.color || '#101116'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(o.text, 0, 2);
    g.restore();
    return { w, h };
  };
  V.measureBubble = function (g, text, size, font) {
    g.save(); g.font = font || `600 ${size}px ${V.FONT.sans}`; const w = g.measureText(text).width + size * 1.8; g.restore(); return { w, h: size * 1.9 };
  };

  // Jagged "shout" bubble
  V.jagged = function (g, cx, cy, rx, ry, text, o = {}) {
    const n = o.spikes || 18, r = V.rng(o.seed || 5), k = o.scale == null ? 1 : o.scale;
    g.save(); g.translate(cx + (o.shake ? (r() - 0.5) * o.shake : 0), cy); g.rotate(o.rot || 0); g.scale(k, k);
    g.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2, out = i % 2 === 0 ? 1.18 + r() * 0.12 : 0.9;
      const x = Math.cos(a) * rx * out, y = Math.sin(a) * ry * out;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
    g.shadowColor = 'rgba(224,52,74,0.7)'; g.shadowBlur = 30;
    g.fillStyle = o.fill || '#E0344A'; g.fill();
    g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.stroke();
    g.fillStyle = o.color || '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = text.split('\n'), fs = o.size || 40;
    g.font = `800 ${fs}px ${V.FONT.sans}`;
    lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * fs * 1.05 + 2));
    g.restore();
  };

  // Phone in screen space: centre x,y, angle, height px, screen: 'on'|'off'|'down'
  V.phone = function (g, x, y, ang, hgt, screen = 'on', t = 0) {
    const w = hgt * 0.52;
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#0d0e12'; g.strokeStyle = '#cfd2da'; g.lineWidth = 3;
    V.roundRect(g, -w / 2, -hgt / 2, w, hgt, 10); g.fill(); g.stroke();
    if (screen === 'on') {
      g.shadowColor = 'rgba(160,200,255,0.9)'; g.shadowBlur = 26;
      g.fillStyle = '#9fc3ff'; V.roundRect(g, -w / 2 + 5, -hgt / 2 + 6, w - 10, hgt - 12, 6); g.fill();
      g.shadowBlur = 0; g.fillStyle = '#ffffff'; V.roundRect(g, -w / 2 + 9, -hgt / 2 + 14, w - 18, hgt * 0.22, 4); g.fill();
    } else if (screen === 'down') {
      g.fillStyle = '#2a2c34'; V.roundRect(g, -w / 2 + 5, -hgt / 2 + 6, w - 10, hgt - 12, 6); g.fill();
      g.fillStyle = '#5a5d66'; g.beginPath(); g.arc(-w / 2 + 14, -hgt / 2 + 16, 4, 0, 6.283); g.fill();
    }
    g.restore();
  };

  // Phone notification card
  V.notification = function (g, cx, cy, w, k, app, body, emojiFace = true) {
    const h = 176;
    withScale(g, cx, cy, k, () => {
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 40; g.shadowOffsetY = 10;
      g.fillStyle = 'rgba(246,247,250,0.98)'; V.roundRect(g, cx - w / 2, cy - h / 2, w, h, 32); g.fill();
      g.restore();
      // app icon
      const ix = cx - w / 2 + 28, iy = cy - h / 2 + 34;
      g.fillStyle = V.COL.red; V.roundRect(g, ix, iy, 76, 76, 18); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix + 38, iy + 35, 24, 18, 0, 0, 6.283); g.fill();
      g.beginPath(); g.moveTo(ix + 21, iy + 45); g.lineTo(ix + 16, iy + 60); g.lineTo(ix + 33, iy + 50); g.fill();
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillStyle = '#5b5e68'; g.font = `600 30px ${V.FONT.sans}`; g.letterSpacing = '2px';
      g.fillText(app, ix + 98, iy + 26); g.letterSpacing = '0px';
      g.textAlign = 'right'; g.fillText('now', cx + w / 2 - 30, iy + 26);
      g.textAlign = 'left'; g.fillStyle = '#0d0e12'; g.font = `700 54px ${V.FONT.sans}`;
      g.fillText(body, ix + 98, iy + 84);
      if (emojiFace) {
        const tw = g.measureText(body).width;
        V.neutralEmoji(g, ix + 98 + tw + 38, iy + 66, 29);
      }
    });
  };
  // 😐 drawn as vector (no emoji-font dependency)
  V.neutralEmoji = function (g, x, y, r) {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, '#FFE27A'); gr.addColorStop(1, '#F5B829');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    g.fillStyle = '#5b3a12';
    g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.15, r * 0.11, r * 0.2, 0, 0, 6.283); g.fill();
    g.beginPath(); g.ellipse(x + r * 0.35, y - r * 0.15, r * 0.11, r * 0.2, 0, 0, 6.283); g.fill();
    g.fillRect(x - r * 0.42, y + r * 0.38, r * 0.84, r * 0.12);
  };

  // Glowing leash from a (hand) to b (neck); slack 0 = taut
  V.leash = function (g, a, b, slack, alpha = 1, collarR = 46) {
    g.save(); g.globalAlpha = alpha;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + slack;
    g.lineCap = 'round';
    for (const [w, c, blur] of [[30, 'rgba(255,60,80,0.35)', 36], [13, '#E0344A', 22], [4, '#ffd0d5', 0]]) {
      g.shadowColor = '#ff2a44'; g.shadowBlur = blur; g.strokeStyle = c; g.lineWidth = w;
      g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mx, my, b[0], b[1]); g.stroke();
    }
    // collar
    for (const [w, c, blur] of [[24, 'rgba(255,60,80,0.4)', 30], [11, '#E0344A', 18], [3.5, '#ffd0d5', 0]]) {
      g.shadowColor = '#ff2a44'; g.shadowBlur = blur; g.strokeStyle = c; g.lineWidth = w;
      g.beginPath(); g.ellipse(b[0], b[1], collarR, collarR * 0.42, 0, 0, 6.283); g.stroke();
    }
    g.restore();
  };

  // Handheld scanner gun at p (screen), pointing angle
  V.scanner = function (g, p, ang, k = 1) {
    g.save(); g.translate(p[0], p[1]); g.rotate(ang); g.scale(k, k);
    g.fillStyle = '#2c2e36'; g.strokeStyle = '#8d909a'; g.lineWidth = 3;
    V.roundRect(g, -14, -20, 74, 30, 8); g.fill(); g.stroke();
    V.roundRect(g, -8, 2, 20, 34, 6); g.fill(); g.stroke();
    g.fillStyle = '#E0344A'; g.shadowColor = '#ff2a44'; g.shadowBlur = 18; g.beginPath(); g.arc(62, -5, 7, 0, 6.283); g.fill();
    g.restore();
  };
  // Laser fan from tip to a horizontal scan line across target
  V.laser = function (g, tip, cx, sy, halfW, alpha = 1) {
    g.save(); g.globalAlpha = alpha;
    const gr = g.createLinearGradient(tip[0], tip[1], cx, sy);
    gr.addColorStop(0, 'rgba(255,40,64,0.45)'); gr.addColorStop(1, 'rgba(255,40,64,0.16)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(tip[0], tip[1]); g.lineTo(cx - halfW, sy); g.lineTo(cx + halfW, sy); g.closePath(); g.fill();
    g.shadowColor = '#ff2a44'; g.shadowBlur = 22; g.strokeStyle = '#ff4660'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx - halfW, sy); g.lineTo(cx + halfW, sy); g.stroke();
    g.strokeStyle = '#ffd7dc'; g.lineWidth = 2; g.stroke();
    g.restore();
  };

  // Readout screen above a character. st: {progress 0..1, tags:[], result:'DATA'|'NODATA'|null, glitch 0..1, t}
  V.readout = function (g, cx, cy, st) {
    const w = 330, h = 118, x = cx - w / 2, y = cy - h / 2;
    const k = st.scale == null ? 1 : st.scale;
    withScale(g, cx, cy, k, () => {
      const isNo = st.result === 'NODATA';
      const edge = isNo ? '#e8eaee' : V.COL.red;
      g.save();
      g.shadowColor = isNo ? 'rgba(255,255,255,0.35)' : 'rgba(224,52,74,0.6)'; g.shadowBlur = 24;
      g.fillStyle = 'rgba(14,15,20,0.96)'; V.roundRect(g, x, y, w, h, 14); g.fill();
      g.shadowBlur = 0; g.strokeStyle = edge; g.lineWidth = 4; V.roundRect(g, x, y, w, h, 14); g.stroke();
      g.restore();
      g.textBaseline = 'middle'; g.textAlign = 'center';
      if (st.result === 'DATA') {
        g.fillStyle = '#ffffff'; g.font = `800 50px ${V.FONT.sans}`; g.letterSpacing = '4px';
        g.fillText('DATA', cx - 26, cy + 2); g.letterSpacing = '0px';
        // check mark
        g.strokeStyle = V.COL.red; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(cx + 66, cy + 2); g.lineTo(cx + 82, cy + 18); g.lineTo(cx + 112, cy - 16); g.stroke();
      } else if (isNo) {
        const gl = st.glitch || 0, r = V.rng(Math.floor((st.t || 0) * 30) + 3);
        g.save(); g.beginPath(); V.roundRect(g, x + 3, y + 3, w - 6, h - 6, 12); g.clip();
        for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(255,255,255,${0.06 + r() * 0.12 * (0.4 + gl)})`; g.fillRect(x, y + r() * h, w, 3 + r() * 10); }
        g.font = `800 50px ${V.FONT.sans}`; g.letterSpacing = '4px';
        const off = 4 + gl * 10 * r();
        g.globalAlpha = 0.85; g.fillStyle = '#ff2a44'; g.fillText('NO DATA', cx - off + 2, cy + 2);
        g.fillStyle = '#39d0ff'; g.fillText('NO DATA', cx + off + 2, cy + 2);
        g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillText('NO DATA', cx + 2, cy + 2);
        g.letterSpacing = '0px';
        g.restore();
      } else {
        g.fillStyle = '#E4E6EB'; g.font = `700 34px ${V.FONT.sans}`; g.letterSpacing = '5px';
        g.fillText(st.label || 'READING…', cx + 3, y + 30); g.letterSpacing = '0px';
        g.fillStyle = '#24262e'; g.fillRect(x + 22, y + 56, w - 44, 16);
        g.fillStyle = st.barColor || V.COL.red; g.fillRect(x + 22, y + 56, (w - 44) * V.clamp(st.progress || 0), 16);
        if (st.tags && st.tags.length) {
          g.font = `800 34px ${V.FONT.sans}`; g.fillStyle = V.COL.red; g.letterSpacing = '3px';
          g.fillText(st.tags[st.tags.length - 1], cx + 1, y + 96); g.letterSpacing = '0px';
        }
      }
    });
  };

  // Sweat drops around a head (screen px)
  V.sweat = function (g, hx, hy, t, amount = 1, seed = 9) {
    const r = V.rng(seed);
    for (let i = 0; i < Math.round(5 * amount); i++) {
      const per = 0.7 + r() * 0.5, off = r() * per, u = ((t + off) % per) / per;
      const side = r() > 0.5 ? 1 : -1;
      const x = hx + side * (40 + r() * 30), y = hy - 40 + r() * 30 + u * 90;
      const s = 10 + r() * 6;
      g.save(); g.globalAlpha = Math.sin(u * Math.PI) * 0.95;
      g.fillStyle = '#8fd3ff'; g.strokeStyle = '#ffffff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y - s * 1.6); g.quadraticCurveTo(x + s, y, x, y + s * 0.7); g.quadraticCurveTo(x - s, y, x, y - s * 1.6); g.fill(); g.stroke();
      g.restore();
    }
  };

  // Impact burst
  V.impact = function (g, x, y, u) {
    if (u < 0 || u > 1) return;
    const k = V.ease.out(u), a = 1 - u;
    g.save(); g.translate(x, y); g.globalAlpha = a;
    g.fillStyle = '#ffffff'; g.shadowColor = '#ffffff'; g.shadowBlur = 40;
    g.beginPath();
    for (let i = 0; i < 20; i++) { const ang = (i / 20) * 6.283, rr = (i % 2 ? 40 : 110) * (0.5 + k); g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    g.closePath(); g.fill();
    g.strokeStyle = V.COL.red; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 60 + 120 * k, 0, 6.283); g.stroke();
    g.restore();
  };

  // Motion arc (wild punch whoosh)
  V.whoosh = function (g, cx, cy, r, a0, a1, alpha) {
    g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r, a0, a1, a1 < a0); g.stroke();
    g.strokeStyle = 'rgba(224,52,74,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r + 14, a0, a1, a1 < a0); g.stroke();
    g.restore();
  };

  // ───────── Pt. 3 props
  // Dark speech/thought bubble: dark fill, thin outline (red = Reactive, white = Steady/others)
  V.darkBubble = function (g, o) {
    return V.bubble(g, Object.assign({ fill: '#15161c', color: '#ffffff', stroke: o.red ? V.COL.red : '#e8eaee', size: 52, font: `700 ${o.size || 52}px ${V.FONT.sans}` }, o));
  };

  // Alarm card (same family as the notification): clock icon, ALARM, big time, shakes while ringing
  V.alarmCard = function (g, cx, cy, w, k, time, sub, shake = 0, t = 0) {
    const h = 210;
    g.save();
    g.translate(cx + Math.sin(t * 80) * shake * 6, cy); g.rotate(Math.sin(t * 61) * shake * 0.025); g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 40; g.shadowOffsetY = 10;
    g.fillStyle = 'rgba(246,247,250,0.98)'; V.roundRect(g, -w / 2, -h / 2, w, h, 36); g.fill();
    g.shadowColor = 'transparent';
    const ix = -w / 2 + 34, iy = -h / 2 + 40;
    g.fillStyle = V.COL.red; V.roundRect(g, ix, iy, 96, 96, 22); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(ix + 48, iy + 50, 28, 0, 6.283); g.stroke();
    g.beginPath(); g.moveTo(ix + 48, iy + 50); g.lineTo(ix + 48, iy + 33); g.moveTo(ix + 48, iy + 50); g.lineTo(ix + 61, iy + 57); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#5b5e68'; g.font = `700 36px ${V.FONT.sans}`; g.letterSpacing = '4px';
    g.fillText('ALARM', ix + 124, iy + 30); g.letterSpacing = '0px';
    g.fillStyle = '#0d0e12'; g.font = `800 84px ${V.FONT.sans}`;
    g.fillText(time, ix + 122, iy + 112);
    if (sub) { g.textAlign = 'right'; g.fillStyle = '#5b5e68'; g.font = `600 36px ${V.FONT.sans}`; g.fillText(sub, w / 2 - 34, iy + 30); }
    g.restore();
    if (shake > 0.05) { // ring marks
      g.save(); g.strokeStyle = `rgba(255,255,255,${0.7 * shake})`; g.lineWidth = 6; g.lineCap = 'round';
      for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
        const x0 = cx + sx * (w / 2 * k + 26 + i * 22);
        g.beginPath(); g.arc(x0 - sx * 70, cy, 60 + i * 22, sx > 0 ? -0.5 : Math.PI - 0.5, sx > 0 ? 0.5 : Math.PI + 0.5); g.stroke();
      }
      g.restore();
    }
  };

  // Brick (world px), centre x,y
  V.brick = function (g, x, y, rot = 0, w = 92, h = 44) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = '#c9cbd3'; g.strokeStyle = '#16171c'; g.lineWidth = 4;
    V.roundRect(g, -w / 2, -h / 2, w, h, 5); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(-w / 2 + 6, -h / 2 + 5, w - 12, 5);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-w / 2 + 6, h / 2 - 9, w - 12, 5);
    g.restore();
  };

  // Small caption (e.g. DAY 9) — bold, spaced
  V.caption = function (g, x, y, text, color = '#F4F5F7', size = 52, k = 1) {
    g.save(); g.translate(x, y); g.scale(k, k);
    g.font = `800 ${size}px ${V.FONT.sans}`; g.letterSpacing = `${Math.round(size * 0.12)}px`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.fillStyle = color; g.fillText(text, size * 0.06, 0);
    g.restore();
  };

  // Timer panel (squat hold)
  V.timerPanel = function (g, cx, cy, text, state = 'run', k = 1) {
    const w = 300, h = 118, col = state === 'quit' ? V.COL.red : '#e8eaee';
    g.save(); g.translate(cx, cy); g.scale(k, k);
    g.shadowColor = state === 'quit' ? 'rgba(224,52,74,0.6)' : 'rgba(255,255,255,0.3)'; g.shadowBlur = 24;
    g.fillStyle = 'rgba(14,15,20,0.96)'; V.roundRect(g, -w / 2, -h / 2, w, h, 16); g.fill();
    g.shadowBlur = 0; g.strokeStyle = col; g.lineWidth = 4; V.roundRect(g, -w / 2, -h / 2, w, h, 16); g.stroke();
    g.fillStyle = state === 'quit' ? V.COL.red : '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 70px ${V.FONT.sans}`; g.letterSpacing = '3px';
    g.fillText(text, 2, 4);
    g.restore();
  };

  // Phone on a tripod, screen facing the viewer
  V.tripodPhone = function (g, x, rec = true, t = 0, screen = null) {
    const top = V.FLOOR - 300;
    g.save(); g.strokeStyle = '#cfd2da'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, top + 70); g.lineTo(x - 60, V.FLOOR); g.moveTo(x, top + 70); g.lineTo(x + 60, V.FLOOR); g.moveTo(x, top + 70); g.lineTo(x, V.FLOOR - 10); g.stroke();
    g.fillStyle = '#0d0e12'; g.strokeStyle = '#e8eaee'; g.lineWidth = 5;
    V.roundRect(g, x - 58, top - 110, 116, 196, 18); g.fill(); g.stroke();
    if (screen) { g.fillStyle = '#1b1d25'; V.roundRect(g, x - 48, top - 98, 96, 172, 10); g.fill(); }
    if (rec) {
      const on = Math.floor(t * 2.4) % 2 === 0;
      g.fillStyle = on ? '#ff2a44' : 'rgba(255,42,68,0.35)'; g.shadowColor = '#ff2a44'; g.shadowBlur = on ? 20 : 0;
      g.beginPath(); g.arc(x - 20, top - 70, 11, 0, 6.283); g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#fff'; g.font = `800 26px ${V.FONT.sans}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('REC', x - 4, top - 69);
    }
    g.restore();
    return [x, top - 110];
  };

  // Jump rope between two hands (world points); phase 0..1 per turn
  V.jumpRope = function (g, a, b, phase, topY, botY) {
    const th = phase * Math.PI * 2;
    const midX = (a[0] + b[0]) / 2, midY = (a[1] + b[1]) / 2;
    const apexY = V.lerp(topY, botY, 0.5 - 0.5 * Math.cos(th));
    const cy = midY + 2 * (apexY - midY);
    g.save(); g.strokeStyle = '#f4f5f7'; g.lineWidth = 5; g.lineCap = 'round';
    g.globalAlpha = Math.abs(Math.sin(th)) < 0.25 ? 0.65 : 1; // motion blur feel when passing the sides
    g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(midX + 40 * Math.sin(th), cy, b[0], b[1]); g.stroke();
    g.restore();
  };

  // Blanket over a seated figure (world px): mound from the floor up to the shoulders
  V.blanket = function (g, x, topY, w, k = 1) {
    g.save(); g.translate(x, V.FLOOR); g.scale(1, k);
    g.fillStyle = '#5a2730'; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w / 2, -(V.FLOOR - topY) * 0.9, -w * 0.18, -(V.FLOOR - topY) * 1.08, w * 0.08, -(V.FLOOR - topY));
    g.bezierCurveTo(w * 0.35, -(V.FLOOR - topY) * 0.95, w / 2, -(V.FLOOR - topY) * 0.55, w / 2, 0); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-w * 0.3, -(V.FLOOR - topY) * 0.5); g.quadraticCurveTo(0, -(V.FLOOR - topY) * 0.62, w * 0.3, -(V.FLOOR - topY) * 0.45); g.stroke();
    g.restore();
  };
})();
