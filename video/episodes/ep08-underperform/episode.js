/* EPISODE CONFIG — "Same age. Same city." Pt. 8 — NARRATED format, second person ("you").
   Topic: "You're not scared of failing. You're scared of underperforming." + the fear of being judged / never starting.
   The two stickmen are illustrations, not named characters (no labels): red cap = the you who holds back,
   white = the you who goes anyway.
   Word timings assume a ~0.3 s/word read and get re-timed to the real voiceover when it arrives. */
V.EPISODE = {
  id: 'ep08-underperform',
  series: 'Same age. Same city.',
  episode: 8,
  handle: '@GESHV1',
  title: 'underperforming',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.9,
  stars: false, dust: false, grid: false,
  labels: false,
  grain: 0.06,
  zoom: 0.82,
  fadeIn: 0.5,
  fadeOut: 0.5,
  panel: { top: 560, bottom: 1330, feather: 80 },
  narrationY: 420,
  transition: { type: 'fade', pre: 0.12, post: 0.12 },

  scenes: [
    { id: 'hook', dur: 4.4, set: 'stage', action: 'u_hook', cam: { zoom: [0.72, 0.86], y: 207 } },
    { id: 'best', dur: 3.6, set: 'stage', action: 'u_best', cam: { zoom: [0.82, 0.86], y: 207 }, grade: { color: '#3a0f1a', amount: 0.2 } },
    { id: 'no-try', dur: 3.0, set: 'stage', action: 'u_noTry', cam: { zoom: 0.84, y: 207 }, grade: { color: '#6a4a20', amount: 0.16 } },
    { id: 'never-start', dur: 3.6, set: 'stage', action: 'u_post', cam: { zoom: 0.84, y: 207 }, grade: { color: '#1c2a45', amount: 0.22 } },
    { id: 'zeros', dur: 4.6, set: 'stage', action: 'u_zeros', cam: { zoom: [0.8, 0.88], y: 207 }, fadeIn: 0.3 },
    { id: 'admired', dur: 2.3, set: 'stage', action: 'u_admired', cam: { zoom: [0.84, 0.8], y: 207 }, grade: { color: '#7a4a1a', amount: 0.22 } },
    { id: 'first-video', dur: 1.4, set: 'stage', action: 'u_firstVideo', cam: { zoom: 0.86, y: 207 } },
    { id: 'first-fight', dur: 1.4, set: 'ring', action: 'u_firstFight', cam: { zoom: 0.84, y: 207 } },
    { id: 'first-day', dur: 1.3, set: 'stage', action: 'u_firstDay', cam: { zoom: 0.86, y: 207 } },
    { id: 'stayed', dur: 4.8, set: 'stage', action: 'u_graph', cam: { zoom: 0.82, y: 207 } },
    { id: 'in-public', dur: 5.6, set: 'stage', action: 'u_public', cam: { zoom: [0.78, 0.86], y: 207 }, grade: { color: '#1a1a24', amount: 0.2, to: '#7a4a1a', toAmount: 0.3 } },
    { id: 'start', dur: 4.0, set: 'stage', action: 'u_start', cam: { zoom: [0.84, 0.8], y: 207 }, grade: { color: '#7a4a1a', amount: 0.25 } },
    { id: 'cta', dur: 2.5, set: 'stage', action: 'u_cta', cam: { zoom: 0.82, y: 207 } },
  ],

  // the voiceover script (absolute seconds); red = key words
  narration: [
    { at: 0.3, text: "You're not scared of failing.", red: ['failing.'] },
    { at: 2.1, text: "You're scared of underperforming.", red: ['underperforming.'] },
    { at: 4.5, text: 'Of giving your best…', red: ['best…'] },
    { at: 6.0, text: 'and it still not being enough.', red: ['enough.'] },
    { at: 8.1, text: "So you don't try at all.", red: ["don't"] },
    { at: 11.1, text: 'If you never start, no one can judge you.', red: ['judge'] },
    { at: 14.7, text: 'But not trying is a performance too.', red: ['performance'] },
    { at: 16.9, text: "The only one that's guaranteed to lose.", red: ['lose.'] },
    { at: 19.3, text: 'Everyone you admire underperformed first.', red: ['underperformed'] },
    { at: 21.6, text: 'First video: 3 views.', red: ['views.'] },
    { at: 23.0, text: 'First fight: lost.', red: ['lost.'] },
    { at: 24.35, text: 'First day: shaking.', red: ['shaking.'] },
    { at: 25.7, text: 'They just stayed long enough to get good.', red: ['stayed'] },
    { at: 30.5, text: 'Be bad in public.', red: ['public.'] },
    { at: 32.4, text: "It's the price of being great later.", red: ['great'] },
    { at: 36.2, text: 'Start badly.', red: ['badly.'] },
    { at: 37.7, text: 'Start today.', red: ['today.'] },
    { at: 40.0, text: 'Which one are you?', red: ['you?'], end: 42.5 },
  ],

  // ── SOUND — minimal, physical only
  sfx: [
    { scene: 'no-try', at: 0.32, id: 'bump', gain: -7, args: { seed: 33, heavy: 1.1 }, note: 'the bar dropped' },
    { scene: 'never-start', at: 2.15, id: 'phone_down', gain: -11, pan: -0.2, note: 'laptop closed' },
    { scene: 'first-fight', at: 0.25, id: 'punch', gain: -4, note: 'first fight' },
    { scene: 'first-day', at: 0.15, id: 'bump', gain: -12, args: { seed: 34, heavy: 0.6 } },
  ],
};
