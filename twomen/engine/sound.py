"""Synthesised sound: dark drone, whoosh, bass hit, voice polish, ducking, loudness."""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
from scipy.signal import butter, lfilter, sosfilt

from .common import SR


def _sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output="sos")


def _env_curve(n, pts):
    """Piecewise-linear envelope from [(t_sec, value), ...]."""
    t = np.arange(n) / SR
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return np.interp(t, xs, ys).astype(np.float32)


# ------------------------------------------------------------------ drone
MOODS = {
    #           sub    fifth  octave tension noise  air
    "hook":    (1.00, 0.55, 0.30, 0.00, 0.35, 0.10),
    "neutral": (1.00, 0.55, 0.30, 0.00, 0.35, 0.10),
    "man1":    (1.00, 0.45, 0.45, 0.55, 0.55, 0.16),
    "man2":    (1.10, 0.30, 0.12, 0.00, 0.22, 0.06),
    "low":     (1.15, 0.00, 0.00, 0.00, 0.10, 0.00),
    "silent":  (0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
}


def drone(duration, segments, seed=3):
    """segments: [(t_start, t_end, mood)]; moods crossfade over 0.35 s, except 'silent' which
    hard-cuts (no fade) so the silence before the principle line is total."""
    n = int(duration * SR)
    t = np.arange(n, dtype=np.float64) / SR
    rng = np.random.default_rng(seed)
    root = 36.71  # D1
    lfo = 1 + 0.25 * np.sin(2 * np.pi * 0.07 * t + 1.0)
    sub = (np.sin(2 * np.pi * root * t) + 0.6 * np.sin(2 * np.pi * root * 2 * t + 0.3)
           + 0.35 * np.sin(2 * np.pi * root * 2.003 * t)) * lfo
    fifth = (np.sin(2 * np.pi * root * 3 * t) + np.sin(2 * np.pi * root * 3.004 * t + 2)) * 0.5 * \
        (1 + 0.4 * np.sin(2 * np.pi * 0.11 * t))
    octave = (np.sin(2 * np.pi * root * 4 * t) + 0.5 * np.sin(2 * np.pi * root * 6.01 * t)) * \
        (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t + 2))
    # tension: minor second against the root, pulsing like a heartbeat
    pulse = np.clip(np.sin(2 * np.pi * 1.15 * t), 0, 1) ** 3
    tension = (np.sin(2 * np.pi * root * 4 * 1.0595 * t) + 0.7 * np.sin(2 * np.pi * root * 2 * 1.0595 * t)) * \
        (0.35 + 0.65 * pulse)
    noise = sosfilt(_sos("lowpass", 320, 4), rng.standard_normal(n)) * 3.0 * \
        (0.7 + 0.3 * np.sin(2 * np.pi * 0.09 * t))
    air = sosfilt(_sos("bandpass", [1800, 4200], 2), rng.standard_normal(n)) * 0.25 * \
        (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t + 1))
    layers = [sub, fifth, octave, tension, noise, air]
    gains = np.zeros((6, n), np.float32)
    xf = 0.35
    for (a, b, mood) in segments:
        vals = MOODS[mood]
        i0, i1 = int(a * SR), int(b * SR)
        for k in range(6):
            gains[k, i0:i1] = vals[k]
    # smooth transitions between moods, but keep cuts to silence hard
    silent = np.zeros(n, bool)
    for (a, b, mood) in segments:
        if mood == "silent":
            silent[int(a * SR):int(b * SR)] = True
    w = int(xf * SR)
    kern = np.ones(w) / w
    for k in range(6):
        g = np.convolve(gains[k], kern, mode="same")
        g[silent] = 0.0
        gains[k] = g
    out = sum(layers[k] * gains[k] for k in range(6))
    # the "low" mood also closes a low-pass filter (drone sinks)
    out = out.astype(np.float32)
    lowmask = np.zeros(n, np.float32)
    for (a, b, mood) in segments:
        if mood in ("low", "man2"):
            lowmask[int(a * SR):int(b * SR)] = 1.0 if mood == "low" else 0.4
    lowmask = np.convolve(lowmask, np.ones(int(0.6 * SR)) / int(0.6 * SR), mode="same").astype(np.float32)
    lowmask[silent] = 0
    dark = sosfilt(_sos("lowpass", 140, 4), out).astype(np.float32)
    out = out * (1 - lowmask) + dark * lowmask
    out[silent] = 0.0
    fade = int(0.04 * SR)
    out[:fade] *= np.linspace(0.6, 1, fade)
    return out / (np.abs(out).max() + 1e-9)


