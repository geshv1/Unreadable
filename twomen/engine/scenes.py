"""Procedural cinematic scenes, painted at SW x SH in float RGB (0..1+).

Every scene is a function  scene(S, t) -> image  where S is a SceneState that holds the
shot's parameters, a seeded RNG and a cache. `t` is seconds since the start of the shot.
Motion inside the scene uses S.mt(t) (t times the shot's anim_speed, e.g. 0.5 for slow motion).
"""
import math
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

from . import shapes
from .common import SW, SH, SS, FONTS

YY, XX = np.mgrid[0:SH, 0:SW].astype(np.float32)


def C(*rgb):
    return np.array(rgb, np.float32)


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


# ---------------------------------------------------------------- noise / fog
class _Noise:
    def __init__(self, seed=7, size=256):
        rng = np.random.default_rng(seed)
        acc = np.zeros((size, size), np.float32)
        amp, tot = 1.0, 0.0
        for cells in (4, 8, 16, 32):
            g = rng.random((cells, cells)).astype(np.float32)
            big = Image.fromarray(np.tile(g, (3, 3)), "F").resize((size * 3, size * 3), Image.BICUBIC)
            acc += np.asarray(big)[size:2 * size, size:2 * size] * amp
            tot += amp
            amp *= 0.55
        acc /= tot
        self.tex = (acc - acc.min()) / (acc.max() - acc.min())
        self.n = size

    def sample(self, w, h, ox, oy, scale):
        xs = (np.arange(w) * scale + ox) % self.n
        ys = (np.arange(h) * scale + oy) % self.n
        x0 = np.floor(xs).astype(int)
        y0 = np.floor(ys).astype(int)
        fx = (xs - x0)[None, :]
        fy = (ys - y0)[:, None]
        x1, y1 = (x0 + 1) % self.n, (y0 + 1) % self.n
        T = self.tex
        a, b = T[np.ix_(y0, x0)], T[np.ix_(y0, x1)]
        c, d = T[np.ix_(y1, x0)], T[np.ix_(y1, x1)]
        return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


NOISE = _Noise()


def upsample(a):
    return np.asarray(Image.fromarray(np.ascontiguousarray(a, np.float32), "F").resize((SW, SH), Image.BILINEAR))


def fog(t, drift=(5.0, 1.2), scale=0.45, lo=0.25, hi=0.85, seed=0):
    w, h = SW // 4, SH // 4
    n1 = NOISE.sample(w, h, seed * 37 + t * drift[0], seed * 11 + t * drift[1], scale)
    n2 = NOISE.sample(w, h, 97 + seed * 5 - t * drift[0] * 0.7, 31 + t * drift[1] * 1.6, scale * 1.9)
    n = n1 * 0.62 + n2 * 0.38
    return upsample(np.clip((n - lo) / (hi - lo), 0, 1))


@lru_cache(maxsize=64)
def _glow(cx, cy, rx, ry):
    return np.exp(-(((XX - cx * SW) / (rx * SW)) ** 2 + ((YY - cy * SH) / (ry * SW)) ** 2)).astype(np.float32)


def glow(cx, cy, rx, ry=None):
    """Gaussian light blob. cx, cy are fractions of width/height, radii fractions of width."""
    return _glow(round(cx, 3), round(cy, 3), round(rx, 3), round(ry if ry is not None else rx, 3))


@lru_cache(maxsize=32)
def _cone(cx, y0, y1, w0, w1):
    f = np.clip((YY - y0 * SH) / ((y1 - y0) * SH), 0, 1)
    width = (w0 + (w1 - w0) * f) * SW
    inside = (YY >= y0 * SH).astype(np.float32)
    beam = np.exp(-((XX - cx * SW) / np.maximum(width, 1)) ** 2 * 2.2) * inside
    beam *= np.clip(1.15 - f * 0.55, 0, 1)
    beam[YY > y1 * SH] = 0
    return beam.astype(np.float32)


def cone(cx, y0, y1, w0, w1):
    return _cone(round(cx, 3), round(y0, 3), round(y1, 3), round(w0, 3), round(w1, 3))


