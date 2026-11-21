"""Least Interest — cinematic sound design (synthesized placeholders, 48 kHz stereo).
Writes every cue into public/sfx/. Replace any file with a recorded one of the same name; timing lives in the scene code.
Run: python3 scripts/sound_design.py
"""
import numpy as np, wave, os
from scipy.signal import butter, sosfilt, sosfilt_zi, fftconvolve

SR = 48000
OUT = 'public/sfx'
rng = np.random.default_rng(1207)

# ---------------- primitives ----------------
class Sig(np.ndarray):
    """1-D signal whose + - * pad the shorter operand with zeros (layering sounds of different lengths)."""
    def _pair(self, o):
        if isinstance(o, np.ndarray) and o.ndim == 1 and self.ndim == 1 and len(o) != len(self):
            n = max(len(o), len(self)); a = np.zeros(n); a[:len(self)] = self; b = np.zeros(n); b[:len(o)] = o; return a.view(Sig), b.view(Sig)
        return self, o
    def __add__(self, o): a, b = self._pair(o); return np.add(np.asarray(a), np.asarray(b)).view(Sig)
    def __radd__(self, o): a, b = self._pair(o); return np.add(np.asarray(b), np.asarray(a)).view(Sig)
    def __sub__(self, o): a, b = self._pair(o); return np.subtract(np.asarray(a), np.asarray(b)).view(Sig)
    def __mul__(self, o): a, b = self._pair(o); return np.multiply(np.asarray(a), np.asarray(b)).view(Sig)
    def __rmul__(self, o): a, b = self._pair(o); return np.multiply(np.asarray(b), np.asarray(a)).view(Sig)
def V(x): return np.asarray(x, dtype=float).view(Sig)
def N(d): return int(round(d * SR))
def tt(d): return V(np.arange(N(d)) / SR)
def noise(d): return V(rng.standard_normal(N(d)))
def pink(d):
    n = N(d); X = np.fft.rfft(rng.standard_normal(n)); fr = np.fft.rfftfreq(n, 1 / SR); fr[0] = 1
    return V(np.fft.irfft(X / np.sqrt(fr), n) * 30)
def _sos(kind, f, o=2): return butter(o, f, btype=kind, fs=SR, output='sos')
def lp(x, f, o=2): return V(sosfilt(_sos('low', min(f, SR / 2 - 100), o), x))
def hp(x, f, o=2): return V(sosfilt(_sos('high', f, o), x))
def bp(x, lo, hi, o=2): return V(sosfilt(_sos('band', [lo, min(hi, SR / 2 - 100)], o), x))
def tv(x, cut, kind='low', o=2, block=256):
    """time-varying filter; cut = array of cutoff per sample (or (lo,hi) arrays for band)."""
    y = np.zeros_like(x); zi = None
    for i in range(0, len(x), block):
        c = cut[min(i, len(cut) - 1)]
        s = butter(o, c, btype=kind, fs=SR, output='sos')
        if zi is None: zi = sosfilt_zi(s) * 0
        y[i:i + block], zi = sosfilt(s, x[i:i + block], zi=zi)
    return V(y)
def curve(d, pts):
    """piecewise-linear automation: pts = [(time, value), ...]"""
    t = tt(d); ts, vs = zip(*pts); return V(np.interp(np.asarray(t), ts, vs))
def env(d, a=0.003, r=0.1, hold=0.0):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4)); dec = np.exp(-np.maximum(0, t - a - hold) / r); return e * dec
def glide(f0, f1, d, k=6.0):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * k); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def sine(f, d, ph=0): return np.sin(2 * np.pi * f * tt(d) + ph)
def saw(f, d, harm=14): t = tt(d); return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, harm + 1))
def fit(x, d):
    o = np.zeros(N(d)); o[:min(len(x), len(o))] = x[:len(o)]; return V(o)
def put(buf, x, at, g=1.0):
    i = N(at); n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n] += np.asarray(x[:n]) * g
def fades(x, fi=0.004, fo=0.02):
    a, b = N(fi), N(fo); x = x.copy()
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x
def st(m, pan=0.0, width=0.0):
    """mono -> stereo with constant-power pan and decorrelated width."""
    m = np.asarray(m)
    L = m * np.sqrt((1 - pan) / 2) * np.sqrt(2); R = m * np.sqrt((1 + pan) / 2) * np.sqrt(2)
    if width:
        d = hp(np.roll(m, 211), 300) * width; L = L + d; R = R - d
    return np.stack([L, R])
