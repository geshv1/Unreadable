/* Object library: small geometric props in the same white/grey line language.
   Every function draws around (x, y); s is a scale (≈ size in px), k a 0..1 draw-on progress where it applies. */
(function () {
  const M = window.M;
  const { C, lerp, TAU } = M;
  const O = (M.O = {});
  const st = (ctx, o, lw = 3) => {
    ctx.strokeStyle = o.color || C.white;
    ctx.lineWidth = o.lw ?? lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };
  const wrap = (ctx, o, fn) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    fn();
    ctx.restore();
  };

  O.glove = (ctx, x, y, s, o = {}) => wrap(ctx, o, () => {
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    ctx.fillStyle = o.color || C.white;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.5, s * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-s * 0.36, s * 0.1, s * 0.16, s * 0.22, -0.5, 0, TAU);
    ctx.fill();
    ctx.fillRect(-s * 0.3, s * 0.22, s * 0.6, s * 0.32);
    ctx.fillStyle = C.bg;
    ctx.fillRect(-s * 0.3, s * 0.3, s * 0.6, s * 0.05);
  });

  O.trophy = (ctx, x, y, s, o = {}) => wrap(ctx, o, () => {
    st(ctx, o);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y - s * 0.6);
    ctx.lineTo(x + s * 0.4, y - s * 0.6);
    ctx.quadraticCurveTo(x + s * 0.4, y + s * 0.05, x, y + s * 0.1);
    ctx.quadraticCurveTo(x - s * 0.4, y + s * 0.05, x - s * 0.4, y - s * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - s * 0.42, y - s * 0.38, s * 0.16, Math.PI * 0.5, Math.PI * 1.5);
    ctx.moveTo(x + s * 0.42, y - s * 0.54);
    ctx.arc(x + s * 0.42, y - s * 0.38, s * 0.16, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.moveTo(x, y + s * 0.1);
    ctx.lineTo(x, y + s * 0.38);
    ctx.moveTo(x - s * 0.28, y + s * 0.42);
    ctx.lineTo(x + s * 0.28, y + s * 0.42);
    ctx.stroke();
  });

  O.bubble = (ctx, x, y, w, h, o = {}) => wrap(ctx, o, () => {
    st(ctx, o);
    const tail = o.tail ?? -1;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h * 0.35);
    ctx.moveTo(x + tail * w * 0.15, y + h / 2);
    ctx.lineTo(x + tail * w * 0.32, y + h / 2 + h * 0.45);
    ctx.lineTo(x + tail * w * 0.02, y + h / 2);
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    ctx.stroke();
    if (o.text) {
      ctx.font = `700 ${h * 0.42}px ${M.FONT}`;
      ctx.letterSpacing = '4px';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = o.textColor || C.white;
      ctx.fillText(o.text, x + (o.jx || 0), y + 2 + (o.jy || 0));
    }
  });

  O.fly = (ctx, x, y, s, t, o = {}) => wrap(ctx, o, () => {
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * 55));
    ctx.strokeStyle = o.color || C.white;
    ctx.lineWidth = 1.8;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sgn * s * 0.32, -s * 0.3, s * 0.36, s * 0.2 * flap, sgn * 0.6, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = o.color || C.white;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.2, s * 0.36, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.42, s * 0.16, 0, TAU);
    ctx.fill();
  });

  O.thermo = (ctx, x, y, h, level, o = {}) => wrap(ctx, o, () => {
    const w = o.w ?? 34, r = w * 0.95;
    st(ctx, o, 3);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h, w, h, w / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + r * 0.6, r, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = o.fill || C.white;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.6, r - 8, 0, TAU);
    ctx.fill();
    const lh = (h - 14) * M.clamp(level);
    ctx.fillRect(x - w / 2 + 8, y + 4 - lh, w - 16, lh + 6);
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + 6, y - (h * i) / 6);
      ctx.lineTo(x + w / 2 + (i % 2 ? 14 : 22), y - (h * i) / 6);
      ctx.strokeStyle = C.g3;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  O.column = (ctx, x, y, h, k, o = {}) => wrap(ctx, o, () => {
    const w = h * 0.2, hk = h * M.clamp(k);
    st(ctx, o, 3);
    ctx.strokeRect(x - w * 0.75, y - h * 0.06, w * 1.5, h * 0.06);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - w, y - hk, w * 2, hk);
    ctx.clip();
    ctx.strokeRect(x - w / 2, y - h * 0.9, w, h * 0.84);
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + (w * i) / 4, y - h * 0.86);
      ctx.lineTo(x - w / 2 + (w * i) / 4, y - h * 0.1);
      ctx.strokeStyle = C.g2;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    st(ctx, o, 3);
    ctx.strokeRect(x - w * 0.8, y - h, w * 1.6, h * 0.1);
    ctx.beginPath();
    ctx.arc(x - w * 0.8, y - h * 0.95, h * 0.04, 0, TAU);
    ctx.arc(x + w * 0.8, y - h * 0.95, h * 0.04, 0, TAU);
    ctx.stroke();
    ctx.restore();
  });

  O.flame = (ctx, x, y, s, t, o = {}) => wrap(ctx, o, () => {
    const layer = (sc, col, ph) => {
      const f = 1 + Math.sin(t * 11 + ph) * 0.06, sw = Math.sin(t * 7 + ph) * s * 0.05;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - s * 0.55 * sc, y - s * 0.05, x - s * 0.35 * sc + sw, y - s * 0.7 * sc * f, x + sw * 2, y - s * 1.05 * sc * f);
      ctx.bezierCurveTo(x + s * 0.3 * sc + sw, y - s * 0.6 * sc * f, x + s * 0.55 * sc, y - s * 0.1, x, y);
      if (o.stroke) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
    };
    layer(1, o.c1 || C.white, 0);
    if (!o.stroke) { layer(0.62, C.bg, 1.3); layer(0.36, o.c1 || C.white, 2.1); }
  });

  O.signpost = (ctx, x, y, h, k, labels, o = {}) => wrap(ctx, o, () => {
    st(ctx, o, 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h * M.clamp(k * 1.4));
    ctx.stroke();
    labels.forEach((L, i) => {
      const kk = M.clamp(k * 2 - 0.6 - i * 0.3);
      if (kk <= 0) return;
      const dir = L.dir, yy = y - h * (0.85 - i * 0.28), w = L.w ?? 230, bh = 54;
      ctx.save();
      ctx.globalAlpha *= kk;
      ctx.translate(x, yy);
      ctx.rotate(dir * (L.tilt ?? 0.06));
      ctx.beginPath();
      const x0 = dir > 0 ? 6 : -6, x1 = x0 + dir * w * kk, tip = x1 + dir * 26;
      ctx.moveTo(x0, -bh / 2);
      ctx.lineTo(x1, -bh / 2);
      ctx.lineTo(tip, 0);
      ctx.lineTo(x1, bh / 2);
      ctx.lineTo(x0, bh / 2);
      ctx.closePath();
      ctx.fillStyle = L.fill || C.bg;
      ctx.fill();
      ctx.strokeStyle = L.color || C.white;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = `600 22px ${M.FONT}`;
      ctx.letterSpacing = '4px';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = L.textColor || L.color || C.white;
      ctx.fillText(L.text, (x0 + x1) / 2, 2);
      ctx.restore();
    });
  });

  O.masks = (ctx, x, y, s, o = {}) => wrap(ctx, o, () => {
    const one = (cx, cy, rot, happy, col) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(-s * 0.42, -s * 0.45);
      ctx.quadraticCurveTo(0, -s * 0.6, s * 0.42, -s * 0.45);
      ctx.quadraticCurveTo(s * 0.48, s * 0.35, 0, s * 0.6);
      ctx.quadraticCurveTo(-s * 0.48, s * 0.35, -s * 0.42, -s * 0.45);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.fillStyle = C.bg;
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sx * s * 0.17, -s * 0.12, s * 0.1, s * 0.06, sx * (happy ? -0.3 : 0.3), 0, TAU);
        ctx.fill();
      }
      ctx.beginPath();
      if (happy) ctx.arc(0, s * 0.12, s * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
      else ctx.arc(0, s * 0.42, s * 0.2, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.strokeStyle = C.bg;
      ctx.lineWidth = s * 0.07;
      ctx.stroke();
      ctx.restore();
    };
    one(x + s * 0.3, y + s * 0.08, 0.25, false, o.c2 || C.g2);
    one(x - s * 0.3, y, -0.2, true, o.c1 || C.white);
  });

  O.curtains = (ctx, x0, x1, top, bottom, k, o = {}) => wrap(ctx, o, () => {
    const open = M.clamp(k);
    for (const side of [-1, 1]) {
      const edge = side < 0 ? x0 : x1, inner = lerp((x0 + x1) / 2, edge + side * -60, open);
      for (let i = 0; i < 5; i++) {
        const xx = lerp(edge, inner, i / 4);
        ctx.beginPath();
        ctx.moveTo(xx, top);
        ctx.bezierCurveTo(xx + side * 10, lerp(top, bottom, 0.35), xx - side * 10, lerp(top, bottom, 0.7), xx + side * 4, bottom);
        ctx.strokeStyle = i % 2 ? C.g3 : C.g2;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = lerp(x0, x1, i / 10), b = lerp(x0, x1, (i + 1) / 10);
      ctx.moveTo(a, top);
      ctx.quadraticCurveTo((a + b) / 2, top + 34, b, top);
    }
    ctx.strokeStyle = C.g1;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 - 20, top);
    ctx.lineTo(x1 + 20, top);
    ctx.stroke();
  });

  O.stopwatch = (ctx, x, y, r, frac, o = {}) => wrap(ctx, o, () => {
    st(ctx, o, 4);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = o.color || C.white;
    ctx.fillRect(x - r * 0.14, y - r * 1.3, r * 0.28, r * 0.18);
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y - r * 1.12);
    ctx.stroke();
    if (frac > 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r * 0.84, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(frac, 0.9999));
      ctx.closePath();
      ctx.fillStyle = o.fill || 'rgba(255,255,255,0.16)';
      ctx.fill();
    }
    const a = -Math.PI / 2 + TAU * frac;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, TAU);
    ctx.fill();
  });

  O.sprout = (ctx, x, y, h, k, o = {}) => wrap(ctx, o, () => {
    const g = M.clamp(k), sh = h * g;
    st(ctx, o, 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - 10, y - sh * 0.4, x + 14, y - sh * 0.7, x, y - sh);
    ctx.stroke();
    const leaf = (lx, ly, ang, sc) => {
      if (sc <= 0) return;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(h * 0.18 * sc, -h * 0.12 * sc, h * 0.36 * sc, 0);
      ctx.quadraticCurveTo(h * 0.18 * sc, h * 0.12 * sc, 0, 0);
      ctx.fillStyle = o.color || C.white;
      ctx.fill();
      ctx.restore();
    };
    leaf(x + 2, y - sh * 0.55, -0.5, M.clamp(g * 2 - 0.6));
    leaf(x - 2, y - sh * 0.75, Math.PI + 0.5, M.clamp(g * 2 - 0.9));
    leaf(x, y - sh, -Math.PI / 2 + 0.2, M.clamp(g * 2 - 1.2) * 0.8);
  });

  O.lamp = (ctx, x, y, h, on, o = {}) => wrap(ctx, o, () => {
    if (on > 0) {
      const gr = ctx.createLinearGradient(0, y - h, 0, y);
      gr.addColorStop(0, `rgba(255,255,255,${0.16 * on})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(x + h * 0.22 - 16, y - h + 18);
      ctx.lineTo(x + h * 0.22 + 16, y - h + 18);
      ctx.lineTo(x + h * 0.22 + h * 0.36, y);
      ctx.lineTo(x + h * 0.22 - h * 0.36, y);
      ctx.closePath();
      ctx.fill();
    }
    st(ctx, o, 5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    ctx.quadraticCurveTo(x, y - h - 26, x + h * 0.12, y - h - 26);
    ctx.lineTo(x + h * 0.22, y - h - 26);
    ctx.lineTo(x + h * 0.22, y - h - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + h * 0.22 - 22, y - h + 14);
    ctx.lineTo(x + h * 0.22 + 22, y - h + 14);
    ctx.lineTo(x + h * 0.22 + 12, y - h - 6);
    ctx.lineTo(x + h * 0.22 - 12, y - h - 6);
    ctx.closePath();
    ctx.fillStyle = on > 0.5 ? C.white : C.bg;
    ctx.fill();
    ctx.stroke();
  });

  O.bench = (ctx, x, y, w, o = {}) => wrap(ctx, o, () => {
    st(ctx, o, 4);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 62); ctx.lineTo(x + w / 2, y - 62);
    ctx.moveTo(x - w / 2 + 10, y - 62); ctx.lineTo(x - w / 2 + 10, y);
    ctx.moveTo(x + w / 2 - 10, y - 62); ctx.lineTo(x + w / 2 - 10, y);
    ctx.moveTo(x - w / 2, y - 100); ctx.lineTo(x + w / 2, y - 100);
    ctx.moveTo(x - w / 2 + 10, y - 100); ctx.lineTo(x - w / 2 + 10, y - 62);
    ctx.moveTo(x + w / 2 - 10, y - 100); ctx.lineTo(x + w / 2 - 10, y - 62);
    ctx.stroke();
  });

  O.moon = (ctx, x, y, r, o = {}) => wrap(ctx, o, () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = o.color || C.white;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.42, y - r * 0.22, r * 0.86, 0, TAU);
    ctx.fillStyle = C.bg;
    ctx.fill();
  });

  O.sparkle = (ctx, x, y, r, o = {}) => wrap(ctx, o, () => {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fillStyle = o.color || C.white;
    ctx.fill();
  });

  O.hex = (ctx, x, y, r, o = {}) => wrap(ctx, o, () => {
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI / 6 + (i / 6) * TAU;
      i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    st(ctx, o, 2);
    ctx.stroke();
  });

  O.thought = (ctx, x, y, w, h, k, o = {}) => wrap(ctx, o, () => {
    const kk = M.clamp(k);
    st(ctx, o, 3);
    const n = 9;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, bx = x + Math.cos(a) * w * 0.5 * kk, by = y + Math.sin(a) * h * 0.5 * kk;
      ctx.moveTo(bx + h * 0.22 * kk, by);
      ctx.arc(bx, by, h * 0.22 * kk, 0, TAU);
    }
    ctx.fillStyle = C.bg;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5 * kk, h * 0.5 * kk, 0, 0, TAU);
    ctx.fill();
    (o.tail || []).forEach((p, i) => {
      if (kk < 0.3 + i * 0.2) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 - i * 2.5, 0, TAU);
      ctx.stroke();
    });
  });

  O.book = (ctx, x, y, w, h, flip, o = {}) => wrap(ctx, o, () => {
    st(ctx, o, 3);
    const page = (sx) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + sx * w * 0.25, y - 14, x + sx * w * 0.5, y - 4);
      ctx.lineTo(x + sx * w * 0.5, y - 4 - h);
      ctx.quadraticCurveTo(x + sx * w * 0.25, y - 14 - h, x, y - h);
      ctx.closePath();
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.stroke();
    };
    page(-1);
    page(1);
    for (let i = 0; i < 5; i++) {
      for (const sx of [-1, 1]) {
        if (o.lines === false && sx < 0) continue;
        ctx.beginPath();
        const yy = y - h + 40 + i * (h - 70) / 5;
        ctx.moveTo(x + sx * 26, yy);
        ctx.lineTo(x + sx * (w * 0.5 - 26) * (i === 4 ? 0.6 : 1), yy);
        ctx.strokeStyle = C.g3;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    if (flip > 0 && flip < 1) {
      const fx = Math.cos(flip * Math.PI);
      st(ctx, o, 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + fx * w * 0.5, y - 4 - Math.sin(flip * Math.PI) * 20);
      ctx.lineTo(x + fx * w * 0.5, y - 4 - h - Math.sin(flip * Math.PI) * 20);
      ctx.lineTo(x, y - h);
      ctx.closePath();
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    st(ctx, o, 3);
    ctx.stroke();
  });

  O.screen = (ctx, x, y, w, h, prog, o = {}) => wrap(ctx, o, () => {
    st(ctx, o, 3);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 14);
    ctx.stroke();
    const by = y + h / 2 - 26;
    ctx.fillStyle = C.g4;
    ctx.fillRect(x - w / 2 + 70, by - 3, w - 100, 6);
    ctx.fillStyle = C.white;
    ctx.fillRect(x - w / 2 + 70, by - 3, (w - 100) * M.clamp(prog), 6);
    ctx.beginPath();
    ctx.arc(x - w / 2 + 70 + (w - 100) * M.clamp(prog), by, 8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 28, by - 11);
    ctx.lineTo(x - w / 2 + 48, by);
    ctx.lineTo(x - w / 2 + 28, by + 11);
    ctx.closePath();
    ctx.fill();
  });

  O.mute = (ctx, x, y, s, o = {}) => wrap(ctx, o, () => {
    ctx.fillStyle = o.color || C.white;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y - s * 0.18);
    ctx.lineTo(x - s * 0.25, y - s * 0.18);
    ctx.lineTo(x + s * 0.05, y - s * 0.45);
    ctx.lineTo(x + s * 0.05, y + s * 0.45);
    ctx.lineTo(x - s * 0.25, y + s * 0.18);
    ctx.lineTo(x - s * 0.5, y + s * 0.18);
    ctx.closePath();
    ctx.fill();
    st(ctx, o, 3.5);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, y - s * 0.2); ctx.lineTo(x + s * 0.5, y + s * 0.2);
    ctx.moveTo(x + s * 0.5, y - s * 0.2); ctx.lineTo(x + s * 0.2, y + s * 0.2);
    ctx.stroke();
  });

  O.star = (ctx, x, y, r, fill, o = {}) => wrap(ctx, o, () => {
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU, rr = i % 2 ? r * 0.45 : r;
      i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    if (fill > 0) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = o.color || C.white;
      ctx.fillRect(x - r, y - r, r * 2 * M.clamp(fill), r * 2);
      ctx.restore();
    }
    st(ctx, o, 2.5);
    ctx.stroke();
  });

  O.eye = (ctx, x, y, w, open, look = 0, o = {}) => wrap(ctx, o, () => {
    const h = w * 0.38 * M.clamp(open);
    st(ctx, o, 4);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(x, y - h * 1.3, x + w / 2, y);
    ctx.quadraticCurveTo(x, y + h * 1.3, x - w / 2, y);
    ctx.closePath();
    ctx.stroke();
    if (open > 0.15) {
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.arc(x + look * w * 0.22, y, w * 0.2, 0, TAU);
      ctx.fillStyle = o.color || C.white;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + look * w * 0.22, y, w * 0.08, 0, TAU);
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.restore();
    }
  });

  O.card = (ctx, x, y, w, h, flip, front, back, o = {}) => wrap(ctx, o, () => {
    const sx = Math.cos(M.clamp(flip) * Math.PI);
    ctx.translate(x, y);
    ctx.scale(Math.abs(sx) < 0.02 ? 0.02 : Math.abs(sx), 1);
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 16);
    ctx.fillStyle = C.bg;
    ctx.fill();
    st(ctx, o, 3);
    ctx.stroke();
    if (sx > 0) front && front(ctx, w, h); else back && back(ctx, w, h);
  });

  O.door = (ctx, x, y, w, h, open, o = {}) => wrap(ctx, o, () => {
    st(ctx, o, 4);
    ctx.strokeRect(x - w / 2, y - h, w, h);
    const ow = w * (1 - 0.75 * M.clamp(open));
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 + ow, y + 8 * open);
    ctx.lineTo(x - w / 2 + ow, y - h - 8 * open);
    ctx.lineTo(x - w / 2, y - h);
    ctx.closePath();
    ctx.fillStyle = open > 0 ? 'rgba(255,255,255,0.1)' : C.bg;
    ctx.fill();
    ctx.stroke();
  });
})();
