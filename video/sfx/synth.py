"""Procedural sound-effect library for the series (no samples, no licences: everything is synthesised).

Every effect is a function returning a stereo float32 array (N, 2) at SR. Deterministic: same seed -> same sound.
Layering approach per effect: a transient (attack), a body (low/mid resonance) and air (filtered noise),
plus a short room so nothing sounds 'in a vacuum'. Add new effects to LIB at the bottom.
"""
import numpy as np
from scipy import signal

SR = 48000


# ───────────────────────── primitives
def T(d):
    return np.arange(int(round(d * SR))) / SR


def white(d, seed=0):
    return np.random.default_rng(seed).standard_normal(int(round(d * SR)))


def pink(d, seed=0):
    n = int(round(d * SR))
    X = np.fft.rfft(np.random.default_rng(seed).standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    x = np.fft.irfft(X / np.sqrt(f), n)
    return x / (np.abs(x).max() + 1e-9)


def brown(d, seed=0):
    x = np.cumsum(white(d, seed))
    x = hp(x, 20)
    return x / (np.abs(x).max() + 1e-9)


def _sos(kind, f, order=4):
    return signal.butter(order, f, kind, fs=SR, output='sos')


def lp(x, f, o=4): return signal.sosfilt(_sos('low', min(f, SR / 2 - 100), o), x)
def hp(x, f, o=4): return signal.sosfilt(_sos('high', f, o), x)
def bp(x, lo, hi, o=3): return signal.sosfilt(_sos('band', [lo, min(hi, SR / 2 - 100)], o), x)


def svf_bp(x, fc, q=1.0):
    """Time-varying band-pass (state-variable filter). fc: array same length as x (Hz)."""
    y = np.zeros_like(x)
    low = band = 0.0
    damp = 1.0 / q
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    for i in range(len(x)):
        high = x[i] - low - damp * band
        band += f[i] * high
        low += f[i] * band
        y[i] = band
    return y


def env(d, a=0.002, dec=0.1, curve='exp'):
    t = T(d)
    e = np.minimum(1, t / max(a, 1e-4))
    if curve == 'exp':
        e = e * np.exp(-np.maximum(0, t - a) / dec)
    return e


def sine_glide(d, f0, f1, k=6.0):
    t = T(d)
    f = f1 + (f0 - f1) * np.exp(-k * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def modes(d, freqs, decays, amps, seed=0):
    """Struck resonant body: sum of exponentially decaying partials."""
    t = T(d)
    rng = np.random.default_rng(seed)
    out = np.zeros_like(t)
    for f, dc, a in zip(freqs, decays, amps):
        out += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / dc)
    return out


def pad(x, d):
    n = int(round(d * SR))
    return np.pad(x, (0, max(0, n - len(x))))[:n] if x.ndim == 1 else np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]


def room(st, rt=0.35, mix=0.12, seed=7, tone=5000):
    """Small room: decaying filtered noise IR, decorrelated L/R."""
    n = int(rt * SR * 1.2)
    t = np.arange(n) / SR
    out = st.copy()
    for ch in range(2):
        ir = lp(white(n / SR, seed + ch), tone) * np.exp(-6.9 * t / rt)
        ir[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
        ir /= np.sqrt((ir ** 2).sum()) + 1e-9
        wet = signal.fftconvolve(st[:, ch], ir)[: len(st)]
        out[:, ch] = st[:, ch] + mix * wet
    return out


def stereo(m, p=0.0):
    """Constant-power pan; p in [-1, 1] or an array (moving pan)."""
    p = np.broadcast_to(np.asarray(p, dtype=float), m.shape)
    a = (p + 1) * np.pi / 4
    return np.stack([m * np.cos(a), m * np.sin(a)], axis=1)


def norm(x, peak=0.9):
    return x * (peak / (np.abs(x).max() + 1e-9))


def fade(x, fi=0.003, fo=0.01):
    n = len(x)
    i, o = int(fi * SR), int(fo * SR)
    w = np.ones(n)
    if i: w[:i] = np.linspace(0, 1, i)
    if o: w[-o:] = np.minimum(w[-o:], np.linspace(1, 0, o))
    return x * (w[:, None] if x.ndim == 2 else w)


def ks_string(d, f, decay=0.996, seed=0):
    """Karplus–Strong plucked string (used for the leash going taut)."""
    n = int(d * SR)
    N = int(SR / f)
    buf = np.random.default_rng(seed).uniform(-1, 1, N)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % N]
        buf[i % N] = decay * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return out


