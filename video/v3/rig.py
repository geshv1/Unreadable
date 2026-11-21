"""Stickman rig v2: side view, IK knees and elbows, planted feet, smooth cycles.

A pose is a small dict in body units (1 unit = 1 px at scale 1), facing right:
  hy      hip height above the ground (standing ~ 91)
  hx      hip shift along the ground
  torso   lean in degrees from vertical (+ forward)
  head    extra head tilt in degrees (+ forward / down)
  fL, fR  foot (x offset from the body x, lift above ground)
  hL, hR  hand target relative to the neck (x forward, y down)
L is the far side (drawn dimmer), R the near side.
"""
import math

from render import src, lerp, eio, prog, clamp  # noqa: F401

LIM = dict(torso=70, neck=8, head=20, uarm=40, farm=38, thigh=48, shin=46)


def P(**kw):
    base = dict(hx=0.0, hy=91.0, torso=3.0, head=0.0, fL=(-7.0, 0.0), fR=(7.0, 0.0), hL=(-4.0, 72.0), hR=(6.0, 72.0))
    base.update(kw)
    return base


POSE = {
    "stand":   P(),
    "guard":   P(hy=84, torso=9, head=6, fL=(-20, 0), fR=(22, 0), hL=(26, -6), hR=(18, 4)),
    "jab":     P(hy=84, torso=14, head=6, fL=(-22, 0), fR=(26, 0), hL=(76, -4), hR=(16, 2)),
    "cross":   P(hx=6, hy=83, torso=20, head=8, fL=(-24, 0), fR=(24, 0), hL=(24, -4), hR=(80, -2)),
    "windup":  P(hx=-4, hy=82, torso=2, head=4, fL=(-22, 0), fR=(22, 0), hL=(24, -6), hR=(-6, 8)),
    "brace":   P(hy=72, torso=12, head=4, fL=(-34, 0), fR=(30, 0), hL=(24, -2), hR=(18, 8)),
    "chest":   P(hy=90, torso=-4, head=-6, fL=(-16, 0), fR=(16, 0), hL=(-16, 62), hR=(-10, 64)),
    "head":    P(hy=86, torso=16, head=22, fL=(-12, 0), fR=(10, 0), hL=(4, -34), hR=(14, -30)),
    "look":    P(hy=89, torso=8, head=26, fL=(-9, 0), fR=(9, 0), hL=(30, 26), hR=(36, 30)),
    "cower":   P(hy=74, torso=26, head=24, fL=(-20, 0), fR=(14, 0), hL=(20, -14), hR=(26, -4)),
    "skid":    P(hx=-8, hy=78, torso=-20, head=-10, fL=(-22, 0), fR=(40, 0), hL=(-44, 20), hR=(-30, 6)),
    "sit":     P(hy=22, torso=-12, head=-4, fL=(52, 0), fR=(60, 0), hL=(-34, 66), hR=(-24, 68)),
    "lie":     P(hy=8, torso=-84, head=-4, fL=(88, 0), fR=(92, 0), hL=(-10, 30), hR=(12, 36)),
    "kneel":   P(hy=48, torso=6, head=4, fL=(-44, 0), fR=(26, 0), hL=(30, 50), hR=(38, 46)),
    "victory": P(hy=92, torso=-3, head=-12, fL=(-12, 0), fR=(12, 0), hL=(-26, -70), hR=(26, -72)),
    "point":   P(hy=91, torso=0, head=-14, fL=(-8, 0), fR=(9, 0), hL=(-6, 70), hR=(30, -74)),
    "flex":    P(hy=88, torso=-2, head=-4, fL=(-16, 0), fR=(16, 0), hL=(-40, -26), hR=(40, -26)),
    "temple":  P(hy=90, torso=2, head=8, fL=(-8, 0), fR=(9, 0), hL=(-4, 70), hR=(12, -30)),
    "fold":    P(hy=91, torso=0, head=-4, fL=(-8, 0), fR=(9, 0), hL=(22, 26), hR=(26, 22)),
}


def mix(a, b, u):
    out = {}
    for k, v in a.items():
        w = b[k]
        out[k] = (lerp(v[0], w[0], u), lerp(v[1], w[1], u)) if isinstance(v, tuple) else lerp(v, w, u)
    return out


def anim(t, keys, lag=0.0):
    """keys: [(time, pose name or dict), ...]; eased blend. Hands follow `lag` s later."""
    def at(tt):
        def g(x):
            return POSE[x] if isinstance(x, str) else x
        if tt <= keys[0][0]:
            return dict(g(keys[0][1]))
        for (t0, a), (t1, b) in zip(keys, keys[1:]):
            if tt < t1:
                return mix(g(a), g(b), eio(prog(tt, t0, t1)))
        return dict(g(keys[-1][1]))
    p = at(t)
    if lag:
        q = at(t - lag)
        p["hL"], p["hR"] = q["hL"], q["hR"]
    return p


def breathe(p, t, amt=1.0):
    p = dict(p)
    b = math.sin(t * 2.4)
    p["torso"] += 1.2 * b * amt
    p["hy"] += 0.7 * math.sin(t * 2.4 + 1.0) * amt
    p["hL"] = (p["hL"][0], p["hL"][1] + 1.5 * b * amt)
    p["hR"] = (p["hR"][0], p["hR"][1] + 1.5 * b * amt)
    return p


