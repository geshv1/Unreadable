# TWO MEN — episode generator

Turns one JSON file into a finished 1080x1920 TikTok video (30 fps, H.264 + AAC, 30–35 s, -14 LUFS),
plus a CapCut kit, cover, post text, credits and a quality report.

Everything is free and needs **no API keys**:
- **Visuals** are generated (backlit silhouettes, fog, light, phones). No stock footage, no movie clips.
- **Voice** is Kokoro-82M, an open-source narrator that runs on the machine (default voice `am_onyx`, deep and calm).
- **Sound** (dark drone, whoosh, bass hit) is synthesised.

## Make a new episode (3 steps)

1. Copy an episode file: `cp episodes/ep01_insult.json episodes/ep03_betrayal.json`
2. Edit the copy: change `title`, `slug`, and the lines in `shots` (see below).
3. Run one command (from this `twomen/` folder):

```
.venv/bin/python make.py episodes/ep03_betrayal.json
```

First time on a new machine, run `./setup.sh` once (installs Python packages, downloads the voice model).
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
- `footage_terms` is only a note (what stock footage would fit); it isn't used.

### Scenes you can use
`two_men`, `room_crowd` (`"laugh": true`), `room_watch`, `man1_fire`, `man1_cuts` (fast cuts: `variants`
`shout_profile`, `point_close`, `gesture`; `cut_every` seconds), `man2_pause` (`nod_beat`), `faceoff` (`dim_beat`),
`walk_away`, `alone`, `door_close`, `phone` (`messages`, variants `phone_close`, `hunched`), `shrink`,
`phone_down`, `wondering`, `black`.

## Change the voice or pace

In the episode file:
```json
"voice": {"voice": "am_onyx", "speed": 0.9}
```
- **Voice**: other deep male voices to try: `bm_lewis` (deep British), `am_michael` (warmer US), `bm_george`
  (British, lighter), `am_fenrir`. For a British voice also set `"lang": "en-gb"`.
- **Pace**: `speed` 0.85 = slower, 1.0 = normal. Longer pauses: raise the `gap` values.
- The length is kept inside 30–35 s automatically (`pacing.auto_fit`): if the script is too long it first
  shortens the pauses and then speeds up the voice slightly. Set `"auto_fit": false` to keep your exact values.

## Audio settings
`"audio": {"lufs": -14, "drone_level": 0.20, "duck_db": -9, "whoosh_level": 0.45, "bass_level": 0.95}`
`drone_level` = how loud the drone is, `duck_db` = how far it dips under the voice.
