"""Minimal synthesized sound design + voiceover mix.

usage: python tts/mix.py build/vo.wav build/cues.json build/mix.wav
Sounds are generated from scratch (no samples): soft ticks, pops, low pulses, sweeps,
glassy shards, a two-tone chime, and a quiet low drone bed. The voice always sits on top.
"""
import json, sys
import numpy as np
import soundfile as sf

vo_path, cue_path, out_path = sys.argv[1:4]
vo, SR = sf.read(vo_path, dtype="float32")
if vo.ndim > 1:
    vo = vo.mean(axis=1)
SR_OUT = 48000
# resample voice 24k → 48k (linear is fine for speech at this ratio)
x = np.arange(int(len(vo) * SR_OUT / SR)) * SR / SR_OUT
vo = np.interp(x, np.arange(len(vo)), vo).astype(np.float32)
N = len(vo)
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR_OUT)) / SR_OUT


def env(t, a, d):
    return np.minimum(t / a, 1.0) * np.exp(-t / d)


def lowpass(sig, cut):
    # one-pole low-pass
    a = np.exp(-2 * np.pi * cut / SR_OUT)
    out = np.empty_like(sig)
    acc = 0.0
    for i, v in enumerate(sig):
        acc = (1 - a) * v + a * acc
        out[i] = acc
    return out


def tick():
    t = t_(0.05)
    return (np.sin(2 * np.pi * 2600 * t) * 0.6 + rng.standard_normal(len(t)) * 0.15) * env(t, 0.0008, 0.008)


def pop():
    t = t_(0.25)
    f = 620 + 500 * np.exp(-t / 0.02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR_OUT) * env(t, 0.002, 0.06) * 0.8


def low():
    t = t_(0.7)
    f = 52 + 40 * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR_OUT) * env(t, 0.005, 0.22) * 1.1


def sweep():
    t = t_(0.8)
    f = 900 * np.exp(-t / 0.35) + 180
    s = np.sin(2 * np.pi * np.cumsum(f) / SR_OUT) * 0.35
    return s * np.sin(np.pi * np.minimum(t / 0.8, 1)) ** 2


def shard():
    t = t_(0.18)
    f = rng.uniform(3200, 5200)
    s = np.sin(2 * np.pi * f * t) * 0.5 + np.sin(2 * np.pi * f * 1.51 * t) * 0.3 + rng.standard_normal(len(t)) * 0.12
    return s * env(t, 0.0005, 0.03)


def chime():
    t = t_(2.2)
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in [(784, 0.5, 0.9), (1175, 0.3, 0.6), (1568, 0.12, 0.35)])
    return s * np.minimum(t / 0.004, 1) * 0.6


SOUNDS = {"tick": tick, "pop": pop, "low": low, "sweep": sweep, "shard": shard, "chime": chime}
LEVEL = {"tick": 0.10, "pop": 0.13, "low": 0.22, "sweep": 0.10, "shard": 0.07, "chime": 0.11}

sfx = np.zeros(N + SR_OUT, dtype=np.float32)
for c in json.loads(open(cue_path).read()):
    s = SOUNDS[c["type"]]() * LEVEL[c["type"]] * c.get("gain", 1)
    i = int(c["t"] * SR_OUT)
    if 0 <= i < N:
        sfx[i : i + len(s)] += s[: len(sfx) - i]
sfx = sfx[:N]

# drone bed: two detuned low sines + soft fifth, slow swell, faded in/out
t = np.arange(N) / SR_OUT
bed = (np.sin(2 * np.pi * 55 * t) + 0.7 * np.sin(2 * np.pi * 55.4 * t) + 0.35 * np.sin(2 * np.pi * 82.4 * t)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t))
fade = np.minimum(np.minimum(t / 2.0, 1), np.minimum((t[-1] - t) / 1.2, 1))
bed = bed * fade * 0.018

# gentle ducking of sfx/bed under the voice
venv = np.convolve(np.abs(vo), np.ones(2400) / 2400, mode="same")
duck = 1 - 0.35 * np.clip(venv / (venv.max() * 0.25), 0, 1)

mix = vo * 1.0 + (sfx + bed) * duck
mix /= max(1.0, np.abs(mix).max() / 0.95)
sf.write(out_path, np.stack([mix, mix], axis=1), SR_OUT)
print("wrote", out_path, f"{N / SR_OUT:.2f}s peak {np.abs(mix).max():.2f}")
