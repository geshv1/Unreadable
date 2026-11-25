"""Narration with the free, open-source Kokoro-82M voice (runs locally, no API key).

Each beat of the script is synthesised as its own clip, trimmed to the spoken audio and
cached. The renderer then places the clips on the timeline itself, so every cut point and
every on-screen text card is timed from the measured start/end of the words.
"""
import hashlib
import json
import re

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from .common import CACHE, ROOT, SR

MODEL = ROOT / "cache" / "models" / "kokoro-v1.0.onnx"
VOICES = ROOT / "cache" / "models" / "voices-v1.0.bin"
_kokoro = None


def _engine():
    global _kokoro
    if _kokoro is None:
        if not MODEL.exists() or not VOICES.exists():
            raise SystemExit("Voice model missing. Run ./setup.sh first (downloads Kokoro, ~350 MB, free).")
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(str(MODEL), str(VOICES))
    return _kokoro


def clean_text(text):
    t = text.replace("…", "...").replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    t = re.sub(r"\.\.\.+\s*$", ".", t.strip())   # trailing ellipsis = our own pause
    t = t.replace("...", ",")
    return t


def trim(a, sr, thresh_db=-42.0, pad=0.025):
    """Cut leading/trailing silence, keep a short pad."""
    win = int(sr * 0.01)
    if len(a) < win * 3:
        return a
    n = len(a) // win
    rms = np.sqrt((a[: n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    on = np.where(db > thresh_db)[0]
    if len(on) == 0:
        return a
    s = max(0, on[0] * win - int(pad * sr))
    e = min(len(a), (on[-1] + 1) * win + int(pad * sr))
    out = a[s:e].copy()
    f = int(0.008 * sr)
    out[:f] *= np.linspace(0, 1, f)
    out[-f:] *= np.linspace(1, 0, f)
    return out


def synth(text, voice="am_onyx", speed=0.9, lang="en-us"):
    """Return mono float32 audio at SR (48 kHz) for one beat, cached on disk."""
    spoken = clean_text(text)
    key = hashlib.sha1(json.dumps([spoken, voice, round(speed, 3), lang, 2]).encode()).hexdigest()[:16]
    path = CACHE / "tts" / f"{key}.wav"
    if path.exists():
        a, _ = sf.read(path, dtype="float32")
        return a
    a, sr = _engine().create(spoken, voice=voice, speed=speed, lang=lang)
    a = trim(np.asarray(a, np.float32), sr)
    a = resample_poly(a, SR, sr).astype(np.float32)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, a, SR)
    return a
