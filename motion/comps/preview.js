/* Preview: two scenes that exercise all four systems.
   A — Social pressure: a lockstep crowd on one path; one figure stops and takes another.
   B — Stoicism: still figure inside the circle of control; chaos outside becomes order. */
(function () {
  const M = window.M;
  const { C, lerp, tw, E, prog } = M;
  const TY = 1390; // text line

  // ---------------- Scene A ----------------
  const A = { x0: 170, x1: 910, gy: 1010, h: 118, n: 7, sp: 112, v: 125, c: 3, td: 2.3 };
  A.L = A.n * A.sp;
  A.stride = A.h * 0.9;
  A.delta = ((((540 - A.x0 + 15 - A.c * A.sp - A.v * A.td) % A.L) + A.L) % A.L);
  A.stopDist = A.v * 0.175; // distance covered while braking over 0.35s
  A.stopX = 540 + A.stopDist;
  A.branch = new M.I.Path([
    { x: A.stopX, y: A.gy },
    { x: A.stopX + 70, y: A.gy - 30 },
    { x: 735, y: 905 },
    { x: 772, y: 850 },
  ]);
  A.end = A.branch.at(1);

  function sceneA(ctx, t, D) {
    const out = 1 - tw(t, D - 0.45, D, E.inCubic);
    ctx.globalAlpha = out;

    M.T.label(ctx, '01   SOCIAL PRESSURE', 540, 640, t - 0.1, { color: C.g2 });

    // main path + ruler
    const k = tw(t, 0.0, 0.8, E.outExpo);
    const mainCol = t > A.td ? C.g3 : C.g2;
    ctx.save();
    ctx.strokeStyle = mainCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(A.x0, A.gy);
    ctx.lineTo(lerp(A.x0, A.x1, k), A.gy);
    ctx.stroke();
    ctx.restore();
    M.I.ticks(ctx, A.x0, A.gy + 16, A.x1 - A.x0, 37, prog(t, 0.15, 1.1), { major: 6, color: C.g4 });

    // branch path (the other direction)
    const bk = tw(t, A.td + 0.55, A.td + 1.15, E.inOutCubic);
    if (bk > 0) {
      A.branch.draw(ctx, 0, bk, { stroke: C.white, lw: 3, dash: [2, 12], cap: 'round' });
      M.I.node(ctx, A.end.x, A.end.y, t - (A.td + 1.1), { r: 9 });
    }

    // crowd (lockstep: every figure shares one phase)
    const crowdA = lerp(1, 0.32, tw(t, A.td + 0.1, A.td + 0.7));
    const ph = M.walkPhase(A.v * t, A.h);
    for (let i = 0; i < A.n; i++) {
      if (i === A.c && t > A.td - 0.001) continue;
      const s = (i * A.sp + A.delta + A.v * t) % A.L;
      const x = A.x0 - 15 + s;
      const edge = Math.min(prog(x, A.x0 - 10, A.x0 + 60), 1 - prog(x, A.x1 - 70, A.x1));
      const intro = tw(t, 0.25 + i * 0.05, 0.6 + i * 0.05, E.outCubic);
      const a = edge * intro * (i === A.c ? 1 : crowdA);
      if (a <= 0.01) continue;
      M.figure(ctx, { x, y: A.gy - 3, h: A.h, pose: M.walkPose(ph, 1), dir: 1, alpha: a });
    }

    // the one who chooses
    if (t > A.td) {
      const u = Math.min(t - A.td, 0.35);
      const brake = A.v * (u - (u * u) / (2 * 0.35));
      const amp = 1 - prog(t, A.td, A.td + 0.35);
      const tw0 = A.td + 1.1, tw1 = D - 0.35;
      if (t < tw0) {
        const pose = amp > 0 ? M.walkPose(M.walkPhase(A.v * A.td + brake, A.h), amp) : M.Pose.side;
        M.figure(ctx, { x: 540 + brake, y: A.gy - 3, h: A.h, pose, dir: 1 });
      } else {
        const uu = tw(t, tw0, tw1, E.inOutSine);
        const p = A.branch.at(uu);
        const ramp = Math.min(prog(t, tw0, tw0 + 0.2), 1 - prog(t, tw1 - 0.2, tw1));
        M.figure(ctx, { x: p.x, y: p.y - 3, h: A.h, pose: M.walkPose(M.walkPhase(uu * A.branch.len, A.h, 1.1), 1.1 * ramp), dir: 1 });
      }
      M.I.tag(ctx, '1 / 7', A.stopX, A.gy - A.h - 24, 46, t - (A.td + 0.4), { t1: 0.75 });
    }

    M.T.words(ctx, { text: 'Everyone walks the *same* path.', x: 540, y: TY, t0: 0.35, t1: 2.05 }, t);
    M.T.words(ctx, { text: '*One* chooses another.', x: 540, y: TY, t0: A.td + 0.15, stagger: 0.1, t1: D - 0.55 }, t);
  }

  // ---------------- Scene B ----------------
  const B = { cx: 540, cy: 905, rIn: 170, rOut: 330 };
  const field = new M.G.Field(18, 7, {
    types: ['triangle', 'square', 'circle', 'triangle', 'plus', 'diamond'],
    sMin: 9, sMax: 22, rMin: 225, rMax: 430, spin: 1.5, wobble: 34, fillRatio: 0.3,
  });
  const LABELS = [
    { text: 'OPINIONS', ang: -2.25, r: 425 },
    { text: 'OUTCOMES', ang: -0.89, r: 425 },
    { text: 'OTHERS', ang: Math.PI / 2, r: 405 },
  ];

  function sceneB(ctx, t, D) {
    const out = 1 - tw(t, D - 0.5, D, E.inCubic);
    ctx.globalAlpha = out;
    const { cx, cy } = B;

    M.T.label(ctx, '02   CONTROL', 540, 470, t - 0.5, { color: C.g2 });

    // node → circle of control
    const e = tw(t, 0.05, 0.75, E.inOutExpo);
    const nx = lerp(A.end.x, cx, e), ny = lerp(A.end.y, cy, e), nr = lerp(9, B.rIn, e);
    if (e < 0.12) {
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, M.TAU);
      ctx.fillStyle = C.white;
      ctx.globalAlpha = out * (1 - e / 0.12);
      ctx.fill();
      ctx.globalAlpha = out;
    }
    M.G.ring(ctx, nx, ny, nr, { stroke: C.white, lw: 2.5 });

    // outer boundary, always moving
    const ok = tw(t, 0.55, 1.35, E.inOutCubic);
    const spin = t * 0.22;
    M.G.ring(ctx, cx, cy, B.rOut, { stroke: C.g3, lw: 2, dash: [3, 11], offset: -t * 40, k: ok, a0: -Math.PI / 2 + spin });

    // chaos → order
    const order = tw(t, 3.15, 4.1, E.linear);
    const target = (it, n, tt) => {
      const a = (it.i / n) * M.TAU + spin * 1.4 - Math.PI / 2;
      return { x: Math.cos(a) * B.rOut, y: Math.sin(a) * B.rOut, rot: a, s: 10 };
    };
    field.draw(ctx, cx, cy, t, order, target, (it, kk) => (it.fill ? { fill: lerp(0, 1, kk) > 0.5 ? C.white : C.g1 } : { stroke: kk > 0.5 ? C.white : C.g2, lw: 2.2 }), prog(t, 0.85, 1.7));

    // labels for what is outside your control
    LABELS.forEach((L, i) => {
      const lt = t - (1.55 + i * 0.14);
      if (lt < 0) return;
      const lx = cx + Math.cos(L.ang) * L.r, ly = cy + Math.sin(L.ang) * L.r;
      M.T.label(ctx, L.text, lx, ly, lt, { color: C.g2, size: 19, t1: D - 0.55 - (1.55 + i * 0.14) });
    });

    // the still centre
    const fa = tw(t, 0.45, 0.95, E.outCubic);
    const calm = tw(t, 3.2, 3.9, E.inOutCubic);
    M.figure(ctx, { x: cx, y: cy + 78 + (1 - fa) * 18, h: 150, pose: M.blendPose(M.Pose.front, M.Pose.frontCalm, calm), alpha: fa });
    M.T.label(ctx, 'YOUR RESPONSE', cx, cy + B.rIn - 36, t - 2.05, { color: C.white, size: 15, tracking: '4px' });

    M.T.words(ctx, { text: 'Control what is *yours*.', x: 540, y: TY + 60, t0: 0.95, t1: 2.95 }, t);
    M.T.words(ctx, { text: 'Release the *rest*.', x: 540, y: TY + 60, t0: 3.15, stagger: 0.11, t1: D - 0.6 }, t);
  }

  const tl = new M.Timeline(9.8);
  tl.add(0, 5.0, sceneA);
  tl.add(4.6, 5.2, sceneB);
  M.comps.preview = { duration: tl.duration, render: (ctx, t) => tl.render(ctx, t) };
})();
