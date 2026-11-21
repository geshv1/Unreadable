#!/usr/bin/env python3
"""Video 2, "The calm one": 9:16 TikTok render (1080x1920, 30 fps).

Mostly black, minimal: a compact animation stage in the upper middle, small
Alice captions under it, every line with its own fast geometric animation and
a stickman. Timing comes from out/timings.json (voice_v2.py, or a recorded
voice aligned to the same format).

  python3 render_v2.py                  # full render + mux with out/voice.wav
  python3 render_v2.py --frames 1.2 5.0 # PNG stills for checking
"""
import json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, HERE)
import render as R  # noqa: E402  (helpers, captions and stickman from video 1)
from render import prog, eo3, eox, eio, eiq, lerp, lerpc, clamp, src, draw_poly  # noqa: E402
from script import LINES  # noqa: E402

OUT = os.path.join(HERE, "out")
W, H, FPS = 1080, 1920, 30
CX, CY = 540, 800          # animation stage centre
CAP_Y = 1250               # caption baseline

BLACK, CHAR = R.hexc("#050505"), R.hexc("#0E0D0C")
FG, RED, MUTE = R.hexc("#E8E3DA"), R.hexc("#D3141B"), R.hexc("#5F5B55")


def palette(bg):
    R.BG, R.BONE, R.RED, R.GREY = bg, FG, RED, MUTE


palette(BLACK)

# new stickman poses
R.POSES["fold"] = dict(torso=180, uaL=-22, faL=82, uaR=22, faR=-82, thL=-7, shL=-3, thR=7, shR=3)

# ----------------------------------------------------------------- timeline
TIM = json.load(open(os.path.join(OUT, "timings.json")))


class Scene:
    pass


SC = []
for i, L in enumerate(TIM["lines"]):
    s = Scene()
    s.i = i
    s.w = [t for _, t in L["words"]]
    s.end_speech = L["end"]
    s.t0 = 0.0 if i == 0 else L["start"] - 0.22
    SC.append(s)
for i, s in enumerate(SC):
    s.t1 = SC[i + 1].t0 if i + 1 < len(SC) else TIM["speech_end"] + 2.0
FREEZE = SC[-1].t1 - 1.0
END = SC[-1].t1


# captions: 2-4 words, small Alice, centred under the stage
CAPS = []
for i, line in enumerate(LINES):
    s = SC[i]
    mp = line.get("map") or list(range(sum(len(c) for c in line["show"])))
    n = 0
    chunks = []
    for chunk in line["show"]:
        ws = []
        for word in chunk:
            key = word.endswith("*")
            ws.append(R.Wd(word.rstrip("*"), s.w[mp[n]], key))
            n += 1
        chunks.append(ws)
    for j, ws in enumerate(chunks):
        t_out = chunks[j + 1][0].t if j + 1 < len(chunks) else (None if i == len(SC) - 1 else s.t1 - 0.08)
        CAPS.append(R.Group([ws], t_out, B=50, align="center", x=CX, y0=CAP_Y, maxw=820))

KEY_TIMES = sorted(w.t for g in CAPS for line in g.lines for w in line if w.key)
IMPACTS = [SC[3].w[1], SC[3].w[4], SC[5].w[3], SC[8].w[2], SC[9].w[4], SC[12].w[0]]


# ----------------------------------------------------------------- small helpers
def angdiff(a, b):
    return (b - a + math.pi) % (2 * math.pi) - math.pi


def lerp_ang(a, b, u):
    return a + angdiff(a, b) * u


def tri(ctx, x, y, ang, s, col, a, fill=True):
    pts = [(x + s * math.cos(ang), y + s * math.sin(ang)),
           (x + s * 0.7 * math.cos(ang + 2.5), y + s * 0.7 * math.sin(ang + 2.5)),
           (x + s * 0.7 * math.cos(ang - 2.5), y + s * 0.7 * math.sin(ang - 2.5))]
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()
    src(ctx, col, a)
    if fill:
        ctx.fill()
    else:
        ctx.set_line_width(2)
        ctx.stroke()


def arrow(ctx, x, y, ang, s, col, a, lw=3):
    hx, hy = x + s * math.cos(ang), y + s * math.sin(ang)
    ctx.move_to(x - s * math.cos(ang), y - s * math.sin(ang))
    ctx.line_to(hx, hy)
    for d in (2.5, -2.5):
        ctx.move_to(hx, hy)
        ctx.line_to(hx + s * 0.6 * math.cos(ang + d), hy + s * 0.6 * math.sin(ang + d))
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    src(ctx, col, a)
    ctx.stroke()
    ctx.set_line_cap(cairo.LINE_CAP_BUTT)


def ring(ctx, x, y, r, col, a, lw=2, frac=1.0, start=-math.pi / 2):
    if a <= 0 or frac <= 0 or r <= 0:
        return
    ctx.new_sub_path()
    ctx.arc(x, y, r, start, start + 2 * math.pi * frac)
    ctx.set_line_width(lw)
    src(ctx, col, a)
    ctx.stroke()


def dot(ctx, x, y, r, col, a=1.0):
    ctx.new_sub_path()
    ctx.arc(x, y, r, 0, 2 * math.pi)
    src(ctx, col, a)
    ctx.fill()


def stick(ctx, pose, x, ground, s=0.78, col=None, a=1.0, lw=5, hands=None, dy=0):
    P = R.POSES[pose] if isinstance(pose, str) else pose
    hip = R.ground_hip(P, x, ground, s)
    R.draw_stick(ctx, P, (hip[0], hip[1] + dy), s, col or FG, a, lw, hands)
    return hip


def anton(ctx, text, x, y, size, col, a=1.0, center=True):
    R.set_font(ctx, R.ANTON, size)
    e = ctx.text_extents(text)
    ctx.move_to(x - (e.x_advance / 2 if center else 0), y)
    src(ctx, col, a)
    ctx.show_text(text)
    return e