def add(img, field, color, k=1.0):
    img += field[..., None] * (color * k)
    return img


def vignette_mask(strength=0.55):
    d = ((XX / SW - 0.5) ** 2 * 1.6 + (YY / SH - 0.5) ** 2 * 1.0)
    return np.clip(1 - d * strength * 2.2, 0, 1).astype(np.float32)


# ---------------------------------------------------------------- silhouettes
def mask_from(shapes_list_with_xform):
    canvas = Image.new("L", (SW * SS, SH * SS), 0)
    for shp, x, y, scale, flip in shapes_list_with_xform:
        shapes.rasterize(shp, x, y, scale, flip, canvas)
    small = canvas.reduce(SS)
    return np.asarray(small, np.float32) / 255.0


def silhouette(img, m, body=C(0.004, 0.004, 0.005), rim=C(1, 1, 1), rim_k=0.6, halo=None, halo_k=0.35,
               rim_r=2.2, light=None):
    """Composite a dark silhouette with an edge rim light and a soft halo (backlight wrap).
    `light` is an optional field that modulates the rim (rim is brighter where the light is)."""
    ms = gaussian_filter(m, 0.9)
    edge = np.clip(ms - gaussian_filter(m, rim_r + 0.8), 0, 1) * 2.0
    m = ms
    out = img * (1 - m[..., None]) + m[..., None] * body
    hal = np.clip(gaussian_filter(m, 7.0) - m, 0, 1)
    lf = light if light is not None else 1.0
    out += (edge * lf)[..., None] * rim * rim_k
    out += (hal * lf)[..., None] * (halo if halo is not None else rim) * halo_k
    return out


def man(x, feet_y, h, pose="stand", t=0.0, phase=0.0, flip=False):
    """Front/back man shape anchored at the feet (scene px)."""
    return (shapes.man_front(pose, t, phase), x, feet_y - h, h, flip)


# ---------------------------------------------------------------- state
class SceneState:
    def __init__(self, params, info):
        self.P = params
        self.info = info                       # dur, beats (relative starts), fps
        self.rng = np.random.default_rng(info.get("seed", 1))
        self.speed = float(params.get("anim_speed", 1.0))
        self.cache = {}

    def mt(self, t):
        return t * self.speed

    def beat_index(self, t):
        starts = self.info.get("beats", [0.0])
        i = 0
        for k, s in enumerate(starts):
            if t >= s - 1e-6:
                i = k
        return i

    def since_beat(self, t, k):
        starts = self.info.get("beats", [0.0])
        if k >= len(starts):
            return -1.0
        return t - starts[k]


def flicker(S, t, amount=0.06, seed=0):
    return 1.0 + amount * (math.sin(t * 13.1 + seed) * 0.5 + math.sin(t * 29.7 + 2 * seed) * 0.3
                           + math.sin(t * 3.3 + seed) * 0.6) / 1.4


# ================================================================= scenes
def sc_black(S, t):
    return np.zeros((SH, SW, 3), np.float32)


def sc_two_men(S, t):
    m = S.mt(t)
    light = C(0.95, 0.88, 0.80)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.012, 0.013, 0.016)
    fl = flicker(S, m, 0.05)
    g = glow(0.5, 0.40, 0.62, 0.70)
    add(img, g, light, 0.42 * fl)
    add(img, glow(0.5, 0.42, 0.18, 0.30), light, 0.55 * fl)
    add(img, cone(0.5, -0.05, 0.74, 0.10, 0.55), light, 0.10)
    # floor
    floor = np.clip((YY / SH - 0.72) * 6, 0, 1) * np.exp(-((XX / SW - 0.5) / 0.55) ** 2)
    add(img, floor * np.exp(-np.clip(YY / SH - 0.72, 0, 1) * 4), light, 0.12 * fl)
    f = fog(m, drift=(4, 1), seed=1)
    add(img, f * (0.25 + g), light, 0.16)
    sway = math.sin(m * 1.3) * 0.6
    msk = mask_from([man(0.31 * SW + sway, 0.745 * SH, 0.43 * SH),
                     man(0.69 * SW - sway, 0.745 * SH, 0.43 * SH, flip=True)])
    return silhouette(img, msk, rim=light, rim_k=0.55, halo_k=0.30, light=0.6 + g)


