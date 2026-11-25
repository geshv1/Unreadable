/* EPISODE CONFIG — "Same age. Same city." — OVERTHINKING (one topic, three real situations).
   Structure per situation: the shared moment → REACTIVE (his thought + why he does it) → STEADY (his thought + why)
   → the rule. Square-up hook, payoff line, quiz + book CTA. Content framed small and centred inside the TikTok
   safe box (x 150–930, y 320–1420), slow drifting dots, slow zoom over the whole video. */
const SH = 1.1, RB = SH, SB = 5.3, RULE = 9.4, SC = 11.6;   // beat times inside each situation scene (choreography time)
const SP = 1.4;                                              // situations play 1.4x faster: 11.6s of choreography in ~8.3s

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

    // ── 1. THE TEXT
    { id: 'the-text', dur: SC / SP, speed: SP, set: 'stage', action: 'otText', cam: { zoom: [0.73, 0.76] },
      beats: [
        { at: 0, top: '11:47 PM', headline: 'She replies: “ok.”', red: '“ok.”' },
        { at: RB, top: 'REACTIVE', headline: '“Is she mad at me?”', red: 'mad', sub: 'Replaying feels like control.' },
        { at: SB, top: 'STEADY', headline: '“Ok means ok.”', red: 'ok.”', sub: 'If it’s something, she’ll say it.' },
        { at: RULE, top: 'RULE 1', headline: 'Read the text, not her mind.', red: 'not her mind.' },
      ] },

    // ── 2. THE COMEBACK
    { id: 'the-comeback', dur: SC / SP, speed: SP, set: 'gym', action: 'otComeback', cam: { zoom: [0.73, 0.76] },
      beats: [
        { at: 0, top: 'AT THE GYM', headline: 'Someone takes a shot.', red: 'shot.' },
        { at: RB, top: 'REACTIVE', headline: 'He laughs it off.', red: 'laughs' },
        { at: RB + 1.6, top: 'REACTIVE · 2 HOURS LATER', headline: '“I should’ve said…”', red: 'should’ve', sub: 'He wins it in the shower.' },
        { at: SB, top: 'STEADY', headline: 'One calm line. Done.', red: 'Done.', sub: 'Nothing left to replay.' },
        { at: RULE, top: 'RULE 2', headline: 'Say it now, or let it go.', red: 'let it go.' },
      ] },

    // ── 3. THE START
    { id: 'the-start', dur: SC / SP, speed: SP, set: 'stage', action: 'otStart', cam: { zoom: [0.73, 0.76] },
      beats: [
        { at: 0, top: 'MONDAY', headline: 'Time to start training.', red: 'start' },
        { at: RB, top: 'REACTIVE · WEEK 6', headline: '“What if I do it wrong?”', red: 'wrong?”', sub: 'Planning feels like progress.' },
        { at: SB, top: 'STEADY · DAY 1', headline: 'One messy rep.', red: 'messy', sub: 'Ugly start. Still a start.' },
        { at: RULE, top: 'RULE 3', headline: 'Action kills doubt.', red: 'doubt.' },
      ] },

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
    { scene: 'the-text', at: 0.15, id: 'notify', gain: -9, args: { chime: false, seed: 31 }, note: 'the “ok.” arrives' },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ scene: 'the-text', at: RB + 0.2 + k * 0.5, id: 'tick', gain: -18, args: { tock: k % 2 === 1 } })),
    { scene: 'the-text', at: SB + 1.35, id: 'phone_down', gain: -10, pan: 0.35, note: 'Steady puts the phone face down' },
    { scene: 'the-comeback', at: 0.05, id: 'scuff', gain: -14, args: { seed: 40 } },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ scene: 'the-comeback', at: RB + 1.75 + k * 0.38, id: 'swing', gain: -19, pan: -0.35, args: { seed: 60 + k } })),
    { scene: 'the-comeback', at: SB + 0.05, id: 'scuff', gain: -14, args: { seed: 41 } },
    { scene: 'the-start', at: RB + 0.1, id: 'typing', gain: -16, args: { d: 3.6, pan: -0.35 }, note: 'the research' },
    { scene: 'the-start', at: SB + 0.62, id: 'hop', gain: -10, pan: 0.35, note: 'jumps to the bar' },
    { scene: 'the-start', at: SB + 2.95, id: 'plop', gain: -11, pan: 0.35, note: 'lands' },
    { scene: 'payoff', at: 0.33, id: 'bump', gain: -12, args: { heavy: 0.4 }, note: 'gloves touch' },
  ],
};