# ───────────────────────── effects
def whoosh(seed=1, d=0.34, p0=0.7, p1=-0.7):
    """Fast swipe transition: air moving right->left, peak in the middle."""
    t = T(d); u = t / d
    x = pink(d, seed)
    fc = 300 + 2700 * np.sin(np.pi * u) ** 2
    y = svf_bp(x, fc, 1.3) * np.sin(np.pi * u) ** 1.6
    y += 0.5 * lp(x, 500) * np.sin(np.pi * u) ** 2
    return fade(stereo(norm(y), p0 + (p1 - p0) * u), 0.01, 0.03)


def swing(seed=2, d=0.24, pan=0.0):
    """Wild punch cutting air (a miss)."""
    t = T(d); u = t / d
    x = pink(d, seed)
    shape = np.sin(np.pi * u ** 0.8) ** 2.2
    y = svf_bp(x, 500 + 3000 * np.sin(np.pi * u ** 0.7) ** 2, 1.8) * shape
    y = hp(y, 180)
    return fade(stereo(norm(y), pan + 0.5 * (u - 0.5)), 0.004, 0.03)


def punch(seed=3, pan=0.0):
    """One clean punch landing: low thump + leather slap + crack, short room."""
    d = 0.7
    thump = sine_glide(d, 115, 46, 9) * env(d, 0.001, 0.16)
    body = lp(white(d, seed), 900) * env(d, 0.0005, 0.05)
    slap = bp(white(d, seed + 1), 900, 4200) * env(d, 0.0003, 0.028)
    crack = hp(white(d, seed + 2), 3500) * env(d, 0.0002, 0.006)
    m = 1.0 * thump + 0.8 * body + 0.7 * slap + 0.5 * crack
    m = np.tanh(2.2 * norm(m)) * 0.9
    return fade(room(stereo(m, pan), 0.4, 0.18), 0.0005, 0.08)


def bump(seed=4, pan=0.0, heavy=1.0):
    """Shoulder bump on the street: muffled body thud + jacket rustle."""
    d = 0.45
    thud = sine_glide(d, 95, 58, 8) * env(d, 0.002, 0.08)
    body = lp(white(d, seed), 320) * env(d, 0.002, 0.06)
    cloth = bp(white(d, seed + 1), 1500, 6500) * env(d, 0.006, 0.09) * 0.35
    m = heavy * (thud + 0.9 * body) + cloth
    return fade(room(stereo(norm(m), pan), 0.3, 0.1), 0.001, 0.05)


def leash_on(seed=5, pan=0.0):
    """Red leash snapping into existence: neon ignition flicker, electric hum, crackles."""
    d = 1.0
    t = T(d)
    hum = sum((1 / k) * np.sin(2 * np.pi * 100 * k * t) for k in range(1, 14))
    rng = np.random.default_rng(seed)
    gate = np.ones_like(t)
    for s, e in [(0.0, 0.03), (0.05, 0.07), (0.1, 0.16)]:   # flicker on
        gate[(t > s) & (t < e)] = 0.15
    hum = lp(hum, 3000) * gate * np.minimum(1, t / 0.01) * np.exp(-np.maximum(0, t - 0.25) / 0.35)
    crack = np.zeros_like(t)
    for _ in range(26):
        i = int(rng.uniform(0, 0.3) * SR)
        crack[i:i + 40] += rng.uniform(0.3, 1) * rng.standard_normal(min(40, len(t) - i))
    crack = hp(crack, 2500)
    zap = sine_glide(0.16, 2600, 260, 5) * env(0.16, 0.001, 0.05)
    m = 0.6 * hum + 0.8 * crack + 0.5 * pad(zap, d)
    return fade(room(stereo(norm(m), pan), 0.3, 0.1), 0.001, 0.1)