def _crowd(S, t, laugh):
    m = S.mt(t)
    warm = C(1.0, 0.80, 0.58)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.010, 0.009, 0.010)
    fl = flicker(S, m, 0.04, 2)
    beam = cone(0.5, -0.05, 0.665, 0.06, 0.20)
    f = fog(m, drift=(3, 0.6), seed=2)
    add(img, beam * (0.55 + 0.6 * f), warm, 0.50 * fl)
    add(img, glow(0.5, 0.665, 0.22, 0.035), warm, 0.55 * fl)
    add(img, glow(0.5, 0.45, 0.45, 0.45), warm, 0.10)
    add(img, f * glow(0.5, 0.5, 0.7, 0.8), warm, 0.06)
    items = [man(0.5 * SW, 0.665 * SH, 0.27 * SH, pose="head_down")]
    if "crowd" not in S.cache:
        rows = []
        for (n, unit, top, jit) in ((9, 0.075, 0.60, 0.010), (6, 0.15, 0.715, 0.018), (4, 0.24, 0.83, 0.02)):
            xs = np.linspace(-0.08, 1.08, n) + S.rng.normal(0, 0.025, n)
            for x in xs:
                rows.append((x, unit * (1 + S.rng.normal(0, 0.06)), top + S.rng.normal(0, jit),
                             S.rng.uniform(0, 6.28), S.rng.uniform(5.5, 8.0)))
        S.cache["crowd"] = rows
    for (x, unit, top, ph, fr) in S.cache["crowd"]:
        if abs(x - 0.5) < 0.08 and unit < 0.1:
            continue  # keep the centre figure clear
        bob = abs(math.sin(m * fr + ph)) * unit * 0.12 * SW if laugh else math.sin(m * 0.7 + ph) * 0.8
        items.append((shapes.head_back(), x * SW, top * SH - bob, unit * SW, False))
    msk = mask_from(items)
    return silhouette(img, msk, rim=warm, rim_k=0.45, halo_k=0.18, light=0.3 + 2.0 * beam + glow(0.5, 0.5, 0.5))


def sc_room_crowd(S, t):
    return _crowd(S, t, laugh=S.P.get("laugh", True))


def sc_room_watch(S, t):
    return _crowd(S, t, laugh=False)


def _red_backdrop(S, m, cx=0.5, cy=0.38, k=1.0):
    red = C(1.0, 0.22, 0.10)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.018, 0.004, 0.003)
    strobe = 1.0 + 0.22 * math.sin(m * 11.0) + (0.35 if (int(m * 6.0) % 7 == 0) else 0.0)
    g = glow(cx, cy, 0.55, 0.65)
    add(img, g, red, 0.55 * strobe * k)
    add(img, glow(cx, cy, 0.20, 0.25), C(1.0, 0.55, 0.30), 0.45 * strobe * k)
    f = fog(m, drift=(14, 5), seed=3)
    add(img, f * (0.3 + g), red, 0.22 * k)
    return img, red, g, strobe


def sc_man1_fire(S, t):
    m = S.mt(t)
    img, red, g, strobe = _red_backdrop(S, m, 0.55, 0.32)
    msk = mask_from([man(0.56 * SW, 1.12 * SH, 0.98 * SH, pose="point", t=m, flip=True)])
    return silhouette(img, msk, rim=C(1, 0.45, 0.2), rim_k=0.85 * strobe, halo_k=0.4, light=0.5 + g)


