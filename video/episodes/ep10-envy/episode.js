/* EPISODE CONFIG — "Same age. Same city." — DIFFERENT EYES: envy, humility, staying a student.
   Same win, same beating, same advice: Reactive keeps score, Steady takes notes.
   Each situation = Reactive's own scene, then Steady's own scene (out in their world).
   Style: darker and more minimal (no grid, darker floor, fewer drifting dots), detailed figures
   (sneakers, hood, sleeves, thumbs, blinks), tighter framing with dark margins clear of TikTok's UI. */
const SP = 1.45;   // choreography plays 1.45x faster than authored

V.EPISODE = {
  id: 'ep10-envy',
  series: 'Same age. Same city.',
  handle: '@GESHV1',
  title: 'reactive-vs-steady-envy',
  fps: 30,
  width: 1080,
  height: 1920,

  // look: darker + more minimal, detailed figures
  detail: true,
  bgColor: '#060609', haze: 0.55, floor: 'dark', grid: false, reflect: 0.16, beamAlpha: 0.85,
  starField: { n: 30, drift: 7 },
  vignette: 1.0, grain: 0.05,
  // framing: a little closer, still leaving dark space around TikTok's buttons and caption
  zoom: 0.82, camY: 66, zoomDrift: 0.04,
  labelY: 1402,
  textTop: 380, textMaxW: 680, headMax: 96, headMin1: 82, head2Max: 82,
  textStyle: 'rise',
  transition: { type: 'fade', pre: 0.1, post: 0.13 },
  fadeOut: 0.5,

  scenes: [
    { id: 'hook', dur: 2.0, set: 'stage', action: 'squareUp', cam: { zoom: [0.8, 0.85] },
      top: 'SAME AGE. SAME CITY.', headline: 'Different eyes.', red: 'eyes.' },

    // ── 1. THE POST
    { id: 'post-reactive', dur: 4.8 / SP, speed: SP, solo: 'reactive', set: 'stage', action: 'evPostR', cam: { zoom: [0.98, 1.02], x: -120 },
      beats: [
        { at: 0, top: '11:02 PM', headline: 'A friend posts a win.', red: 'win.' },
        { at: 1.05, top: 'REACTIVE', headline: '“Why him?”', red: 'him?”', sub: 'Envy keeps score of other people.' },
      ] },
    { id: 'post-steady', dur: 4.8 / SP, speed: SP, solo: 'steady', set: 'stage', action: 'evPostS', cam: { zoom: [0.98, 1.02], x: 130 },
      beats: [
        { at: 0, top: '11:02 PM', headline: 'Same post.', red: 'post.' },
        { at: 1.0, top: 'STEADY', headline: '“How did he do it?”', red: 'How', sub: 'His win is free information.' },
      ] },

    // ── 2. SPARRING
    { id: 'spar-reactive', dur: 4.8 / SP, speed: SP, solo: 'reactive', set: 'stage', action: 'evSparR', cam: { zoom: [0.96, 1.0], x: -60 },
      beats: [
        { at: 0, top: 'SPARRING', headline: 'Someone better shows up.', red: 'better' },
        { at: 1.3, top: 'REACTIVE', headline: '“I know.”', red: 'know.”', sub: 'Pride protects him from the lesson.' },
      ] },
    { id: 'spar-steady', dur: 4.8 / SP, speed: SP, solo: 'steady', set: 'stage', action: 'evSparS', cam: { zoom: [0.96, 1.0], x: 60 },
      beats: [
        { at: 0, top: 'SPARRING', headline: 'Same beating.', red: 'beating.' },
        { at: 1.3, top: 'STEADY', headline: '“Show me again.”', red: 'again.”', sub: 'He loses the round. Keeps the lesson.' },
      ] },

    // ── 3. THE BOOK
    { id: 'book-reactive', dur: 4.8 / SP, speed: SP, solo: 'reactive', set: 'stage', action: 'evBookR', cam: { zoom: [0.98, 1.02], x: -60 },
      beats: [
        { at: 0, top: 'A FRIEND SAYS', headline: '“Read this.”', red: 'this.”' },
        { at: 0.95, top: 'REACTIVE', headline: '“I know all that.”', red: 'know', sub: '100 clips a day. Nothing sticks.' },
      ] },
    { id: 'book-steady', dur: 4.8 / SP, speed: SP, solo: 'steady', set: 'stage', action: 'evBookS', cam: { zoom: [0.98, 1.02], x: 40 },
      top: 'STEADY', headline: 'He stays a student.', red: 'student.', sub: 'One book a month. Twelve a year.' },

    // ── PAYOFF + CTA
    { id: 'payoff', dur: 2.6, set: 'stage', action: 'evPayoff', cam: { zoom: [0.81, 0.85] },
      top: 'SAME AGE. SAME CITY.', headline: 'Envy watches. Humility learns.', red: 'learns.' },
    { id: 'end-card', dur: 3.1, set: 'stage', action: 'endCard', cam: { zoom: [0.81, 0.84] },
      top: 'WHICH ONE ARE YOU?', headline: 'Find your type.', red: 'type.',
      sub: 'Free 2-min quiz — link in bio.', subColor: '#F4F5F7', sub2: 'THE FIX: UNREADABLE' },
  ],

  // ── SOUND — physical only
  sfx: [
    { scene: 'post-reactive', at: 0.12, id: 'notify', gain: -10, args: { chime: false, seed: 51 }, note: 'the post' },
    { scene: 'post-steady', at: 0.12, id: 'notify', gain: -11, args: { chime: false, seed: 52 } },
    { scene: 'post-steady', at: 1.05, id: 'tick', gain: -14, note: 'like' },
    { scene: 'post-steady', at: 2.55, id: 'notify', gain: -13, args: { chime: false, seed: 53 }, note: 'his reply' },
    { scene: 'spar-reactive', at: 0.22, id: 'swing', gain: -16, args: { seed: 70 } },
    { scene: 'spar-reactive', at: 0.62, id: 'punch', gain: -6, note: 'the counter lands' },
    { scene: 'spar-steady', at: 0.22, id: 'swing', gain: -16, args: { seed: 71 } },
    { scene: 'spar-steady', at: 0.62, id: 'punch', gain: -8 },
    { scene: 'spar-steady', at: 3.25, id: 'swing', gain: -14, args: { seed: 72 }, note: 'he slips it' },
    { scene: 'book-reactive', at: 1.95, id: 'plop', gain: -12, note: 'the book hits the floor' },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'book-reactive', at: 2.55 + k * 0.38, id: 'tick', gain: -20 })),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => ({ scene: 'book-steady', at: 0.45 + k * 0.3, id: 'plop', gain: -22, note: k ? '' : 'books stack up' })),
    { scene: 'payoff', at: 0.33, id: 'bump', gain: -12, args: { heavy: 0.4 }, note: 'gloves touch' },
  ],
};
