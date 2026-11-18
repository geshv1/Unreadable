# Launch video: The Complete Fighter

- `out/launch_no_audio.mp4`: 1440×1080, 30 fps, H.264, 48.8 s (the last frame holds for 1 s)
- `out/cover.png`: TikTok cover (scene 1 with the hook)
- `out/voiceover.txt`: voice lines with start times, for CapCut text-to-speech

Re-render: `pip install pycairo && python3 video/render.py` (needs ffmpeg).
Single stills for checking: `python3 video/render.py --frames 1.4 17.2 47.9`.
Every timing lives at the top of each scene in `render.py`. To re-sync to a real voice track,
change the word times in the `Wd(...)` captions and the matching animation times.
