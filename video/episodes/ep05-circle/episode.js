/* EPISODE CONFIG — "Same age. Same city." Pt. 5 — the company you keep: your circle, the people around you.
   Cinematic cut: slow opening push-in, camera moves per scene, film grain, colour grades, depth (foreground figures),
   longer dramatic fades into the key scenes, fade to black at the end. */
V.EPISODE = {
  id: 'ep05-circle',
  series: 'Same age. Same city.',
  episode: 5,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-circle',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.95,
  stars: false, dust: false, grid: false,   // clean background: focus on the two of them
  grain: 0.07,
  zoom: 0.82,
  fadeIn: 0.9,            // opening fade up from black
  fadeOut: 0.6,           // closing fade to black
  textStyle: 'rise',      // text fades up 18px in 0.2s (cinematic) instead of the pop
  transition: { type: 'fade', pre: 0.2, post: 0.2 },

  scenes: [
    // COLD OPEN — a very slow push-in on both, a dark crowd behind them
    { id: 'cold-open', dur: 2.6, speed: 4.2 / 2.6, labels: false, set: 'stage', action: 'coldOpen', cam: { zoom: [0.55, 0.84], ease: 'inOut' },
      top: 'SAME AGE. SAME CITY. — PT. 5', headline: 'Different circle.', red: 'circle.' },

    { id: 'rule1-circle', dur: 4.6, speed: 6 / 4.6, set: 'club', action: 'circleRule', cam: { zoom: [0.8, 0.86], x: [-40, 40] },
      grade: { color: '#5a1830', amount: 0.25 },
      top: 'RULE I', headline: 'You become your circle.', red: 'circle.', sub: 'Your future looks like them.' },

    { id: 'rule2-hands', dur: 4.6, speed: 6 / 4.6, set: 'rooftop', action: 'ladderRule', cam: { zoom: [0.71, 0.74], y: [0, -10] },
      grade: { color: '#1c2a55', amount: 0.3 },
      top: 'RULE II', headline: 'Some hands hold you back.', red: 'back.', sub: 'Some lift you up.' },

    { id: 'rule3-talk', dur: 4.2, speed: 5.5 / 4.2, set: 'cafe', action: 'talkRule', cam: { zoom: [0.78, 0.82] },
      grade: { color: '#6a4a20', amount: 0.22 },
      top: 'RULE III', headline: 'Listen to what they talk about.', red: 'talk about.', sub: 'People, or ideas.' },

    { id: 'rule4-outgrow', dur: 5.0, speed: 6.5 / 5.0, set: 'rainstreet', action: 'outgrowRule', cam: { zoom: [0.8, 0.88], x: [0, 40] },
      fadeIn: 0.35, grade: { color: '#14305e', amount: 0.38 },
      top: 'RULE IV', headline: "It's okay to outgrow people.", red: 'outgrow', sub: 'Leave with love. Keep walking.' },

    { id: 'corner', dur: 4.8, speed: 6.3 / 4.8, set: 'ring', action: 'cornerRule', cam: { zoom: [0.76, 0.86] },
      fadeIn: 0.4, grade: { color: '#1a1a24', amount: 0.2, to: '#7a4a1a', toAmount: 0.32 },
      top: 'FIGHT NIGHT', headline: 'Your corner wins fights.', red: 'corner', sub: 'Build it on purpose.' },

    { id: 'end-card', dur: 2.8, set: 'stage', action: 'endCard', fadeIn: 0.4,
      top: 'SAME AGE. SAME CITY.', headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],

  // ── SOUND — minimal and physical only
  sfx: [
    { scene: 'rule2-hands', at: 2.95, id: 'bump', gain: -11, pan: -0.35, args: { seed: 61, heavy: 0.8 }, note: 'Reactive lands back on the roof' },
    { scene: 'corner', at: 4.72, id: 'punch', gain: -15, args: { seed: 5 }, note: 'gloves touch' },
  ],
};
