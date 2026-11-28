/* EPISODE CONFIG — "Underperforming", NARRATOR format (TikTok cut).
   A confident, composed narrator (jacked white stickman) talks straight to the viewer; illustrations with
   "you" (red cap), judges, objects and geometric shapes carry the idea between his lines.
   Voiceover: ElevenLabs, voice "Brian" (premade, deep & resonant), model eleven_v4 (take 1).
   Phrase times below are measured from the voiceover (pause detection) + a 0.9 s offset for the opening. */
const VO = 1.05;
V.EPISODE = {
  id: 'ep09-unreadable',
  series: 'Same age. Same city.',
  episode: 9,
  handle: '@GESHV1',
  title: 'underperforming-narrator',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.85,
  stars: false, dust: false, grid: false,
  labels: false,
  grain: 0.05,
  zoom: 0.82,
  fadeIn: 0.15,
  fadeOut: 0.4,
  panel: { top: 560, bottom: 1330, feather: 70 },
  narrationY: 420,
  transition: { type: 'fade', pre: 0.08, post: 0.08 },
  assets: { cover: 'assets/cover-unreadable.jpg' },
  voiceover: { file: 'assets/vo/underperforming-vo-brian.mp3', at: VO, gain: 0 },

  // scene cuts land on the voiceover's phrase starts (Brian take 1, measured)
  scenes: [
    { id: 'opener', dur: 3.014, set: 'stage', action: 'v_opener', cam: { zoom: [0.82, 0.92], y: 207 } },
    { id: 'judges', dur: 1.944, set: 'stage', action: 'v_judges', cam: { zoom: [0.84, 0.92], y: 207 } },
    { id: 'barbell', dur: 3.884, set: 'stage', action: 'v_barbell', cam: { zoom: [0.82, 0.88], y: 207 } },
    { id: 'preparing', dur: 2.132, set: 'stage', action: 'v_preparing', cam: { zoom: [0.8, 0.84], y: 207 } },
    { id: 'post', dur: 3.081, set: 'stage', action: 'v_post', cam: { zoom: [0.84, 0.9], y: 207 } },
    { id: 'confess', dur: 2.587, set: 'stage', action: 'v_confess', cam: { zoom: [0.9, 0.96], y: 207 } },
    { id: 'spotlight', dur: 2.37, set: 'stage', action: 'v_spotlight', cam: { zoom: [0.8, 0.88], y: 207 } },
    { id: 'zero', dur: 2.138, set: 'stage', action: 'v_zero', cam: { zoom: [0.86, 0.82], y: 207 } },
    { id: 'admire', dur: 2.633, set: 'stage', action: 'v_admire', cam: { zoom: [0.8, 0.84], y: 207 } },
    { id: 'first-video', dur: 2.259, set: 'stage', action: 'v_firstVideo', cam: { zoom: [0.9, 0.96], y: 207 } },
    { id: 'first-fight', dur: 2.065, set: 'ring', action: 'v_firstFight', cam: { zoom: [0.86, 0.92], y: 207 } },
    { id: 'first-day', dur: 2.114, set: 'stage', action: 'v_firstDay', cam: { zoom: [0.9, 0.96], y: 207 } },
    { id: 'stayed', dur: 2.124, set: 'stage', action: 'v_stayed', cam: { zoom: 0.82, y: 207 } },
    { id: 'public', dur: 2.874, set: 'stage', action: 'v_public', cam: { zoom: [0.84, 0.94], y: 207 } },
    { id: 'cta', dur: 3.781, set: 'stage', action: 'v_cta', cam: { zoom: [0.84, 0.8], y: 207 } },
  ],

  // captions = the voiceover (at / span / times measured from Brian's read)
  narration: [
    { at: VO + 0.0, span: 1.435, text: "You're not scared of failure.", red: ['failure.'] },
    { at: VO + 1.964, span: 1.479, text: "You're scared of underperforming.", red: ['underperforming.'] },
    { at: VO + 3.908, span: 1.636, text: "Of giving everything you've got…", red: ['everything'] },
    { at: VO + 6.009, span: 1.367, text: 'and it still not being enough.', red: ['enough.'] },
    { at: VO + 7.792, span: 1.641, text: "So you call it 'preparing'.", red: ["'preparing'."] },
    { at: VO + 9.924, span: 1.142, text: 'Because if you never start,' },
    { at: VO + 11.422, span: 1.002, text: 'no one can judge you.', red: ['judge'] },
    { at: VO + 13.005, span: 0.534, text: 'I know.' },
    { at: VO + 14.027, span: 0.987, text: 'I did it for years.', red: ['years.'] },
    { at: VO + 15.592, span: 1.904, text: 'But not trying is a performance too.', red: ['performance'] },
    { at: VO + 17.962, span: 1.603, text: 'And it always scores zero.', red: ['zero.'] },
    { at: VO + 20.1, span: 2.131, text: 'Everyone you admire was bad first.', red: ['bad'] },
    { at: VO + 22.733, times: [0, 0.38, 1.11, 1.45], text: 'First video: three views.', red: ['views.'] },
    { at: VO + 24.992, times: [0, 0.33, 1.03], text: 'First fight: lost.', red: ['lost.'] },
    { at: VO + 27.057, times: [0, 0.36, 0.85], text: 'First day: shaking.', red: ['shaking.'] },
    { at: VO + 29.171, span: 1.654, text: 'They just stayed long enough to get good.', red: ['stayed'] },
    { at: VO + 31.295, times: [0, 0.2, 0.38, 0.62, 0.78, 1.637, 1.95], text: 'So be bad in public. Start today.', red: ['public.', 'today.'] },
    { at: VO + 34.169, span: 1.426, text: 'Learn to be unreadable.', red: ['unreadable.'] },
    { at: VO + 36.093, span: 0.743, text: 'Link in bio.', end: 39.0 },
  ],

  // ── SOUND — minimal and physical, under the voice
  sfx: [
    { scene: 'barbell', at: 3.45, id: 'bump', gain: -10, args: { seed: 33, heavy: 0.9 }, note: 'bar drops' },
    { scene: 'post', at: 1.9, id: 'phone_down', gain: -12, pan: -0.2, note: 'laptop shut' },
    { scene: 'zero', at: 1.3, id: 'bump', gain: -6, args: { seed: 40, heavy: 1.3 }, note: 'the zero lands' },
    { scene: 'first-fight', at: 0.35, id: 'punch', gain: -6, note: 'first fight' },
  ],
};
