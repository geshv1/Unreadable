# TWO MEN — episode generator

Turns one JSON file into a finished 1080x1920 TikTok video (30 fps, H.264 + AAC, 30–35 s, -14 LUFS),
plus a CapCut kit, cover, post text, credits and a quality report.

Everything is free and needs **no API keys**:
- **Visuals** are 3D scenes built and rendered in **Blender** from code: realistic 3D men (free CC0 MakeHuman
  body, skeleton and expressions; skin, clothes, hair and eyes made in code) acting out each line, plus geometric
  solids, shattering glass, a crowd of eyes, phones, an hourglass, a slamming stone door, pillars, a neon grid world.
  No stock footage, no movie clips. The three men: **Man 1** (burgundy top, reacts), **Man 2** (black top, calm),
  **the other one** (grey top, insulter / the one who says no).
  (Older 2D silhouette scenes still work: use a scene name without `3d:`.)
- **Voice** is Kokoro-82M, an open-source narrator that runs on the machine (default voice `bm_lewis`: deep British, expressive).
- **Sound** (dark drone, whoosh, bass hit) is synthesised.

Rendering takes ~45–60 min per 40 s episode (3D on CPU, no graphics card). Frames are cached, so re-rendering after a text,
voice or timing change that doesn't change a shot's length is quick.

## Make a new episode (3 steps)

1. Copy an episode file: `cp episodes/ep01_insult.json episodes/ep03_betrayal.json`
2. Edit the copy: change `title`, `slug`, and the lines in `shots` (see below).
3. Run one command (from this `twomen/` folder):

```
.venv/bin/python make.py episodes/ep03_betrayal.json
```

First time on a new machine, run `./setup.sh` once (installs Python packages, downloads the voice model and the
free MakeHuman body data)
and install Blender: `apt-get install -y blender libegl1 libegl-mesa0 libgl1-mesa-dri`.
If you're on your iPhone, just ask Claude in a session: *"make episode 3: The Betrayal, here's the script…"*.

The result lands in `output/<slug>/`:

| File | What it is |
|---|---|
| `final.mp4` | ready to post |
| `cover.jpg` | TikTok cover frame |
| `post.txt` | caption, pinned comment, hashtags |
| `credits.txt` | what was used and its licence |
| `capcut_kit/` | `voice.mp3`, `music.mp3`, `sfx/`, `clips/` (graded, trimmed, no text), `captions.srt` (on-screen text), `narration.srt` (spoken words), `timeline.txt` (where everything goes) |
| `qc/` | `report.txt` (duration, resolution, fps, loudness, silence, bass hit, safe zone) and `contact_sheet.jpg` (one frame per line, green lines = TikTok UI zones) |

## The episode file

Each **shot** is one visual scene. Each **beat** inside it is one spoken line. Every beat is voiced
separately and measured, so cuts and text land exactly on the words.

```json
{"name": "fires_back", "scene": "man1_fire", "grade": "man1", "section": "man1",
 "camera": {"zoom": [1.06, 1.12], "shake": 12},
 "beats": [{"vo": "The first one fires back.", "text": "HE [FIRES BACK]", "gap": 0.2}]}
```

- `vo`: what the narrator says. End a line with `...` and split the rest into the next beat to get a pause before a key word.
- `text`: on-screen text, 2–4 words. Put the one red key word in `[brackets]`. Leave it out for no text.
- `gap`: silence after the line, in seconds.
- `grade`: `neutral`, `man1` (warm/red, more contrast, grain), `man2` (cold blue/grey, saturation −30 %) or `black`.
- `section`: `hook`, `neutral`, `man1`, `man2`, `transition`, `principle`. Sets the drone's mood; `principle` is silent.
- `slowmo`: `0.5` makes everything in the shot move at half speed (use for Man 2).
- `camera`: `zoom` [start, end], `drift` [x, y], `shake` (pixels), `punch` (zoom jump on each fast cut).
- Special beat flags: `"drone": "low"` (drone sinks from this line on), `"bass_hit": true` (bass hit on this word),
  `"text_size": 200` (bigger text).
- Transition: `{"scene": "black", "grade": "black", "section": "transition", "duration": 0.5, "sfx": "whoosh"}`.
- Principle shot: `"silence_before": 0.55` gives the hard cut to silence before the last line.

### 3D scenes (`"scene": "3d:<name>"`)
| Scene | What you see | Params |
|---|---|---|
| `hook_twins` | Man 1 + Man 2 under a giant glowing wireframe icosahedron, orbiting solids | – |
| `face_close` | head-and-shoulders close-up: angry shouting (red) or calm stare (cold) | `who` (man1/man2), `mood` (red/cold), `dim_beat` |
| `untouchable` | Man 2 stands still; red spiky orbs fly at him and dissolve before touching | – |
| `eyes_room` | mannequin on a marble pedestal, a crowd of eyeballs on tiers staring at him | `laugh`, `watch` (push-in, narrowed eyes) |
| `fire_back` | mannequin pointing and shouting, red glass wall shattering, sparks | – |
| `loud_cuts` | fast cuts: sound-wave rings, a hand pointing at you, gesturing in front of a red wire cube | `variants`, `cut_every` |
| `calm_monolith` | still obsidian mannequin, black monolith, rain frozen in slow motion | `nod_beat` |
| `eye_close` | extreme close-up of a giant eye; light dims | `dim_beat` |
| `walk_grid` | mannequin walking away through glowing arches on a neon grid | `walk_speed` |
| `insult_returns` | a red spiky orb flies back and circles the insulter's head | – |
| `door_slam` | two huge stone doors closing on both men, light through the gap | `close_from`, `closed` (Man 2 alone in front of the shut door) |
| `phone3d` | phone close-up with the messages appearing + Man 1 sitting hunched over his phone | `messages`, `variants` (`phone_close`, `hunched`), `cut_every` |
| `shrink_pillars` | black pillars slam down around a mannequin as the camera rises | – |
| `phone_down3d` | phone face-down on a marble table next to a glass of water | – |
| `hourglass` | hourglass with falling sand, the other person waiting in the background | – |

`"text_box": true` on a shot puts a dark plate behind the text (use it on bright/red scenes).

## Change the voice or pace

In the episode file:
```json
"voice": {"voice": "bm_lewis", "speed": 1.05, "lang": "en-gb"}
```
- **Voice**: `bm_lewis` (deep British, default), `am_fenrir` (most energetic), `am_puck`, `am_michael` (warm US),
  `am_onyx` (deepest, calmest). British voices (`bm_…`) need `"lang": "en-gb"`, American (`am_…`) `"en-us"`.
- **Pace**: `speed` 1.0 = normal, 1.1 = faster, 0.9 = slower. Shorter pauses: lower the `gap` values.
- The length is kept inside 30–35 s automatically (`pacing.auto_fit`): if the script is too long it first
  shortens the pauses and then speeds up the voice slightly. Set `"auto_fit": false` to keep your exact values.

## Audio settings
`"audio": {"lufs": -14, "drone_level": 0.20, "duck_db": -9, "whoosh_level": 0.45, "bass_level": 0.95}`
`drone_level` = how loud the drone is, `duck_db` = how far it dips under the voice.
