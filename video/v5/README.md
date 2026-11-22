# Video 5: "The Pause" (4:3, ultra-minimal, illustrated)

- `out/the_pause_4x3.mp4`: final video, 1440×1080, 41.6 s, voice included
- `out/cover.png`: cover frame (the stopwatch at 7 seconds)
- `script.py`: narration + title-block text per line
- `voice_v5.py`: local voice with word timings (splits merged phoneme words like "in the")
- `figure.py`: illustrated profile figure on rig.py (suit/tee, lapels, tie, hair, shoes, solid overlapping parts)
- `render_v5.py`: sets (stopwatch, boardroom, 5 a.m. gym, lever, plank/hourglass) and choreography

`python3 render_v5.py` renders and muxes; `--frames 1.0 5.0` writes stills.
