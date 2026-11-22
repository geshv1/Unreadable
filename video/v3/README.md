# Video 3: "Your enemy is you" (9:16 TikTok)

- `out/enemy_tiktok.mp4`: final video, 1080×1920, 29.9 s, voice included
- `out/cover.png`: cover frame
- `script.py`: the 13 lines, caption chunks and key words
- `voice_v3.py`: local voice (Kokoro `am_michael`) → `out/voice.wav` + `out/timings.json`
- `rig.py`: stickman rig v2 (IK knees/elbows, planted feet, walk/run cycles, breathing, follow-through)
- `render_v3.py`: scenes, environments (ring, void, road, rain, gym, dawn, mirror, cage) and render

`python3 render_v3.py` renders and muxes; `--frames 1.0 5.0` writes stills.