def st_pan_auto(m, pans):
    m = np.asarray(m); pans = np.asarray(pans)
    p = np.clip(pans, -1, 1); return np.stack([m * np.sqrt((1 - p) / 2) * np.sqrt(2), m * np.sqrt((1 + p) / 2) * np.sqrt(2)])
def verb(s, decay=1.2, wet=0.2, damp=5000, pre=0.012, tail=None):
    n = N(decay * 1.6); t = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / decay)
        ir = lp(ir, damp); ir = np.concatenate([np.zeros(N(pre)), ir]); ir /= np.sqrt((ir ** 2).sum())
        out.append(fftconvolve(s[ch], ir)[: s.shape[1] + (N(tail) if tail else 0)])
    w = np.stack(out); d = np.zeros_like(w); d[:, : s.shape[1]] = s
    return d * (1 - wet * 0.5) + w * wet
def write(name, s, peak=0.5, fi=0.002, fo=0.03):
    if s.ndim == 1: s = st(s)
    s = np.stack([fades(s[0], fi, fo), fades(s[1], fi, fo)])
    s = np.tanh(s / (np.max(np.abs(s)) + 1e-9) * 1.15) ; s = s / np.max(np.abs(s)) * peak
    with wave.open(f'{OUT}/{name}', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((s.T * 32767).astype(np.int16).tobytes())

# ---------------- building blocks ----------------
def thud(f0=85, f1=40, d=0.35, tau=0.09):
    return glide(f0, f1, d, 18) * env(d, 0.002, tau) + lp(noise(d), 260) * env(d, 0.001, tau * 0.6) * 0.8
def transient(d=0.01, lo=2500): return hp(noise(d), lo) * env(d, 0.0003, 0.002)
def heartbeat():
    d = 0.6; lub = glide(70, 48, d, 25) * env(d, 0.004, 0.06); dub = fit(np.zeros(N(0.17)), d)
    dub = np.concatenate([np.zeros(N(0.17)), glide(62, 44, d - 0.17, 25) * env(d - 0.17, 0.004, 0.05) * 0.7])
    return lp(lub + fit(dub, d), 160) * 2.2
def footstep(kind='sneaker', g=1.0):
    d = 0.32
    heel = thud(95, 55, d, 0.04) * 0.9
    grit = bp(noise(d), 2000, 7000) * env(d, 0.001, 0.012) * (0.5 if kind == 'sneaker' else 0.9)
    toe = np.concatenate([np.zeros(N(0.06)), (thud(110, 70, d - 0.06, 0.025) * 0.5 + bp(noise(d - 0.06), 1800, 6000) * env(d - 0.06, 0.001, 0.01) * 0.4)])
    x = heel + grit + fit(toe, d)
    if kind == 'leather': x += transient(d, 3500) * 1.8
    return x * g
def metal(parts, taus, d, amps=None):
    t = tt(d); amps = amps or [1] * len(parts)
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, tau, a in zip(parts, taus, amps)) * np.minimum(1, t / 0.0006)
def swish(d, f0, f1, width=0.35):
    c = np.geomspace(f0, f1, N(d)); x = noise(d)
    y = tv(x, np.stack([c * (1 - width), np.minimum(c * (1 + width), SR / 2 - 200)], 1), 'band')
    return y * np.sin(np.pi * np.linspace(0, 1, N(d))) ** 1.5
def tick(f=2300, g=1.0):
    d = 0.06; return (bp(noise(d), f * 0.92, f * 1.08, 2) * env(d, 0.0003, 0.01) * 3 + sine(f * 0.38, d) * env(d, 0.001, 0.008) * 0.6) * g
def breath(d, inhale=False):
    x = noise(d); y = bp(x, 450, 950) * 0.8 + bp(x, 1100, 1700) * 0.5 + lp(hp(x, 3000), 7000) * 0.08
    e = np.sin(np.pi * np.linspace(0, 1, N(d))) ** (0.8 if inhale else 1.6)
    return y * e
def fabric(d):
    y = np.zeros(N(d))
    for _ in range(int(d * 120)):
        i = rng.integers(0, max(1, len(y) - N(0.02))); g = bp(noise(0.02), 900, 5000) * env(0.02, 0.001, 0.004); y[i:i + len(g)] += g * rng.random()
    return y * np.sin(np.pi * np.linspace(0, 1, N(d)))

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.wav'): os.remove(os.path.join(OUT, f))

