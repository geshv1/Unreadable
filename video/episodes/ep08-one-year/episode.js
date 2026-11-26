/* EPISODE CONFIG — "Same age. Same city." Pt. 8 — NARRATED format (from the owner's reference video).
   Voiceover-driven: captions build word by word in sync with the narration; the scene sits in a dark
   cinema panel; one character per scene most of the time (labelled), side by side at key moments.
   PREVIEW: first 12 seconds (hook, mirror, bedroom). Word timings are set for a ~0.3 s/word read and are
   re-timed to the real voiceover once it exists. */
V.EPISODE = {
  id: 'ep08-one-year',
  series: 'Same age. Same city.',
  episode: 8,
  handle: '@GESHV1',
  title: 'reactive-vs-steady-one-year-preview',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.9,
  stars: false, dust: false, grid: false,
  grain: 0.06,
  zoom: 0.82,
  fadeIn: 0.5,
  panel: { top: 560, bottom: 1330, feather: 80 },   // the scene lives in this band; captions above it
  labelY: 1296,
  narrationY: 420,
  transition: { type: 'fade', pre: 0.12, post: 0.12 },

  scenes: [
    { id: 'hook', dur: 3.4, set: 'stage', action: 'hook8', cam: { zoom: [0.74, 0.82], y: 207 }, headline: '' },
    { id: 'mirror', dur: 3.0, set: 'stage', action: 'mirror8', cam: { zoom: 0.82, y: 207 }, labels: true, headline: '' },
    { id: 'bedroom', dur: 5.6, set: 'stage', action: 'bedroom8', cam: { zoom: [0.82, 0.86], y: 207, x: [0, -30] }, labels: 'reactive',
      grade: { color: '#14244e', amount: 0.3 }, headline: '' },
  ],

  // the voiceover script (absolute seconds); red = key words
  narration: [
    { at: 0.25, text: 'Same age.', red: ['age.'] },
    { at: 1.2, text: 'Same city.', red: ['city.'] },
    { at: 2.15, text: 'A year from now,' },
    { at: 3.45, text: "one of them won't recognize the other.", red: ['recognize'] },
    { at: 6.5, text: 'Reactive wakes up already tired.', red: ['tired.'] },
    { at: 8.6, text: 'Phone first.' },
    { at: 9.55, text: 'Dopamine before daylight.', red: ['Dopamine'], end: 12 },
  ],

  sfx: [
    { scene: 'bedroom', at: 0.45, id: 'notify', gain: -12, args: { chime: false }, note: 'phone buzz' },
  ],
};