def walk(t, rate=0.16):
    return R.POSES["step1"] if int(t / rate) % 2 else R.POSES["step2"]


def box(t, rate=0.14):
    u = (t / rate) % 2
    return R.lerp_pose(R.POSES["guard"], R.POSES["punch"], math.sin(math.pi * min(u, 1)) if u < 1 else 0)


# ----------------------------------------------------------------- scenes
_r = random.Random(1)
S1_TRI = [(_r.uniform(0, 6.283), _r.uniform(155, 320), _r.uniform(0, 6.283), _r.uniform(2, 5)) for _ in range(46)]


def s1(ctx, t, S):
    """The calm one always wins: chaos around one still figure."""
    kc, kw = S.w[1], S.w[4]
    ent = eox(prog(t, S.t0, S.t0 + 0.45))
    tt = min(t, kc)
    f = eox(prog(t, kc, kc + 0.28))
    g = eio(prog(t, kw, kw + 0.55))
    for k, (a0, r0, ph, sp) in enumerate(S1_TRI):
        a = a0 + 0.55 * math.sin(tt * 3.1 + ph)
        r = (r0 + 28 * math.sin(tt * 4.3 + ph * 2)) * ent
        x, y = CX + r * math.cos(a), CY + r * math.sin(a) * 0.92
        j = 4 * (1 - f)
        x += j * math.sin(t * 53 + ph)
        y += j * math.cos(t * 47 + ph)
        ang = lerp_ang(tt * sp + ph, math.atan2(CY - y, CX - x), f)
        if g > 0:
            oa = 2 * math.pi * k / len(S1_TRI) + (t - kw) * 0.7
            x, y = lerp(x, CX + 250 * math.cos(oa), g), lerp(y, CY + 250 * math.sin(oa), g)
            ang = lerp_ang(ang, oa + math.pi / 2, g)
        tri(ctx, x, y, ang, 12, lerpc(MUTE, FG, f), 0.95)
    ring(ctx, CX, CY, 128, RED, 1, 3, eo3(prog(t, kc, kc + 0.3)))
    for q in range(4):
        u = eo3(prog(t, kc + 0.05 * q, kc + 0.3 + 0.05 * q))
        if u > 0:
            a = q * math.pi / 2 - math.pi / 4
            draw_poly(ctx, [(CX + 140 * math.cos(a), CY + 140 * math.sin(a)),
                            (CX + (140 + 22 * u) * math.cos(a), CY + (140 + 22 * u) * math.sin(a))], 1, RED, 1, 3)
    stick(ctx, "stand", CX, CY + 92, 0.76, a=eo3(prog(t, S.t0, S.t0 + 0.25)))


def s2(ctx, t, S):
    """He doesn't shout: loud waves on both sides fall flat into one line."""
    k = S.w[2]
    f = eox(prog(t, k, k + 0.3))
    ent = eo3(prog(t, S.t0, S.t0 + 0.35))
    rows = [-150, -75, 0, 75, 150]
    for side in (-1, 1):
        for j, dy in enumerate(rows):
            pts = []
            for n in range(56):
                u = n / 55
                x = CX + side * (92 + u * 240)
                amp = 40 * (1 - abs(dy) / 230) * (1 - f) * (0.35 + 0.65 * u) + 0.8
                y = CY - 22 + dy * (1 - f) + amp * (0.6 * math.sin(u * 31 + t * 19 * side + j)
                                                     + 0.4 * math.sin(u * 13 - t * 11 + 2 * j))
                pts.append((x, y))
            draw_poly(ctx, pts, ent, lerpc(MUTE, RED, f), 1, 2 if f < 0.5 else 3)
        for q in range(3):
            r = ((t * 2.2 + q / 3) % 1) * 110
            a = (1 - f) * (1 - r / 110) * 0.6
            base = 0 if side < 0 else math.pi
            ctx.new_sub_path()
            ctx.arc(CX + side * 360, CY - 22, 20 + r, base - 0.6, base + 0.6)
            ctx.set_line_width(2)
            src(ctx, MUTE, a * ent)
            ctx.stroke()
    stick(ctx, "fold", CX, CY + 92, 0.76)


_r = random.Random(3)
S3_DOTS = [(_r.uniform(4.5, 7.5) * (1 if k % 2 else -1), _r.uniform(0, 6.28), _r.uniform(130, 310),
            170 if k % 2 else 245) for k in range(14)]


def s3_pos(k, t, S):
    w, ph, rb, ro = S3_DOTS[k]
    kk = S.w[2]
    ws = 0.8 * (1 if w > 0 else -1)
    if t <= kk:
        th = ph + w * t
    else:
        th, n, tau = ph + w * kk, 12, kk
        dt = (t - kk) / n
        for _ in range(n):
            th += lerp(w, ws, eio(prog(tau + dt / 2, kk, kk + 0.7))) * dt
            tau += dt
    g = eio(prog(t, kk, kk + 0.7))
    r = lerp(rb + 70 * math.sin(t * 5 + ph), ro, g)
    return CX + r * math.cos(th), CY + r * math.sin(th) * 0.86


def s3(ctx, t, S):
    """He doesn't chase: frantic chasers fall into orbit around him."""
    k = S.w[2]
    ent = eo3(prog(t, S.t0, S.t0 + 0.4))
    g = eio(prog(t, k, k + 0.7))
    for ro in (170, 245):
        ctx.save()
        ctx.translate(CX, CY)
        ctx.scale(1, 0.86)
        ring(ctx, 0, 0, ro, RED, 0.55, 2, eo3(prog(t, k, k + 0.5)))
        ctx.restore()
    for kk in range(len(S3_DOTS)):
        pts = [s3_pos(kk, t - j * 0.022, S) for j in range(11)]
        pts = [(CX + (x - CX) * ent, CY + (y - CY) * ent) for x, y in pts]
        for j in range(10):
            draw_poly(ctx, [pts[j], pts[j + 1]], 1, lerpc(MUTE, FG, g), (1 - j / 10) * 0.8, 3 - j * 0.2)
        dot(ctx, pts[0][0], pts[0][1], 5, FG if g > 0.5 else MUTE)
    if t < k:
        x = lerp(CX - 80, CX + 10, prog(t, S.t0, k))
        stick(ctx, walk(t), x, CY + 92, 0.76)
    else:
        stick(ctx, "stand", CX + 10, CY + 92, 0.76)