def yank(seed=6, pan=0.0):
    """Leash pulled taut: short air pull, whip-crack, string twang, body jerk."""
    d = 0.8
    t = T(d)
    pre = svf_bp(pink(d, seed), 600 + 3000 * np.clip(t / 0.09, 0, 1), 1.5) * np.clip(t / 0.09, 0, 1) ** 2 * (t < 0.09)
    k = np.zeros_like(t); i0 = int(0.09 * SR)
    crack = hp(white(d, seed + 1), 1800) * np.exp(-np.maximum(0, t - 0.09) / 0.012) * (t >= 0.09)
    twang = pad(np.zeros(i0), d) + np.concatenate([np.zeros(i0), ks_string(d - 0.09, 150, 0.994, seed)])[: len(t)]
    jerk = np.concatenate([np.zeros(i0), sine_glide(d - 0.09, 90, 55, 8) * env(d - 0.09, 0.001, 0.08)])[: len(t)]
    m = 0.5 * norm(pre) + 1.0 * crack + 0.45 * norm(lp(twang, 2500)) + 0.7 * jerk + k
    return fade(room(stereo(norm(np.tanh(1.5 * norm(m))), pan), 0.3, 0.12), 0.002, 0.08)


def notify(seed=8, chime=True):
    """Same message on both phones: chime on each (L and R, a hair apart) + vibration buzz."""
    d = 0.9
    t = T(d)

    def chime_(off):
        x = np.zeros_like(t)
        for f, s in [(1568.0, 0.0), (2093.0, 0.09)]:
            tt = np.maximum(0, t - s - off)
            x += (np.sin(2 * np.pi * f * tt) + 0.18 * np.sin(4 * np.pi * f * tt)) * np.minimum(1, tt / 0.002) * np.exp(-tt / 0.22) * (t >= s + off)
        return x

    def buzz(off):
        tt = t - off
        b = np.sign(np.sin(2 * np.pi * 168 * tt)) * 0.6 + np.sin(2 * np.pi * 336 * tt) * 0.3
        g = (((tt > 0) & (tt < 0.2)) | ((tt > 0.3) & (tt < 0.5))).astype(float)
        return lp(b * lp(g, 60, 2), 1800)

    c = 0.55 if chime else 0.0
    L = c * chime_(0.0) + 0.25 * buzz(0.0)
    R = c * chime_(0.025) + 0.25 * buzz(0.03)
    st = np.stack([0.85 * L + 0.25 * R, 0.25 * L + 0.85 * R], axis=1)
    return fade(room(norm(st), 0.25, 0.08), 0.001, 0.05)


def typing(seed=9, d=3.4, pan=-0.35):
    """Frantic thumb taps on a glass phone screen."""
    t = T(d)
    rng = np.random.default_rng(seed)
    m = np.zeros_like(t)
    s = 0.0
    while s < d - 0.05:
        i = int(s * SR)
        n = int(0.03 * SR)
        a = rng.uniform(0.55, 1.0)
        tap = hp(white(0.03, int(rng.integers(1e6))), 2200) * env(0.03, 0.0003, 0.004) * 0.7
        tap += np.sin(2 * np.pi * rng.uniform(200, 280) * T(0.03)) * env(0.03, 0.0005, 0.008)
        m[i:i + n] += a * tap[: len(m) - i]
        s += rng.uniform(0.065, 0.15)
    return fade(stereo(norm(m), pan), 0.002, 0.05)


def send(seed=10, pan=-0.35):
    """Message sent: short rising swoosh + soft blip."""
    d = 0.32
    t = T(d); u = np.clip(t / 0.18, 0, 1)
    sw = svf_bp(pink(d, seed), 600 + 3600 * u, 2.0) * np.sin(np.pi * u) ** 1.5 * (t < 0.18)
    blip = sine_glide(0.08, 1100, 1650, 4) * env(0.08, 0.002, 0.03)
    m = norm(sw) + 0.35 * pad(np.concatenate([np.zeros(int(0.12 * SR)), blip]), d)
    return fade(stereo(norm(m), pan), 0.002, 0.04)


