# Video 2: "The calm one" (9:16 TikTok)

- `out/calm_tiktok.mp4`: final video, 1080×1920, 31.5 s, voice included
- `out/cover.png`: cover frame (hook)
- `script.py`: the 13 lines, caption chunks and key words
- `voice_v2.py`: local voice (Kokoro `am_michael`) → `out/voice.wav` + `out/timings.json`
- `render_v2.py`: the renderer (`python3 render_v2.py`; `--frames 1.0 5.0` for stills)

To use a recorded ElevenLabs voice instead: put the MP3 in `out/`, write its word times into
`out/timings.json` (same format) and re-run `render_v2.py`. Every animation is keyed to word times.
