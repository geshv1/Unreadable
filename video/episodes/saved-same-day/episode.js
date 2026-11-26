/* EPISODE CONFIG — "Same age. Same city." (saved, not scheduled) — "Same day. Different control."
   From the saved brief (video/briefs/next-same-day.md), adapted to the owner's later direction:
   clean minimal look, big headlines only (no top lines, sublines or labels), the message first.
   One continuous day, tracked by a live CONTROL meter. */
V.EPISODE = {
  id: 'saved-same-day',
  series: 'Same age. Same city.',
  episode: 8,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-same-day',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.94,
  grain: 0.05,
  zoom: 0.76,                                  // characters ≈ 400px tall
  stars: false, dust: false, grid: false, labels: false,
  fadeIn: 0.7,
  fadeOut: 0.5,
  textStyle: 'rise',
  transition: { type: 'fade', pre: 0.14, post: 0.14 },

  scenes: [
    { id: 'hook', dur: 1.8, set: 'stage', action: 'hook6', cam: { zoom: [0.6, 0.76], ease: 'inOut' },
      headline: 'Same day. Different control.', red: 'control.' },

    { id: 'am-street', dur: 4.2, set: 'lamp', action: 'street6', grade: { color: '#6a4a20', amount: 0.16 },
      headline: 'Emotion is a leash.', red: 'leash.' },

    { id: 'pm-phone', dur: 4.2, set: 'stage', action: 'phone6',
      headline: 'A feint is a question.', red: 'question.' },

    { id: 'work', dur: 4.2, set: 'stage', action: 'work6', grade: { color: '#1c2a45', amount: 0.18 },
      headline: 'Your reaction is their data.', red: 'data.' },

    { id: 'sparring', dur: 3.8, set: 'ring', action: 'spar6',
      headline: 'Silence is pressure.', red: 'pressure.' },

    // the quiet moment: slower fade in, slower motion
    { id: 'night', dur: 3.6, set: 'stage', action: 'night6', fadeIn: 0.6, fadeOut: 0.3, cam: { zoom: [0.78, 0.82] },
      grade: { color: '#101a3a', amount: 0.4 },
      headline: '11:48 PM.', red: null },

    { id: 'lesson', dur: 2.3, set: 'stage', action: 'lesson6', meters: 'fade',
      headline: 'One breath before you react.', red: 'breath' },

    { id: 'next-day', dur: 3.2, set: 'lamp', action: 'callback6', grade: { color: '#7a4a1a', amount: 0.2 },
      headline: 'Day one.', red: 'one.' },

    { id: 'cta', dur: 3.0, set: 'stage', action: 'endCard', meters: false,
      headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],

  // CONTROL meter: [scene, at (s, scene-relative), value]
  control: {
    reactive: [['hook', 0, 100], ['am-street', 1.3, 78], ['pm-phone', 2.3, 52], ['work', 1.55, 31],
      ['sparring', 0.55, 23], ['sparring', 1.0, 15], ['sparring', 1.45, 8], ['next-day', 1.85, 9]],
    steady: [['hook', 0, 100]],
  },

  // ── SOUND — minimal, physical only
  sfx: [
    { scene: 'am-street', at: 0.9, id: 'bump', gain: -7, pan: -0.35, args: { seed: 14 }, note: 'coffee guy bumps Reactive' },
    { scene: 'pm-phone', at: 0.2, id: 'notify', gain: -10, args: { chime: false }, note: 'both phones vibrate' },
    { scene: 'pm-phone', at: 2.75, id: 'notify', gain: -12, args: { chime: false, seed: 9 }, note: 'the reply' },
    { scene: 'pm-phone', at: 1.62, id: 'phone_down', gain: -10, pan: 0.4, note: 'Steady: face-down' },
    { scene: 'sparring', at: 1.95, id: 'punch', gain: -2, pan: -0.15, note: 'the clean punch' },
    { scene: 'next-day', at: 0.62, id: 'bump', gain: -9, pan: -0.35, args: { seed: 15, heavy: 0.8 }, note: 'same bump, next day' },
  ],
};
