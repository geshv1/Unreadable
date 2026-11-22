/* Player: turns an episode config into frames. One call per frame: V.renderFrame(i). */
(function () {
  const V = window.V;

  V.load = function (ep) {
    let t = 0;
    ep.scenes.forEach((s) => { s.start = t; s.end = t + s.dur; t = s.end; });
    ep.duration = t;
    ep.cuts = ep.scenes.slice(1).map((s) => ({ t: +s.start.toFixed(3), scene: s.id }));
    V.ep = ep;
    return ep;
  };

  // Standard helpers for actions
  V.R = (o = {}) => Object.assign({ kind: 'reactive', x: V.POS.reactive, face: 1, pose: V.POSES.guard }, o);
  V.St = (o = {}) => Object.assign({ kind: 'steady', x: V.POS.steady, face: -1, pose: V.POSES.guard }, o);
  V.X = (o = {}) => Object.assign({ kind: 'other', x: 540, face: 1, pose: V.POSES.stand }, o);

  function sceneAt(t) {
    const sc = V.ep.scenes;
    for (const s of sc) if (t < s.end - 1e-9) return s;
    return sc[sc.length - 1];
  }

  V.renderFrame = function (i, g) {
    const ep = V.ep;
    g = g || V.ctx;
    const t = i / ep.fps;
    const sc = sceneAt(t);
    const tl = t - sc.start;
    const act = V.actions[sc.action];
    if (!act) throw new Error('Unknown action ' + sc.action);
    const st = act(tl, sc, ep) || {};
    const figs = st.figs || [];
    const back = figs.filter((f) => f.depth === 'back');
    const main = figs.filter((f) => f.depth !== 'back');

    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1; g.filter = 'none';
    V.drawBackground(g, t);

    // world layer gets a slow camera push-in per scene (like the original)
    const push = 1 + 0.025 * V.ease.inOut(V.clamp(tl / sc.dur));
    const shake = st.shake || 0;
    g.save();
    g.translate(540 + V.hash(i, 3) * shake, 1180 + V.hash(i, 4) * shake); g.scale(push, push); g.translate(-540, -1180);
    (V.sets[sc.set] || V.sets.stage)(g, t);
    V.drawFloor(g);
    if (st.back) st.back(g);
    for (const f of main) if (f.kind === 'reactive' || f.kind === 'steady') V.drawBeam(g, f.kind, f.x, t, V.POS[f.kind]);
    for (const f of back) V.drawFigure(g, f);
    if (st.mid) st.mid(g);
    V.drawReflections(g, main);
    for (const f of main) V.drawFigure(g, f);
    if (st.front) st.front(g);
    g.restore();

    V.drawLabels(g);
    V.drawText(g, sc, tl, sc.start > 0);
    if (st.overlay) st.overlay(g);
    drawTransition(g, t);
    if (V.debug) drawSafe(g);
    g.restore();
    return { t, scene: sc.id };
  };

  // Swipe: a red diagonal band sweeps right->left across the cut (0.24s total), plus a 3-frame flash.
  function drawTransition(g, t) {
    const tr = V.ep.transition || { pre: 0.16, post: 0.08 };
    for (const c of V.ep.cuts) {
      const u = (t - (c.t - tr.pre)) / (tr.pre + tr.post);
      if (u >= 0 && u <= 1) {
        const x = V.lerp(V.W + 420, -420, V.ease.inOut(u));
        g.save(); g.translate(x, 960); g.rotate(-0.22);
        g.fillStyle = 'rgba(224,52,74,0.92)'; g.fillRect(-150, -1300, 300, 2600);
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(150, -1300, 16, 2600); g.fillRect(-190, -1300, 8, 2600);
        g.restore();
      }
      const f = t - c.t;
      if (f >= 0 && f < 0.1) { g.fillStyle = `rgba(255,255,255,${0.22 * (1 - f / 0.1)})`; g.fillRect(0, 0, V.W, V.H); }
    }
  }

  function drawSafe(g) {
    g.save(); g.fillStyle = 'rgba(0,160,255,0.18)';
    g.fillRect(0, 0, V.W, V.SAFE.top); g.fillRect(0, V.SAFE.bottom, V.W, V.H - V.SAFE.bottom); g.fillRect(V.SAFE.right, 0, V.W - V.SAFE.right, V.H);
    g.strokeStyle = 'rgba(0,200,255,0.8)'; g.lineWidth = 2; g.strokeRect(0, 400, V.W, 350);
    g.restore();
  }
})();
