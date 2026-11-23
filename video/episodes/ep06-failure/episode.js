/* EPISODE CONFIG — "Same age. Same city." Pt. 6 — failure, rejection, problems.
   Exact Pt. 5 style: cinematic (camera moves, grades, grain, depth), clean background,
   big headlines only (no top lines, sublines or labels), faceless square-up opening, quiz CTA. */
V.EPISODE = {
  id: 'ep06-failure',
  series: 'Same age. Same city.',
  episode: 6,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-failure',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.95,
  stars: false, dust: false, grid: false,   // clean background: focus on the two of them
  labels: false,                            // no REACTIVE / STEADY labels: minimal look
  top: 'SAME OPPORTUNITIES. SAME 24 HOURS.',  // small spaced top line on every scene
  grain: 0.07,
  zoom: 0.82,
  fadeIn: 0.9,
  fadeOut: 0.6,
  textStyle: 'rise',
  transition: { type: 'fade', pre: 0.2, post: 0.2 },

  // clean look: only the big headlines; the end card keeps the quiz CTA
  scenes: [
    { id: 'cold-open', dur: 2.6, labels: false, set: 'stage', action: 'coldOpen6', cam: { zoom: [0.55, 0.84], ease: 'inOut' },
      headline: 'Different comeback.', red: 'comeback.' },

    { id: 'rejection', dur: 4.6, set: 'stage', action: 'doorRule', cam: { zoom: [0.79, 0.82] },
      grade: { color: '#1c2a45', amount: 0.25 },
      headline: 'Knock again.', red: 'again.' },

    { id: 'failure', dur: 4.6, set: 'stage', action: 'hurdleRule', cam: { zoom: [0.8, 0.84], x: [-20, 20] },
      grade: { color: '#5a1830', amount: 0.2 },
      headline: 'Fall seven. Rise eight.', red: 'Rise' },

    { id: 'problem', dur: 4.6, set: 'stage', action: 'blockRule', cam: { zoom: [0.8, 0.86] },
      grade: { color: '#2a2a3a', amount: 0.2 },
      headline: 'Break it into pieces.', red: 'pieces.' },

    { id: 'the-email', dur: 4.6, set: 'stage', action: 'emailRule', cam: { zoom: [0.8, 0.84] }, fadeIn: 0.3,
      grade: { color: '#14305e', amount: 0.3 },
      headline: 'Ask what to fix.', red: 'fix.' },

    { id: 'fight-night', dur: 4.8, set: 'ring', action: 'ringGetUp', cam: { zoom: [0.76, 0.86] }, fadeIn: 0.35,
      grade: { color: '#1a1a24', amount: 0.2, to: '#7a4a1a', toAmount: 0.3 },
      headline: 'Get up. Every time.', red: 'up.' },

    { id: 'end-card', dur: 2.8, set: 'stage', action: 'endCard', fadeIn: 0.4,
      headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],

  // ── SOUND — minimal, physical only
  sfx: [
    ...[0.25, 0.45, 0.65].map((at, k) => ({ scene: 'rejection', at, id: 'phone_down', gain: -15, args: { seed: 70 + k }, note: k ? '' : 'knock knock' })),
    { scene: 'rejection', at: 1.8, id: 'bump', gain: -9, args: { seed: 31, heavy: 0.8 }, note: 'door shuts' },
    ...[2.05, 2.25].map((at, k) => ({ scene: 'rejection', at, id: 'phone_down', gain: -16, pan: 0.4, args: { seed: 80 + k } })),
    { scene: 'rejection', at: 2.95, id: 'bump', gain: -11, pan: 0.4, args: { seed: 32, heavy: 0.7 } },
    ...[3.2, 3.38].map((at, k) => ({ scene: 'rejection', at, id: 'phone_down', gain: -16, pan: 0.4, args: { seed: 90 + k } })),
    { scene: 'failure', at: 0.82, id: 'bump', gain: -7, pan: -0.35, args: { seed: 41 }, note: 'both fall' },
    { scene: 'failure', at: 0.88, id: 'bump', gain: -8, pan: 0.35, args: { seed: 42 } },
    ...[0, 1, 2, 3, 4, 5, 6].map((k) => ({ scene: 'problem', at: 1.2 + k * 0.48, id: 'phone_down', gain: -14, pan: 0.4, args: { seed: 100 + k }, note: k ? '' : 'one piece at a time' })),
    { scene: 'the-email', at: 1.55, id: 'phone_down', gain: -8, pan: -0.4, args: { seed: 120 }, note: 'laptop slammed shut' },
    { scene: 'fight-night', at: 0.58, id: 'punch', gain: -5, pan: 0.2, note: 'Steady goes down' },
    { scene: 'fight-night', at: 3.0, id: 'punch', gain: -2, pan: -0.15, note: 'the clean punch' },
  ],
};
