#!/usr/bin/env python3
"""Video 4: generate the narrator with Kokoro-82M (local) and write word timings.

KOKORO_DIR must hold model_ts.onnx and voices.npz (see video/voice.py).
Writes out/voice.wav and out/timings.json
"""
import json, os, subprocess, sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, HERE)
import voice as V  # noqa: E402  (synth + Kokoro helpers from video 1)
from kokoro_onnx import Kokoro  # noqa: E402
from script import LINES, GAPS  # noqa: E402

V.VOICE = os.environ.get("VOICE", "am_michael")
SPEED, PITCH, LEAD = 0.88, 0.94, 0.45


def main():
    k = Kokoro(os.path.join(V.KDIR, "model_ts.onnx"), os.path.join(V.KDIR, "voices.npz"))
    clips, t, out = [], LEAD, []
    for i, line in enumerate(LINES):
        wav, onsets, ph = V.synth(k, line["voice"], SPEED)
        words = line["voice"].split()
        assert len(onsets) == len(words), (line["voice"], ph)
        clips.append((t, wav))
        out.append({"text": line["voice"], "start": round(t, 3), "end": round(t + len(wav) / V.SR, 3),
                    "words": [[w, round(t + o, 3)] for w, o in zip(words, onsets)]})
        t += len(wav) / V.SR + (GAPS[i] if i < len(GAPS) else 0)
    total = t + 0.1
    track = np.zeros(int(total * V.SR) + 1, np.float32)
    for t0, wav in clips:
        i0 = int(round(t0 * V.SR))
        track[i0:i0 + len(wav)] += wav
    raw = os.path.join(HERE, "out", "_raw.wav")
    sf.write(raw, track / np.abs(track).max() * 0.89, V.SR)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af",
                    f"rubberband=pitch={PITCH}:formant=preserved,highpass=f=60,"
                    "equalizer=f=140:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,"
                    "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "48000", "-ac", "2",
                    os.path.join(HERE, "out", "voice.wav")], check=True)
    os.remove(raw)
    json.dump({"voice": V.VOICE, "speech_end": round(t, 3), "lines": out},
              open(os.path.join(HERE, "out", "timings.json"), "w"), indent=1)
    for l in out:
        print(f"{l['start']:6.2f}-{l['end']:6.2f}  {l['text']}")
    print("speech ends", round(t, 2))


if __name__ == "__main__":
    main()