# ================= HOOK =================
d = 1.13; strain = np.zeros(N(d))
ramp = curve(d, [(0, 0.35), (1.13, 1.0)])
for k in range(60):
    at = (rng.random() ** 0.65) * (d - 0.07); gl = rng.uniform(0.025, 0.06); c = rng.uniform(320, 1150)
    g = bp(noise(gl), c * 0.93, c * 1.07, 2) * env(gl, 0.002, gl * 0.4) * 4 + sine(c, gl) * env(gl, 0.002, gl * 0.3) * 0.5
    put(strain, g, at, rng.uniform(0.3, 1.0) * np.interp(at, [0, d], [0.4, 1]))
tension = (sine(46, d) + 0.5 * sine(92.5, d)) * curve(d, [(0, 0.15), (d, 0.55)]) * (0.85 + 0.15 * np.cos(2 * np.pi * 7 * tt(d)))
effort = breath(d) * curve(d, [(0, .2), (.3, .8), (.55, .4), (.85, 1), (d, .9)]) * 0.5
mix = strain * 0.9 + tension * 0.7 + effort
# tape-stop into the release
n_ts = N(0.12); rate = np.linspace(1, 0.12, n_ts); idx = (len(mix) - n_ts) + np.cumsum(rate) - rate[0]
mix = np.concatenate([mix[:len(mix) - n_ts], np.interp(idx, np.arange(len(mix)), mix)])
write('hook_strain.wav', verb(st(mix, -0.35, 0.25), 0.7, 0.12), 0.5, fo=0.004)

d = 0.9; rel = np.zeros(N(d))
put(rel, swish(0.18, 4200, 650, 0.3) * 2.2, 0)
put(rel, (hp(noise(0.05), 1200) * env(0.05, 0.0005, 0.012) * 1.4 + thud(130, 80, 0.2, 0.03) * 0.8), 0.24)
for a in (0.31, 0.36, 0.43): put(rel, hp(noise(0.03), 1500) * env(0.03, 0.0005, 0.006) * 0.35, a)
write('hook_release.wav', verb(st(rel, 0.1, 0.2), 0.8, 0.16), 0.5)

d = 1.4; fall = np.zeros(N(d))
put(fall, fabric(0.2) * 1.2 + swish(0.2, 700, 2600, 0.4) * 0.8, 0)
put(fall, transient(0.012, 2500) * 1.6 + thud(88, 38, 0.5, 0.11) * 1.6 + bp(noise(0.08), 300, 1200) * env(0.08, 0.001, 0.03) * 0.9, 0.18)
put(fall, thud(125, 70, 0.3, 0.05) * 0.55 + transient(0.01, 3000) * 0.5, 0.30)
put(fall, bp(noise(0.5), 120, 520) * env(0.5, 0.002, 0.16) * 0.6, 0.18)
write('body_fall.wav', verb(st(fall, -0.2, 0.15), 1.1, 0.22), 0.62)

d = 3.2; t = tt(d); hit = np.zeros(N(d))
sub = glide(95, 30, d, 2.3) * env(d, 0.004, 1.0)
braam = sum(saw(f, d) for f in (55, 55.4, 82.6, 110.3)) * 0.25
braam = tv(braam, np.geomspace(2200, 240, N(d))) * env(d, 0.015, 0.9)
rumble = lp(noise(d), 100, 3) * env(d, 0.05, 1.2) * 1.6
hit = np.tanh((sub * 1.3 + braam * 1.1 + rumble) * 1.4)
write('wins_hit.wav', verb(st(hit, 0, 0.35), 2.6, 0.3, 3500), 0.62)

# ================= TRANSITIONS: reverse-reverb swells =================
for name, dark in (('swell_a.wav', False), ('swell_b.wav', True)):
    imp = np.zeros(N(3.2)); put(imp, bp(noise(0.03), 250, 6000 if not dark else 2500) * env(0.03, 0.0005, 0.008) * 2 + sine(110 if not dark else 70, 0.2) * env(0.2, 0.002, 0.05), 0)
    s = verb(st(imp, 0, 0.3), 3.0, 1.0, 6000 if not dark else 2600)[:, : N(0.6)]
    s = s[:, ::-1] * np.linspace(0.2, 1, N(0.6)) ** 2
    cut = np.zeros((2, N(0.68))); cut[:, : N(0.6)] = s
    air = hp(noise(0.08), 2500) * env(0.08, 0.001, 0.02) * (0.35 if not dark else 0.2); cut[:, N(0.6):N(0.6) + len(air)] += np.stack([air, air])[:, : N(0.08)]
    write(name, cut, 0.45, fi=0.03, fo=0.03)

