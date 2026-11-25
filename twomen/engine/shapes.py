"""Silhouette shapes: men (front, profile, from behind), limbs, phones.

All shapes are drawn as polygons/ellipses into an 'L' mask with Pillow at 2x the
scene resolution and box-downsampled, which gives clean anti-aliased edges.
"""
import math

from PIL import Image, ImageDraw

from .common import SW, SH, SS


def _limb(p0, p1, w0, w1):
    """Quad polygon for a limb from p0 to p1 with widths w0 -> w1."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / n, dx / n
    return [(x0 + nx * w0 / 2, y0 + ny * w0 / 2), (x1 + nx * w1 / 2, y1 + ny * w1 / 2),
            (x1 - nx * w1 / 2, y1 - ny * w1 / 2), (x0 - nx * w0 / 2, y0 - ny * w0 / 2)]


def _ell(cx, cy, rx, ry):
    return ("ell", (cx - rx, cy - ry, cx + rx, cy + ry))


def _arm(shoulder, elbow, hand, side=1, finger=False):
    out = [("poly", _limb(shoulder, elbow, 0.050, 0.042)),
           ("poly", _limb(elbow, hand, 0.042, 0.032)),
           _ell(*elbow, 0.021, 0.021), _ell(*shoulder, 0.026, 0.026),
           _ell(hand[0], hand[1], 0.022, 0.026)]
    if finger:
        dx, dy = hand[0] - elbow[0], hand[1] - elbow[1]
        n = math.hypot(dx, dy) or 1.0
        tip = (hand[0] + dx / n * 0.06, hand[1] + dy / n * 0.06)
        out.append(("poly", _limb(hand, tip, 0.014, 0.010)))
    return out


def man_front(pose="stand", t=0.0, phase=0.0):
    """Standing man seen from the front or back. Units: height = 1, feet at y = 1,
    x = 0 is the body centre. Returns list of ('poly', pts) / ('ell', bbox)."""
    s = []
    head_dx, head_dy = 0.0, 0.0
    if pose == "head_down":
        head_dy = 0.012
    s.append(_ell(head_dx, 0.071 + head_dy, 0.046, 0.062))
    s.append(("poly", [(-0.025, 0.115), (0.025, 0.115), (0.033, 0.160), (-0.033, 0.160)]))
    torso = [(-0.032, 0.150), (0.032, 0.150), (0.105, 0.170), (0.135, 0.188), (0.148, 0.215),
             (0.140, 0.30), (0.124, 0.42), (0.128, 0.50), (0.132, 0.585), (-0.132, 0.585),
             (-0.128, 0.50), (-0.124, 0.42), (-0.140, 0.30), (-0.148, 0.215), (-0.135, 0.188),
             (-0.105, 0.170)]
    s.append(("poly", torso))
    swing = math.sin(phase) if pose == "walk" else 0.0
    for side in (-1, 1):
        k = swing * side
        lift = max(0.0, k) * 0.020 if pose == "walk" else 0.0
        ax = side * (0.056 + 0.010 * k)
        ay = 0.972 - lift
        s.append(("poly", [(side * 0.122, 0.57), (side * 0.006, 0.57), (side * 0.024, 0.78),
                           (ax - side * 0.020, ay), (ax + side * 0.022, ay), (side * 0.098, 0.78)]))
        s.append(_ell(ax, ay + 0.012, 0.030, 0.014))
    # arms
    sh = {-1: (-0.128, 0.205), 1: (0.128, 0.205)}
    if pose in ("stand", "head_down", "walk"):
        for side in (-1, 1):
            sw = math.sin(phase) * side * 0.012 if pose == "walk" else 0.0
            s += _arm(sh[side], (side * 0.146 + sw, 0.360), (side * 0.134 + sw * 1.5, 0.515))
    elif pose == "point":
        # left arm hangs, right arm points out to the side (jabbing with t)
        s += _arm(sh[-1], (-0.146, 0.360), (-0.134, 0.515))
        ang = math.radians(-12 + 6 * math.sin(t * 9.0))
        e = (0.128 + 0.17 * math.cos(ang), 0.19 + 0.17 * math.sin(ang))
        h = (e[0] + 0.15 * math.cos(ang), e[1] + 0.15 * math.sin(ang))
        s += _arm(sh[1], e, h, finger=True)
    elif pose == "gesture":
        # both forearms up, hands moving as if shouting / explaining
        for side in (-1, 1):
            w = math.sin(t * 7.0 + (0 if side > 0 else 1.7))
            e = (side * 0.215, 0.345)
            h = (side * (0.205 + 0.03 * w), 0.205 - 0.04 * w)
            s += _arm(sh[side], e, h)
    return s


# Profile bust facing +x. Units: head height (crown to chin) ~ 1.
_PROFILE_CLOSED = [
    (0.30, 6.0), (0.30, 1.75), (0.12, 1.22), (0.12, 1.07), (0.25, 1.02), (0.37, 0.96), (0.35, 0.89),
    (0.40, 0.84), (0.38, 0.80), (0.41, 0.765), (0.40, 0.71), (0.505, 0.645), (0.38, 0.50),
    (0.34, 0.46), (0.385, 0.38), (0.36, 0.22), (0.30, 0.11), (0.16, 0.025), (0.02, 0.0),
    (-0.18, 0.04), (-0.34, 0.16), (-0.42, 0.36), (-0.43, 0.58), (-0.38, 0.76),
    (-0.30, 0.92), (-0.30, 1.22), (-0.60, 1.40), (-0.95, 1.62), (-1.22, 2.1), (-1.30, 6.0),
]
_PROFILE_OPEN = [
    (0.30, 6.0), (0.30, 1.75), (0.12, 1.24), (0.12, 1.12), (0.25, 1.08), (0.36, 1.03), (0.35, 0.96),
    (0.39, 0.92), (0.37, 0.88), (0.30, 0.84), (0.27, 0.80), (0.41, 0.765), (0.40, 0.71),
    (0.505, 0.645), (0.38, 0.50), (0.34, 0.46), (0.385, 0.38), (0.36, 0.22), (0.30, 0.11),
    (0.16, 0.025), (0.02, 0.0), (-0.18, 0.04), (-0.34, 0.16), (-0.42, 0.36), (-0.43, 0.58),
    (-0.38, 0.76), (-0.30, 0.94), (-0.30, 1.22), (-0.60, 1.40), (-0.95, 1.62), (-1.22, 2.1), (-1.30, 6.0),
]


def profile(mouth_open=False, tilt_deg=0.0):
    pts = _PROFILE_OPEN if mouth_open else _PROFILE_CLOSED
    if tilt_deg:
        a = math.radians(tilt_deg)
        c, s_ = math.cos(a), math.sin(a)
        piv = (0.0, 1.15)
        out = []
        for x, y in pts:
            if y < 1.3:  # rotate the head only
                dx, dy = x - piv[0], y - piv[1]
                out.append((piv[0] + dx * c - dy * s_, piv[1] + dx * s_ + dy * c))
            else:
                out.append((x, y))
        pts = out
    return [("poly", pts), _ell(-0.02, 0.62, 0.05, 0.08)]


def head_back():
    """Head and shoulders seen from behind. Unit = head width; top of head y=0."""
    return [_ell(0.0, 0.62, 0.50, 0.62), _ell(-0.49, 0.66, 0.05, 0.11), _ell(0.49, 0.66, 0.05, 0.11),
            ("poly", [(-0.25, 1.0), (0.25, 1.0), (0.30, 1.15), (-0.30, 1.15)]),
            ("poly", [(-1.40, 7.0), (-1.30, 1.50), (-0.95, 1.15), (-0.30, 1.02), (0.30, 1.02),
                      (0.95, 1.15), (1.30, 1.50), (1.40, 7.0)])]


def pointing_arm():
    """A big arm + pointing hand entering from the right edge. Unit = frame width."""
    s = [("poly", _limb((1.25, 0.70), (0.62, 0.50), 0.20, 0.13)),
         _ell(0.60, 0.495, 0.085, 0.07),
         ("poly", _limb((0.56, 0.48), (0.30, 0.43), 0.045, 0.034)),  # index finger
         _ell(0.30, 0.43, 0.018, 0.017),
         _ell(0.57, 0.535, 0.06, 0.035)]  # curled fingers
    return s


def rasterize(shapes, x, y, scale, flip=False, canvas=None):
    """Draw shapes (in local units) into an 'L' mask at SS x scene res.
    x, y: anchor in scene px; scale: px per unit (scene px)."""
    if canvas is None:
        canvas = Image.new("L", (SW * SS, SH * SS), 0)
    d = ImageDraw.Draw(canvas)
    k = scale * SS
    fx = -1 if flip else 1
    for kind, data in shapes:
        if kind == "poly":
            pts = [((x + fx * px * scale) * SS, (y + py * scale) * SS) for px, py in data]
            d.polygon(pts, fill=255)
        else:
            x0, y0, x1, y1 = data
            if flip:
                x0, x1 = -x1, -x0
            d.ellipse([(x * SS + x0 * k), (y * SS + y0 * k), (x * SS + x1 * k), (y * SS + y1 * k)], fill=255)
    return canvas
