"""Illustrated line figure (profile view) built on rig.py joints.

Each body part is a solid shape: outlined in white and filled black, drawn back
to front, so nearer parts cleanly cover farther ones (line-art illustration look).
Outfits: "suit" (jacket, lapels, buttons, optional tie), "tee" (t-shirt + shorts).
"""
import math

import cairo

import rig
from render import lerp, clamp

BLACK = (0.0, 0.0, 0.0)
WHITE = (0.95, 0.95, 0.95)


def _src(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def smooth(ctx, pts, closed=True):
    n = len(pts)
    if n < 3:
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        return
    rng = range(n) if closed else range(n - 1)
    ctx.move_to(*pts[0])
    for i in rng:
        p0 = pts[(i - 1) % n] if closed or i > 0 else pts[0]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed or i + 2 < n else pts[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        ctx.curve_to(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed:
        ctx.close_path()


def capsule(A, B, ra, rb=None):
    rb = ra if rb is None else rb

    def add(ctx):
        dx, dy = B[0] - A[0], B[1] - A[1]
        L = math.hypot(dx, dy) or 1e-3
        ang = math.atan2(dy, dx)
        ctx.new_sub_path()
        ctx.arc(B[0], B[1], rb, ang - math.pi / 2, ang + math.pi / 2)
        ctx.arc(A[0], A[1], ra, ang + math.pi / 2, ang + 3 * math.pi / 2)
        ctx.close_path()
    return add


def poly(pts, smooth_it=True):
    def add(ctx):
        ctx.new_sub_path()
        if smooth_it:
            smooth(ctx, pts)
        else:
            ctx.move_to(*pts[0])
            for p in pts[1:]:
                ctx.line_to(*p)
            ctx.close_path()
    return add


def solid(ctx, adders, col=WHITE, a=1.0, lw=3.0, fill=BLACK):
    """Union outline of several shapes: stroke them all wide, then fill them all."""
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for add in adders:
        ctx.new_path()
        add(ctx)
        ctx.set_line_width(2 * lw)
        _src(ctx, col, a)
        ctx.stroke()
    for add in adders:
        ctx.new_path()
        add(ctx)
        _src(ctx, fill, 1.0)
        ctx.fill()


def seg(ctx, pts, col=WHITE, a=1.0, lw=2.0):
    ctx.new_path()
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    _src(ctx, col, a)
    ctx.stroke()


HEAD = [(-0.30, 0.80), (-0.64, 0.44), (-0.80, 0.0), (-0.72, -0.46), (-0.40, -0.82), (0.05, -0.94), (0.46, -0.78),
        (0.68, -0.46), (0.74, -0.18), (0.80, -0.02), (0.99, 0.20), (0.80, 0.30), (0.83, 0.42), (0.77, 0.50),
        (0.72, 0.66), (0.42, 0.84), (0.05, 0.88)]
HAIR = [(-0.86, 0.30), (-0.95, -1.05), (0.80, -1.10), (0.58, -0.60), (0.18, -0.64), (-0.30, -0.48), (-0.56, -0.12),
        (-0.62, 0.26)]


def draw(ctx, p, x, ground, s=1.25, facing=1, outfit="suit", tie=False, tie_loose=0.0, col=WHITE, a=1.0,
         hands=None, feet=None, lw=2.2, far=0.55, jacket_buttoned=0.0, shake=0.0, t=0.0, sweat=0.0):
    f = facing
    J = rig.joints(p, x, ground, s, f, hands, feet)
    hip, neck = J["hip"], J["neck"]
    dx, dy = neck[0] - hip[0], neck[1] - hip[1]
    Lt = math.hypot(dx, dy) or 1
    d = (dx / Lt, dy / Lt)
    nf = (f * -d[1], f * d[0])          # front normal

    def P(u, off):
        return (hip[0] + d[0] * Lt * u + nf[0] * off * s, hip[1] + d[1] * Lt * u + nf[1] * off * s)

    sh = (neck[0] - d[0] * 9 * s - nf[0] * 1 * s, neck[1] - d[1] * 9 * s - nf[1] * 1 * s)
    arms = {}
    for side in "LR":
        hand = J["hand" + side]
        if not (hands and side in hands):
            hand = (hand[0] - d[0] * 9 * s, hand[1] - d[1] * 9 * s)
        if shake:
            hand = (hand[0] + shake * math.sin(t * 61 + (side == "L")), hand[1] + shake * math.cos(t * 53))
        e, h = rig.two_bone(sh, hand, rig.LIM["uarm"] * s, rig.LIM["farm"] * s, f)
        arms[side] = (e, h)
    farc = tuple(c * far + (1 - far) * 0.0 for c in col)
    farc = (col[0] * far, col[1] * far, col[2] * far)
    tee = outfit == "tee"

    def leg(side, c):
        k, fo = J["knee" + side], J["foot" + side]
        th_r = 11.5 if not tee else 12.5
        parts = [capsule(hip, k, th_r * s, 9 * s), capsule(k, fo, 8.5 * s if not tee else 7 * s, 6.5 * s)]
        shoe = [(-7, -9), (-8, 0), (21, 0), (22, -3), (14, -8), (3, -11)]
        parts.append(poly([(fo[0] + f * u * s, fo[1] + v * s) for u, v in shoe], smooth_it=False))
        solid(ctx, parts, c, a, lw)
        seg(ctx, [(fo[0] - f * 8 * s, fo[1]), (fo[0] + f * 18 * s, fo[1])], c, a, lw)
        if tee:
            # shorts hem above the knee
            m = (lerp(hip[0], k[0], 0.78), lerp(hip[1], k[1], 0.78))
            ang = math.atan2(k[1] - hip[1], k[0] - hip[0]) + math.pi / 2
            seg(ctx, [(m[0] - 11 * s * math.cos(ang), m[1] - 11 * s * math.sin(ang)),
                      (m[0] + 11 * s * math.cos(ang), m[1] + 11 * s * math.sin(ang))], c, a, lw * 0.8)

    def arm(side, c):
        e, h = arms[side]
        hd = (h[0] - e[0], h[1] - e[1])
        hl = math.hypot(*hd) or 1
        tip = (h[0] + hd[0] / hl * 9 * s, h[1] + hd[1] / hl * 9 * s)
        if tee:
            parts = [capsule(sh, e, 7 * s, 6 * s), capsule(e, h, 6 * s, 5 * s), capsule(h, tip, 5.5 * s, 4.5 * s)]
            solid(ctx, parts, c, a, lw)
            mid = (lerp(sh[0], e[0], 0.5), lerp(sh[1], e[1], 0.5))
            solid(ctx, [capsule(sh, mid, 10 * s, 9 * s)], c, a, lw)
        else:
            parts = [capsule(sh, e, 8.5 * s, 7.5 * s), capsule(e, h, 7.5 * s, 6.5 * s)]
            solid(ctx, parts, c, a, lw)
            solid(ctx, [capsule(h, tip, 5.5 * s, 4.5 * s)], c, a, lw)
            cu = (lerp(e[0], h[0], 0.86), lerp(e[1], h[1], 0.86))
            ang = math.atan2(h[1] - e[1], h[0] - e[0]) + math.pi / 2
            seg(ctx, [(cu[0] - 7 * s * math.cos(ang), cu[1] - 7 * s * math.sin(ang)),
                      (cu[0] + 7 * s * math.cos(ang), cu[1] + 7 * s * math.sin(ang))], c, a, lw * 0.8)

    # back to front
    leg("L", farc)
    arm("L", farc)
    hem = 0.0 if tee else -0.24
    prof = [(hem, 15, 18), (0.0, 14, 17), (0.35, 13, 15), (0.66, 18, 16), (0.9, 14, 15), (1.0, 8, 11)]
    back = [P(u, -b) for u, fr, b in prof]
    front = [P(u, fr) for u, fr, b in reversed(prof)]
    top = P(1.07, -1)
    torso_pts = back + [top] + front
    hd = math.radians(p["torso"] + p["head"])
    hdir = (f * math.sin(math.radians(p["torso"])), -math.cos(math.radians(p["torso"])))
    hc = (neck[0] + hdir[0] * 24 * s + f * math.sin(hd) * 2 * s, neck[1] + hdir[1] * 24 * s)
    neck_top = (hc[0] - hdir[0] * 8 * s, hc[1] - hdir[1] * 8 * s)
    solid(ctx, [poly(torso_pts), capsule(neck, neck_top, 6.5 * s)], col, a, lw)
    if tee:
        seg(ctx, [P(0.93, 4), P(0.86, 10), P(0.93, 15)], col, a, lw * 0.8)
    else:
        seg(ctx, [P(0.97, 9), P(0.55, 17.5)], col, a, lw * 0.85)
        seg(ctx, [P(0.97, 9), P(0.86, 3), P(0.62, 14)], col, a, lw * 0.75)
        for u in (0.36, 0.2):
            bx, by = P(u, 17.8)
            ctx.new_sub_path()
            ctx.arc(bx, by, 2.0 * s, 0, 2 * math.pi)
            _src(ctx, col, a)
            ctx.fill()
        seg(ctx, [P(-0.2, 15.5), P(0.05, 14.5)], col, a * 0.7, lw * 0.7)
        if tie:
            kn = 0.9 - 0.12 * tie_loose
            ang_off = 3 * tie_loose
            solid(ctx, [poly([P(kn + 0.02, 15), P(kn - 0.04, 18 + ang_off), P(0.38 - 0.04 * tie_loose, 21 + 2 * ang_off),
                              P(0.34 - 0.04 * tie_loose, 19 + ang_off), P(kn - 0.05, 15.5)], smooth_it=False)], col, a, lw * 0.6)
        if jacket_buttoned > 0:
            bx, by = P(0.36, 17.8)
            ctx.new_sub_path()
            ctx.arc(bx, by, 4.5 * s * jacket_buttoned, 0, 2 * math.pi)
            ctx.set_line_width(lw * 0.8)
            _src(ctx, col, a)
            ctx.stroke()
    leg("R", col)
    # head (profile) with hair and ear
    r = 16.5 * s
    tilt = f * math.radians(p["torso"] + p["head"])
    ct, st = math.cos(tilt), math.sin(tilt)

    def H(u, v):
        lx, ly = f * u * r, v * r
        return (hc[0] + lx * ct - ly * st, hc[1] + lx * st + ly * ct)
    head_pts = [H(u, v) for u, v in HEAD]
    solid(ctx, [poly(head_pts)], col, a, lw)
    ctx.save()
    ctx.new_path()
    smooth(ctx, head_pts)
    ctx.clip()
    ctx.new_path()
    smooth(ctx, [H(u, v) for u, v in HAIR])
    _src(ctx, col, a * 0.38)
    ctx.fill()
    ctx.restore()
    hl = [H(0.58, -0.6), H(0.18, -0.64), H(-0.3, -0.48), H(-0.56, -0.12), H(-0.62, 0.26)]
    ctx.new_path()
    smooth(ctx, hl, closed=False)
    ctx.set_line_width(lw * 0.7)
    _src(ctx, col, a * 0.8)
    ctx.stroke()
    if sweat > 0:
        sx, sy = H(0.55, -0.35 + 0.9 * sweat)
        ctx.new_path()
        ctx.move_to(sx, sy - 7 * s)
        ctx.curve_to(sx + 4 * s, sy, sx + 3 * s, sy + 4 * s, sx, sy + 4 * s)
        ctx.curve_to(sx - 3 * s, sy + 4 * s, sx - 4 * s, sy, sx, sy - 7 * s)
        _src(ctx, col, a * (1 - sweat ** 3))
        ctx.set_line_width(lw * 0.7)
        ctx.stroke()
    arm("R", col)
    return J, arms
