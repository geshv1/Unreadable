/* EPISODE CONFIG — "Underperforming", NARRATOR format (TikTok cut).
   A confident, composed narrator (jacked white stickman) talks straight to the viewer; illustrations with
   "you" (red cap), judges, objects and geometric shapes carry the idea between his lines.
   Voiceover: ElevenLabs, voice "Magnus – Deep British Narrator", model eleven_v4 (take 1).
   Phrase times below are measured from the voiceover (pause detection) + a 0.9 s offset for the opening. */
const VO = 0.9;
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
  voiceover: { file: 'assets/vo/underperforming-vo.mp3', at: VO, gain: 0 },

  scenes: [
    { id: 'opener', dur: 2.84, set: 'stage', action: 'v_opener', cam: { zoom: [0.8, 0.9], y: 207 } },
    { id: 'judges', dur: 1.89, set: 'stage', action: 'v_judges', cam: { zoom: [0.84, 0.92], y: 207 } },
    { id: 'barbell', dur: 3.75, set: 'stage', action: 'v_barbell', cam: { zoom: [0.82, 0.88], y: 207 } },
    { id: 'preparing', dur: 1.83, set: 'stage', action: 'v_preparing', cam: { zoom: [0.8, 0.84], y: 207 } },
    { id: 'post', dur: 2.92, set: 'stage', action: 'v_post', cam: { zoom: [0.84, 0.9], y: 207 } },
    { id: 'confess', dur: 2.43, set: 'stage', action: 'v_confess', cam: { zoom: [0.9, 0.96], y: 207 } },
    { id: 'spotlight', dur: 2.53, set: 'stage', action: 'v_spotlight', cam: { zoom: [0.8, 0.88], y: 207 } },
    { id: 'zero', dur: 2.17, set: 'stage', action: 'v_zero', cam: { zoom: [0.86, 0.82], y: 207 } },
    { id: 'admire', dur: 2.58, set: 'stage', action: 'v_admire', cam: { zoom: [0.8, 0.84], y: 207 } },
    { id: 'first-video', dur: 1.94, set: 'stage', action: 'v_firstVideo', cam: { zoom: [0.9, 0.96], y: 207 } },
    { id: 'first-fight', dur: 1.8, set: 'ring', action: 'v_firstFight', cam: { zoom: [0.86, 0.92], y: 207 } },
    { id: 'first-day', dur: 1.94, set: 'stage', action: 'v_firstDay', cam: { zoom: [0.9, 0.96], y: 207 } },
    { id: 'stayed', dur: 2.38, set: 'stage', action: 'v_stayed', cam: { zoom: 0.82, y: 207 } },
    { id: 'public', dur: 2.75, set: 'stage', action: 'v_public', cam: { zoom: [0.84, 0.94], y: 207 } },
    { id: 'cta', dur: 4.25, set: 'stage', action: 'v_cta', cam: { zoom: [0.84, 0.8], y: 207 } },
  ],

  // captions = the voiceover (at / span measured from the audio)
  narration: [
    { at: VO + 0.0, span: 1.52, text: "You're not scared of failure.", red: ['failure.'] },
    { at: VO + 1.94, span: 1.57, text: "You're scared of underperforming.", red: ['underperforming.'] },
    { at: VO + 3.83, span: 1.69, text: "Of giving everything you've got…", red: ['everything'] },
    { at: VO + 5.79, span: 1.36, text: 'and it still not being enough.', red: ['enough.'] },
    { at: VO + 7.58, span: 1.43, text: "So you call it 'preparing'.", red: ["'preparing'."] },
    { at: VO + 9.41, span: 1.22, text: 'Because if you never start,' },
    { at: VO + 10.86, span: 0.91, text: 'no one can judge you.', red: ['judge'] },
    { at: VO + 12.33, span: 0.5, text: 'I know.' },
    { at: VO + 13.25, span: 1.02, text: 'I did it for years.', red: ['years.'] },
    { at: VO + 14.76, span: 2.13, text: 'But not trying is a performance too.', red: ['performance'] },
    { at: VO + 17.29, span: 1.62, text: 'And it always scores zero.', red: ['zero.'] },
    { at: VO + 19.46, span: 2.2, text: 'Everyone you admire was bad first.', red: ['bad'] },
    { at: VO + 22.04, times: [0, 0.36, 0.93, 1.3], text: 'First video: three views.', red: ['views.'] },
    { at: VO + 24.1, times: [0, 0.33, 0.93], text: 'First fight: lost.', red: ['lost.'] },
    { at: VO + 25.86, times: [0, 0.36, 0.96], text: 'First day: shaking.', red: ['shaking.'] },
    { at: VO + 27.84, span: 2.01, text: 'They just stayed long enough to get good.', red: ['stayed'] },
    { at: VO + 30.26, span: 2.36, text: 'So be bad in public. Start today.', red: ['public.', 'today.'] },
    { at: VO + 32.94, span: 1.46, text: 'Learn to be unreadable.', red: ['unreadable.'] },
    { at: VO + 34.84, span: 0.66, text: 'Link in bio.', end: 38.0 },
  ],

  // ── SOUND — minimal and physical, under the voice
  sfx: [
    { scene: 'barbell', at: 3.1, id: 'bump', gain: -10, args: { seed: 33, heavy: 0.9 }, note: 'bar drops' },
    { scene: 'post', at: 1.9, id: 'phone_down', gain: -12, pan: -0.2, note: 'laptop shut' },
    { scene: 'zero', at: 0.05, id: 'bump', gain: -6, args: { seed: 40, heavy: 1.3 }, note: 'the zero lands' },
    { scene: 'first-fight', at: 0.35, id: 'punch', gain: -6, note: 'first fight' },
  ],
};
