/* EPISODE CONFIG — "Same age. Same city." Pt. 3 — consistency & mind strength.
   Same template as Pt. 2 (see episodes/ep02-control/episode.js for the field list). */
V.EPISODE = {
  id: 'ep03-discipline',
  series: 'Same age. Same city.',
  episode: 3,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-discipline',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.92,
  zoom: 0.82,
  transition: { type: 'fade', pre: 0.14, post: 0.14 },

  scenes: [
    { id: 'hook', dur: 1.5, set: 'stage', action: 'squareUp',
      top: 'SAME AGE. SAME CITY. — PT. 3', headline: 'Different discipline.', red: 'discipline.' },

    { id: 'rule1-alarm', dur: 5.5, set: 'dawn', action: 'alarmRule',
      top: 'RULE I', headline: 'Motivation is a mood.', red: 'mood.', sub: "Discipline doesn't wait for it." },

    { id: 'rule2-bricks', dur: 5.5, set: 'yard', action: 'bricksRule',
      top: 'RULE II', headline: 'Consistency beats intensity.', red: 'Consistency', sub: 'One brick a day. Every day.' },

    { id: 'rule3-hold', dur: 5.5, set: 'gym', action: 'holdRule',
      top: 'RULE III', headline: 'The mind quits first.', red: 'first.', sub: 'Your body has more left.' },

    { id: 'rule4-alone', dur: 5.5, set: 'night', action: 'aloneRule',
      top: 'RULE IV', headline: 'Train when no one claps.', red: 'claps.', sub: 'Discipline is private.' },

    { id: 'ring-payoff', dur: 3.5, set: 'ring', action: 'ringGas',
      top: '6 MONTHS LATER', headline: 'Discipline shows up.', red: 'shows up.', sub: 'Strong mind. Every round.' },

    { id: 'end-card', dur: 3, set: 'stage', action: 'endCard',
      top: 'SAME AGE. SAME CITY.', headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],

  // ── SOUND EFFECTS — minimal and physical only (owner's rule: mature, no cartoon sounds).
  sfx: [
    ...[0.2, 0.75, 1.3].map((at) => ({ scene: 'rule1-alarm', at, id: 'notify', gain: -10, args: { chime: false }, note: 'alarm vibrating' })),
    // Steady: one brick every beat — a quiet metronome
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => ({ scene: 'rule2-bricks', at: 0.25 + (j + 1) * 0.55, id: 'phone_down', gain: -17, pan: 0.45, args: { seed: 30 + j }, note: j ? '' : 'Steady lays a brick' })),
    // Reactive: a burst of five, then the pile collapses
    ...[0, 1, 2, 3, 4].map((j) => ({ scene: 'rule2-bricks', at: 0.25 + (j + 1) * 0.24, id: 'phone_down', gain: -15, pan: -0.45, args: { seed: 50 + j } })),
    ...[0, 0.09, 0.2, 0.33].map((d, k) => ({ scene: 'rule2-bricks', at: 3.42 + d, id: 'bump', gain: -11 - k, pan: -0.5, args: { seed: 70 + k, heavy: 0.6 }, note: k ? '' : 'pile collapses' })),
    // the hold: only a clock
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'rule3-hold', at: 0.05 + k, id: 'tick', gain: -17, args: { tock: k % 2 === 1 } })),
    { scene: 'ring-payoff', at: 2.04, id: 'punch', gain: -2, pan: -0.15, note: 'the one clean punch' },
  ],
};
