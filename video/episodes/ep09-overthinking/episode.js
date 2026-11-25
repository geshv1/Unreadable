/* EPISODE CONFIG — "Same age. Same city." — OVERTHINKING (one topic, three real situations).
   Structure per situation: the shared moment → REACTIVE (his thought + why he does it) → STEADY (his thought + why)
   → the rule. Square-up hook, payoff line, quiz + book CTA. Content framed small and centred inside the TikTok
   safe box (x 150–930, y 320–1420), slow drifting dots, slow zoom over the whole video. */
const SH = 1.1, RB = SH, SB = 5.3, RULE = 9.4, SC = 11.6;   // beat times inside each situation scene (choreography time)
const SP = 1.45, RP = 1.4;   // solo scenes play their choreography 1.45x faster, rule scenes 1.4x

V.EPISODE = {
  id: 'ep09-overthinking',
  series: 'Same age. Same city.',
  handle: '@GESHV1',
  title: 'reactive-vs-steady-overthinking',
  fps: 30,
  width: 1080,
  height: 1920,

  // framing: smaller, centred, never under TikTok's buttons or caption
  zoom: 0.74, camY: 108, zoomDrift: 0.06,
  labelY: 1394,
  textTop: 372, textMaxW: 690, headMax: 98, headMin1: 84, head2Max: 84,
  vignette: 0.85, grain: 0.05,
  starField: { n: 55, drift: 9 },
  textStyle: 'rise',
  transition: { type: 'fade', pre: 0.18, post: 0.18 },
  fadeOut: 0.6,

  scenes: [
    { id: 'hook', dur: 2.2, set: 'stage', action: 'squareUp', cam: { zoom: [0.72, 0.76] },
      top: 'SAME AGE. SAME CITY.', headline: 'Different thoughts.', red: 'thoughts.' },

    // ── 1. THE TEXT — his night, then his night, then the rule
    { id: 'text-reactive', dur: SB / SP, speed: SP, solo: 'reactive', labelY: 1410, set: 'stage', action: 'otText', cam: { zoom: [0.88, 0.92], x: -240, y: -40 },
      beats: [
        { at: 0, top: '11:47 PM', headline: 'She replies: “ok.”', red: '“ok.”' },
        { at: RB, top: 'REACTIVE', headline: '“Is she mad at me?”', red: 'mad', sub: 'Replaying feels like control.' },
      ] },
    { id: 'text-steady', dur: (1.4 + RULE - SB) / SP, speed: SP, solo: 'steady', labelY: 1410, remap: [[0, 0], [1.4, SB]], set: 'stage', action: 'otText', cam: { zoom: [0.88, 0.92], x: 240, y: -40 },
      beats: [
        { at: 0, top: '11:47 PM', headline: 'Same text: “ok.”', red: '“ok.”' },
        { at: 1.4, top: 'STEADY', headline: '“Ok means ok.”', red: 'ok.”', sub: 'If it’s something, she’ll say it.' },
      ] },

    // ── 2. THE COMEBACK
    { id: 'comeback-reactive', dur: SB / SP, speed: SP, solo: 'reactive', labelY: 1410, set: 'stage', action: 'otComeback', cam: { zoom: [0.88, 0.92], x: -160, y: -40 },
      beats: [
        { at: 0, top: 'AT THE GYM', headline: 'Someone takes a shot.', red: 'shot.' },
        { at: RB, top: 'REACTIVE', headline: 'He laughs it off.', red: 'laughs' },
        { at: RB + 1.6, top: 'REACTIVE · 2 HOURS LATER', headline: '“I should’ve said…”', red: 'should’ve', sub: 'He wins it in the shower.' },
      ] },
    { id: 'comeback-steady', dur: (RULE - SB) / SP, speed: SP, solo: 'steady', labelY: 1410, offset: SB, set: 'stage', action: 'otComeback', cam: { zoom: [0.88, 0.92], x: 140, y: -40 },
      beats: [
        { at: 0, top: 'AT THE GYM', headline: 'Same shot.', red: 'shot.' },
        { at: 1.4, top: 'STEADY', headline: 'One calm line. Done.', red: 'Done.', sub: 'Nothing left to replay.' },
      ] },

    // ── 3. THE START
    { id: 'start-reactive', dur: SB / SP, speed: SP, solo: 'reactive', labelY: 1410, set: 'stage', action: 'otStart', cam: { zoom: [0.88, 0.92], x: -270, y: -40 },
      beats: [
        { at: 0, top: 'MONDAY', headline: 'Time to start training.', red: 'start' },
        { at: RB, top: 'REACTIVE · WEEK 6', headline: '“What if I’m wrong?”', red: 'wrong?”', sub: 'Planning feels like progress.' },
      ] },
    { id: 'start-steady', dur: (RULE - SB) / SP, speed: SP, solo: 'steady', labelY: 1410, offset: SB, set: 'stage', action: 'otStart', cam: { zoom: [0.8, 0.83], x: 220, y: -60 },
      top: 'STEADY · DAY 1', headline: 'One messy rep.', red: 'messy', sub: 'Ugly start. Still a start.' },

    // ── PAYOFF
    { id: 'payoff', dur: 2.7, set: 'stage', action: 'otPayoff', cam: { zoom: [0.74, 0.77] },
      top: 'SAME AGE. SAME CITY.', headline: 'Overthinking is fear in a smart costume.', red: 'fear' },

    // ── CTA: quiz + book
    { id: 'end-card', dur: 3.2, set: 'stage', action: 'endCard', cam: { zoom: [0.74, 0.76] },
      top: 'WHICH ONE ARE YOU?', headline: 'Find your type.', red: 'type.',
      sub: 'Free 2-min quiz — link in bio.', subColor: '#F4F5F7', sub2: 'THE FIX: UNREADABLE' },
  ],

  // ── SOUND — minimal, physical only (no music: add a sound in TikTok)
  sfx: [
    { scene: 'text-reactive', at: 0.15, id: 'notify', gain: -9, args: { chime: false, seed: 31 }, note: 'the “ok.” arrives' },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ scene: 'text-reactive', at: RB + 0.2 + k * 0.5, id: 'tick', gain: -18, args: { tock: k % 2 === 1 } })),
    { scene: 'text-steady', at: 0.15, id: 'notify', gain: -10, args: { chime: false, seed: 32 } },
    { scene: 'text-steady', at: 2.75, id: 'phone_down', gain: -10, pan: 0.2, note: 'phone face down' },
    { scene: 'text-steady', at: 2.87, id: 'tick', gain: -13, note: 'lamp off' },
    { scene: 'comeback-reactive', at: 0.05, id: 'scuff', gain: -14, args: { seed: 40 } },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'comeback-reactive', at: RB + 1.75 + k * 0.38, id: 'swing', gain: -19, pan: -0.1, args: { seed: 60 + k } })),
    { scene: 'comeback-steady', at: 0.05, id: 'scuff', gain: -14, args: { seed: 41 } },
    { scene: 'start-reactive', at: RB + 0.1, id: 'typing', gain: -16, args: { d: 2.6, pan: -0.1 }, note: 'the research' },
    { scene: 'start-steady', at: 0.62, id: 'hop', gain: -10, note: 'jumps to the bar' },
    { scene: 'start-steady', at: 3.1, id: 'plop', gain: -11, note: 'lands' },
    { scene: 'payoff', at: 0.33, id: 'bump', gain: -12, args: { heavy: 0.4 }, note: 'gloves touch' },
  ],
};
