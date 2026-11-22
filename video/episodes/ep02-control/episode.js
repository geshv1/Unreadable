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
     sub       small subline (optional)                                           */
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
    { id: 'hook', dur: 2.5, set: 'stage', action: 'idle',
      top: 'SAME AGE. SAME CITY. — PT. 2', headline: 'Different control.', red: 'control.' },

    { id: 'rule1-street', dur: 6, set: 'street', action: 'streetLeash',
      top: 'RULE I', headline: 'Emotion is a leash.', red: 'leash.', sub: 'Whoever pulls it, leads you.' },

    { id: 'rule2-phone', dur: 6, set: 'room', action: 'phoneFeint',
      top: 'RULE II', headline: 'A feint is a question.', red: 'question.', sub: 'The reactive man always answers.' },

    { id: 'rule3-office', dur: 6, set: 'office', action: 'scannerData',
      top: 'RULE III', headline: 'Your reaction is their data.', red: 'data.', sub: 'Give them nothing to read.' },

    { id: 'rule4-table', dur: 6, set: 'table', action: 'silenceTable',
      top: 'RULE IV', headline: 'Silence is pressure.', red: 'pressure.', sub: 'Let them fill it. Then watch.' },

    { id: 'ring-payoff', dur: 3.5, set: 'ring', action: 'ringPayoff',
      top: 'THE QUIET ONE WINS', headline: 'Stay unreadable.', red: 'unreadable.', sub: 'Same rules. Everywhere.' },

    { id: 'end-card', dur: 2, set: 'stage', action: 'endCard',
      top: 'SAME AGE. SAME CITY.', headline: 'Which one are you?', red: 'you?', sub: '@GESHV1', subColor: '#F4F5F7' },
  ],
};