def sc_man1_cuts(S, t):
    m = S.mt(t)
    variants = S.P.get("variants", ["shout_profile", "point_close", "gesture"])
    every = float(S.P.get("cut_every", 0.5))
    v = variants[int(t / every) % len(variants)]
    cut_t = t % every
    if v == "shout_profile":
        img, red, g, strobe = _red_backdrop(S, m, 0.30, 0.40, 1.15)
        open_ = int(m / 0.16) % 2 == 0
        msk = mask_from([(shapes.profile(mouth_open=open_, tilt_deg=-6 if open_ else 0), 0.62 * SW,
                          0.24 * SH, 0.30 * SH, True)])
        return silhouette(img, msk, rim=C(1, 0.5, 0.25), rim_k=1.0, halo_k=0.45, light=0.4 + 1.2 * g)
    if v == "point_close":
        img, red, g, strobe = _red_backdrop(S, m, 0.40, 0.42, 1.1)
        jab = math.sin(cut_t * 14) * 6
        msk = mask_from([(shapes.pointing_arm(), jab, 0.44 * SH - 0.47 * SW, SW, False)])
        return silhouette(img, msk, rim=C(1, 0.5, 0.25), rim_k=1.0, halo_k=0.4, light=0.4 + g)
    img, red, g, strobe = _red_backdrop(S, m, 0.5, 0.30)
    msk = mask_from([man(0.5 * SW, 1.02 * SH, 0.82 * SH, pose="gesture", t=m)])
    return silhouette(img, msk, rim=C(1, 0.45, 0.2), rim_k=0.9, halo_k=0.4, light=0.5 + g)


def sc_man2_pause(S, t):
    m = S.mt(t)
    cold = C(0.70, 0.84, 1.0)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.008, 0.011, 0.016)
    beam = cone(0.5, -0.05, 0.745, 0.05, 0.22)
    f = fog(m, drift=(2.0, 0.5), seed=4)
    add(img, beam * (0.5 + 0.7 * f), cold, 0.45)
    add(img, glow(0.5, 0.42, 0.55, 0.6), cold, 0.16)
    add(img, glow(0.5, 0.745, 0.20, 0.03), cold, 0.50)
    add(img, f * glow(0.5, 0.5, 0.8, 0.9), cold, 0.07)
    nod = 0.0
    k = int(S.P.get("nod_beat", -1))
    if k >= 0:
        s = S.since_beat(t, k)
        if 0 <= s <= 0.9:
            nod = math.sin(s / 0.9 * math.pi) * 0.018
    shp = shapes.man_front("stand")
    if nod:
        kind, bbox = shp[0]
        shp[0] = (kind, (bbox[0], bbox[1] + nod, bbox[2], bbox[3] + nod))
    msk = mask_from([(shp, 0.5 * SW, 0.745 * SH - 0.47 * SH, 0.47 * SH, False)])
    return silhouette(img, msk, rim=cold, rim_k=0.6, halo_k=0.25, light=0.4 + 1.5 * beam)


def sc_faceoff(S, t):
    m = S.mt(t)
    cold = C(0.72, 0.85, 1.0)
    dim = 1.0
    k = int(S.P.get("dim_beat", -1))
    if k >= 0:
        s = S.since_beat(t, k)
        if s >= 0:
            dim = 1.0 - 0.45 * smooth(s / 1.2)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.006, 0.008, 0.012)
    g = glow(0.5, 0.36, 0.20, 0.45)
    add(img, g, cold, 0.75 * dim)
    add(img, glow(0.5, 0.40, 0.55, 0.7), cold, 0.12 * dim)
    f = fog(m, drift=(1.5, 0.4), seed=5)
    add(img, f * (0.2 + g), cold, 0.12 * dim)
    unit = 0.20 * SH
    msk = mask_from([(shapes.profile(), 0.17 * SW, 0.27 * SH, unit, False),
                     (shapes.profile(tilt_deg=3), 0.83 * SW, 0.27 * SH, unit, True)])
    out = silhouette(img, msk, rim=cold, rim_k=0.9 * dim, halo_k=0.35, light=0.3 + 1.5 * g)
    # a cold glint in the calm man's eye
    ex, ey = 0.17 * SW + 0.30 * unit, 0.27 * SH + 0.44 * unit
    add(out, np.exp(-(((XX - ex) ** 2 + (YY - ey) ** 2) / 2.2)), cold, 0.9 * dim)
    return out