def phone_down(seed=11, pan=0.35):
    """Phone placed face-down on the floor: plastic click + small wood knock."""
    d = 0.4
    click = hp(white(d, seed), 3000) * env(d, 0.0002, 0.003)
    knock = modes(d, [190, 430, 960, 1850], [0.06, 0.04, 0.025, 0.012], [1, 0.6, 0.35, 0.2], seed)
    thump = lp(white(d, seed + 1), 260) * env(d, 0.001, 0.03)
    m = 0.7 * click + knock * np.minimum(1, T(d) / 0.0008) + 0.6 * thump
    return fade(room(stereo(norm(m), pan), 0.3, 0.12), 0.0005, 0.05)


def scan(seed=12, d=2.4, pan=0.0, rate=1.114):
    """Red laser scanner: whining carrier that follows the scan line up and down + beam fizz."""
    t = T(d)
    pos = 0.5 + 0.5 * np.sin(2 * np.pi * rate * t)
    f = 720 + 520 * pos
    car = np.sin(2 * np.pi * np.cumsum(f) / SR)
    car += 0.35 * np.sin(2 * np.pi * np.cumsum(2.01 * f) / SR)
    car *= 1 + 0.25 * np.sin(2 * np.pi * 22 * t)
    fizz = bp(white(d, seed), 3000, 7000) * 0.07
    m = (0.7 * car + fizz) * np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.12)
    return fade(room(stereo(norm(m), pan), 0.3, 0.1), 0.005, 0.05)


def confirm(seed=13, pan=0.0):
    """'DATA ✓' — two clean ascending beeps."""
    d = 0.42
    t = T(d)
    m = np.zeros_like(t)
    for f, s, L in [(1318.5, 0.0, 0.08), (1760.0, 0.11, 0.16)]:
        tt = t - s
        w = ((tt >= 0) & (tt < L)).astype(float) * np.minimum(1, np.maximum(tt, 0) / 0.003) * np.minimum(1, np.maximum(L - tt, 0) / 0.015)
        m += (np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(6 * np.pi * f * tt)) * w
    return fade(room(stereo(norm(m), pan), 0.25, 0.1), 0.001, 0.05)


def glitch(seed=14, pan=0.0):
    """'NO DATA' — digital stutter, bit-crush, and a falling error buzz."""
    d = 0.75
    rng = np.random.default_rng(seed)
    t = T(d)
    m = np.zeros_like(t)
    s = 0.0
    while s < 0.42:
        L = rng.uniform(0.025, 0.06)
        i, n = int(s * SR), int(L * SR)
        kind = rng.integers(3)
        if kind == 0:
            seg = rng.standard_normal(n)
        elif kind == 1:
            seg = np.sign(np.sin(2 * np.pi * rng.uniform(300, 2200) * np.arange(n) / SR))
        else:
            seg = np.zeros(n)
        hold = int(rng.uniform(4, 24))
        seg = np.repeat(seg[::hold], hold)[:n]          # sample-and-hold crush
        seg = np.round(seg * 4) / 4                     # 3-bit
        m[i:i + len(seg)] += seg * rng.uniform(0.4, 1)
        s += L
    tt = np.maximum(0, t - 0.4)
    err = np.sign(np.sin(2 * np.pi * np.cumsum(420 * np.exp(-tt * 4.5) + 70) / SR)) * (t >= 0.4) * np.exp(-tt / 0.2)
    m = lp(m, 7000) * 0.6 + lp(err, 2500) * 0.6
    return fade(stereo(norm(m), pan), 0.001, 0.05)


def tick(seed=15, tock=False):
    """Wall clock in a silent room."""
    d = 0.25
    fr = [2200, 3300, 900] if tock else [2800, 4100, 1150]
    m = modes(d, fr, [0.012, 0.008, 0.02], [1, 0.6, 0.5], seed) * np.minimum(1, T(d) / 0.0004)
    m += 0.5 * hp(white(d, seed), 4000) * env(d, 0.0002, 0.002)
    return fade(room(stereo(norm(m), 0.12), 0.6, 0.25, tone=3500), 0.0005, 0.05)


