/* Player: turns an episode config into frames. One call per frame: V.renderFrame(i). */
(function () {
  const V = window.V;

  V.load = function (ep) {
    let t = 0;
    ep.scenes.forEach((s) => { s.start = t; s.end = t + s.dur; t = s.end; });
    ep.duration = t;
    ep.cuts = ep.scenes.slice(1).map((s) => ({ t: +s.start.toFixed(3), scene: s.id }));
    // resolve scene-relative sound cues to absolute seconds (+ one whoosh per cut)
    const byId = Object.fromEntries(ep.scenes.map((s) => [s.id, s]));
    ep.sfxResolved = (ep.sfx || []).map((c) => {
      if (!byId[c.scene]) throw new Error('sfx cue for unknown scene ' + c.scene);
      return Object.assign({}, c, { t: +(byId[c.scene].start + c.at / (byId[c.scene].speed || 1)).toFixed(4) });
    });
    if (ep.sfxCut) for (const c of ep.cuts) ep.sfxResolved.push({ id: ep.sfxCut.id, gain: ep.sfxCut.gain, t: +(c.t + ep.sfxCut.offset).toFixed(4), note: 'cut -> ' + c.scene });
    ep.sfxResolved.sort((a, b) => a.t - b.t);
    // CONTROL meter track: { reactive: [[scene, at, value], ...], steady: [...] } -> absolute [t, value]
    if (ep.control) {
      ep.controlResolved = {};
      for (const k of Object.keys(ep.control)) ep.controlResolved[k] = ep.control[k].map(([s, at, v]) => [byId[s].start + at / (byId[s].speed || 1), v]);
    }
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
    // scene.speed > 1 plays the scene's choreography faster (dur is the real, shortened length)
    const st = act(tl * (sc.speed || 1), sc, ep) || {};
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
    // camera zoom (episode.zoom < 1 = zoomed out), pivot on the floor line so the floor stays put
    // scene.zoom: number or [from, to] animated over the scene (slow push-in / pull-out)
    // scene.cam = { zoom, x, y, ease }: each a number or [from, to] animated over the scene (pan in world px)
    const cam = sc.cam || {};
    const zs = cam.zoom != null ? cam.zoom : sc.zoom != null ? sc.zoom : ep.zoom || 1;
    const cu = (V.ease[cam.ease || sc.zoomEase || 'inOut'])(V.clamp(tl / sc.dur));
    const anim = (v) => (Array.isArray(v) ? V.lerp(v[0], v[1], cu) : v || 0);
    const z = anim(zs), px = anim(cam.x), py = anim(cam.y);
    V.cam = { z, px, py };
    g.translate(540, V.FLOOR); g.scale(z, z); g.translate(-540 - px, -V.FLOOR - py);
    g.translate(540 + V.hash(i, 3) * shake, 1180 + V.hash(i, 4) * shake); g.scale(push, push); g.translate(-540, -1180);
    (V.sets[sc.set] || V.sets.stage)(g, t);
    V.drawFloor(g);
    if (st.back) st.back(g);
    for (const f of main) if (f.kind === 'reactive' || f.kind === 'steady') V.drawBeam(g, f.kind, f.beamX != null ? f.beamX : f.x, t, V.POS[f.kind], f.beam == null ? 1 : f.beam, f.beamW || 1, f.beamWarm || 0);
    for (const f of back) V.drawFigure(g, f);
    if (st.mid) st.mid(g);
    V.drawReflections(g, main);
    for (const f of main) V.drawFigure(g, f);
    if (st.front) st.front(g);
    g.restore();

    if (st.fg) st.fg(g);                       // foreground layer (screen space): blurred figures close to the lens
    if (sc.grade) drawGrade(g, sc.grade, tl, sc.dur);
    if (sc.labels !== false && ep.labels !== false) V.drawLabels(g, z, px);
    if (ep.vignette) drawVignette(g, ep.vignette);
    if (ep.grain) drawGrain(g, ep.grain, i);
    // CONTROL meters above each character (screen space, follow the camera)
    if (ep.controlResolved && sc.meters !== false) {
      const sx = (wx) => 540 + (wx - V.cam.px - 540) * V.cam.z;
      const ma = sc.meters === 'fade' ? 1 - V.clamp(tl / 0.3) : 1;
      g.save(); g.globalAlpha = ma;
      for (const [k, col] of [['reactive', 'red'], ['steady', 'white']]) {
        const m = V.meterAt(t, ep.controlResolved[k]);
        V.meter(g, sx(V.POS[k]), ep.meterY || 800, m.v, col, m.flash, m.up);
      }
      g.restore();
    }
    V.drawText(g, sc, tl, sc.start > 0);
    if (st.overlay) st.overlay(g);
    drawTransition(g, t);
    // opening fade from black (episode.fadeIn seconds) and closing fade to black (episode.fadeOut)
    if (ep.fadeIn && t < ep.fadeIn) { g.fillStyle = `rgba(0,0,0,${(1 - V.ease.inOut(t / ep.fadeIn)).toFixed(3)})`; g.fillRect(0, 0, V.W, V.H); }
    if (ep.fadeOut && t > ep.duration - ep.fadeOut) { g.fillStyle = `rgba(0,0,0,${V.ease.inOut(V.clamp((t - (ep.duration - ep.fadeOut)) / ep.fadeOut)).toFixed(3)})`; g.fillRect(0, 0, V.W, V.H); }
    if (V.debug) drawSafe(g);
    g.restore();
    return { t, scene: sc.id };
  };

  // Cut transitions. type 'fade': quick dip to black (fade out `pre`, fade in `post`). type 'swipe': red band.
  function drawTransition(g, t) {
    const tr = V.ep.transition || { pre: 0.16, post: 0.08 };
    if (tr.type === 'fade') {
      for (const c of V.ep.cuts) {
        const k = V.ep.scenes.findIndex((s) => s.id === c.scene);
        const pre = V.ep.scenes[k - 1].fadeOut || tr.pre, post = V.ep.scenes[k].fadeIn || tr.post;
        const d = t - c.t;
        const a = d < 0 ? 1 + d / pre : 1 - d / post;
        if (a > 0 && d > -pre && d < post) { g.fillStyle = `rgba(0,0,0,${V.ease.inOut(V.clamp(a)).toFixed(3)})`; g.fillRect(0, 0, V.W, V.H); }
      }
      return;
    }
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

  // Black edges: radial falloff from the centre of the action + darker top/bottom bands. Text is drawn after it.
  let vigCache = null, vigAmt = -1;
  function drawVignette(g, amt) {
    if (!vigCache || vigAmt !== amt) {
      vigCache = V.makeCanvas(V.W, V.H); vigAmt = amt;
      const x = vigCache.getContext('2d');
      const r = x.createRadialGradient(540, 1060, 260, 540, 1060, 1180);
      r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(0.55, `rgba(0,0,0,${0.35 * amt})`); r.addColorStop(1, `rgba(0,0,0,${amt})`);
      x.save(); x.translate(540, 1060); x.scale(1, 1.25); x.translate(-540, -1060); x.fillStyle = r; x.fillRect(-400, -600, V.W + 800, V.H + 1200); x.restore();
      const top = x.createLinearGradient(0, 0, 0, 380); top.addColorStop(0, `rgba(0,0,0,${0.85 * amt})`); top.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = top; x.fillRect(0, 0, V.W, 380);
      const bot = x.createLinearGradient(0, V.H, 0, V.H - 520); bot.addColorStop(0, `rgba(0,0,0,${amt})`); bot.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = bot; x.fillRect(0, V.H - 520, V.W, 520);
    }
    g.drawImage(vigCache, 0, 0);
  }

  // Colour grade: soft-light wash (e.g. cool rain, warm sunrise). grade = {color, amount, to?, toAmount?}
  function drawGrade(g, gr, tl, dur) {
    const u = V.clamp(tl / dur);
    g.save();
    g.globalCompositeOperation = 'soft-light';
    g.globalAlpha = gr.to ? V.lerp(gr.amount, gr.toAmount == null ? gr.amount : gr.toAmount, u) : gr.amount;
    g.fillStyle = gr.color; g.fillRect(0, 0, V.W, V.H);
    if (gr.to) { g.globalAlpha = (gr.toAmount == null ? gr.amount : gr.toAmount) * V.ease.inOut(u); g.fillStyle = gr.to; g.fillRect(0, 0, V.W, V.H); }
    g.restore();
  }
  // Film grain: a few pre-baked noise plates cycled per frame
  let grainPlates = null;
  function drawGrain(g, amt, i) {
    if (!grainPlates) {
      grainPlates = [];
      for (let p = 0; p < 6; p++) {
        const c = V.makeCanvas(540, 960), x = c.getContext('2d'), d = x.createImageData(540, 960), r = V.rng(900 + p);
        for (let k = 0; k < d.data.length; k += 4) { const v = 128 + (r() - 0.5) * 255; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
        x.putImageData(d, 0, 0); grainPlates.push(c);
      }
    }
    g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amt; g.imageSmoothingEnabled = false;
    g.drawImage(grainPlates[i % grainPlates.length], 0, 0, V.W, V.H); g.restore();
  }

  function drawSafe(g) {
    g.save(); g.fillStyle = 'rgba(0,160,255,0.18)';
    g.fillRect(0, 0, V.W, V.SAFE.top); g.fillRect(0, V.SAFE.bottom, V.W, V.H - V.SAFE.bottom); g.fillRect(V.SAFE.right, 0, V.W - V.SAFE.right, V.H);
    g.fillStyle = 'rgba(0,160,255,0.08)'; g.fillRect(0, 0, 150, V.H);
    g.strokeStyle = 'rgba(0,200,255,0.8)'; g.lineWidth = 2; g.strokeRect(0, 400, V.W, 350);
    g.restore();
  }
})();