# ================= 01 THE TEXT =================
d = 4.6; clock = np.zeros(N(d))
for i, a in enumerate(np.arange(0.1, d, 0.5)):
    put(clock, tick(2300 if i % 2 == 0 else 1850, np.interp(a, [0, d], [0.35, 1.0])), a)
roomtone = lp(pink(d), 280) * 0.04 + (sine(50, d) + 0.4 * sine(100, d)) * 0.012
dry = st(clock + roomtone, -0.3, 0.1); wetv = verb(dry, 1.4, 1.0)
clk = dry * curve(d, [(0, 1), (d, 0.7)]) + wetv * curve(d, [(0, 0.08), (d, 0.45)])
write('clock_tension.wav', clk, 0.38, fi=0.2, fo=0.3)

gym = lp(bp(pink(d), 80, 650), 600) * 0.12 + sine(120, d) * 0.01
for a in (0.7, 2.3, 3.6):
    put(gym, lp(metal([523, 1307, 2131, 3011], [0.9, 0.6, 0.4, 0.3], 1.2), 3200) * 0.25, a)
write('gym_bed.wav', verb(st(gym, 0.45, 0.3), 1.8, 0.45, 3000), 0.3, fi=0.25, fo=0.3)

d = 0.42; ty = np.zeros(N(d)); a = 0.0
while a < d - 0.05:
    put(ty, transient(0.004, 3000) * 0.7 + bp(noise(0.02), 2500, 6000) * env(0.02, 0.0004, 0.004) + sine(190, 0.03) * env(0.03, 0.001, 0.005) * 0.4, a, rng.uniform(0.5, 1)); a += rng.uniform(0.065, 0.1)
write('typing.wav', verb(st(ty, -0.3), 0.4, 0.08), 0.35)

for i, (f0, cutf, wetk) in enumerate(zip([740, 659, 587, 494, 415], [6500, 4800, 3600, 2600, 1900], [0.1, 0.17, 0.25, 0.34, 0.44]), 1):
    d = 0.9; s = np.zeros(N(d))
    put(s, swish(0.13, 900, 3600, 0.4) * 1.3, 0)
    put(s, (glide(f0 * 1.04, f0, 0.4, 30) * env(0.4, 0.003, 0.11) + glide(f0 * 2.01, f0 * 2, 0.4, 30) * env(0.4, 0.002, 0.05) * 0.25) * 0.55, 0.1)
    s = lp(s, cutf) * (1 - 0.06 * i)
    write(f'send{i}.wav', verb(st(s, -0.3, 0.15), 1.0 + 0.3 * i, wetk), 0.45)
s = np.zeros(N(0.7)); put(s, swish(0.12, 1000, 4200, 0.4) * 1.2, 0); put(s, glide(810, 784, 0.4, 30) * env(0.4, 0.003, 0.1) * 0.5, 0.09)
write('send_clean.wav', verb(st(lp(s, 7000), 0.35, 0.1), 0.6, 0.1), 0.4)
s = transient(0.006, 2000) * 0.6 + thud(70, 50, 0.25, 0.04) * 0.5
write('delivered.wav', verb(st(s, -0.3), 0.8, 0.15), 0.35)
s = fit(glide(500, 720, 0.25, 40) * env(0.25, 0.004, 0.05) * 0.7 + bp(noise(0.25), 800, 3000) * env(0.25, 0.002, 0.03) * 0.3, 0.35)
write('dots_in.wav', verb(st(s, -0.3), 0.6, 0.12), 0.35)
d = 0.9; t = tt(d); fq = 700 * np.exp(-t * 2.4) + 300
s = lp(np.sin(2 * np.pi * np.cumsum(fq) / SR), 2500) * env(d, 0.01, 0.3) * 0.7 + glide(90, 55, d, 3) * env(d, 0.05, 0.35) * 0.6
write('dots_out.wav', verb(st(s, -0.3, 0.2), 1.6, 0.3), 0.42)
d = 0.8; s = np.zeros(N(d)); put(s, swish(0.22, 900, 3800, 0.4), 0)
put(s, lp(noise(0.3), 220) * env(0.3, 0.002, 0.06) * 2 + thud(72, 48, 0.3, 0.05) * 0.8 + fabric(0.3) * 0.8, 0.27)
write('phone_toss.wav', verb(st(s, -0.4, 0.15), 0.7, 0.14), 0.5)
d = 1.5; t = tt(d); s = np.zeros(N(d))
for f0, a, g in ((659.3, 0, 1.0), (987.8, 0.09, 0.7)):
    tl = tt(d - a); idx = 1.3 * np.exp(-tl * 6)
    tone = np.sin(2 * np.pi * f0 * tl + idx * np.sin(2 * np.pi * f0 * 1.4 * tl)) * np.exp(-tl / 0.45) * np.minimum(1, tl / 0.004)
    put(s, tone * g, a)
