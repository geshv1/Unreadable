# Video 6: "The Pause" v2 (4:3, faster, stronger hook)

- `out/the_pause_v2_4x3.mp4`: final video, 1440×1080, 38.7 s, voice included
- `out/cover.png`: cover frame (stopwatch + price counter)
- `script.py`: narration + title-block text (supports display words mapped to voice words)
- `voice_v6.py`: faster local voice (speed 1.06) with word timings
- `render_v6.py`: builds on video 5 (figure, props) and adds the camera system, whip-pan / match-cut /
  wipe / zoom-through transitions, odometer, annotation callouts, silence rings, magnifier lens,
  heart-rate monitor, split screen and the stopwatch-to-octagon morph

`python3 render_v6.py` renders and muxes; `--frames 1.0 5.0` writes stills.