_r = random.Random(4)
S4_SHARDS = [[(_r.uniform(-0.4, 0.4), _r.uniform(0.7, 1.4)) for _ in range(3)] for _ in range(6)]


def s4(ctx, t, S):
    """Pressure hits. He doesn't move: walls slam in, he holds, walls shatter."""
    hit, mv = S.w[1], S.w[4]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    R0 = lerp(340, 305, prog(t, S.t0, hit))
    R = lerp(R0, 172, eox(prog(t, hit - 0.04, hit + 0.1)))
    vib = 3 * math.sin(t * 80) * prog(t, hit, hit + 0.1) * (1 - prog(t, mv, mv + 0.05))
    shat = prog(t, mv, mv + 0.55)
    pts = [(CX + (R + vib) * math.cos(math.radians(30 + 60 * k)),
            CY + (R + vib) * math.sin(math.radians(30 + 60 * k))) for k in range(6)]
    for k in range(6):
        p, q = pts[k], pts[(k + 1) % 6]
        if shat <= 0:
            draw_poly(ctx, [p, q], ent, FG, 1, 6)
            continue
        mid_a = math.radians(60 + 60 * k)
        for j in range(3):
            a0, a1 = j / 3, (j + 1) / 3
            rot, sp = S4_SHARDS[k][j]
            c = (lerp(p[0], q[0], (a0 + a1) / 2), lerp(p[1], q[1], (a0 + a1) / 2))
            d = 190 * eo3(shat) * sp
            c = (c[0] + d * math.cos(mid_a), c[1] + d * math.sin(mid_a))
            hx, hy = (q[0] - p[0]) / 6, (q[1] - p[1]) / 6
            ang = rot * 2.5 * eo3(shat)
            ca, sa = math.cos(ang), math.sin(ang)
            e1 = (c[0] - hx * ca + hy * sa, c[1] - hx * sa - hy * ca)
            e2 = (c[0] + hx * ca - hy * sa, c[1] + hx * sa + hy * ca)
            draw_poly(ctx, [e1, e2], 1, FG, 1 - shat, 6)
    for dly in (0, 0.09):
        u = prog(t, hit + dly, hit + dly + 0.5)
        if 0 < u < 1:
            ring(ctx, CX, CY, 172 + 330 * eo3(u), FG, 0.5 * (1 - u), 2)
    dip = 7 * math.sin(math.pi * prog(t, hit, hit + 0.25))
    stick(ctx, "brace", CX, CY + 84, 0.72, dy=dip)
    u = eo3(prog(t, mv, mv + 0.22))
    if u > 0:
        hs = 100
        sq = [(CX - hs, CY - hs + 4), (CX + hs, CY - hs + 4), (CX + hs, CY + hs + 4), (CX - hs, CY + hs + 4)]
        draw_poly(ctx, sq, u, RED, 1, 3, closed=True)
        for (x, y), (sx, sy) in zip(sq, [(-1, -1), (1, -1), (1, 1), (-1, 1)]):
            draw_poly(ctx, [(x + sx * 14, y + sy * 14 - sy * 34), (x + sx * 14, y + sy * 14), (x + sx * 14 - sx * 34, y + sy * 14)],
                      u, RED, 1, 3)


_r = random.Random(5)
S5_NOISE = [[_r.uniform(-1, 1) for _ in range(48)] for _ in range(5)]


def s5(ctx, t, S):
    """Not talent, training: a jagged ring refined pass by pass into a perfect circle."""
    k, st = S.w[4], S.w[0]
    passes = [st + (k - st) * q / 4 for q in range(1, 5)]
    levels = [72, 42, 22, 9, 0]
    n = sum(1 for p in passes if t >= p)
    e = eox(prog(t, passes[n - 1], passes[n - 1] + 0.12)) if n else 1
    amp = lerp(levels[max(n - 1, 0)], levels[n], e) if n else levels[0]
    nz_a, nz_b = S5_NOISE[max(n - 1, 0)], S5_NOISE[n]
    ent = eo3(prog(t, S.t0, S.t0 + 0.35))
    rot = t * 0.5
    pts = []
    for i in range(48):
        nz = lerp(nz_a[i], nz_b[i], e)
        r = (205 + amp * nz) * ent
        a = rot + 2 * math.pi * i / 48
        pts.append((CX + r * math.cos(a), CY + r * math.sin(a)))
    flash = 0
    for p in passes:
        u = prog(t, p, p + 0.35)
        if 0 < u < 1:
            flash = max(flash, 1 - u)
            ring(ctx, CX, CY, 205 + 150 * eo3(u), FG, 0.35 * (1 - u), 2)
    draw_poly(ctx, pts, 1, RED if t >= k else FG, 1, 3 + 3 * flash, closed=True)
    if t >= k:
        for q in range(24):
            u = eo3(prog(t, k + 0.01 * q, k + 0.2 + 0.01 * q))
            a = rot + 2 * math.pi * q / 24
            draw_poly(ctx, [(CX + 222 * math.cos(a), CY + 222 * math.sin(a)),
                            (CX + (222 + 14 * u) * math.cos(a), CY + (222 + 14 * u) * math.sin(a))], 1, RED, u, 2)
    reps = 1 + int(99 * eiq(prog(t, st, k)))
    anton(ctx, f"×{reps}", CX, CY + 305, 40, RED if t >= k else MUTE, ent)
    stick(ctx, box(t) if t < k else "stand", CX, CY + 88, 0.74)


_r = random.Random(6)
S6_SPIKES = [_r.uniform(0.8, 1.15) for _ in range(16)]