def bounce(p, t, amt=1.0, f=2.6):
    """Boxer's bounce: hips bob, feet alternate light lifts, hands drift."""
    p = dict(p)
    s = math.sin(t * f * math.pi)
    p["hy"] += (2.5 * abs(s) - 1.5) * amt
    p["fL"] = (p["fL"][0], p["fL"][1] + 3 * max(0, s) * amt)
    p["fR"] = (p["fR"][0], p["fR"][1] + 3 * max(0, -s) * amt)
    p["hL"] = (p["hL"][0] + 2 * s * amt, p["hL"][1] + 2 * abs(s) * amt)
    p["hR"] = (p["hR"][0] - 2 * s * amt, p["hR"][1] + 2 * abs(s) * amt)
    return p


def walk(dist, s=1.0, base=None, A=20, lift=11, swing=16):
    ph = math.pi * dist / (2 * A * s)
    p = dict(base or POSE["stand"])
    p["fR"] = (A * math.sin(ph), lift * max(0.0, math.cos(ph)))
    p["fL"] = (A * math.sin(ph + math.pi), lift * max(0.0, math.cos(ph + math.pi)))
    p["hy"] = 91 - 3 * abs(math.sin(ph))
    p["torso"] = 5 + 1.5 * math.sin(2 * ph)
    p["hR"] = (6 - swing * math.sin(ph), 70)
    p["hL"] = (-2 + swing * math.sin(ph), 70)
    p["head"] = 2
    return p


def run(dist, s=1.0, A=34, lift=30):
    ph = math.pi * dist / (2 * A * s)
    p = dict(POSE["stand"])
    p["fR"] = (A * math.sin(ph), lift * max(0.0, math.cos(ph)))
    p["fL"] = (A * math.sin(ph + math.pi), lift * max(0.0, math.cos(ph + math.pi)))
    p["hy"] = 84 + 5 * abs(math.cos(ph))
    p["torso"] = 16
    p["head"] = -6
    p["hR"] = (10 - 30 * math.sin(ph), 34 - 10 * math.cos(ph))
    p["hL"] = (10 + 30 * math.sin(ph), 34 + 10 * math.cos(ph))
    return p


def two_bone(S, T, l1, l2, bend):
    dx, dy = T[0] - S[0], T[1] - S[1]
    d = max(1e-3, min(math.hypot(dx, dy), l1 + l2 - 1e-3))
    a = math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1))
    base = math.atan2(dy, dx)
    e = (S[0] + l1 * math.cos(base + bend * a), S[1] + l1 * math.sin(base + bend * a))
    n = math.hypot(dx, dy) or 1
    end = (S[0] + dx / n * min(n, l1 + l2), S[1] + dy / n * min(n, l1 + l2))
    return e, end


def joints(p, x, ground, s=1.0, facing=1, hands=None, feet=None):
    f = facing
    hip = (x + f * p["hx"] * s, ground - p["hy"] * s)
    ta = math.radians(p["torso"])
    neck = (hip[0] + f * math.sin(ta) * LIM["torso"] * s, hip[1] - math.cos(ta) * LIM["torso"] * s)
    ha = math.radians(p["torso"] + p["head"])
    hd = (LIM["neck"] + LIM["head"]) * s
    head = (neck[0] + f * math.sin(ha) * hd, neck[1] - math.cos(ha) * hd)
    J = {"hip": hip, "neck": neck, "head": head}
    for side in "LR":
        ft = feet[side] if feet and side in feet else (x + f * p["f" + side][0] * s, ground - p["f" + side][1] * s)
        J["knee" + side], J["foot" + side] = two_bone(hip, ft, LIM["thigh"] * s, LIM["shin"] * s, -f)
        hdx, hdy = p["h" + side]
        ht = hands[side] if hands and side in hands else (neck[0] + f * hdx * s, neck[1] + hdy * s)
        J["elbow" + side], J["hand" + side] = two_bone(neck, ht, LIM["uarm"] * s, LIM["farm"] * s, f)
    return J


def draw(ctx, p, x, ground, s=1.0, col=(0.91, 0.89, 0.85), a=1.0, lw=5, facing=1, hands=None, feet=None,
         rot=0.0, far=0.55):
    """Draw the rig. `rot` (radians) spins the whole body around the hip (tumbles)."""
    if a <= 0:
        return None
    import cairo
    J = joints(p, x, ground, s, facing, hands, feet)
    ctx.save()
    if rot:
        hx, hy = J["hip"]
        ctx.translate(hx, hy)
        ctx.rotate(rot)
        ctx.translate(-hx, -hy)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_width(lw)
    for side, alpha in (("L", a * far), ("R", a)):
        ctx.move_to(*J["neck"])
        ctx.line_to(*J["elbow" + side])
        ctx.line_to(*J["hand" + side])
        ctx.move_to(*J["hip"])
        ctx.line_to(*J["knee" + side])
        ctx.line_to(*J["foot" + side])
        src(ctx, col, alpha)
        ctx.stroke()
        if side == "L":
            ctx.move_to(*J["hip"])
            ctx.line_to(*J["neck"])
            src(ctx, col, a)
            ctx.stroke()
    ctx.new_sub_path()
    ctx.arc(J["head"][0], J["head"][1], LIM["head"] * s, 0, 2 * math.pi)
    src(ctx, col, a)
    ctx.fill()
    ctx.restore()
    return J