def sc_walk_away(S, t):
    m = S.mt(t)
    cold = C(0.62, 0.78, 1.0)
    dur = S.info["dur"]
    if "bokeh" not in S.cache:
        hor = 0.56
        layer = np.zeros((SH, SW, 3), np.float32)
        refl = np.zeros((SH, SW, 3), np.float32)
        for i in range(46):
            x = S.rng.uniform(-0.05, 1.05)
            y = S.rng.uniform(0.18, hor - 0.01)
            r = S.rng.uniform(0.012, 0.05) * (0.6 + (y - 0.18) * 1.5)
            col = cold * S.rng.uniform(0.5, 1.0) if S.rng.random() < 0.78 else C(1.0, 0.72, 0.42) * 0.7
            d = np.sqrt((XX - x * SW) ** 2 + (YY - y * SH) ** 2)
            disc = np.clip((r * SW - d) / 2.0, 0, 1) * S.rng.uniform(0.10, 0.32)
            layer += disc[..., None] * col
            ry = (2 * hor - y)
            streak = np.exp(-(((XX - x * SW) / (r * SW * 0.7)) ** 2 + ((YY - ry * SH) / (0.09 * SH)) ** 2))
            refl += (streak * 0.08 * (YY > hor * SH))[..., None] * col
        layer = gaussian_filter(layer, (2.2, 2.2, 0))
        S.cache["bokeh"] = (layer, refl)
    layer, refl = S.cache["bokeh"]
    img = np.zeros((SH, SW, 3), np.float32) + C(0.006, 0.009, 0.015)
    img += layer * (0.95 + 0.05 * math.sin(m * 2))
    img += refl
    add(img, glow(0.5, 0.56, 0.6, 0.10), cold, 0.10)
    street = np.clip((YY / SH - 0.56) * 5, 0, 1)
    add(img, street * np.exp(-((XX / SW - 0.5) / 0.30) ** 2), cold, 0.10)
    f = fog(m, drift=(2.5, 0.3), seed=6)
    add(img, f * 0.5, cold, 0.06)
    p = smooth(t / max(dur, 0.1) * 0.9 + 0.05)
    h = (0.52 - 0.30 * p) * SH
    feet = (1.00 - 0.27 * p) * SH
    msk = mask_from([man(0.5 * SW, feet, h, pose="walk", phase=m * 2 * math.pi * 0.9)])
    return silhouette(img, msk, rim=cold, rim_k=0.55, halo_k=0.25, light=0.5 + glow(0.5, 0.5, 0.5, 0.5))


def sc_alone(S, t):
    m = S.mt(t)
    cold = C(0.66, 0.78, 0.95)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.006, 0.007, 0.010)
    fl = flicker(S, m, 0.10, 4)
    beam = cone(0.45, -0.05, 0.70, 0.03, 0.12)
    f = fog(m, drift=(1.5, 0.3), seed=7)
    add(img, beam * (0.4 + 0.8 * f), cold, 0.38 * fl)
    add(img, glow(0.45, 0.70, 0.12, 0.02), cold, 0.45 * fl)
    add(img, glow(0.5, 0.5, 0.9, 0.9), cold, 0.035)
    msk = mask_from([man(0.45 * SW, 0.70 * SH, 0.25 * SH, pose="head_down")])
    return silhouette(img, msk, rim=cold, rim_k=0.5, halo_k=0.2, light=0.3 + 2 * beam)