def plop(seed=16, pan=-0.35):
    """A speech bubble landing on the pile: soft cushion thump."""
    d = 0.3
    rng = np.random.default_rng(seed)
    f0 = rng.uniform(130, 170)
    m = sine_glide(d, f0, f0 * 0.62, 7) * env(d, 0.002, 0.05)
    m += 0.8 * lp(white(d, seed), 480) * env(d, 0.002, 0.04)
    m += 0.15 * hp(white(d, seed + 3), 3000) * env(d, 0.001, 0.015)
    return fade(room(stereo(norm(m), pan), 0.25, 0.08), 0.001, 0.04)


def hop(seed=17, pan=0.0):
    """Sneaker landing on ring canvas while bouncing on the toes."""
    d = 0.22
    m = sine_glide(d, 78, 52, 8) * env(d, 0.001, 0.04)
    m += 0.7 * lp(white(d, seed), 260) * env(d, 0.001, 0.03)
    m += 0.12 * bp(white(d, seed + 1), 1200, 4000) * env(d, 0.001, 0.02)
    return fade(room(stereo(norm(m), pan), 0.35, 0.12), 0.0005, 0.03)


def squeak(seed=18, pan=0.0):
    """Sneaker squeak on canvas (sharp pivot)."""
    d = 0.11
    t = T(d)
    f = 1700 + 900 * (t / d) + 60 * np.sin(2 * np.pi * 70 * t)
    m = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 0.7
    m += 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * np.sin(np.pi * t / d)
    m = bp(m + 0.15 * white(d, seed), 900, 6000)
    return fade(stereo(norm(m), pan), 0.002, 0.02)


def scuff(seed=19, pan=0.0):
    """Shoe dragging on canvas as Reactive stumbles back."""
    d = 0.3
    t = T(d)
    m = bp(white(d, seed), 700, 4200) * np.minimum(1, t / 0.02) * np.exp(-t / 0.11)
    m += 0.4 * lp(white(d, seed + 1), 200) * env(d, 0.002, 0.05)
    return fade(room(stereo(norm(m), pan), 0.3, 0.1), 0.002, 0.04)


def bell(seed=20, strikes=(0.0, 0.26, 0.52), d=2.9):
    """Boxing ring bell: ding-ding-ding (struck dome bell, inharmonic partials)."""
    t = T(d)
    m = np.zeros_like(t)
    f0 = 742.0
    parts = [(0.5 * f0, 0.25, 2.4), (f0, 1.0, 1.9), (f0 + 2.1, 0.5, 1.9), (2.76 * f0, 0.55, 0.9), (5.40 * f0, 0.3, 0.42), (8.93 * f0, 0.15, 0.22)]
    for k, s in enumerate(strikes):
        tt = np.maximum(0, t - s)
        on = (t >= s).astype(float)
        a = 1.0 if k == 0 else 0.9
        for f, amp, dc in parts:
            m += a * amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt / dc) * on * np.minimum(1, tt / 0.0006)
        m += a * 0.4 * hp(white(d, seed + k), 2500) * np.exp(-tt / 0.004) * on
    m *= np.minimum(1, (d - t) / 0.4)
    return fade(room(stereo(norm(m), 0.0), 1.1, 0.22, tone=7000), 0.0005, 0.1)


def city(seed=21, d=3.5):
    """Street bed: low traffic rumble, distant city air, one car passing left->right."""
    t = T(d)
    rumble = hp(lp(brown(d, seed), 160), 38) * 0.45
    air = bp(pink(d, seed + 1), 250, 2500) * 0.18
    u = np.clip((t - 0.5) / 2.6, 0, 1)
    swell = np.sin(np.pi * u) ** 2
    car = svf_bp(pink(d, seed + 2), 350 + 900 * swell, 0.9) * swell
    st = stereo(rumble + air, 0.0) + stereo(0.7 * norm(car), -0.8 + 1.6 * u)
    st *= (np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.25))[:, None]
    return norm(st, 0.9)


LIB = {
    'whoosh': whoosh, 'swing': swing, 'punch': punch, 'bump': bump, 'leash_on': leash_on, 'yank': yank,
    'notify': notify, 'typing': typing, 'send': send, 'phone_down': phone_down, 'scan': scan, 'confirm': confirm,
    'glitch': glitch, 'tick': tick, 'plop': plop, 'hop': hop, 'squeak': squeak, 'scuff': scuff, 'bell': bell, 'city': city,
}
