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
  transition: { pre: 0.16, post: 0.08 }, // red swipe straddling each cut (0.24s)

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
  // ── SOUND EFFECTS (only where something physical happens; no music, no voices).
  //    Cues are relative to their scene so retiming a scene keeps them in sync.
  //    { scene, at (s), id (video/sfx/synth.py), gain (dB), pan (-1 L .. 1 R), args, note }
  //    Reactive is on the left (pan -0.35), Steady on the right (+0.35).
  sfxCut: { id: 'whoosh', offset: -0.16, gain: -13 },   // red swipe on every cut
  sfx: [
    // HOOK — both bouncing on their toes: soft canvas landings, one sneaker squeak on Reactive's feint
    { scene: 'hook', at: 0.385, id: 'hop', gain: -13, pan: -0.4 },
    { scene: 'hook', at: 0.769, id: 'hop', gain: -14, pan: -0.4, args: { seed: 27 } },
    { scene: 'hook', at: 1.154, id: 'hop', gain: -13, pan: -0.4, args: { seed: 37 } },
    { scene: 'hook', at: 0.326, id: 'hop', gain: -16, pan: 0.4, args: { seed: 47 } },
    { scene: 'hook', at: 0.853, id: 'hop', gain: -16, pan: 0.4, args: { seed: 57 } },
    { scene: 'hook', at: 0.56, id: 'squeak', gain: -17, pan: -0.4, note: 'feint pivot' },
    { scene: 'hook', at: 0.58, id: 'swing', gain: -16, pan: -0.2, note: 'feint' },

    // RULE I — street: city bed, two shoulder bumps, the leash igniting, the yank
    { scene: 'rule1-street', at: 0.0, id: 'city', gain: -23, note: 'street bed' },
    { scene: 'rule1-street', at: 0.2, id: 'bump', gain: -9, pan: 0.35, args: { heavy: 0.7 }, note: 'stranger bumps Steady' },
    { scene: 'rule1-street', at: 0.72, id: 'bump', gain: -5, pan: -0.35, args: { seed: 14 }, note: 'stranger bumps Reactive' },
    { scene: 'rule1-street', at: 0.95, id: 'leash_on', gain: -8, pan: -0.45, note: 'red leash appears' },
    { scene: 'rule1-street', at: 1.2, id: 'yank', gain: -4, pan: -0.45, note: 'YANK' },

    // RULE II — phone: same message on both phones; Reactive types and sends, Steady puts it face-down
    { scene: 'rule2-phone', at: 0.25, id: 'notify', gain: -7, note: 'we need to talk' },
    { scene: 'rule2-phone', at: 2.0, id: 'typing', gain: -15, pan: -0.35, args: { d: 3.4 } },
    { scene: 'rule2-phone', at: 2.05, id: 'send', gain: -13, pan: -0.35 },
    { scene: 'rule2-phone', at: 2.80, id: 'send', gain: -13, pan: -0.35 },
    { scene: 'rule2-phone', at: 3.55, id: 'send', gain: -12, pan: -0.35 },
    { scene: 'rule2-phone', at: 4.30, id: 'send', gain: -13, pan: -0.35 },
    { scene: 'rule2-phone', at: 5.05, id: 'send', gain: -13, pan: -0.35 },
    { scene: 'rule2-phone', at: 2.86, id: 'phone_down', gain: -9, pan: 0.4, note: 'Steady: face-down' },

    // RULE III — office: scanner on Reactive -> DATA beep; scanner on Steady -> glitch
    { scene: 'rule3-office', at: 0.3, id: 'scan', gain: -17, pan: -0.3, args: { d: 2.45 } },
    { scene: 'rule3-office', at: 2.6, id: 'confirm', gain: -10, pan: -0.35, note: 'DATA ✓' },
    { scene: 'rule3-office', at: 3.15, id: 'scan', gain: -17, pan: 0.3, args: { d: 1.0, seed: 22 } },
    { scene: 'rule3-office', at: 4.1, id: 'glitch', gain: -9, pan: 0.35, note: 'NO DATA' },

    // RULE IV — table: the silence is the point. Only a wall clock, and each bubble thudding onto the pile.
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'rule4-table', at: 0.05 + k, id: 'tick', gain: -14, args: { tock: k % 2 === 1 } })),
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'rule4-table', at: 0.61 + k * 0.62, id: 'plop', gain: -12, pan: -0.35, args: { seed: 60 + k } })),

    // RING — five wild misses, one clean punch, Reactive's shoes scuffing back
    ...[0, 1, 2, 3, 4].map((k) => ({ scene: 'ring-payoff', at: 0.1 + k * 0.3, id: 'swing', gain: -10, pan: k % 2 ? 0.1 : -0.1, args: { seed: 80 + k }, note: 'miss' })),
    { scene: 'ring-payoff', at: 1.84, id: 'punch', gain: -1, pan: -0.2, note: 'clean punch lands' },
    { scene: 'ring-payoff', at: 2.0, id: 'scuff', gain: -12, pan: -0.4 },
    { scene: 'ring-payoff', at: 2.24, id: 'scuff', gain: -14, pan: -0.45, args: { seed: 91 } },

    // END CARD — ring bell: ding-ding-ding under "Which one are you?"
    { scene: 'end-card', at: 0.05, id: 'bell', gain: -6, note: 'CTA' },
  ],
};