# ----------------------------------------------------------------- episode 2
def sc_door_close(S, t):
    m = S.mt(t)
    warm = C(1.0, 0.92, 0.80)
    dur = S.info["dur"]
    close_from = float(S.P.get("close_from", 0.35))
    p = smooth((t / max(dur, 0.1) - close_from) / (1 - close_from))
    frac = 1.0 - 0.94 * p
    x0, x1, y0, y1 = 0.36, 0.64, 0.25, 0.72
    img = np.zeros((SH, SW, 3), np.float32) + C(0.010, 0.010, 0.012)
    door = np.zeros((SH, SW), np.float32)
    xr = x0 + (x1 - x0) * frac
    door[int(y0 * SH):int(y1 * SH), int(x0 * SW):max(int(xr * SW), int(x0 * SW) + 1)] = 1.0
    # spill of light on the floor, widening towards the camera
    yy = YY / SH
    fwd = np.clip((yy - y1) / (1 - y1), 0, 1)
    left = x0 - fwd * 0.30
    right = xr + fwd * (0.30 + (xr - x0) * 1.2)
    spill = ((XX / SW > left) & (XX / SW < right) & (yy > y1)).astype(np.float32) * (1 - fwd * 0.85)
    spill = gaussian_filter(spill, 6)
    bloom = gaussian_filter(door, 20) * 1.4 + gaussian_filter(door, 60) * 1.6
    add(img, door, warm, 1.1)
    add(img, bloom, warm, 0.35 * (0.4 + 0.6 * frac))
    add(img, spill, warm, 0.25 * frac)
    f = fog(m, drift=(2, 0.4), seed=8)
    add(img, f * bloom, warm, 0.2)
    msk = mask_from([man(0.5 * SW, 0.80 * SH, 0.44 * SH)])
    return silhouette(img, msk, rim=warm, rim_k=0.7 * (0.3 + frac), halo_k=0.3, light=0.3 + bloom)


_BUBBLE_FONT = None


