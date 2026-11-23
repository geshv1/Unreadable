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

  // ───────── Pt. 4 props
  // Result card (same family as the notification / alarm): RESULT + big WIN / LOSS
  V.resultCard = function (g, cx, cy, w, k, word, color) {
    const h = 200;
    g.save(); g.translate(cx, cy); g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 40; g.shadowOffsetY = 10;
    g.fillStyle = 'rgba(246,247,250,0.98)'; V.roundRect(g, -w / 2, -h / 2, w, h, 36); g.fill();
    g.shadowColor = 'transparent';
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = '#5b5e68'; g.font = `700 38px ${V.FONT.sans}`; g.letterSpacing = '8px';
    g.fillText('RESULT', -w / 2 + 50, 0);
    g.letterSpacing = '6px'; g.textAlign = 'right'; g.fillStyle = color; g.font = `800 104px ${V.FONT.sans}`;
    g.fillText(word, w / 2 - 44, 6);
    g.restore();
  };

  // Medal on a red ribbon hanging from the neck (world px)
  V.medal = function (g, neck, chest, k = 1) {
    g.save();
    g.strokeStyle = V.COL.red; g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(neck[0] - 26, neck[1] - 4); g.lineTo(chest[0], chest[1] - 22); g.lineTo(neck[0] + 26, neck[1] - 4); g.stroke();
    g.translate(chest[0], chest[1]); g.scale(k, k);
    // gold
    g.shadowColor = 'rgba(255,200,90,0.75)'; g.shadowBlur = 30;
    const gd = g.createRadialGradient(-10, -12, 4, 0, 0, 38); gd.addColorStop(0, '#FFE9A3'); gd.addColorStop(0.55, '#F2C14E'); gd.addColorStop(1, '#B9832A');
    g.fillStyle = gd; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    g.beginPath(); g.arc(0, 0, 34, 0, 6.283); g.fill(); g.stroke();
    g.shadowBlur = 0; g.strokeStyle = '#9c6a1c'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 22, 0, 6.283); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(-12, -14, 8, 4, -0.6, 0, 6.283); g.fill();
    g.fillStyle = '#16171c'; g.font = `800 28px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', 0, 2);
    g.restore();
  };
  V.medalFlat = function (g, x) { // lying on the floor
    g.save(); g.fillStyle = '#eef0f4'; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    g.beginPath(); g.ellipse(x, V.FLOOR - 8, 36, 10, 0, 0, 6.283); g.fill(); g.stroke();
    g.strokeStyle = V.COL.red; g.lineWidth = 9; g.beginPath(); g.moveTo(x + 30, V.FLOOR - 8); g.quadraticCurveTo(x + 70, V.FLOOR - 6, x + 96, V.FLOOR - 7); g.stroke();
    g.restore();
  };

  // Big block letter L (world px). x = left edge, bar w/h, foot length/height. dy = drop offset
  V.letterL = function (g, x, barW, barH, footL, footH, dy = 0, color = '#eef0f4') {
    const y0 = V.FLOOR + dy;
    g.save();
    g.fillStyle = color; g.strokeStyle = '#16171c'; g.lineWidth = 6; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - barH); g.lineTo(x + barW, y0 - barH); g.lineTo(x + barW, y0 - footH); g.lineTo(x + footL, y0 - footH); g.lineTo(x + footL, y0); g.closePath();
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0; g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + barW - 14, y0 - barH + 6, 8, barH - footH - 6);
    g.restore();
  };

  // Small rain cloud over a head (world px)
  V.rainCloud = function (g, cx, cy, t, k = 1) {
    g.save(); g.translate(cx, cy); g.scale(k, k);
    g.strokeStyle = 'rgba(160,200,255,0.7)'; g.lineWidth = 4; g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = -80 + i * 20, ph = ((t * 2.2 + i * 0.37) % 1);
      const y = 30 + ph * 150;
      g.globalAlpha = 1 - ph; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 10, y + 24); g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = '#3a3c46'; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    g.beginPath();
    g.arc(-55, 8, 36, Math.PI * 0.5, Math.PI * 1.5); g.arc(-20, -22, 42, Math.PI, Math.PI * 1.9); g.arc(32, -14, 40, Math.PI * 1.2, Math.PI * 0.1 + Math.PI * 2);
    g.arc(62, 12, 30, -Math.PI * 0.5, Math.PI * 0.5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };

  // Heart (like) icon
  V.heart = function (g, x, y, s, alpha = 1, color = V.COL.red) {
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = alpha;
    g.fillStyle = color; g.strokeStyle = '#fff'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-26, -4, -14, -26, 0, -12); g.bezierCurveTo(14, -26, 26, -4, 0, 14); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };

  // W / L result chip
  V.chip = function (g, x, y, letter, k = 1) {
    const win = letter === 'W', s = 120;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.shadowColor = win ? 'rgba(255,255,255,0.45)' : 'rgba(224,52,74,0.6)'; g.shadowBlur = 30;
    g.fillStyle = win ? '#f4f5f7' : V.COL.red; V.roundRect(g, -s / 2, -s / 2, s, s, 22); g.fill();
    g.shadowBlur = 0; g.fillStyle = win ? '#0d0e12' : '#ffffff'; g.font = `800 84px ${V.FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(letter, 2, 6);
    g.restore();
  };

  // Mood graph panel: samples = array of values in [-1, 1] drawn left->right
  V.moodGraph = function (g, cx, cy, samples, color, label) {
    const w = 300, h = 130, x = cx - w / 2, y = cy - h / 2;
    g.save();
    g.fillStyle = 'rgba(14,15,20,0.94)'; V.roundRect(g, x, y, w, h, 16); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; V.roundRect(g, x, y, w, h, 16); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(x + 16, cy); g.lineTo(x + w - 16, cy); g.stroke(); g.setLineDash([]);
    if (samples.length > 1) {
      g.strokeStyle = color; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
      g.shadowColor = color; g.shadowBlur = 14;
      g.beginPath();
      samples.forEach((v, i) => { const px = x + 18 + (i / (samples.length - 1)) * (w - 36) * (samples.length / samples.max), py = cy - v * (h / 2 - 18); i ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.stroke();
    }
    g.restore();
  };

  // Confetti (white + red) falling in a band
  V.confetti = function (g, t, x0, x1, alpha = 1, seed = 3) {
    const r = V.rng(seed);
    g.save(); g.globalAlpha = alpha;
    for (let i = 0; i < 46; i++) {
      const x = x0 + r() * (x1 - x0), sp = 260 + r() * 240, ph = r(), y = 600 + ((t * sp + ph * 800) % 800);
      g.save(); g.translate(x + Math.sin(t * 4 + i) * 14, y); g.rotate(t * (2 + r() * 4) + i);
      g.fillStyle = i % 3 ? '#f4f5f7' : V.COL.red; g.fillRect(-7, -4, 14, 8); g.restore();
    }
    g.restore();
  };

  // ───────── Pt. 5 props (cinematic)
  // Glowing ring on the floor around a character: their circle
  V.floorRing = function (g, x, rx, color, alpha = 1, t = 0) {
    g.save(); g.translate(x, V.FLOOR + 4); g.scale(1, 0.17); g.globalAlpha = alpha * (0.85 + 0.15 * Math.sin(t * 3));
    g.shadowColor = color; g.shadowBlur = 40; g.strokeStyle = color; g.lineWidth = 16;
    g.beginPath(); g.arc(0, 0, rx, 0, 6.283); g.stroke();
    g.shadowBlur = 0; g.globalAlpha *= 0.5; g.lineWidth = 5; g.strokeStyle = '#ffffff'; g.stroke();
    g.restore();
  };

  // Rain: streaks across the whole world area (slanted), plus splashes on the floor
  V.rain = function (g, t, amt = 1, seed = 11) {
    const r = V.rng(seed);
    g.save(); g.strokeStyle = 'rgba(190,210,240,0.45)'; g.lineWidth = 2.5; g.lineCap = 'round';
    for (let i = 0; i < 150 * amt; i++) {
      const x0 = -300 + r() * 1700, sp = 1700 + r() * 700, ph = r();
      const y = -200 + ((t * sp + ph * 1800) % 1800), x = x0 - y * 0.18;
      g.globalAlpha = 0.35 + r() * 0.5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 9, y + 46); g.stroke();
    }
    g.globalAlpha = 0.5; g.strokeStyle = 'rgba(210,225,250,0.6)'; g.lineWidth = 2;
    for (let i = 0; i < 26 * amt; i++) {
      const x = -100 + r() * 1300, ph = (t * 3 + r()) % 1;
      g.globalAlpha = (1 - ph) * 0.6; g.beginPath(); g.ellipse(x, V.FLOOR + 6, 6 + ph * 22, 2 + ph * 4, 0, 0, 6.283); g.stroke();
    }
    g.restore();
  };

  // Ladder (white line art) from the floor up to topY
  V.ladder = function (g, x, topY, w = 110) {
    g.save(); g.strokeStyle = '#e8eaee'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - w / 2, V.FLOOR); g.lineTo(x - w / 2, topY); g.moveTo(x + w / 2, V.FLOOR); g.lineTo(x + w / 2, topY); g.stroke();
    g.lineWidth = 6; g.strokeStyle = '#c9cbd3';
    for (let y = V.FLOOR - 64; y > topY + 10; y -= 64) { g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.stroke(); }
    g.restore();
  };

  // Corner stool
  V.stool = function (g, x, seatY) {
    g.save(); g.strokeStyle = '#c9cbd3'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 50, V.FLOOR); g.lineTo(x - 34, seatY); g.moveTo(x + 50, V.FLOOR); g.lineTo(x + 34, seatY); g.moveTo(x - 42, (V.FLOOR + seatY) / 2); g.lineTo(x + 42, (V.FLOOR + seatY) / 2); g.stroke();
    g.fillStyle = '#e8eaee'; g.strokeStyle = '#16171c'; g.lineWidth = 5; V.roundRect(g, x - 62, seatY - 14, 124, 22, 8); g.fill(); g.stroke();
    g.restore();
  };

  // Towel over a shoulder (world neck point)
  V.towel = function (g, neck, face = 1) {
    g.save(); g.translate(neck[0], neck[1]); g.scale(face, 1);
    g.fillStyle = '#f4f5f7'; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-40, -6); g.quadraticCurveTo(0, -26, 40, -6); g.lineTo(46, 110); g.lineTo(18, 116); g.lineTo(10, 14); g.lineTo(-14, 14); g.lineTo(-22, 120); g.lineTo(-50, 112); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };

  // Notebook + moving pen in front of a hand (world)
  V.notebook = function (g, hand, t, writing = true) {
    g.save(); g.translate(hand[0], hand[1]); g.rotate(-0.25);
    g.fillStyle = '#f4f5f7'; g.strokeStyle = '#16171c'; g.lineWidth = 4; V.roundRect(g, -46, -34, 92, 64, 6); g.fill(); g.stroke();
    g.strokeStyle = '#9a9da7'; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-34, -16 + i * 16); g.lineTo(-34 + (i === 2 && writing ? 30 + 30 * ((t * 1.5) % 1) : 64), -16 + i * 16); g.stroke(); }
    if (writing) { g.strokeStyle = V.COL.red; g.lineWidth = 6; const px = -4 + 30 * ((t * 1.5) % 1); g.beginPath(); g.moveTo(px, 18); g.lineTo(px + 26, -16); g.stroke(); }
    g.restore();
  };

  // Lightbulb glyph (for an "ideas" bubble)
  V.bulb = function (g, x, y, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.shadowColor = 'rgba(255,240,200,0.9)'; g.shadowBlur = 22; g.fillStyle = '#fff4d6';
    g.beginPath(); g.arc(0, -8, 20, Math.PI * 0.8, Math.PI * 2.2); g.lineTo(9, 16); g.lineTo(-9, 16); g.closePath(); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#9a9da7'; g.fillRect(-9, 18, 18, 5); g.fillRect(-7, 25, 14, 4);
    g.restore();
  };

  // A figure close to the lens: big, dark, blurred (screen space). feetY usually below the frame.
  V.fgFigure = function (g, f, blur = 9, alpha = 0.92) {
    g.save(); g.filter = `blur(${blur}px)`; g.globalAlpha = alpha;
    V.drawFigure(g, Object.assign({ kind: 'shadow' }, f));
    g.restore();
  };

  // ───────── Pt. 4 v2 objects
  V.gymBag = function (g, x, open = 0) { // duffel bag on the floor
    const y = V.FLOOR;
    g.save(); g.fillStyle = '#2b2d36'; g.strokeStyle = '#e8eaee'; g.lineWidth = 5;
    V.roundRect(g, x - 85, y - 82, 170, 82, 30); g.fill(); g.stroke();
    g.strokeStyle = '#e8eaee'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 50, y - 80); g.quadraticCurveTo(x, y - 150 - open * 20, x + 50, y - 80); g.stroke();
    g.strokeStyle = V.COL.red; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 70, y - 60); g.lineTo(x + 70, y - 60); g.stroke();
    g.restore();
  };
  V.dumbbell = function (g, hand, ang = 0) {
    g.save(); g.translate(hand[0], hand[1]); g.rotate(ang);
    g.fillStyle = '#c9cbd3'; g.strokeStyle = '#16171c'; g.lineWidth = 4;
    g.fillRect(-36, -5, 72, 10); g.strokeRect(-36, -5, 72, 10);
    for (const sx of [-1, 1]) { V.roundRect(g, sx * 38 - 11, -26, 22, 52, 5); g.fillStyle = '#3a3c46'; g.fill(); g.stroke(); }
    g.restore();
  };
  V.flash = function (g, x, y, u, s = 1) { // camera flash pop
    if (u < 0 || u > 1) return;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = 1 - u; g.globalCompositeOperation = 'lighter';
    const r = g.createRadialGradient(0, 0, 2, 0, 0, 120 * (0.4 + u)); r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(-160, -160, 320, 320);
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = i * 1.047; g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); g.lineTo(Math.cos(a) * (60 + 40 * u), Math.sin(a) * (60 + 40 * u)); g.stroke(); }
    g.restore();
  };
  V.glovesFloor = function (g, x) { // two red boxing gloves dropped on the floor
    g.save();
    for (const [dx, rot] of [[-36, -0.4], [34, 0.5]]) {
      g.save(); g.translate(x + dx, V.FLOOR - 26); g.rotate(rot);
      g.fillStyle = V.COL.red; g.strokeStyle = '#16171c'; g.lineWidth = 5;
      g.beginPath(); g.ellipse(0, 0, 40, 28, 0, 0, 6.283); g.fill(); g.stroke();
      g.fillStyle = '#f4f5f7'; V.roundRect(g, 26, -16, 22, 32, 6); g.fill(); g.stroke();
      g.restore();
    }
    g.restore();
  };
  V.clapMarks = function (g, x, y, u) {
    if (u < 0 || u > 1) return;
    g.save(); g.strokeStyle = `rgba(255,255,255,${1 - u})`; g.lineWidth = 5; g.lineCap = 'round';
    for (const a of [-0.9, -0.3, 0.3]) { const r0 = 30 + u * 20; g.beginPath(); g.moveTo(x + Math.cos(a - 1.57) * r0, y + Math.sin(a - 1.57) * r0); g.lineTo(x + Math.cos(a - 1.57) * (r0 + 26), y + Math.sin(a - 1.57) * (r0 + 26)); g.stroke(); }
    g.restore();
  };
  V.crackedPhone = function (g, x) { // phone face-up on the floor with a cracked screen
    g.save(); g.translate(x, V.FLOOR - 10);
    g.fillStyle = '#0d0e12'; g.strokeStyle = '#cfd2da'; g.lineWidth = 3; V.roundRect(g, -40, -9, 80, 16, 5); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -8); g.lineTo(0, 0); g.lineTo(-6, 6); g.moveTo(0, 0); g.lineTo(14, -6); g.stroke();
    g.restore();
  };

  // ───────── Pt. 6 props
  // CONTROL meter (screen space): small CONTROL label, big number, thin bar. flash 0..1 on a change.
  V.meter = function (g, cx, cy, value, color, flash = 0, up = false) {
    const w = 260;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.fillStyle = 'rgba(214,216,223,0.85)'; g.font = `600 22px ${V.FONT.sans}`; g.letterSpacing = '8px';
    g.fillText('CONTROL', cx + 4, cy - 62); g.letterSpacing = '0px';
    const k = 1 + 0.12 * flash;
    g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy);
    g.fillStyle = flash > 0.05 ? (up ? '#ffffff' : V.COL.red) : color === 'white' ? '#F4F5F7' : V.COL.red;
    if (flash > 0.05) { g.shadowColor = up ? 'rgba(255,220,170,0.9)' : 'rgba(224,52,74,0.9)'; g.shadowBlur = 30 * flash; }
    g.font = `800 72px ${V.FONT.sans}`;
    g.fillText(`${Math.round(value)}%`, cx, cy);
    g.restore();
    g.save(); g.shadowColor = 'transparent';
    g.fillStyle = 'rgba(255,255,255,0.14)'; V.roundRect(g, cx - w / 2, cy + 18, w, 8, 4); g.fill();
    g.fillStyle = color === 'white' ? '#F4F5F7' : V.COL.red;
    if (color !== 'white') { g.shadowColor = 'rgba(224,52,74,0.7)'; g.shadowBlur = 12; }
    V.roundRect(g, cx - w / 2, cy + 18, Math.max(8, w * value / 100), 8, 4); g.fill();
    g.restore();
  };
  // value at time t for a list of [time, value] steps, each change ticking over `dur` seconds
  V.meterAt = function (t, steps, dur = 0.45) {
    let v = steps[0][1], flash = 0, up = false;
    for (let i = 1; i < steps.length; i++) {
      const [ts, to] = steps[i], from = steps[i - 1][1];
      if (t >= ts) { const u = V.clamp((t - ts) / dur); v = V.lerp(from, to, V.ease.out(u)); if (t - ts < 0.6) { flash = 1 - (t - ts) / 0.6; up = to > from; } }
    }
    return { v, flash, up };
  };

  V.coffee = function (g, hand, k = 1) {
    g.save(); g.translate(hand[0], hand[1] - 18); g.scale(k, k);
    g.fillStyle = '#e8eaee'; g.strokeStyle = '#16171c'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-17, -26); g.lineTo(17, -26); g.lineTo(13, 22); g.lineTo(-13, 22); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#7a4b2a'; g.fillRect(-15, -8, 30, 14);
    g.fillStyle = '#c9cbd3'; V.roundRect(g, -20, -34, 40, 10, 4); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-4, -42); g.quadraticCurveTo(6, -54, -2, -66); g.stroke();
    g.restore();
  };

  // Standing desk with an open laptop (world px). x = centre, screen glow.
  V.desk = function (g, x, laptop = true, glow = 1) {
    const top = V.FLOOR - 232;
    g.save(); g.strokeStyle = '#c9cbd3'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 70, top + 10); g.lineTo(x - 70, V.FLOOR - 4); g.moveTo(x + 70, top + 10); g.lineTo(x + 70, V.FLOOR - 4); g.stroke();
    g.fillStyle = '#e8eaee'; g.strokeStyle = '#16171c'; g.lineWidth = 5; V.roundRect(g, x - 100, top - 6, 200, 18, 6); g.fill(); g.stroke();
    if (laptop) {
      g.fillStyle = '#2b2d36'; g.strokeStyle = '#e8eaee'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(x - 56, top - 6); g.lineTo(x + 50, top - 6); g.lineTo(x + 56, top - 14); g.lineTo(x - 50, top - 14); g.closePath(); g.fill(); g.stroke();
      g.save(); g.translate(x - 50, top - 14); g.rotate(-1.25);
      V.roundRect(g, 0, -4, 92, 8, 3); g.fill(); g.stroke();
      g.restore();
      g.save(); g.globalAlpha = 0.5 * glow; g.filter = 'blur(10px)'; g.fillStyle = '#9fc3ff';
      g.beginPath(); g.ellipse(x - 34, top - 60, 30, 46, -0.3, 0, 6.283); g.fill(); g.restore();
    }
    g.restore();
    return top;
  };

  // Bed (world px): from x0 to x1, mattress top at topY, headboard at the head end
  V.bed = function (g, x0, x1, topY, headLeft = true, blanket = '#3a3c46') {
    g.save();
    g.strokeStyle = '#c9cbd3'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0 + 20, topY + 60); g.lineTo(x0 + 20, V.FLOOR - 4); g.moveTo(x1 - 20, topY + 60); g.lineTo(x1 - 20, V.FLOOR - 4); g.stroke();
    const hx = headLeft ? x0 : x1;
    g.beginPath(); g.moveTo(hx, V.FLOOR - 4); g.lineTo(hx, topY - 150); g.stroke();
    g.fillStyle = '#e8eaee'; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    V.roundRect(g, x0, topY, x1 - x0, 60, 14); g.fill(); g.stroke();
    g.restore();
  };
  V.bedBlanket = function (g, x0, x1, topY, color) {
    g.save(); g.fillStyle = color; g.strokeStyle = '#16171c'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x0, topY + 30); g.quadraticCurveTo(x0, topY - 56, x0 + 40, topY - 60); g.lineTo(x1 - 40, topY - 60); g.quadraticCurveTo(x1, topY - 56, x1, topY + 30); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + 40, topY - 30); g.lineTo(x1 - 40, topY - 30); g.stroke();
    g.restore();
  };
  V.pillow = function (g, x, y) { g.save(); g.fillStyle = '#f4f5f7'; g.strokeStyle = '#16171c'; g.lineWidth = 4; V.roundRect(g, x - 60, y - 22, 120, 34, 16); g.fill(); g.stroke(); g.restore(); };

  // Leash snapping: red particles drifting away (u 0..1)
  V.leashDissolve = function (g, a, b, u, seed = 3) {
    const r = V.rng(seed);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const k = r(), x = V.lerp(a[0], b[0], k), y = V.lerp(a[1], b[1], k) + Math.sin(k * Math.PI) * 30;
      const dx = (r() - 0.5) * 220 * u, dy = (-60 - r() * 160) * u;
      g.globalAlpha = (1 - u) * (0.5 + r() * 0.5);
      g.fillStyle = r() > 0.4 ? '#ff4660' : '#ffd0d5';
      g.beginPath(); g.arc(x + dx, y + dy, 4 + r() * 5 * (1 - u), 0, 6.283); g.fill();
    }
    g.restore();
  };

  // ───────── Pt. 6 (failure) props
  // Door: frame + panel. open 0 = shut, ~0.15 = a crack, 1 = wide open with warm light
  V.door = function (g, x, open = 0, light = 0) {
    const w = 150, h = 330, top = V.FLOOR - h;
    g.save();
    if (open > 0.02) {
      const gw = w * Math.min(1, open);
      const lg = g.createLinearGradient(0, top, 0, V.FLOOR);
      lg.addColorStop(0, `rgba(255,214,160,${0.5 * light + 0.15})`); lg.addColorStop(1, `rgba(255,214,160,${0.8 * light + 0.1})`);
      g.fillStyle = open < 0.3 && light < 0.1 ? '#050507' : lg; g.fillRect(x - w / 2, top, gw, h);
      if (light > 0.05) {   // light spilling onto the floor
        g.save(); g.filter = 'blur(18px)'; g.globalAlpha = light;
        g.fillStyle = 'rgba(255,214,160,0.45)'; g.beginPath(); g.moveTo(x - w / 2, V.FLOOR); g.lineTo(x + w / 2, V.FLOOR); g.lineTo(x + w * 1.6, V.FLOOR + 90); g.lineTo(x - w * 1.6, V.FLOOR + 90); g.closePath(); g.fill(); g.restore();
      }
    }
    // panel (foreshortens as it opens)
    const pw = w * (1 - Math.min(1, open)), px = x - w / 2 + w - pw;
    if (pw > 2) {
      g.fillStyle = '#2b2d36'; g.strokeStyle = '#e8eaee'; g.lineWidth = 5;
      g.fillRect(px, top, pw, h); g.strokeRect(px, top, pw, h);
      g.fillStyle = '#e8eaee'; g.beginPath(); g.arc(px + 18, top + h * 0.55, 6, 0, 6.283); g.fill();
    }
    g.strokeStyle = '#e8eaee'; g.lineWidth = 9; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - w / 2 - 8, V.FLOOR); g.lineTo(x - w / 2 - 8, top - 8); g.lineTo(x + w / 2 + 8, top - 8); g.lineTo(x + w / 2 + 8, V.FLOOR); g.stroke();
    g.restore();
  };

  // Track hurdle; tip 0..1 knocks it over
  V.hurdle = function (g, x, tip = 0) {
    g.save(); g.translate(x, V.FLOOR); g.rotate(tip * 1.35);
    g.strokeStyle = '#e8eaee'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-6, 0); g.lineTo(-6, -150); g.moveTo(6, 0); g.lineTo(6, -150); g.moveTo(-40, 0); g.lineTo(40, 0); g.stroke();
    g.fillStyle = '#f4f5f7'; g.strokeStyle = '#16171c'; g.lineWidth = 4; V.roundRect(g, -14, -168, 28, 30, 6); g.fill(); g.stroke();
    g.fillStyle = V.COL.red; g.fillRect(-12, -160, 24, 8);
    g.restore();
  };

  // A problem: heavy block with cracks (world px), bottom on the floor
  V.block = function (g, x, w, h, cracks = 0) {
    const top = V.FLOOR - h;
    g.save();
    g.fillStyle = '#3a3c46'; g.strokeStyle = '#16171c'; g.lineWidth = 6;
    V.roundRect(g, x - w / 2, top, w, h, 8); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x - w / 2 + 10, top + 10, w - 20, 12);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
    const r = V.rng(7);
    for (let i = 0; i < cracks; i++) {
      const sx = x - w / 2 + r() * w, sy = top + r() * h * 0.6;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 50, sy + 30 + r() * 40); g.lineTo(sx + (r() - 0.5) * 70, sy + 70 + r() * 50); g.stroke();
    }
    g.restore();
    return top;
  };

  // Hammer in hand (world), angle in radians
  V.hammer = function (g, hand, ang) {
    g.save(); g.translate(hand[0], hand[1]); g.rotate(ang);
    g.strokeStyle = '#c9cbd3'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 18); g.lineTo(0, -70); g.stroke();
    g.fillStyle = '#e8eaee'; g.strokeStyle = '#16171c'; g.lineWidth = 4; V.roundRect(g, -30, -92, 60, 26, 5); g.fill(); g.stroke();
    g.restore();
  };

  // Closed laptop on a desk top (after it was slammed)
  V.laptopClosed = function (g, x, top) {
    g.save(); g.fillStyle = '#2b2d36'; g.strokeStyle = '#e8eaee'; g.lineWidth = 4;
    V.roundRect(g, x - 56, top - 22, 112, 16, 4); g.fill(); g.stroke(); g.restore();
  };
})();