write('reply_chime.wav', verb(st(lp(s, 5200), 0.35, 0.2), 1.6, 0.24), 0.36)

# ================= 02 THE DEAL =================
d = 4.6; t = tt(d)
wind = bp(pink(d), 150, 900) * (0.6 + 0.4 * (0.5 - 0.5 * np.cos(2 * np.pi * 0.28 * t))) * 0.25
traffic = lp(pink(d), 320) * 0.18
car = lp(noise(d), 900) * np.exp(-((t - 2.6) / 0.55) ** 2) * 0.5
hum = (sine(120, d) * 0.6 + sine(240, d) * 0.3 + sine(360, d) * 0.15) * 0.012
lot = wind + traffic + car + hum
write('lot_bed.wav', verb(st(lot, 0, 0.45), 1.2, 0.15), 0.34, fi=0.25, fo=0.3)
write('step_quick.wav', verb(st(footstep('sneaker'), -0.3), 0.5, 0.12, pre=0.06), 0.45)
write('step_calm.wav', verb(st(footstep('leather'), -0.35), 0.9, 0.2, pre=0.08), 0.42)
d = 1.15; s = np.zeros(N(d))
for i, a in enumerate(np.arange(0, 0.95, 0.16)): put(s, footstep('leather', np.interp(i, [0, 5], [0.55, 1])), a)
put(s, fabric(1.0) * 0.6, 0)
write('steps_hurry.wav', verb(st_pan_auto(s, np.linspace(0.35, -0.25, N(d))), 0.8, 0.15, pre=0.07), 0.5)
d = 0.6; s = np.zeros(N(d))
for _ in range(15):
    parts = list(rng.uniform(2200, 7600, 4)); put(s, metal(parts, list(rng.uniform(0.04, 0.12, 4)), 0.2) * rng.uniform(0.3, 1), rng.uniform(0, 0.36))
write('key_jingle.wav', verb(st(lp(s, 9000), 0.35, 0.35), 0.5, 0.15), 0.38)
d = 0.75; s = np.zeros(N(d)); a, gap, k = 0.0, 0.11, 0
while a < 0.5:
    put(s, tick(1800 + 1500 * a, 0.7 + 0.5 * a), a); a += gap; gap = max(0.034, gap * 0.82); k += 1
put(s, tick(2700, 1.3) + thud(110, 70, 0.06, 0.02) * 0.5, 0.52)
s += glide(58, 74, d, 0.5) * curve(d, [(0, 0), (0.5, 0.25), (d, 0)]) * 0.4
write('counter_up.wav', verb(st(s, 0.1, 0.1), 0.5, 0.1), 0.45)
d = 0.75; s = np.zeros(N(d)); a, gap = 0.0, 0.034
while a < 0.42:
    put(s, tick(2600 - 1900 * a, 0.9), a); a += gap; gap = min(0.12, gap * 1.2)
put(s, thud(82, 50, 0.3, 0.08) * 1.6 + bp(noise(0.1), 800, 3000) * env(0.1, 0.0005, 0.02) * 1.2, 0.45)
write('counter_down.wav', verb(st(s, 0, 0.1), 0.6, 0.12), 0.5)
d = 0.9; t = tt(d); s = swish(0.55, 1500, 7500, 0.3) * 1.3
sh = sum(np.sin(2 * np.pi * f * t[:N(0.55)] * (1 + 0.003 * np.sin(2 * np.pi * 6 * t[:N(0.55)]))) for f in (2349, 3136, 4186)) * np.sin(np.pi * np.linspace(0, 1, N(0.55))) ** 2 * 0.15
s = fit(s + sh, d)
write('wipe_shimmer.wav', verb(st_pan_auto(s, np.linspace(-0.8, 0.8, N(d))), 1.2, 0.3), 0.38)
write('cloth.wav', verb(st(fabric(0.35), 0, 0.2), 0.4, 0.1), 0.3)

