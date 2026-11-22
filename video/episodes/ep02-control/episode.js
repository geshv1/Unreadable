/* EPISODE CONFIG — "Same age. Same city." Pt. 2
   Everything the episode needs lives here. To make a new episode: copy this folder,
   edit the text/timing below, and write the scene actions in actions.js.
   Fields per scene:
     id        short name (used in the cut list)
     dur       seconds
     set       background: stage | street | room | office | table | ring   (engine/sets.js)
     action    scene action name (actions.js or engine/actions-common.js)
     top       small spaced top line ("— TEXT —")
     headline  big italic serif headline
     red       the word(s) of the headline shown in red
     sub       small subline (optional; auto-fits, wraps after ' — ' if too long)
     sub2      extra small bold line under the subline, e.g. the handle (optional)                                           */
V.EPISODE = {
  id: 'ep02-control',
  series: 'Same age. Same city.',
  episode: 2,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-control',
  fps: 30,
  width: 1080,
  height: 1920,
  zoom: 0.82,                                     // camera: <1 zooms out (characters ≈ 23% of frame height)
  transition: { type: 'fade', pre: 0.14, post: 0.14 }, // quick dip to black at each cut (0.28s)

  scenes: [
    { id: 'hook', dur: 1.5, set: 'stage', action: 'squareUp',
      top: 'SAME AGE. SAME CITY. — PT. 2', headline: 'Different control.', red: 'control.' },

    { id: 'rule1-street', dur: 3.5, set: 'street', action: 'streetLeash',
      top: 'RULE I', headline: 'Emotion is a leash.', red: 'leash.', sub: 'Whoever pulls it, leads you.' },

    { id: 'rule2-phone', dur: 6, set: 'room', action: 'phoneFeint',
      top: 'RULE II', headline: 'A feint is a question.', red: 'question.', sub: 'The reactive man always answers.' },

    { id: 'rule3-office', dur: 6, set: 'office', action: 'scannerData',
      top: 'RULE III', headline: 'Your reaction is their data.', red: 'data.', sub: 'Give them nothing to read.' },

    { id: 'rule4-table', dur: 6, set: 'table', action: 'silenceTable',
      top: 'RULE IV', headline: 'Silence is pressure.', red: 'pressure.', sub: 'Let them fill it. Then watch.' },

    { id: 'ring-payoff', dur: 3.5, set: 'ring', action: 'ringPayoff',
      top: 'THE QUIET ONE WINS', headline: 'Stay unreadable.', red: 'unreadable.', sub: 'Same rules. Everywhere.' },

    { id: 'end-card', dur: 3, set: 'stage', action: 'endCard',
      top: 'SAME AGE. SAME CITY.', headline: 'Which one are you?', red: 'you?',
      sub: 'Free 2-min fighter quiz — link in bio.', subColor: '#F4F5F7', sub2: '@GESHV1' },
  ],
  // ── SOUND EFFECTS — kept minimal and physical on purpose (no whooshes, beeps, music or voices).
  //    Cues are relative to their scene. { scene, at (s), id (video/sfx/synth.py), gain (dB), pan, args, note }
  sfx: [
    { scene: 'rule1-street', at: 0.72, id: 'bump', gain: -6, pan: -0.3, args: { seed: 14 }, note: 'stranger bumps Reactive' },
    { scene: 'rule2-phone', at: 0.25, id: 'notify', gain: -9, args: { chime: false }, note: 'both phones vibrate' },
    { scene: 'rule2-phone', at: 2.86, id: 'phone_down', gain: -10, pan: 0.3, note: 'Steady: phone face-down' },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'rule4-table', at: 0.05 + k, id: 'tick', gain: -17, args: { tock: k % 2 === 1 }, note: k ? '' : 'clock in the silence' })),
    { scene: 'ring-payoff', at: 1.84, id: 'punch', gain: -2, pan: -0.15, note: 'the one clean punch' },
  ],
};
