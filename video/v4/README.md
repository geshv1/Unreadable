# Video 4: "Quiet power" (4:3, ultra-minimal)

- `out/quiet_power_4x3.mp4`: final video, 1440×1080 (4:3, gets TikTok's "Full screen" button), 28.5 s, voice included
- `out/cover.png`: cover frame
- `script.py`: the 8 lines and the title-block text (overline / title / sub)
- `voice_v4.py`: local voice (Kokoro `am_michael`) → `out/voice.wav` + `out/timings.json`
- `render_v4.py`: pure black, white line art, one continuous floor line, Inter title block, rig.py figure

`python3 render_v4.py` renders and muxes; `--frames 1.0 5.0` writes stills.