# ================= 03 THE ROOM =================
d = 4.6; t = tt(d)
crowd = bp(pink(d), 250, 2200) * 0.35
for v in range(9):
    rate = rng.uniform(3.5, 6.0); ph = rng.uniform(0, 6.3); c1 = rng.uniform(300, 850); c2 = rng.uniform(1200, 2400)
    gate = np.clip(np.sin(2 * np.pi * rate * t + ph + np.sin(2 * np.pi * 0.7 * t + v)), 0, 1) ** 1.5
    on = (np.sin(2 * np.pi * rng.uniform(0.15, 0.35) * t + rng.uniform(0, 6.3)) > -0.3).astype(float)
    x = noise(d); crowd += (bp(x, c1 * 0.8, c1 * 1.25) + bp(x, c2 * 0.85, c2 * 1.15) * 0.5) * gate * lp(on, 8, 1) * 0.5
kick = np.zeros(N(d))
for a in np.arange(0.05, d, 0.5): put(kick, glide(62, 44, 0.3, 20) * env(0.3, 0.002, 0.12) + lp(noise(0.02), 400) * env(0.02, 0.0005, 0.005) * 0.4, a)
kick = lp(kick, 170, 4) * 0.55
cut = curve(d, [(0, 3000), (1.6, 3000), (2.05, 380), (2.65, 380), (3.2, 7000), (d, 7000)])
cg = curve(d, [(0, 1), (2.0, 0.8), (2.65, 0.8), (3.3, 1.25), (d, 1.1)])
crowdF = tv(crowd, cut) * cg
iso = np.zeros(N(d))
for a in (1.8, 2.55): put(iso, heartbeat(), a, 0.7)
iso += sine(6800, d) * curve(d, [(0, 0), (1.8, 0), (2.1, 0.012), (2.6, 0.012), (3.0, 0), (d, 0)])
room = st(crowdF, 0, 0.6) + st(kick, 0.3) + st(iso, -0.25)
write('room_bed.wav', verb(room, 1.1, 0.2), 0.42, fi=0.25, fo=0.35)
d = 1.4; s = np.zeros(N(d)); parts = [2850, 4130, 5920, 7710, 9370]; taus = [0.9, 0.6, 0.45, 0.3, 0.2]; amps = [1, 0.6, 0.4, 0.25, 0.12]
put(s, metal(parts, taus, 1.2, amps) + transient(0.004, 4000) * 0.5, 0)
put(s, metal([p * 1.031 for p in parts], taus, 1.2, amps) * 0.7, 0.022)
write('glass_clink.wav', verb(st(s, 0.45, 0.2), 1.0, 0.22), 0.34)

# ================= 04 THE HABIT =================
d = 4.6; t = tt(d)
drops = np.zeros(N(d))
for _ in range(int(d * 140)):
    put(drops, hp(noise(0.006), 2500) * env(0.006, 0.0003, 0.0015) * rng.random(), rng.uniform(0, d - 0.01))
rain_ = lp(drops, 3500) * 0.8 + bp(pink(d), 400, 3000) * 0.1
comp = (sine(60, d) + sine(60.4, d) * 0.8 + sine(120, d) * 0.5 + sine(180, d) * 0.25) * 0.05
pattern = [1, 1, 1, .2, 1, 1, 1, 1, .3, 1, 1, 1, 1, 1, .15, 1]
gate = np.array([pattern[int(x * 30) % 16] for x in t]); gate = lp(gate, 60, 1)
buzz = lp(sum(np.sin(2 * np.pi * 120 * k * t) / k for k in range(1, 12)), 2500) * gate * 0.03
crack = np.zeros(N(d))
for k in range(int(d * 30)):
    if pattern[k % 16] < 0.5: put(crack, hp(noise(0.012), 2000) * env(0.012, 0.0003, 0.003) * 0.4, (k + 1) / 30)
