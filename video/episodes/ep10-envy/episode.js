/* EPISODE CONFIG — "Same age. Same city." — DIFFERENT EYES: envy, humility, staying a student.
   Same win, same beating, same advice: Reactive keeps score, Steady takes notes.
   Each situation = Reactive's own scene, then Steady's own scene (out in their world).
   Style: darker and more minimal (no grid, darker floor, fewer drifting dots), detailed figures
   (sneakers, hood, sleeves, thumbs, blinks), tighter framing with dark margins clear of TikTok's UI. */
// Caption rule: in every solo scene the thought + its line show alone for CAP seconds (calm setup, no action),
// fade out, then the action plays at RATE with no caption on screen.
const CAP = 1.8, RATE = 1.0, HOLD = 0.3;   // action at its natural pace; a short beat at the end lets each moment land
// remap pieces: [localT, actionT, rate]. Setup either plays slowly under the caption (posts) or is a calm
// pre-roll before the action starts (actionT < 0: guard, standing, reading).
const SETUP = (len) => [[0, 0, len / CAP], [CAP, len, RATE]];
const PREROLL = [[0, -CAP, 1], [CAP, 0, RATE]];
const durOf = (remap, end) => { const [l0, a0, r] = remap[remap.length - 1]; return l0 + (end - a0) / r + HOLD; };
const at = (remap, a) => { let t = null; for (const [l0, a0, r] of remap) if (a >= a0) t = l0 + (a - a0) / (r || 1); return +t.toFixed(3); };
const CAPTION = (headline, red, sub) => [{ at: 0, until: CAP - 0.18, top: '', headline, red, sub }];

const PR = SETUP(1.3), PS = SETUP(1.0);

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
    { id: 'post-reactive', dur: durOf(PR, 4.8), remap: PR, solo: 'reactive', set: 'stage', action: 'evPostR', cam: { zoom: [0.98, 1.02], x: -120 },
      beats: CAPTION('“Why him?”', 'him?”', 'Envy keeps score of other people.') },
    { id: 'post-steady', dur: durOf(PS, 4.8), remap: PS, solo: 'steady', set: 'stage', action: 'evPostS', cam: { zoom: [0.98, 1.02], x: 130 },
      beats: CAPTION('“How did he do it?”', 'How', 'His win is free information.') },

    // ── 2. SPARRING
    { id: 'spar-reactive', dur: durOf(PREROLL, 4.4), remap: PREROLL, solo: 'reactive', set: 'stage', action: 'evSparR', cam: { zoom: [0.96, 1.0], x: -60 },
      beats: CAPTION('“I already know.”', 'know.”', 'Pride protects him from the lesson.') },
    { id: 'spar-steady', dur: durOf(PREROLL, 4.5), remap: PREROLL, solo: 'steady', set: 'stage', action: 'evSparS', cam: { zoom: [0.96, 1.0], x: 60 },
      beats: CAPTION('“Show me again.”', 'again.”', 'He loses the round. Keeps the lesson.') },

    // ── 3. THE BOOK
    { id: 'book-reactive', dur: durOf(PREROLL, 4.45), remap: PREROLL, solo: 'reactive', set: 'stage', action: 'evBookR', cam: { zoom: [0.98, 1.02], x: -60 },
      beats: CAPTION('“I know all that.”', 'know', '100 clips a day. Nothing sticks.') },
    { id: 'book-steady', dur: durOf(PREROLL, 4.2), remap: PREROLL, solo: 'steady', set: 'stage', action: 'evBookS', cam: { zoom: [0.98, 1.02], x: 40 },
      beats: CAPTION('He stays a student.', 'student.', 'One book a month. Twelve a year.') },

    // ── FINALE: ready to fight, then the question, then the quiz picture
    { id: 'ready', dur: 3.4, set: 'stage', action: 'evReady', cam: { zoom: [0.82, 0.87] },
      beats: [
        { at: 0, top: 'SAME AGE. SAME CITY.', headline: 'Envy watches. Humility learns.', red: 'learns.' },
        { at: 1.8, top: '', headline: 'Which one are you?', red: 'you?' },
      ] },
    { id: 'quiz', dur: 3.2, set: 'stage', action: 'evPawn', labels: false, headline: '' },
  ],

  // ── SOUND — physical only
  sfx: [
    { scene: 'post-reactive', at: at(PR, 0.12), id: 'notify', gain: -10, args: { chime: false, seed: 51 }, note: 'the post' },
    { scene: 'post-steady', at: at(PS, 0.12), id: 'notify', gain: -11, args: { chime: false, seed: 52 } },
    { scene: 'post-steady', at: at(PS, 1.12), id: 'tick', gain: -14, note: 'like' },
    { scene: 'post-steady', at: at(PS, 2.55), id: 'notify', gain: -13, args: { chime: false, seed: 53 }, note: 'his reply' },
    { scene: 'spar-reactive', at: at(PREROLL, 0.22), id: 'swing', gain: -16, args: { seed: 70 } },
    { scene: 'spar-reactive', at: at(PREROLL, 0.62), id: 'punch', gain: -6, note: 'the counter lands' },
    { scene: 'spar-steady', at: at(PREROLL, 0.22), id: 'swing', gain: -16, args: { seed: 71 } },
    { scene: 'spar-steady', at: at(PREROLL, 0.62), id: 'punch', gain: -8 },
    { scene: 'spar-steady', at: at(PREROLL, 3.25), id: 'swing', gain: -14, args: { seed: 72 }, note: 'he slips it' },
    { scene: 'book-reactive', at: at(PREROLL, 1.95), id: 'plop', gain: -12, note: 'the book hits the floor' },
    ...[0, 1, 2, 3, 4].map((k) => ({ scene: 'book-reactive', at: at(PREROLL, 2.55 + k * 0.38), id: 'tick', gain: -20 })),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => ({ scene: 'book-steady', at: at(PREROLL, 0.45 + k * 0.3), id: 'plop', gain: -22, note: k ? '' : 'books stack up' })),
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'ready', at: 0.18 + k * 0.37, id: 'scuff', gain: -24, args: { seed: 80 + k }, note: k ? '' : 'on their toes' })),
  ],
};
