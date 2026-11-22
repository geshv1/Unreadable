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

  // End card: idle + handle under the headline is handled by `sub`
  V.actions.endCard = function (tl, sc) {
    const st = V.actions.idle(tl, sc);
    st.figs[0].expr = 'neutral'; st.figs[0].look = 0.5;
    st.figs[1].expr = 'neutral';
    return st;
  };
})();