store = st(rain_, 0.4, 0.5) + st(comp, -0.35) + st(buzz + crack, 0.3)
write('store_bed.wav', verb(store, 0.8, 0.12), 0.36, fi=0.25, fo=0.35)
d = 1.8; t = tt(d); s = np.zeros(N(d))
amp = curve(d, [(0, 0), (0.3, 0.15), (1.7, 1.0), (d, 1.0)])
fw = np.interp(t, [0, d], [6200, 6900])
s += (np.sin(2 * np.pi * np.cumsum(fw) / SR) + np.sin(2 * np.pi * np.cumsum(fw + 7) / SR)) * amp * 0.035
a, bpm = 0.05, 70
while a < d - 0.3:
    put(s, heartbeat(), a, np.interp(a, [0, d], [0.5, 1.0])); a += 60 / bpm; bpm = min(132, bpm * 1.18)
s += glide(40, 46, d, 0.4) * amp * 0.25
write('craving_whine.wav', verb(st(s, -0.3, 0.2), 0.7, 0.1), 0.45, fo=0.025)
write('step_soft.wav', verb(st(footstep('sneaker', 0.8) + fit(glide(1900, 2300, 0.03, 50) * env(0.03, 0.002, 0.01) * 0.06, 0.32), -0.2), 0.5, 0.1), 0.32)
d = 0.8; s = np.zeros(N(d)); put(s, swish(0.08, 3000, 7000, 0.3) * 0.9, 0)
for i, a in enumerate([0.12, 0.2, 0.26, 0.3, 0.33]):
    parts = [3100 * rng.uniform(0.95, 1.05), 4870 * rng.uniform(0.95, 1.05), 6700]
    put(s, metal(parts, [0.05, 0.035, 0.025], 0.1) * (1 - 0.17 * i), a)
s = lp(s, 4200) + bp(s, 400, 900) * 0.4
write('coin_insert.wav', verb(st(s, -0.4, 0.1), 0.35, 0.18), 0.4)
d = 1.0; s = np.zeros(N(d))
put(s, lp(noise(0.3), 260) * env(0.3, 0.001, 0.06) * 1.6 + glide(78, 52, 0.4, 15) * env(0.4, 0.002, 0.1) * 1.2 + metal([180, 410, 690], [0.25, 0.18, 0.12], 0.5) * 0.3, 0)
for i, a in enumerate(np.linspace(0.16, 0.5, 8)): put(s, bp(noise(0.015), 1500, 5000) * env(0.015, 0.0005, 0.004) * 0.25 * (1 - i / 8), a)
write('can_drop.wav', verb(st(s, -0.45, 0.1), 0.4, 0.2), 0.55)
d = 1.5; t = tt(d); s = np.zeros(N(d))
put(s, transient(0.006, 2000) * 1.4 + metal([2900, 4600], [0.02, 0.015], 0.1) * 0.6, 0)
put(s, hp(noise(0.5), 2500) * env(0.5, 0.002, 0.11) * 1.3, 0.012)
fizz = np.zeros(N(d))
for _ in range(500):
    a = rng.uniform(0.05, 1.45); put(fizz, hp(noise(0.004), 3000) * env(0.004, 0.0002, 0.001) * rng.random() * np.exp(-a * 1.8), a)
s += fizz * 0.7
write('can_open.wav', verb(st(s, -0.4, 0.25), 0.4, 0.12), 0.5)
d = 0.4; s = glide(220, 110, d, 18) * env(d, 0.003, 0.07) * 0.8 + bp(noise(d), 250, 800) * env(d, 0.003, 0.05) * 0.5 + fit(np.concatenate([np.zeros(N(0.05)), glide(620, 300, 0.1, 60) * env(0.1, 0.002, 0.02) * 0.25]), d)
write('gulp.wav', st(lp(s, 1500), -0.4), 0.38)
write('relief_exhale.wav', verb(st(lp(breath(1.1), 4000), -0.4, 0.15), 0.6, 0.12), 0.4)
d = 1.6; t = tt(d); s = (np.sin(2 * np.pi * 6500 * t) + np.sin(2 * np.pi * 6506 * t)) * curve(d, [(0, 0), (1.2, 0.03), (d, 0.02)])
put(s, heartbeat(), 0.9, 0.9); s += glide(42, 40, d, 1) * curve(d, [(0, 0), (1.0, 0.25), (d, 0.15)])
write('craving_return.wav', verb(st(s, -0.35, 0.2), 0.9, 0.15), 0.38)
d = 1.25; s = np.zeros(N(d))
for i, a in enumerate(np.arange(0, 1.15, 0.2)):
    stp = footstep('sneaker', np.interp(i, [0, 5], [0.35, 1])); spl = bp(noise(0.08), 1500, 6000) * env(0.08, 0.002, 0.03) * 0.6
    put(s, stp + fit(spl, 0.32), a)
