/* EPISODE CONFIG — "Same age. Same city." Pt. 7 — focus vs distraction: where your attention goes.
   Exact Pt. 6 style: cinematic, clean background, big headlines + the episode top line, no labels, quiz CTA. */
V.EPISODE = {
  id: 'ep07-focus',
  series: 'Same age. Same city.',
  episode: 7,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-focus',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.95,
  stars: false, dust: false, grid: false,
  labels: false,
  top: 'SAME OPPORTUNITIES. SAME 24 HOURS.',
  grain: 0.07,
  zoom: 0.82,
  fadeIn: 0.9,
  fadeOut: 0.6,
  textStyle: 'rise',
  transition: { type: 'fade', pre: 0.2, post: 0.2 },

  scenes: [
    { id: 'cold-open', dur: 2.6, set: 'stage', action: 'coldOpen7', cam: { zoom: [0.55, 0.84], ease: 'inOut' },
      headline: 'Different focus.', red: 'focus.' },

    { id: 'morning', dur: 4.6, set: 'dawn', action: 'morning7', cam: { zoom: [0.8, 0.84] },
      grade: { color: '#7a4a1a', amount: 0.22 },
      headline: 'Win the first hour.', red: 'first hour.' },

    { id: 'pings', dur: 4.6, set: 'stage', action: 'pings7', cam: { zoom: [0.8, 0.84] },
      grade: { color: '#1c2a45', amount: 0.2 },
      headline: 'Guard your attention.', red: 'attention.' },

    { id: 'slot', dur: 4.6, set: 'stage', action: 'slot7', cam: { zoom: [0.8, 0.85], x: [-20, 10] },
      grade: { color: '#5a1840', amount: 0.24 },
      headline: 'Easy now. Hard later.', red: 'Hard later.' },

    { id: 'night', dur: 4.6, set: 'stage', action: 'night7', cam: { zoom: [0.8, 0.83] }, fadeIn: 0.35,
      grade: { color: '#101a3a', amount: 0.4 },
      headline: "Hours don't come back.", red: 'back.' },

    { id: 'fight-night', dur: 4.8, set: 'ring', action: 'ringFocus', cam: { zoom: [0.76, 0.86] },
      grade: { color: '#1a1a24', amount: 0.2, to: '#7a4a1a', toAmount: 0.28 },
      headline: 'Focus wins fights.', red: 'Focus' },

    { id: 'end-card', dur: 2.8, set: 'stage', action: 'endCard', fadeIn: 0.4,
      headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],

  // ── SOUND — minimal, physical only
  sfx: [
    ...[0.4, 1.0, 1.6, 2.2, 2.8, 3.4].map((at, k) => ({ scene: 'pings', at, id: 'notify', gain: k ? -15 : -11, pan: -0.3, args: { chime: false, seed: 20 + k }, note: k ? '' : 'the pings' })),
    { scene: 'pings', at: 0.95, id: 'phone_down', gain: -12, pan: 0.4, note: 'Steady boxes the phone' },
    ...[0.3, 1.1, 1.9, 2.7, 3.5].map((at, k) => ({ scene: 'slot', at: at + 0.18, id: 'bump', gain: -15, pan: -0.4, args: { seed: 50 + k, heavy: 0.5 }, note: k ? '' : 'lever pulls' })),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ scene: 'night', at: 0.1 + k * 0.5, id: 'tick', gain: -17, args: { tock: k % 2 === 1 } })),
    { scene: 'fight-night', at: 2.3, id: 'punch', gain: -2, pan: -0.15, note: 'the clean punch' },
  ],
};