def s6(ctx, t, S):
    """Every round makes fear smaller: a spiky red fear shrinks with every bell."""
    bells, sm = [S.w[1], S.w[2], S.w[3]], S.w[4]
    lv = [1.0, 0.74, 0.52, 0.34]
    n = sum(1 for b in bells if t >= b)
    sc = lerp(lv[max(n - 1, 0)], lv[n], eox(prog(t, bells[n - 1], bells[n - 1] + 0.15))) if n else lv[0]
    sc = lerp(sc, 0.1, eio(prog(t, sm, sm + 0.4)))
    ent = eo3(prog(t, S.t0, S.t0 + 0.35))
    c = (CX, CY - 30)
    pts = []
    for i in range(32):
        a = t * 0.35 + 2 * math.pi * i / 32
        r = (300 * S6_SPIKES[i // 2] + 9 * math.sin(t * 40 + i)) if i % 2 == 0 else 140
        r *= sc * ent
        pts.append((c[0] + r * math.cos(a), c[1] + r * math.sin(a)))
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()
    src(ctx, RED, 0.08)
    ctx.fill_preserve()
    ctx.set_line_width(3)
    src(ctx, RED, 1)
    ctx.stroke()
    for j, b in enumerate(bells):
        u = prog(t, b, b + 0.45)
        if 0 < u < 1:
            ring(ctx, c[0], c[1], 60 + 330 * eo3(u), FG, 0.55 * (1 - u), 2)
            for q in range(10):
                a = 2 * math.pi * q / 10
                r0, r1 = 320 + 30 * eo3(u), 345 + 45 * eo3(u)
                draw_poly(ctx, [(c[0] + r0 * math.cos(a), c[1] + r0 * math.sin(a)),
                                (c[0] + r1 * math.cos(a), c[1] + r1 * math.sin(a))], 1, FG, 0.7 * (1 - u), 2)
        x = CX - 40 + 40 * j
        ring(ctx, x, CY - 350, 8, MUTE, ent, 2)
        if t >= b:
            dot(ctx, x, CY - 350, 8 * eox(prog(t, b, b + 0.12)), RED)
    stick(ctx, box(t, 0.16) if t < sm else R.pose_at(t, [(sm, "guard"), (sm + 0.25, "stand")]), CX, CY + 150, 0.78)


def pushup(ctx, t, F, s, d):
    phi = math.radians(lerp(24, 8, d))
    Lg = (R.STICK["thigh"] + R.STICK["shin"]) * s
    hip = (F[0] + math.cos(phi) * Lg, F[1] - math.sin(phi) * Lg)
    a = 90 + math.degrees(phi)
    pose = dict(R.POSES["stand"], torso=a, thL=a - 180, shL=a - 180, thR=a - 180, shR=a - 180)
    J = R.stick_joints(pose, hip, s)
    hands = {"L": (J["neck"][0] + 6, F[1]), "R": (J["neck"][0] + 12, F[1])}
    R.draw_stick(ctx, pose, hip, s, FG, 1, 5, hands)


def s7(ctx, t, S):
    """Every rep builds control: push-ups fill a meter, a rank of chevrons locks in."""
    k = S.w[3]
    st, per = S.t0 + 0.15, 0.34
    ph = max(0, (min(t, k) - st) / per)
    reps = int(ph)
    d = 0.5 - 0.5 * math.cos(2 * math.pi * (ph % 1)) if t < k else 0
    ent = eo3(prog(t, S.t0, S.t0 + 0.35))
    for j in range(12):
        a0 = math.radians(150 + 240 * j / 12 + 2)
        a1 = math.radians(150 + 240 * (j + 1) / 12 - 2)
        lit = j < reps or t >= k
        col = RED if t >= k else (FG if lit else MUTE)
        if t >= k:
            col = RED if prog(t, k + 0.02 * j, k + 0.02 * j + 0.01) >= 1 else FG
        ctx.new_sub_path()
        ctx.arc(CX, CY + 10, 255, a0, a0 + (a1 - a0) * ent)
        ctx.set_line_width(10 if lit else 4)
        src(ctx, col, 1 if lit else 0.6)
        ctx.stroke()
    pushup(ctx, t, (CX - 95, CY + 135), 0.8, d)
    for j in range(3):
        u = eo3(prog(t, k + 0.08 * j, k + 0.08 * j + 0.22))
        if u > 0:
            y = CY - 120 - 36 * j - 20 * (1 - u)
            draw_poly(ctx, [(CX - 42, y + 18), (CX, y - 12), (CX + 42, y + 18)], 1, RED, u, 6)


_r = random.Random(8)
S8_PEOPLE = []
while len(S8_PEOPLE) < 36:
    a, r = _r.uniform(0, 6.283), _r.uniform(150, 330)
    p = (CX + r * math.cos(a), CY + r * math.sin(a) * 0.95)
    if all(math.dist(p, q[:2]) > 52 for q in S8_PEOPLE):
        S8_PEOPLE.append((p[0], p[1], _r.uniform(0, 6.283), _r.uniform(0, 6.283)))


def s8(ctx, t, S):
    """People feel it: he walks in, radar pulses, every arrow in the room turns to him."""
    k = S.w[1]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    sx = lerp(CX - 240, CX, eo3(prog(t, S.t0, k - 0.08)))
    chest = (sx, CY + 2)
    if t > S.t0 + 0.2:
        for q in range(3):
            r = (((t - S.t0) / 0.42 + q / 3) % 1) * 280
            ring(ctx, chest[0], chest[1], r, MUTE, 0.35 * (1 - r / 280), 2)
    u = prog(t, k, k + 0.6)
    if 0 < u < 1:
        ring(ctx, chest[0], chest[1], 40 + 340 * eo3(u), RED, 0.8 * (1 - u), 3)
    for x, y, a0, ph in S8_PEOPLE:
        dly = math.dist((x, y), chest) / 1300
        f = eox(prog(t, k + dly, k + dly + 0.25))
        a = lerp_ang(a0 + 0.5 * math.sin(t * 2.2 + ph), math.atan2(chest[1] - y, chest[0] - x), f)
        sc = 1 + 0.35 * math.sin(math.pi * f)
        arrow(ctx, x, y, a, 13 * sc * ent, lerpc(MUTE, FG, f), ent, 3)
    if t < k - 0.08:
        stick(ctx, walk(t), sx, CY + 92, 0.72)
    else:
        stick(ctx, "stand", sx, CY + 92, 0.72)


def gyro_ring(R_, a, b, c, n=90):
    out = []
    ca, sa, cb, sb, cc, sc = math.cos(a), math.sin(a), math.cos(b), math.sin(b), math.cos(c), math.sin(c)
    for i in range(n + 1):
        f = 2 * math.pi * i / n
        x, y, z = R_ * math.cos(f), R_ * math.sin(f), 0
        y, z = y * ca - z * sa, y * sa + z * ca
        x, z = x * cb + z * sb, -x * sb + z * cb
        x, y = x * cc - y * sc, x * sc + y * cc
        out.append((CX + x, CY + y, z))
    return out


_r = random.Random(9)
S9_PART = [(_r.uniform(0, 6.283), _r.uniform(0, 1)) for _ in range(40)]


def s9(ctx, t, S):
    """Calm is power: a chaotic gyroscope locks into steady rotation around a still core."""
    k = S.w[2]
    q = 1 - eox(prog(t, k, k + 0.35))
    ent = eo3(prog(t, S.t0, S.t0 + 0.35))
    if t >= k:
        g = cairo.RadialGradient(CX, CY, 10, CX, CY, 150)
        g.add_color_stop_rgba(0, RED[0], RED[1], RED[2], 0.35 * eo3(prog(t, k, k + 0.3)))
        g.add_color_stop_rgba(1, RED[0], RED[1], RED[2], 0)
        ctx.set_source(g)
        ctx.arc(CX, CY, 150, 0, 2 * math.pi)
        ctx.fill()
        for ang, off in S9_PART:
            r = 380 * (1 - ((t - k) * 1.3 + off) % 1)
            dot(ctx, CX + r * math.cos(ang), CY + r * math.sin(ang), 2.5, MUTE, 0.8)
    rings = []
    for i in range(3):
        a = t * 0.9 + i * 2.1 + q * 2.2 * math.sin(t * 7.1 + i * 3)
        b = i * 1.05 + 0.4 + q * 1.8 * math.sin(t * 5.3 + i)
        c = t * 0.3 * (i + 1)
        rings.append(gyro_ring(230 * ent, a, b, c))
    for front in (False, True):
        for i, pts in enumerate(rings):
            for j in range(len(pts) - 1):
                z = (pts[j][2] + pts[j + 1][2]) / 2
                if (z > 0) != front:
                    continue
                col = (RED if (i == 0 and t >= k) else FG) if front else MUTE
                ctx.move_to(pts[j][0], pts[j][1])
                ctx.line_to(pts[j + 1][0], pts[j + 1][1])
                ctx.set_line_width(3 if front else 2)
                src(ctx, col, 0.95 if front else 0.45)
                ctx.stroke()
        if not front:
            stick(ctx, "meditate", CX, CY + 50, 0.56)


_r = random.Random(10)
S10_A = [[(_r.uniform(0, 6.283), _r.uniform(0, 6.283)) for _ in range(7)] for _ in range(7)]


def s10(ctx, t, S):
    """Control yourself, control the room: one arrow aligns, then a ripple aligns them all."""
    k1, k2 = S.w[1], S.w[4]
    sp = 80
    for i in range(7):
        for j in range(7):
            x, y = CX + (i - 3) * sp, CY + (j - 3) * sp
            d = math.hypot(i - 3, j - 3)
            ent = eo3(prog(t, S.t0 + d * 0.04, S.t0 + d * 0.04 + 0.25))
            a0, ph = S10_A[i][j]
            a = a0 + 1.3 * math.sin(t * 3 + ph) + 0.3 * math.sin(t * 11 + ph)
            centre = i == 3 and j == 3
            if centre:
                f = eox(prog(t, k1, k1 + 0.2))
            else:
                dly = d * 0.05
                f = eox(prog(t, k2 + dly, k2 + dly + 0.22))
            a = lerp_ang(a, -math.pi / 2, f)
            col = RED if centre else lerpc(MUTE, FG, f)
            arrow(ctx, x, y, a, (20 if not centre else 26) * ent, col, ent, 4 if centre else 3)
    u = prog(t, k1, k1 + 0.45)
    if 0 < u < 1:
        ring(ctx, CX, CY, 20 + 60 * eo3(u), RED, 1 - u, 3)
    u = prog(t, k2, k2 + 0.7)
    if 0 < u < 1:
        ring(ctx, CX, CY, 40 + 400 * eo3(u), RED, 0.7 * (1 - u), 3)


S11_MOD = {"MIND": (CX, CY - 175), "FIGHT": (CX - 200, CY + 130), "BODY": (CX + 200, CY + 130)}


def module(ctx, name, x, y, a, lw=3, col=None):
    w, h = 150, 64
    ctx.rectangle(x - w / 2, y - h / 2, w, h)
    ctx.set_line_width(lw)
    src(ctx, col or FG, a)
    ctx.stroke()
    anton(ctx, name, x, y + 12, 30, FG, a)


def s11(ctx, t, S):
    """I built a system: blueprint lines, three modules snap into a locked triangle."""
    w = S.w
    k = w[3]
    ctx.save()
    ctx.set_dash([10, 8])
    guides = [[(CX - 330, CY - 175), (CX + 330, CY - 175)], [(CX - 330, CY + 130), (CX + 330, CY + 130)],
              [(CX - 200, CY - 330), (CX - 200, CY + 330)], [(CX + 200, CY - 330), (CX + 200, CY + 330)],
              [(CX, CY - 330), (CX, CY + 330)]]
    for j, g in enumerate(guides):
        draw_poly(ctx, g, eo3(prog(t, S.t0 + 0.04 * j, S.t0 + 0.4 + 0.04 * j)), MUTE, 0.7, 1.5)
    ring(ctx, CX, CY - 15, 235, MUTE, 0.6, 1.5, eo3(prog(t, S.t0 + 0.1, S.t0 + 0.6)))
    ctx.restore()
    lock = eo3(prog(t, k, k + 0.25))
    mx, my = S11_MOD["MIND"]
    u = eox(prog(t, w[0], w[1]))
    if t >= w[0]:
        module(ctx, "MIND", mx, lerp(CY - 420, my, u), min(1, u * 3), 3 + 3 * lock, RED if lock > 0 else FG)
    fx, fy = S11_MOD["FIGHT"]
    u = eox(prog(t, w[1], w[2]))
    if t >= w[1]:
        module(ctx, "FIGHT", lerp(CX - 480, fx, u), fy, min(1, u * 3), 3 + 3 * lock, RED if lock > 0 else FG)
    bx, by = S11_MOD["BODY"]
    u = eio(prog(t, w[1] + 0.1, k - 0.05))
    x = lerp(CX + 40, bx, u)
    module(ctx, "BODY", x, by, eo3(prog(t, S.t0 + 0.2, S.t0 + 0.4)), 3 + 3 * lock, RED if lock > 0 else FG)
    if t < k:
        stick(ctx, "push", x - 75 - 40, by + 32, 0.5, lw=4)
    else:
        stick(ctx, "stand", bx - 75 - 40, by + 32, 0.5, lw=4)
    if lock > 0:
        cs = [S11_MOD["MIND"], S11_MOD["FIGHT"], S11_MOD["BODY"]]
        for a, b in zip(cs, cs[1:] + cs[:1]):
            draw_poly(ctx, [a, b], lock, RED, 1, 3)
        for c in cs:
            dot(ctx, c[0], c[1], 7 * lock, RED)


def s12(ctx, t, S):
    """The Complete Fighter: the red cage forms; mind, fight, body light up in turn."""
    w = S.w
    k = w[2]
    pts = R.oct_pts(CX, CY, 310)
    order = [pts[5], pts[6], pts[7], pts[0], pts[1], pts[2], pts[3], pts[4]]
    draw_poly(ctx, order, eo3(prog(t, S.t0, k)), RED, 1, 3 + 3 * (1 - prog(t, k, k + 0.3)) * (t >= k), closed=True)
    da = eo3(prog(t, k - 0.2, k + 0.2))
    if da > 0:
        ctx.set_line_width(2)
        for q in range(72):
            a = t * 0.4 + 2 * math.pi * q / 72
            r0 = 322 if q % 6 else 314
            ctx.move_to(CX + r0 * math.cos(a), CY + r0 * math.sin(a))
            ctx.line_to(CX + 334 * math.cos(a), CY + 334 * math.sin(a))
        src(ctx, MUTE, 0.7 * da)
        ctx.stroke()
    for j in range(12):
        u = eo3(prog(t, w[5] + 0.025 * j, w[5] + 0.025 * j + 0.25))
        if u > 0:
            h = (16 + j * 13) * u
            x = CX - 165 + j * 30
            ctx.rectangle(x - 9, CY + 175 - h, 18, h)
            src(ctx, MUTE, 0.55)
            ctx.fill()
    pose = R.pose_at(t, [(S.t0, "guard"), (w[4], "guard"), (w[4] + 0.08, "punch"), (w[5] - 0.05, "punch"),
                          (w[5] + 0.15, "victory")])
    hip = stick(ctx, pose, CX, CY + 175, 0.8)
    J = R.stick_joints(pose, R.ground_hip(pose, CX, CY + 175, 0.8), 0.8)
    if t >= w[3]:
        for q in range(6):
            u = eo3(prog(t, w[3] + 0.04 * q, w[3] + 0.04 * q + 0.12))
            a0 = -math.pi / 2 + q * math.pi / 3 + 0.08
            ctx.new_sub_path()
            ctx.arc(J["head"][0], J["head"][1], 34, a0, a0 + (math.pi / 3 - 0.16) * u)
            ctx.set_line_width(6)
            src(ctx, RED, 1)
            ctx.stroke()
    u = prog(t, w[4] + 0.08, w[4] + 0.5)
    if 0 < u < 1:
        hx, hy = J["handR"]
        for q in range(8):
            a = 2 * math.pi * q / 8
            r0, r1 = 12 + 40 * eo3(u), 26 + 60 * eo3(u)
            draw_poly(ctx, [(hx + r0 * math.cos(a), hy + r0 * math.sin(a)),
                            (hx + r1 * math.cos(a), hy + r1 * math.sin(a))], 1, FG, 1 - u, 3)


def s13(ctx, t, S):
    """€19, link in bio: slot-machine price, then the arrow up."""
    w = S.w
    kp, kb = w[0], w[4]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    R.set_font(ctx, R.ALICE, 34)
    lab = "THE COMPLETE FIGHTER"
    e = ctx.text_extents(lab)
    ctx.move_to(CX - e.x_advance / 2, CY - 215)
    src(ctx, MUTE, ent)
    ctx.show_text(lab)
    size, glyphs = 200, ["€", "1", "9"]
    R.set_font(ctx, R.ANTON, size)
    adv = [ctx.text_extents(g).x_advance for g in glyphs]
    total = sum(adv) + 12 * 2
    x0 = CX - total / 2 - 20
    top, bot = CY - 170, CY + 70
    draw_poly(ctx, [(x0 - 20, top), (x0 + total + 20, top)], ent, MUTE, 0.8, 2)
    draw_poly(ctx, [(x0 - 20, bot), (x0 + total + 20, bot)], ent, MUTE, 0.8, 2)
    x = x0
    for j, g in enumerate(glyphs):
        strip = (["$", "£", "¥", "€"] * 3)[:-1] + ["€"] if j == 0 else list("0123456789" * 2) + [g]
        land = kp + 0.1 * j
        pos = (len(strip) - 1) * eo3(prog(t, S.t0, land))
        ctx.save()
        ctx.rectangle(x - 5, top + 4, adv[j] + 10, bot - top - 8)
        ctx.clip()
        base = CY + 0
        for n in (int(pos), int(pos) + 1):
            if n >= len(strip):
                continue
            off = (n - pos) * 230
            col = RED if (t >= land and n == len(strip) - 1) else FG
            R.set_font(ctx, R.ANTON, size)
            ctx.move_to(x, base + off)
            src(ctx, col, ent)
            ctx.show_text(strip[n])
        ctx.restore()
        x += adv[j] + 12
    u = eo3(prog(t, kp + 0.25, kp + 0.55))
    ctx.rectangle(x0, bot + 18, total * u, 5)
    src(ctx, RED, 1)
    ctx.fill()
    sa = eo3(prog(t, w[2], w[2] + 0.3))
    pose = R.pose_at(t, [(w[2], "stand"), (kb, "stand"), (kb + 0.2, "point")])
    stick(ctx, pose, CX + 285, CY + 175, 0.7, a=sa)
    au = eo3(prog(t, kb, kb + 0.3))
    if au > 0:
        ax = CX + 205
        lift = 0
        for p0 in (kb + 0.3, kb + 0.6):
            p = prog(t, p0, p0 + 0.28)
            if 0 < p < 1:
                lift = 16 * math.sin(math.pi * p)
        y0, y1 = CY + 160, CY - 190
        ytip = lerp(y0, y1, au) - lift
        draw_poly(ctx, [(ax, y0), (ax, ytip)], 1, RED, 1, 5)
        draw_poly(ctx, [(ax - 24, ytip + 24), (ax, ytip), (ax + 24, ytip + 24)], 1, RED, 1, 5)


SCENE_FNS = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13]
EXITS = ["shrink", "zoom", "spin", "slice"]
PATTERNS = ["rays", "grid", "rings", "lines", "grid", "rays", "rings", "lines", "rays", "grid", "lines", "rings", "rays"]
WIPES = ["blade", "iris", "shutter"]


# ----------------------------------------------------------------- background & finishing
_rng = np.random.default_rng(7)
GRAIN = []
for _ in range(4):
    a = _rng.integers(0, 13, (256, 256), dtype=np.uint8)
    arr = np.zeros((256, 256, 4), np.uint8)
    arr[..., 0] = arr[..., 1] = arr[..., 2] = arr[..., 3] = a
    GRAIN.append((arr, cairo.ImageSurface.create_for_data(memoryview(arr), cairo.FORMAT_ARGB32, 256, 256)))


def bg_pattern(ctx, t, kind):
    ctx.save()
    if kind == "grid":
        sp, ox, oy = 60, (t * 12) % 60, (t * 8) % 60
        src(ctx, FG, 0.07)
        for y in range(-1, H // sp + 2):
            for x in range(-1, W // sp + 2):
                ctx.new_sub_path()
                ctx.arc(x * sp + ox, y * sp + oy, 1.8, 0, 2 * math.pi)
        ctx.fill()
    elif kind == "rays":
        rot = math.radians(4 * t)
        for k in range(48):
            a = rot + 2 * math.pi * k / 48
            ctx.move_to(CX + 380 * math.cos(a), CY + 380 * math.sin(a))
            ctx.line_to(CX + 2200 * math.cos(a), CY + 2200 * math.sin(a))
        ctx.set_line_width(1.5)
        src(ctx, FG, 0.04)
        ctx.stroke()
    elif kind == "rings":
        ctx.set_line_width(1.5)
        for k in range(16):
            r = (k * 90 + t * 45) % 1440
            ring(ctx, CX, CY, r, FG, 0.07 * (1 - r / 1440), 1.5, 1)
    elif kind == "lines":
        off = (t * 40) % 24
        for y in range(-1, H // 24 + 2):
            ctx.move_to(0, y * 24 + off)
            ctx.line_to(W, y * 24 + off)
        ctx.set_line_width(1)
        src(ctx, FG, 0.03)
        ctx.stroke()
    ctx.restore()
    pts = R.oct_pts(CX, CY, 470, math.radians(5 * t))
    draw_poly(ctx, pts, 1, FG, 0.045, 2, closed=True)


def big_number(ctx, i):
    R.set_font(ctx, R.ANTON, 560)
    txt = f"{i + 1:02d}"
    e = ctx.text_extents(txt)
    ctx.move_to(CX - e.x_advance / 2, CY + 200)
    ctx.text_path(txt)
    ctx.set_line_width(2)
    src(ctx, FG, 0.035)
    ctx.stroke()


def scene_index(t):
    for s in SC:
        if s.t0 <= t < s.t1:
            return s.i
    return len(SC) - 1


def draw_bg(ctx, t, i):
    def layer(j):
        src(ctx, BLACK if j % 2 == 0 else CHAR)
        ctx.paint()
        bg_pattern(ctx, t, PATTERNS[j])
        big_number(ctx, j)
    S = SC[i]
    u = prog(t, S.t0, S.t0 + 0.28)
    if i == 0 or u >= 1:
        layer(i)
        return
    layer(i - 1)
    ctx.save()
    kind = WIPES[i % 3]
    e = eio(u)
    if kind == "iris":
        ctx.arc(CX, CY, 2300 * e + 0.1, 0, 2 * math.pi)
    elif kind == "shutter":
        for b in range(8):
            y = b * H / 8
            ctx.rectangle(0, y, W, H / 8 * e)
    else:
        x = -H + (W + 2 * H) * e
        ctx.move_to(-H, 0)
        ctx.line_to(x, 0)
        ctx.line_to(x - H * 0.5, H)
        ctx.line_to(-H, H)
        ctx.close_path()
    path = ctx.copy_path()
    ctx.clip()
    layer(i)
    ctx.restore()
    ctx.append_path(path)
    ctx.set_line_width(3)
    src(ctx, RED if i % 2 else FG, 0.6 * (1 - u))
    ctx.stroke()


def punch(t):
    p, shake = 0.0, (0.0, 0.0)
    for k in KEY_TIMES:
        d = t - k
        if 0 <= d < 0.5:
            p += 0.045 * math.exp(-d / 0.1) * min(1, d / 0.03)
    for k in IMPACTS:
        d = t - k
        if 0 <= d < 0.3:
            m = 9 * (1 - d / 0.3)
            shake = (m * math.sin(t * 97), m * math.cos(t * 83))
    return p, shake


def draw_stage(ctx, t, i):
    S = SC[i]
    ein = eo3(prog(t, S.t0, S.t0 + 0.28))
    u = 0 if i == len(SC) - 1 else prog(t, S.t1 - 0.26, S.t1)
    p, sh = punch(t)
    sc = (0.88 + 0.12 * ein) * (1 + p) * (1 + 0.03 * prog(t, S.t0, S.t1))
    rot, alpha = 0.0, ein
    style = EXITS[i % 4]
    e = eio(u)
    ctx.push_group()
    ctx.save()
    if u > 0:
        if style == "shrink":
            sc *= max(1 - e, 1e-3)
        elif style == "zoom":
            sc *= 1 + 0.6 * e
            alpha *= 1 - e
        elif style == "spin":
            sc *= max(1 - e, 1e-3)
            rot = 1.3 * e
        elif style == "slice":
            hh = 420 * (1 - e)
            ctx.rectangle(0, CY - hh, W, 2 * hh + 0.1)
            ctx.clip()
    ctx.translate(CX + sh[0], CY + sh[1])
    ctx.rotate(rot)
    ctx.scale(sc, sc)
    ctx.translate(-CX, -CY)
    SCENE_FNS[i](ctx, t, S)
    for k in KEY_TIMES:
        d = t - k
        if 0 <= d < 0.5 and S.t0 <= k < S.t1:
            v = eo3(d / 0.5)
            ring(ctx, CX, CY, 90 + 330 * v, RED, 0.4 * (1 - v), 3)
    ctx.restore()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)


def finish(ctx, t, frame):
    # slow light sweep
    cx = -600 + ((t / 7.0) % 1) * 2400
    g = cairo.LinearGradient(cx - 260, 0, cx + 260, 0)
    g.add_color_stop_rgba(0, 1, 1, 1, 0)
    g.add_color_stop_rgba(0.5, 1, 1, 1, 0.03)
    g.add_color_stop_rgba(1, 1, 1, 1, 0)
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(0.35)
    ctx.translate(-W / 2, -H / 2)
    ctx.set_source(g)
    ctx.rectangle(-W, -H, 3 * W, 3 * H)
    ctx.fill()
    ctx.restore()
    v = cairo.RadialGradient(CX, 880, 380, CX, 880, 1250)
    v.add_color_stop_rgba(0, 0, 0, 0, 0)
    v.add_color_stop_rgba(1, 0, 0, 0, 0.6)
    ctx.set_source(v)
    ctx.paint()


def grain(ctx, frame):
    arr, surf = GRAIN[frame % 4]
    pat = cairo.SurfacePattern(surf)
    pat.set_extend(cairo.EXTEND_REPEAT)
    r = random.Random(frame)
    m = cairo.Matrix()
    m.translate(r.randint(0, 255), r.randint(0, 255))
    pat.set_matrix(m)
    ctx.set_source(pat)
    ctx.paint()


def hud(ctx, t, i):
    x0, x1, y = 190, 890, 262
    ctx.rectangle(x0, y - 1, x1 - x0, 2)
    src(ctx, FG, 0.12)
    ctx.fill()
    ctx.rectangle(x0, y - 1, (x1 - x0) * clamp(t / FREEZE), 2)
    src(ctx, RED, 0.9)
    ctx.fill()
    R.set_font(ctx, R.ANTON, 22)
    src(ctx, MUTE, 0.9)
    ctx.move_to(x0, y - 16)
    ctx.show_text(f"{i + 1:02d} / {len(SC):02d}")


def render(t, frame=0):
    t = min(t, FREEZE)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ctx.set_antialias(cairo.ANTIALIAS_BEST)
    fo = cairo.FontOptions()
    fo.set_antialias(cairo.ANTIALIAS_GRAY)
    fo.set_hint_style(cairo.HINT_STYLE_NONE)
    fo.set_hint_metrics(cairo.HINT_METRICS_OFF)
    ctx.set_font_options(fo)
    i = scene_index(t)
    draw_bg(ctx, t, i)
    draw_stage(ctx, t, i)
    finish(ctx, t, frame)
    for g in CAPS:
        g.draw(ctx, t)
    hud(ctx, t, i)
    grain(ctx, frame if t < FREEZE else 0)
    return surf


def frame_bytes(n):
    return bytes(render(n / FPS, n).get_data())


def main():
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "--frames":
        for a in sys.argv[2:]:
            render(float(a)).write_to_png(os.path.join(OUT, f"check_{float(a):05.2f}.png"))
        return
    render(SC[0].w[2] + 0.35).write_to_png(os.path.join(OUT, "cover.png"))
    n = int(round(END * FPS))
    vid = os.path.join(OUT, "calm_no_audio.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", vid]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for k, b in enumerate(pool.imap(frame_bytes, range(n), chunksize=6)):
            ff.stdin.write(b)
            if k % 150 == 0:
                print(f"frame {k}/{n}", flush=True)
    ff.stdin.close()
    ff.wait()
    final = os.path.join(OUT, "calm_tiktok.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", os.path.join(OUT, "voice.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", f"{END:.3f}", "-movflags", "+faststart", final], check=True)
    print("wrote", final, f"({END:.2f}s)")


if __name__ == "__main__":
    R.ensure_fonts()
    main()