write('run_wet.wav', verb(st_pan_auto(s, np.linspace(0.75, 0.25, N(d))), 0.6, 0.12, pre=0.05), 0.45)
d = 1.0; s = np.zeros(N(d)); put(s, breath(0.25, True) * 0.6, 0); put(s, breath(0.42), 0.3); put(s, breath(0.25, True) * 0.5, 0.75)
write('breath_run.wav', verb(st(s, 0.3, 0.1), 0.5, 0.1), 0.35)
d = 0.6; s = np.zeros(N(d))
for a in (0.05, 0.14, 0.22): put(s, glide(420, 720, 0.06, -20) * env(0.06, 0.003, 0.015) * 0.5, a)
s += fabric(0.6) * 0.3
write('water_sip.wav', st(lp(s, 5000), 0.3), 0.3)

# ================= THESIS =================
d = 2.9; t = tt(d)
dr = (np.sin(2 * np.pi * 41.2 * t) + np.sin(2 * np.pi * 41.5 * t) * 0.7 + np.sin(2 * np.pi * 61.7 * t) * 0.5 + np.sin(2 * np.pi * 82.4 * t) * 0.3)
dr = lp(dr, 300) * curve(d, [(0, 0), (0.4, 1), (2.4, 1), (d, 0)]) * 0.4 + bp(pink(d), 100, 500) * 0.15
thunder = lp(noise(2.0), 120, 3) * env(2.0, 0.3, 0.6) * 1.4
put(dr, thunder, 0.85)
write('thesis_drone.wav', verb(st(dr, 0, 0.6), 2.0, 0.25, 3000), 0.5, fi=0.2, fo=0.4)
d = 1.8; t = tt(d)
air = lp(hp(noise(d), 2500), 9000) * curve(d, [(0, 0), (1.0, 1), (d, 0)]) * 0.5
shim = sum(np.sin(2 * np.pi * f * t) for f in (1568, 2349, 3136)) * curve(d, [(0, 0), (1.0, 0.04), (d, 0)])
write('door_air.wav', verb(st(air + shim, 0.35, 0.6), 1.6, 0.35), 0.34)
write('step_hall.wav', verb(st(footstep('leather', 0.9), 0.3), 2.2, 0.45, 4000, pre=0.03, tail=0.6), 0.36)
d = 2.5; s = glide(70, 34, d, 2.5) * env(d, 0.005, 0.8) + lp(noise(d), 120, 3) * env(d, 0.02, 0.7) * 0.8
write('final_hit.wav', verb(st(s, 0, 0.3), 2.4, 0.3, 3000), 0.5)

# ================= CTA =================
d = 3.2; t = tt(d)
s = sine(55, d) * curve(d, [(0, 0), (0.8, 0.6), (d, 0)]) + lp(pink(d), 1500) * curve(d, [(0, 0), (1.2, 0.18), (d, 0)]) + lp(noise(d), 120) * env(d, 0.002, 0.3) * 0.8
write('cta_swell.wav', verb(st(s, 0, 0.5), 2.0, 0.3), 0.42, fi=0.01, fo=0.5)
d = 0.8; s = fit(swish(0.5, 2000, 9000, 0.3) + sine(3136, 0.5) * np.sin(np.pi * np.linspace(0, 1, N(0.5))) ** 2 * 0.05, d)
write('sheen.wav', verb(st_pan_auto(s, np.linspace(-0.6, 0.6, N(d))), 1.0, 0.3), 0.3)
d = 0.3; s = bp(noise(d), 1200, 3500) * env(d, 0.0005, 0.008) * 1.5 + glide(190, 150, d, 30) * env(d, 0.002, 0.03) * 0.6
s = s + fit(np.concatenate([np.zeros(N(0.025)), bp(noise(0.05), 1500, 4000) * env(0.05, 0.0005, 0.005) * 0.6]), d)
write('button_tick.wav', verb(st(s, 0), 0.4, 0.1), 0.36)

print('wrote', len([f for f in os.listdir(OUT) if f.endswith('.wav')]), 'files')
