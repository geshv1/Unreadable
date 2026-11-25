/* Scene actions any episode can use. An action is (tl, scene, episode) -> {figs, back, mid, front, overlay, shake}.
   tl = seconds since scene start. Characters: V.R() Reactive, V.St() Steady, V.X() third figure. */
(function () {
  const V = window.V;

  // Both standing in their spotlights in guard, idle breathing/bounce. Everything is static at tl=0.
  V.actions.idle = function (tl, sc) {
    const t = tl + (sc.start || 0);
    return {
      figs: [
        V.R({ pose: V.breathe(V.POSES.guard, t, 1.8, 3.7, 0) }),
        V.St({ pose: V.breathe(V.POSES.guard, t, 1.8, 3.3, 1.7) }),
      ],
    };
  };

  // Hook: both squaring up — bouncing on their toes in guard, edging toward each other.
  // Reactive: fast, twitchy, leans in, throws a quick feint. Steady: compact, slower rhythm, eyes locked.
  // Fully composed at tl = 0 (no fade, no entrance).
  V.actions.squareUp = function (tl, sc) {
    const PO = V.POSES;
    const hop = (t, hz, h) => -Math.abs(Math.sin(t * Math.PI * hz)) * h; // up only, feet leave the floor
    // Reactive
    const rLean = Object.assign({}, PO.guard, { C: [3, -83], P: [-4, -51], fB: [-25, -5], fF: [17, -5], hB: [9, -90], hF: [21, -94], hd: [2, 1] });
    const feintK = Math.sin(V.seg(tl, 0.55, 0.8) * Math.PI);
    let rp = V.lerpPose(rLean, V.set(PO.jab, 'hF', [34, -100]), feintK * 0.8);
    rp = V.shift(rp, Math.sin(tl * 17) * 1.5, hop(tl, 2.6, 6), true);
    rp.hB = [rp.hB[0] + Math.sin(tl * 23) * 1.5, rp.hB[1] + Math.cos(tl * 19) * 1.5];
    const rx = V.POS.reactive + 14 * Math.sin(tl * 4.2) + 10 * V.ease.out(V.seg(tl, 0, 1.5));
    // Steady
    let sp = Object.assign({}, PO.guard, { C: [-2, -84], P: [-6, -52], fB: [-24, -5], fF: [15, -5], hB: [7, -92], hF: [17, -96] });
    sp = V.shift(sp, 0, hop(tl + 0.2, 1.9, 3.6), true);
    const sx = V.POS.steady - 8 * Math.sin(tl * 3.1 + 1) - 8 * V.ease.out(V.seg(tl, 0, 1.5));
    return {
      figs: [
        V.R({ x: rx, pose: rp, expr: 'angry' }),
        V.St({ x: sx, pose: sp, expr: 'neutral' }),
      ],
    };
  };

  // End card: idle + handle under the headline is handled by `sub`
  V.actions.endCard = function (tl, sc) {
    const st = V.actions.idle(tl, sc);
    st.figs[0].expr = 'neutral'; st.figs[0].look = 0.5;
    st.figs[1].expr = 'neutral';
    return st;
  };
})();
