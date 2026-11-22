/* More props: donkey, lion, crown, heart, bulb, clock, documents, pie, newspaper, clover, radar, rock, target,
   hourglass, sun, cart, chevrons. Same flat white/grey language as the pictograms. Side-facing animals look right. */
(function () {
  const M = window.M;
  const { C, lerp, TAU } = M;
  const O = M.O;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const legs = (ctx, pairs, y, legH, lw, col, far) => {
    ctx.lineCap = 'round';
    for (const [x, a, isFar] of pairs) {
      ctx.strokeStyle = isFar ? far : col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x, y - legH);
      ctx.lineTo(x + Math.sin(a) * legH, y - legH + Math.cos(a) * legH);
      ctx.stroke();
    }
  };

  O.donkey = (ctx, x, y, s, ph = 0, o = {}) => {
    const col = o.color || C.white, far = o.far || C.g3, walk = o.walk ?? 0;
    const legH = 0.42 * s, top = y - legH - 0.3 * s, sw = Math.sin(ph) * 0.38 * walk, bob = Math.abs(Math.sin(ph)) * 0.015 * s * walk;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.translate(0, -bob);
    legs(ctx, [[x + 0.36 * s, -sw, true], [x - 0.3 * s, sw, true]], y + bob, legH, 0.07 * s, col, far);
    // tail
    ctx.strokeStyle = col; ctx.lineWidth = 0.03 * s;
    ctx.beginPath(); ctx.moveTo(x - 0.47 * s, top + 0.06 * s); ctx.lineTo(x - 0.6 * s, top + 0.32 * s + Math.sin(ph * 0.5) * 0.02 * s); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x - 0.61 * s, top + 0.36 * s, 0.03 * s, 0.06 * s, 0.3, 0, TAU); ctx.fill();
    rr(ctx, x - 0.48 * s, top, 0.96 * s, 0.32 * s, 0.15 * s); ctx.fill();
    // neck + head (hangs low: a beast of burden)
    ctx.strokeStyle = col; ctx.lineWidth = 0.17 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 0.33 * s, top + 0.1 * s); ctx.lineTo(x + 0.55 * s, top - 0.14 * s + (o.low ? 0.18 * s : 0)); ctx.stroke();
    ctx.save();
    ctx.translate(x + 0.6 * s, top - 0.14 * s + (o.low ? 0.18 * s : 0));
    ctx.rotate(o.low ? 0.95 : 0.55);
    rr(ctx, -0.05 * s, -0.08 * s, 0.33 * s, 0.16 * s, 0.07 * s); ctx.fill();
    ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(0.06 * s, -0.025 * s, 0.018 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(-0.04 * s, -0.17 * s, 0.035 * s, 0.13 * s, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = far;
    ctx.beginPath(); ctx.ellipse(0.02 * s, -0.17 * s, 0.03 * s, 0.12 * s, -0.15, 0, TAU); ctx.fill();
    ctx.restore();
    legs(ctx, [[x + 0.3 * s, sw], [x - 0.36 * s, -sw]], y + bob, legH, 0.075 * s, col, far);
    ctx.restore();
  };

  /** mode: stand | walk | lie | crouch */
  O.lion = (ctx, x, y, s, ph = 0, o = {}) => {
    const col = o.color || C.white, far = o.far || C.g3, mode = o.mode || 'stand';
    const legH = mode === 'lie' ? 0.06 * s : mode === 'crouch' ? 0.26 * s : 0.4 * s;
    const top = y - legH - 0.32 * s, sw = mode === 'walk' ? Math.sin(ph) * 0.4 : 0;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    if (mode !== 'lie') legs(ctx, [[x + 0.36 * s, -sw + (mode === 'crouch' ? 0.5 : 0), true], [x - 0.32 * s, sw - (mode === 'crouch' ? 0.4 : 0), true]], y, legH, 0.09 * s, col, far);
    // tail with tuft
    ctx.strokeStyle = col; ctx.lineWidth = 0.035 * s; ctx.lineCap = 'round';
    const tw2 = Math.sin(ph * 0.7) * 0.05 * s;
    ctx.beginPath(); ctx.moveTo(x - 0.5 * s, top + 0.08 * s); ctx.quadraticCurveTo(x - 0.8 * s, top + 0.05 * s, x - 0.76 * s + tw2, top - 0.2 * s); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x - 0.76 * s + tw2, top - 0.23 * s, 0.045 * s, 0.07 * s, 0.2, 0, TAU); ctx.fill();
    rr(ctx, x - 0.54 * s, top, 1.02 * s, 0.32 * s, 0.16 * s); ctx.fill();
    if (mode === 'lie') {
      ctx.strokeStyle = col; ctx.lineWidth = 0.09 * s;
      ctx.beginPath(); ctx.moveTo(x + 0.35 * s, y - 0.05 * s); ctx.lineTo(x + 0.66 * s, y - 0.05 * s); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x - 0.33 * s, top + 0.2 * s, 0.2 * s, 0.17 * s, 0, 0, TAU); ctx.fill();
    } else legs(ctx, [[x + 0.3 * s, sw + (mode === 'crouch' ? 0.5 : 0)], [x - 0.38 * s, -sw - (mode === 'crouch' ? 0.4 : 0)]], y, legH, 0.095 * s, col, far);
    // head with mane
    const hx = x + 0.55 * s + (mode === 'crouch' ? 0.06 * s : 0), hy = top - (mode === 'crouch' ? -0.02 * s : 0.04 * s);
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * TAU, r = (i % 2 ? 0.2 : 0.28) * s * (o.big ?? 1);
      i ? ctx.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r) : ctx.moveTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 0.04 * s, hy, 0.14 * s, 0, TAU); ctx.fillStyle = o.face || C.g2; ctx.fill();
    ctx.fillStyle = C.bg;
    ctx.beginPath(); ctx.arc(hx + 0.08 * s, hy - 0.04 * s, 0.022 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 0.15 * s, hy + 0.04 * s, 0.035 * s, 0.025 * s, 0, 0, TAU); ctx.fill();
    if (o.roar) { ctx.beginPath(); ctx.moveTo(hx + 0.08 * s, hy + 0.07 * s); ctx.lineTo(hx + 0.18 * s, hy + 0.06 * s + o.roar * 0.06 * s); ctx.lineTo(hx + 0.18 * s, hy + 0.1 * s); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    return { head: { x: hx, y: hy }, chest: { x: x + 0.3 * s, y: top + 0.16 * s }, top: hy - 0.28 * s };
  };

  O.crown = (ctx, x, y, s, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    ctx.beginPath();
    ctx.moveTo(-s / 2, 0); ctx.lineTo(-s / 2, -s * 0.5); ctx.lineTo(-s / 4, -s * 0.22); ctx.lineTo(0, -s * 0.6);
    ctx.lineTo(s / 4, -s * 0.22); ctx.lineTo(s / 2, -s * 0.5); ctx.lineTo(s / 2, 0); ctx.closePath();
    if (o.outline) { ctx.strokeStyle = o.color || C.white; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(); }
    else { ctx.fillStyle = o.color || C.white; ctx.fill(); ctx.fillStyle = C.bg; ctx.fillRect(-s / 2, -s * 0.14, s, s * 0.05); }
    ctx.fillStyle = o.color || C.white;
    for (const px of [-s / 2, 0, s / 2]) { ctx.beginPath(); ctx.arc(px, px === 0 ? -s * 0.64 : -s * 0.54, s * 0.06, 0, TAU); ctx.fill(); }
    ctx.restore();
  };

  O.heart = (ctx, x, y, s, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.translate(x, y);
    ctx.scale(s / 100, s / 100);
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.bezierCurveTo(-60, -5, -45, -60, 0, -28);
    ctx.bezierCurveTo(45, -60, 60, -5, 0, 35);
    if (o.outline) { ctx.strokeStyle = o.color || C.white; ctx.lineWidth = (o.lw || 3) * (100 / s); ctx.stroke(); }
    else { ctx.fillStyle = o.color || C.white; ctx.fill(); }
    ctx.restore();
  };

  O.bulb = (ctx, x, y, s, on, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    if (on > 0) {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.36, r0 = s * 0.5, r1 = s * (0.62 + 0.12 * on);
        if (i === 0 || i === 7) continue;
        ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.globalAlpha = (o.alpha ?? 1) * on;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y - s * 0.1 + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y - s * 0.1 + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.globalAlpha = o.alpha ?? 1;
    }
    ctx.beginPath();
    ctx.arc(x, y - s * 0.1, s * 0.34, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineTo(x + s * 0.14, y + s * 0.3);
    ctx.lineTo(x - s * 0.14, y + s * 0.3);
    ctx.closePath();
    ctx.fillStyle = on > 0.5 ? C.white : C.bg;
    ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.fillStyle = C.g1;
    ctx.fillRect(x - s * 0.13, y + s * 0.34, s * 0.26, s * 0.06);
    ctx.fillRect(x - s * 0.1, y + s * 0.44, s * 0.2, s * 0.06);
    ctx.restore();
  };

  O.clock = (ctx, x, y, r, hours, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, l = i % 3 ? 0.08 : 0.15;
      ctx.lineWidth = i % 3 ? 2 : 3.5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86); ctx.lineTo(x + Math.cos(a) * r * (0.86 - l), y + Math.sin(a) * r * (0.86 - l)); ctx.stroke();
    }
    const ha = -Math.PI / 2 + (hours / 12) * TAU, ma = -Math.PI / 2 + hours * TAU;
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ha) * r * 0.45, y + Math.sin(ha) * r * 0.45); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ma) * r * 0.7, y + Math.sin(ma) * r * 0.7); ctx.stroke();
    ctx.fillStyle = o.color || C.white; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    ctx.restore();
  };

  O.doc = (ctx, x, y, w, o = {}) => {
    const h = w * 1.3;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.g2; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 4, y - h / 2); ctx.lineTo(x + w / 2, y - h / 4); ctx.lineTo(x + w / 2, y + h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h * 0.1 + i * h * 0.18); ctx.lineTo(x + w * (i === 2 ? 0.05 : 0.3), y - h * 0.1 + i * h * 0.18); ctx.stroke(); }
    ctx.restore();
  };

  O.pie = (ctx, x, y, r, frac, k, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    const a0 = -Math.PI / 2, kk = M.clamp(k);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0 + TAU * frac, a0 + TAU * frac + TAU * (1 - frac) * kk); ctx.closePath();
    ctx.fillStyle = o.rest || C.g4; ctx.fill();
    const pop = o.pop ?? 0, mid = a0 + TAU * frac / 2;
    ctx.translate(Math.cos(mid) * pop, Math.sin(mid) * pop);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a0 + TAU * frac * kk); ctx.closePath();
    ctx.fillStyle = C.white; ctx.fill();
    ctx.restore();
  };

  O.newspaper = (ctx, x, y, w, h, k, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillStyle = C.bg;
    ctx.strokeStyle = C.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
    ctx.font = `700 ${w * 0.07}px DejaVu Serif`; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('THE DAILY', x, y - h / 2 + w * 0.07);
    ctx.fillRect(x - w / 2 + 16, y - h / 2 + w * 0.13, w - 32, 3);
    // photos
    const cols = 4, pw = (w - 32 - (cols - 1) * 12) / cols, ph = pw * 0.7;
    let n = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) {
      const px = x - w / 2 + 16 + c * (pw + 12), py = y - h / 2 + w * 0.18 + r * (ph + 34);
      const lk = M.clamp(k * 14 - n); n++;
      if (lk <= 0) continue;
      ctx.globalAlpha = (o.alpha ?? 1) * lk;
      ctx.strokeStyle = (o.counted || 0) > n - 1 ? C.white : C.g3; ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);
      ctx.beginPath(); ctx.moveTo(px + 6, py + ph - 6); ctx.lineTo(px + pw * 0.4, py + ph * 0.45); ctx.lineTo(px + pw * 0.65, py + ph * 0.7); ctx.lineTo(px + pw - 6, py + ph * 0.35); ctx.stroke();
      ctx.fillStyle = C.g4; ctx.fillRect(px, py + ph + 8, pw, 5); ctx.fillRect(px, py + ph + 18, pw * 0.7, 5);
    }
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.msg > 0) {
      const mh = h * 0.2, my = y + h / 2 - mh - 16;
      ctx.fillStyle = C.white; ctx.fillRect(x - w / 2 + 16, my, (w - 32) * M.clamp(o.msg), mh);
      if (o.msg > 0.7) {
        ctx.fillStyle = C.bg; ctx.font = `700 ${mh * 0.32}px DejaVu Serif`;
        ctx.fillText('STOP COUNTING.', x, my + mh * 0.34);
        ctx.font = `400 ${mh * 0.2}px DejaVu Serif`;
        ctx.fillText('THERE ARE 43 PHOTOGRAPHS', x, my + mh * 0.72);
      }
    }
    ctx.restore();
  };

  O.clover = (ctx, x, y, s, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillStyle = o.color || C.white;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.26, y + Math.sin(a) * s * 0.26, s * 0.24, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = o.color || C.white; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.5, x + s * 0.3, y + s * 0.8); ctx.stroke();
    ctx.restore();
  };

  O.radar = (ctx, x, y, r, ang, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = C.g3; ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(x, y, (r * i) / 3, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
    for (let i = 0; i < 18; i++) {
      ctx.globalAlpha = (o.alpha ?? 1) * (1 - i / 18) * 0.35;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, ang - (i + 1) * 0.04, ang - i * 0.04); ctx.closePath();
      ctx.fillStyle = C.white; ctx.fill();
    }
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.strokeStyle = C.white; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); ctx.stroke();
    ctx.restore();
  };

  O.rock = (ctx, x, y, w, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w * 0.42, y - w * 0.16); ctx.lineTo(x - w * 0.2, y - w * 0.26); ctx.lineTo(x + w * 0.15, y - w * 0.24); ctx.lineTo(x + w * 0.4, y - w * 0.14); ctx.lineTo(x + w / 2, y); ctx.closePath();
    ctx.fillStyle = C.g5; ctx.fill(); ctx.strokeStyle = C.g2; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  };

  O.target = (ctx, x, y, r, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    for (let i = 3; i >= 1; i--) { ctx.beginPath(); ctx.arc(x, y, (r * i) / 3, 0, TAU); ctx.fillStyle = i % 2 ? C.bg : C.g4; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, r * 0.1, 0, TAU); ctx.fillStyle = C.white; ctx.fill();
    ctx.restore();
  };

  O.hourglass = (ctx, x, y, s, k, rot = 0, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = C.white; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.32, -s / 2); ctx.lineTo(s * 0.32, -s / 2); ctx.lineTo(s * 0.04, 0); ctx.lineTo(s * 0.32, s / 2); ctx.lineTo(-s * 0.32, s / 2); ctx.lineTo(-s * 0.04, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = C.g1;
    const top = 1 - M.clamp(k), bot = M.clamp(k);
    ctx.beginPath(); ctx.moveTo(-s * 0.27 * top, -s * 0.05 - s * 0.4 * top); ctx.lineTo(s * 0.27 * top, -s * 0.05 - s * 0.4 * top); ctx.lineTo(0, -s * 0.03); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.47); ctx.lineTo(s * 0.28, s * 0.47); ctx.lineTo(0, s * 0.47 - s * 0.38 * bot); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  O.sun = (ctx, x, y, r, t, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = C.white; ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + t * 0.4, l = r * (0.35 + 0.12 * Math.sin(t * 6 + i));
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); ctx.lineTo(x + Math.cos(a) * (r * 1.3 + l), y + Math.sin(a) * (r * 1.3 + l)); ctx.stroke();
    }
    ctx.restore();
  };

  O.cart = (ctx, x, y, w, t, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = C.g1; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.strokeRect(x - w / 2, y - w * 0.55, w, w * 0.3);
    const boxes = [[-0.32, 0.25], [0.02, 0.28], [0.3, 0.22], [-0.14, 0.2], [0.16, 0.18]];
    boxes.forEach(([bx, bs], i) => {
      const lvl = i < 3 ? 0 : 1;
      ctx.fillStyle = i % 2 ? C.g2 : C.g1;
      ctx.fillRect(x + bx * w - (bs * w) / 2, y - w * 0.55 - bs * w - lvl * w * 0.24, bs * w, bs * w);
    });
    for (const wx of [-0.3, 0.3]) {
      ctx.beginPath(); ctx.arc(x + wx * w, y - w * 0.13, w * 0.13, 0, TAU); ctx.stroke();
      const a = t * 4;
      ctx.beginPath(); ctx.moveTo(x + wx * w - Math.cos(a) * w * 0.13, y - w * 0.13 - Math.sin(a) * w * 0.13); ctx.lineTo(x + wx * w + Math.cos(a) * w * 0.13, y - w * 0.13 + Math.sin(a) * w * 0.13); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - w * 0.4); ctx.lineTo(x + w / 2 + (o.pole ?? w * 0.5), y - w * 0.5); ctx.stroke();
    ctx.restore();
  };

  O.chevrons = (ctx, x, y, s, n, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.white; ctx.lineWidth = s * 0.12; ctx.lineJoin = 'miter';
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(x - s / 2, y + i * s * 0.3); ctx.lineTo(x, y - s * 0.35 + i * s * 0.3); ctx.lineTo(x + s / 2, y + i * s * 0.3); ctx.stroke(); }
    ctx.restore();
  };
})();