def _phone_layer(msgs, delivered=True, w=0.60, tilt=-5.0):
    """RGBA phone image (scene px) with sent message bubbles and no reply."""
    global _BUBBLE_FONT
    if _BUBBLE_FONT is None:
        _BUBBLE_FONT = ImageFont.truetype(str(FONTS / "Montserrat-ExtraBold.ttf"), 30)
    pw = int(w * SW * SS)
    ph = int(pw * 2.05)
    im = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([20, 20, 20 + pw, 20 + ph], radius=int(pw * 0.13), fill=(8, 8, 10, 255),
                        outline=(70, 70, 78, 255), width=3)
    sx0, sy0, sx1, sy1 = 20 + 16, 20 + 16, 20 + pw - 16, 20 + ph - 16
    d.rounded_rectangle([sx0, sy0, sx1, sy1], radius=int(pw * 0.11), fill=(52, 52, 58, 255))
    d.rectangle([sx0, sy0 + 40, sx1, sy0 + 120], fill=(68, 68, 75, 255))
    d.ellipse([sx0 + 24, sy0 + 55, sx0 + 74, sy0 + 105], fill=(110, 110, 118, 255))
    y = sy0 + 170
    f = _BUBBLE_FONT
    for msg in msgs:
        tw = d.textlength(msg, font=f)
        bx1 = sx1 - 22
        bx0 = bx1 - tw - 44
        d.rounded_rectangle([bx0, y, bx1, y + 64], radius=30, fill=(70, 130, 235, 255))
        d.text((bx0 + 22, y + 14), msg, font=f, fill=(245, 245, 250, 255))
        y += 86
    if msgs and delivered:
        small = f.font_variant(size=20)
        d.text((sx1 - 22 - d.textlength("Delivered", font=small), y - 12), "Delivered", font=small,
               fill=(120, 120, 128, 255))
    im = im.rotate(tilt, resample=Image.BICUBIC, expand=True)
    w2, h2 = im.size
    im = im.resize((w2 // SS, h2 // SS), Image.LANCZOS)
    return np.asarray(im, np.float32) / 255.0


def _paste(img, rgba, cx, cy):
    h, w = rgba.shape[:2]
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    xa, ya = max(x0, 0), max(y0, 0)
    xb, yb = min(x0 + w, SW), min(y0 + h, SH)
    if xb <= xa or yb <= ya:
        return img
    sub = rgba[ya - y0:yb - y0, xa - x0:xb - x0]
    a = sub[..., 3:4]
    img[ya:yb, xa:xb] = img[ya:yb, xa:xb] * (1 - a) + sub[..., :3] * a
    return img


def sc_phone(S, t):
    m = S.mt(t)
    msgs_all = S.P.get("messages", ["why?"])
    n = min(S.beat_index(t) + 1, len(msgs_all))
    variants = S.P.get("variants", ["phone_close"])
    every = float(S.P.get("cut_every", 0.0)) or 1e9
    v = variants[int(t / every) % len(variants)]
    screen = C(0.95, 0.92, 0.88)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.012, 0.008, 0.008)
    if v == "phone_close":
        key = ("phone", n)
        if key not in S.cache:
            S.cache[key] = _phone_layer(msgs_all[:n])
        layer = S.cache[key]
        cx, cy = 0.5 * SW + math.sin(m * 1.7) * 3, 0.66 * SH + math.sin(m * 1.1) * 4
        add(img, glow(0.5, 0.66, 0.60, 0.50), screen, 0.30)
        f = fog(m, drift=(2, 0.5), seed=9)
        add(img, f * glow(0.5, 0.6, 0.7, 0.7), screen, 0.08)
        img = _paste(img, layer, cx, cy)
        # thumbs/hands at the bottom corners
        msk = mask_from([([("ell", (-0.5, -0.3, 0.5, 0.3))], cx - 0.30 * SW, cy + 0.42 * SH, 0.30 * SW, False),
                         ([("ell", (-0.5, -0.3, 0.5, 0.3))], cx + 0.31 * SW, cy + 0.44 * SH, 0.30 * SW, False)])
        return silhouette(img, msk, rim=screen, rim_k=0.35, halo_k=0.1)
    # hunched over the phone, lit from below by the screen
    g = glow(0.78, 0.64, 0.16, 0.12)
    add(img, g, screen, 0.9)
    add(img, glow(0.70, 0.55, 0.55, 0.5), screen, 0.12)
    f = fog(m, drift=(3, 0.6), seed=10)
    add(img, f * glow(0.6, 0.5, 0.6, 0.6), screen, 0.08)
    msk = mask_from([(shapes.profile(tilt_deg=20), 0.40 * SW, 0.27 * SH, 0.26 * SH, False)])
    return silhouette(img, msk, rim=screen, rim_k=1.0, halo_k=0.3, light=0.2 + 3 * glow(0.72, 0.6, 0.3, 0.3))


def sc_shrink(S, t):
    m = S.mt(t)
    warm = C(1.0, 0.45, 0.25)
    dur = S.info["dur"]
    p = smooth(t / max(dur, 0.1))
    img = np.zeros((SH, SW, 3), np.float32) + C(0.012, 0.004, 0.003)
    h = (0.95 - 0.68 * p) * SH
    feet = (1.18 - 0.48 * p) * SH
    bw = 0.30 - 0.16 * p
    beam = cone(0.5, -0.05, feet / SH, 0.05, bw)
    f = fog(m, drift=(4, 1), seed=11)
    add(img, beam * (0.6 + 0.8 * f), warm, 0.75)
    add(img, glow(0.5, 0.45, 0.5, 0.6), warm, 0.12 + 0.10 * p)
    add(img, glow(0.5, min(feet / SH, 0.98), bw * 0.8, 0.03), warm, 0.7)
    msk = mask_from([man(0.5 * SW, feet, h, pose="head_down")])
    return silhouette(img, msk, rim=warm, rim_k=0.9, halo_k=0.35, light=0.5 + 2 * beam)


def _phone_back():
    """Back of a phone lying face down, seen from above at an angle (RGBA, scene px)."""
    pw, ph = 300, 620
    im = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=46, fill=(20, 21, 25, 255), outline=(120, 125, 140, 255),
                        width=4)
    d.rounded_rectangle([24, 24, 140, 140], radius=30, fill=(30, 31, 36, 255), outline=(90, 94, 105, 255), width=3)
    for cx, cy in ((56, 56), (108, 56), (56, 108)):
        d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=(8, 8, 10, 255), outline=(110, 115, 128, 255), width=3)
    d.ellipse([100, 98, 116, 114], fill=(150, 150, 140, 255))
    # perspective: far edge (top) narrower
    W2, H2 = 420, 420
    src = [(0, 0), (pw, 0), (pw, ph), (0, ph)]
    dst = [(95, 30), (325, 30), (390, 400), (30, 400)]
    import numpy as _np
    A = []
    B = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([u, v, 1, 0, 0, 0, -x * u, -x * v]); B.append(x)
        A.append([0, 0, 0, u, v, 1, -y * u, -y * v]); B.append(y)
    coef = _np.linalg.solve(_np.array(A, float), _np.array(B, float))
    out = im.transform((W2, H2), Image.PERSPECTIVE, tuple(coef), resample=Image.BICUBIC)
    return np.asarray(out, np.float32) / 255.0