# ------------------------------------------------------------------ sfx
def whoosh(length=0.9, peak=0.55, seed=5):
    """Filtered-noise swoosh with a low thump at the peak (peak = seconds from start)."""
    n = int(length * SR)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    block = 256
    zi = None
    for i in range(0, n, block):
        tt = i / SR
        p = tt / peak if tt < peak else max(0.0, 1 - (tt - peak) / (length - peak))
        fc = 250 + 3800 * p ** 1.6
        b, a = butter(2, [max(fc * 0.55, 40), min(fc * 1.6, SR / 2 - 100)], btype="band", fs=SR)
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1)
        y, zi = lfilter(b, a, x[i:i + block], zi=zi)
        out[i:i + block] = y
    env = _env_curve(n, [(0, 0), (peak * 0.75, 0.6), (peak, 1.0), (peak + 0.05, 0.8), (length, 0.0)])
    out = out * env
    out += _thump(n, peak, 70, 0.35)
    return (out / (np.abs(out).max() + 1e-9) * 0.9).astype(np.float32)


def _thump(n, at, f, dur):
    t = np.arange(n) / SR - at
    e = np.where(t >= 0, np.exp(-np.maximum(t, 0) / (dur / 4)), 0)
    return np.sin(2 * np.pi * f * np.maximum(t, 0)) * e * 0.8


def bass_hit(length=2.6, seed=9):
    """Deep cinematic boom: pitch-dropping sub + saturated harmonics (audible on phone
    speakers) + a short transient click."""
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 38 + 72 * np.exp(-t / 0.045)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t / 0.85)
    sat = np.tanh(body * 3.2) * 0.55  # harmonics at 76/114 Hz
    rng = np.random.default_rng(seed)
    click = sosfilt(_sos("lowpass", 2500, 2), rng.standard_normal(n)) * np.exp(-t / 0.006) * 0.9
    rumble = sosfilt(_sos("lowpass", 120, 4), rng.standard_normal(n)) * np.exp(-t / 0.6) * 2.2
    out = body * 0.9 + sat + click + rumble
    return (out / (np.abs(out).max() + 1e-9) * 0.98).astype(np.float32)


# ------------------------------------------------------------------ voice polish
def polish_voice(x):
    """Gentle EQ + compression with ffmpeg (deep, close, even)."""
    with tempfile.TemporaryDirectory() as d:
        src, dst = Path(d) / "in.wav", Path(d) / "out.wav"
        sf.write(src, x, SR, subtype="FLOAT")
        af = ("highpass=f=55,equalizer=f=110:t=q:w=1.0:g=3.5,equalizer=f=320:t=q:w=1.2:g=-2,"
              "equalizer=f=3200:t=q:w=1.4:g=2.0,"
              "acompressor=threshold=-24dB:ratio=3:attack=4:release=140:makeup=2")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", af, "-ar", str(SR),
                        "-c:a", "pcm_f32le", str(dst)], check=True)
        y, _ = sf.read(dst, dtype="float32")
    return y[: len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))


def duck_gain(voice, depth_db=-9.0):
    """Gain curve that pulls the music down while the narrator speaks."""
    env = np.abs(voice)
    env = maximum_filter1d(env, int(0.03 * SR))
    win = int(0.12 * SR)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    on = np.clip(env / 0.05, 0, 1)
    # slow release so the drone doesn't pump between words
    rel = int(0.35 * SR)
    on = maximum_filter1d(on, rel)
    on = np.convolve(on, np.ones(int(0.15 * SR)) / int(0.15 * SR), mode="same")
    return (10 ** (depth_db * on / 20)).astype(np.float32)


def limiter(x, ceiling_db=-1.2, window=0.012):
    """Look-ahead peak limiter: min-filter then box-smooth over the same window, which
    guarantees the gain never exceeds what each sample needs."""
    c = 10 ** (ceiling_db / 20)
    need = np.minimum(1.0, c / np.maximum(np.abs(x), 1e-9))
    w = int(window * SR) | 1
    g = minimum_filter1d(need, w)
    g = uniform_filter1d(g, w)
    return (x * np.minimum(g, need)).astype(np.float32)


def normalize(x, target=-14.0):
    meter = pyln.Meter(SR)
    for _ in range(3):
        lufs = meter.integrated_loudness(x.astype(np.float64))
        x = (x * 10 ** ((target - lufs) / 20)).astype(np.float32)
        x = limiter(x, -1.2)
    return x, meter.integrated_loudness(x.astype(np.float64))
