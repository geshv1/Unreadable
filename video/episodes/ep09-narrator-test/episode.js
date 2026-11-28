/* EPISODE CONFIG — NARRATOR format test (15 s).
   The white stickman is a narrator who talks straight to the viewer (second person); his mouth moves on
   every narrated word. Coloured scenery + geometric shapes, objects and other stickmen illustrate the idea.
   CTA: "Learn to be unreadable — link in bio" with the new book cover (How to Become Unreadable). */
V.EPISODE = {
  id: 'ep09-narrator-test',
  series: 'Same age. Same city.',
  episode: 9,
  handle: '@GESHV1',
  title: 'narrator-test',
  fps: 30,
  width: 1080,
  height: 1920,
  vignette: 0.85,
  stars: false, dust: false, grid: false,
  labels: false,
  grain: 0.06,
  zoom: 0.82,
  fadeIn: 0.4,
  fadeOut: 0.4,
  panel: { top: 560, bottom: 1330, feather: 70 },
  narrationY: 420,
  transition: { type: 'fade', pre: 0.12, post: 0.12 },
  assets: { cover: 'assets/cover-unreadable.jpg' },

  scenes: [
    { id: 'studio', dur: 5.3, set: 'stage', action: 'n_studio', cam: { zoom: [0.78, 0.86], y: 207 } },
    { id: 'watched', dur: 3.4, set: 'stage', action: 'n_watched', cam: { zoom: [0.8, 0.86], y: 207 } },
    { id: 'preparing', dur: 2.3, set: 'stage', action: 'n_preparing', cam: { zoom: 0.8, y: 207 } },
    { id: 'confess', dur: 2.2, set: 'stage', action: 'n_confess', cam: { zoom: [0.86, 0.9], y: 207 } },
    { id: 'cta', dur: 1.8, set: 'stage', action: 'n_cta', cam: { zoom: 0.82, y: 207 } },
  ],

  narration: [
    { at: 0.3, text: 'Hey. You.', red: ['You.'] },
    { at: 1.3, text: "You're not scared of failing.", red: ['failing.'] },
    { at: 3.2, text: "You're scared of underperforming.", red: ['underperforming.'] },
    { at: 5.4, text: 'Of being watched…', red: ['watched…'] },
    { at: 6.8, text: "while you're still bad at it.", red: ['bad'] },
    { at: 8.8, text: "So you keep 'preparing'.", red: ["'preparing'."] },
    { at: 11.1, text: 'I know. I did it too.', red: ['too.'] },
    { at: 13.3, text: 'Learn to be unreadable.', red: ['unreadable.'], end: 15 },
  ],

  sfx: [],
};
