# Launch video: The Complete Fighter

- `out/launch_tiktok_vertical.mp4`: ready to upload to TikTok (9:16, voice included)
- `out/launch_with_voice.mp4`: 1440×1080 with the voice, 49.7 s (the last frame holds for 1 s)
- `out/launch_no_audio.mp4`: the same video without sound
- `out/voiceover.wav`: the voice on its own
- `out/cover.png`: TikTok cover (scene 1 with the hook)
- `out/voiceover.txt` / `out/voice_timings.json`: when each line and word is spoken

Voice: Kokoro-82M (open model, Apache-2.0), voice `af_heart`, made by `voice.py`.
Captions are synced to the measured word times.

Re-render: `pip install pycairo && python3 video/render.py` (needs ffmpeg).
Single stills for checking: `python3 video/render.py --frames 1.4 17.2 47.9`.
Every timing lives at the top of each scene in `render.py`. To re-sync to a real voice track,
change the word times in the `Wd(...)` captions and the matching animation times.