def sc_phone_down(S, t):
    m = S.mt(t)
    cold = C(0.65, 0.78, 1.0)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.006, 0.007, 0.010)
    table = np.clip((YY / SH - 0.40) * 8, 0, 1)
    if "grain" not in S.cache:
        wood = NOISE.sample(SW // 4, SH // 4, 13, 7, 0.9)
        wood = upsample(np.repeat(wood[:, ::6], 6, axis=1)[:, :SW // 4])
        S.cache["grain"] = wood
    wood = S.cache["grain"]
    lamp = glow(0.5, 0.45, 0.45, 0.30)
    add(img, table * (0.5 + 0.5 * wood) * glow(0.5, 0.40, 0.9, 0.9), cold, 0.12)
    add(img, table * lamp, cold, 0.22)
    if "phone_back" not in S.cache:
        S.cache["phone_back"] = _phone_back()
    layer = S.cache["phone_back"]
    # soft contact shadow, then the phone
    sh = gaussian_filter((np.abs(XX / SW - 0.5) < 0.19) * (np.abs(YY / SH - 0.63) < 0.11) * 1.0, 10)
    img *= (1 - 0.7 * sh)[..., None]
    img = _paste(img, layer, 0.5 * SW, 0.62 * SH)
    # slow specular sheen sliding across the back of the phone
    sx = 0.25 + 0.5 * ((m * 0.12) % 1.0)
    pm = np.zeros((SH, SW), np.float32)
    h, w = layer.shape[:2]
    y0, x0 = int(0.62 * SH - h / 2), int(0.5 * SW - w / 2)
    pm[y0:y0 + h, x0:x0 + w] = layer[..., 3]
    sheen = np.exp(-(((XX / SW - sx) - (YY / SH - 0.62) * 0.4) / 0.05) ** 2) * pm
    add(img, sheen, cold, 0.12)
    add(img, fog(m, drift=(1, 0.2), seed=12) * 0.4, cold, 0.04)
    return img


def sc_wondering(S, t):
    m = S.mt(t)
    cold = C(0.62, 0.76, 1.0)
    img = np.zeros((SH, SW, 3), np.float32) + C(0.005, 0.007, 0.011)
    # a tall window of cold light behind
    win = np.zeros((SH, SW), np.float32)
    win[int(0.12 * SH):int(0.56 * SH), int(0.62 * SW):int(0.86 * SW)] = 1
    win[:, int(0.735 * SW):int(0.75 * SW)] = 0
    win[int(0.33 * SH):int(0.34 * SH), :] = 0
    win = gaussian_filter(win, 3)
    add(img, win, cold, 0.20)
    add(img, gaussian_filter(win, 25), cold, 0.25)
    g = glow(0.72, 0.66, 0.14, 0.10)
    add(img, g, cold, 0.8 * (1 + 0.03 * math.sin(m * 5)))
    f = fog(m, drift=(1.2, 0.3), seed=13)
    add(img, f * 0.5, cold, 0.05)
    msk = mask_from([(shapes.profile(tilt_deg=14), 0.36 * SW, 0.30 * SH, 0.25 * SH, False)])
    return silhouette(img, msk, rim=cold, rim_k=0.9, halo_k=0.25, light=0.2 + 3 * glow(0.66, 0.6, 0.35, 0.3) + win)


SCENES = {
    "black": sc_black,
    "two_men": sc_two_men,
    "room_crowd": sc_room_crowd,
    "room_watch": sc_room_watch,
    "man1_fire": sc_man1_fire,
    "man1_cuts": sc_man1_cuts,
    "man2_pause": sc_man2_pause,
    "faceoff": sc_faceoff,
    "walk_away": sc_walk_away,
    "alone": sc_alone,
    "door_close": sc_door_close,
    "phone": sc_phone,
    "shrink": sc_shrink,
    "phone_down": sc_phone_down,
    "wondering": sc_wondering,
}
