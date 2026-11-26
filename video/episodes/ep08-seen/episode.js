/* EPISODE CONFIG — "Same age. Same city." Pt. 8 — NARRATED format. Topic: the fear of being seen trying
   (fear of judgement, never starting). Hook: "You're not scared of failing. You're scared of being seen trying."
   PREVIEW: first ~12 seconds. Word timings assume a ~0.3 s/word read; re-timed to the real voiceover later. */
V.EPISODE = {
  id: 'ep08-seen',
  series: 'Same age. Same city.',
  episode: 8,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-seen-preview',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.9,
  stars: false, dust: false, grid: false,
  grain: 0.06,
  zoom: 0.82,
  fadeIn: 0.5,
  panel: { top: 560, bottom: 1330, feather: 80 },
  labelY: 1296,
  narrationY: 420,
  transition: { type: 'fade', pre: 0.12, post: 0.12 },

  scenes: [
    { id: 'hook', dur: 4.6, set: 'stage', action: 'hookEyes', cam: { zoom: [0.72, 0.84], y: 207 }, headline: '' },
    { id: 'board', dur: 2.7, set: 'stage', action: 'ideaBoard', cam: { zoom: [0.82, 0.86], y: 207 }, labels: 'reactive',
      grade: { color: '#6a4a20', amount: 0.18 }, headline: '' },
    { id: 'post', dur: 2.2, set: 'stage', action: 'postButton', cam: { zoom: 0.84, y: 207 }, labels: 'reactive',
      grade: { color: '#1c2a45', amount: 0.22 }, headline: '' },
    { id: 'judges', dur: 2.9, set: 'stage', action: 'judges', cam: { zoom: [0.82, 0.88], y: 207 }, labels: 'reactive',
      grade: { color: '#3a0f1a', amount: 0.3 }, headline: '' },
  ],

  narration: [
    { at: 0.3, text: "You're not scared of failing.", red: ['failing.'] },
    { at: 2.2, text: "You're scared of being seen trying.", red: ['seen'] },
    { at: 4.8, text: 'Reactive has a plan for everything.', red: ['plan'] },
    { at: 7.45, text: 'He just never presses start.', red: ['start.'] },
    { at: 9.7, text: 'Because… what will they think?', red: ['think?'], end: 12.4 },
  ],

  sfx: [
    { scene: 'post', at: 1.75, id: 'phone_down', gain: -11, pan: -0.2, note: 'laptop closed' },
  ],
};
