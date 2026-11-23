/* EPISODE CONFIG — "Same age. Same city." Pt. 4 — how they handle wins and losses.  (v2: shorter scenes,
   more expressions and objects, gold medals, clean background: no stars, no dust, no grid, no set clutter) */
V.EPISODE = {
  id: 'ep04-ego',
  series: 'Same age. Same city.',
  episode: 4,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-ego',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.92,
  zoom: 0.82,
  stars: false, dust: false, grid: false,               // clean background: focus on the two of them
  fadeIn: 0.7,                                         // opening: 0.7s fade up from black
  transition: { type: 'fade', pre: 0.12, post: 0.12 },

  scenes: [
    { id: 'hook', dur: 2.0, set: 'stage', action: 'squareUp', zoom: [0.62, 0.9],
      top: 'SAME AGE. SAME CITY. — PT. 4', headline: 'Different ego.', red: 'ego.' },

    { id: 'rule1-win', dur: 4.2, set: 'stage', action: 'winRule',
      top: 'RULE I', headline: 'A win is a test too.', red: 'test', sub: "Don't let it make you soft." },

    { id: 'rule2-loss', dur: 4.2, set: 'stage', action: 'lossRule',
      top: 'RULE II', headline: 'A loss is a step.', red: 'step.', sub: 'Or a place to sit.' },

    { id: 'rule3-their-win', dur: 4.0, set: 'stage', action: 'envyRule',
      top: 'RULE III', headline: "Their win isn't your loss.", red: 'loss.', sub: 'Clap. Then get back to work.' },

    { id: 'rule4-scoreboard', dur: 4.0, set: 'stage', action: 'scoreboardRule',
      top: 'RULE IV', headline: "Don't ride the scoreboard.", red: 'scoreboard.', sub: 'Same work after every result.' },

    { id: 'ring-payoff', dur: 3.3, set: 'ring', action: 'ringEgo',
      top: 'THE REMATCH', headline: 'Win or lose. Stay level.', red: 'level.', sub: 'Same rules. Every round.' },

    { id: 'end-card', dur: 2.8, set: 'stage', action: 'endCard',
      top: 'SAME AGE. SAME CITY.', headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],

  // ── SOUND EFFECTS — minimal and physical only.
  sfx: [
    { scene: 'rule2-loss', at: 0.95, id: 'bump', gain: -6, pan: -0.45, args: { seed: 41, heavy: 1.2 }, note: 'the L lands (x2)' },
    { scene: 'rule2-loss', at: 0.97, id: 'bump', gain: -7, pan: 0.45, args: { seed: 42, heavy: 1.2 } },
    { scene: 'rule2-loss', at: 0.62, id: 'bump', gain: -12, pan: -0.4, args: { seed: 43, heavy: 0.7 }, note: 'Reactive drops to his knees' },
    { scene: 'rule2-loss', at: 1.55, id: 'hop', gain: -15, pan: 0.4, note: 'Steady steps up' },
    { scene: 'rule2-loss', at: 2.25, id: 'hop', gain: -14, pan: 0.3, args: { seed: 23 } },
    { scene: 'rule3-their-win', at: 2.98, id: 'phone_down', gain: -7, pan: -0.45, note: 'phone hits the floor' },
    { scene: 'ring-payoff', at: 0.45, id: 'punch', gain: -11, pan: 0.2, args: { seed: 9 }, note: 'lucky jab' },
    { scene: 'ring-payoff', at: 1.95, id: 'punch', gain: -2, pan: -0.15, note: 'the clean punch' },
  ],
};
