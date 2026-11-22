#!/usr/bin/env python3
"""Video 5, "The Pause": 4:3 (1440x1080), ultra-minimal, illustrated.

Pure black, white line illustration (figure.py: profile figures in suits /
training clothes), detailed props, a clean Inter title block on the right,
slow eased motion, continuous sets (the boardroom holds across four lines).

  python3 render_v5.py                  # full render + mux with out/voice.wav
  python3 render_v5.py --frames 1.2 5.0 # PNG stills for checking
"""
import importlib.util, json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(HERE)
sys.path.insert(0, VIDEO)
sys.path.insert(0, os.path.join(VIDEO, "v3"))
sys.path.insert(0, HERE)
from render import prog, eo3, eio, lerp, clamp  # noqa: E402
import rig  # noqa: E402
import figure as F  # noqa: E402
from figure import solid, capsule, poly, seg  # noqa: E402

_spec = importlib.util.spec_from_file_location("script_v5", os.path.join(HERE, "script.py"))
_sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sc)
LINES = _sc.LINES
OUT = os.path.join(HERE, "out")

W, H, FPS = 1440, 1080, 30
FLOOR = 840
S = 1.25
FG = (0.95, 0.95, 0.95)
GREY = (0.55, 0.55, 0.55)
BLACK = (0.0, 0.0, 0.0)
TXC, TXW, TYC = 1095, 500, 450
LW = 2.2


def src(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def line(ctx, pts, a=1.0, lw=LW, frac=1.0, col=FG, close=False, dash=None):
    if a <= 0 or frac <= 0:
        return
    if close:
        pts = list(pts) + [pts[0]]
    segs = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    left = sum(segs) * clamp(frac)
    ctx.new_path()
    ctx.move_to(*pts[0])
    for i, L in enumerate(segs):
        if left >= L:
            ctx.line_to(*pts[i + 1])
            left -= L
        else:
            u = left / L if L else 0
            ctx.line_to(lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u))
            break
    ctx.save()
    if dash:
        ctx.set_dash(dash)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    src(ctx, col, a)
    ctx.stroke()
    ctx.restore()


def circ(ctx, x, y, r, a=1.0, lw=LW, frac=1.0, start=-math.pi / 2, fill=False, col=FG):
    if a <= 0 or frac <= 0 or r <= 0:
        return
    ctx.new_path()
    ctx.arc(x, y, r, start, start + 2 * math.pi * clamp(frac))
    src(ctx, col, a)
    if fill:
        ctx.fill()
    else:
        ctx.set_line_width(lw)
        ctx.stroke()


def rrect(x0, y0, x1, y1, r):
    def add(ctx):
        ctx.new_sub_path()
        ctx.arc(x1 - r, y0 + r, r, -math.pi / 2, 0)
        ctx.arc(x1 - r, y1 - r, r, 0, math.pi / 2)
        ctx.arc(x0 + r, y1 - r, r, math.pi / 2, math.pi)
        ctx.arc(x0 + r, y0 + r, r, math.pi, 3 * math.pi / 2)
        ctx.close_path()
    return add


def text(ctx, s, x, y, size, col=FG, a=1.0, bold=False, center=True, track=0):
    ctx.select_font_face("Inter", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(size)
    if track:
        w = sum(ctx.text_extents(ch).x_advance + track for ch in s) - track
        xx = x - w / 2 if center else x
        for ch in s:
            ctx.move_to(xx, y)
            src(ctx, col, a)
            ctx.show_text(ch)
            xx += ctx.text_extents(ch).x_advance + track
        return
    e = ctx.text_extents(s)
    ctx.move_to(x - e.x_advance / 2 if center else x, y)
    src(ctx, col, a)
    ctx.show_text(s)


# ----------------------------------------------------------------- timeline
TIM = json.load(open(os.path.join(OUT, "timings.json")))


class Sc:
    pass


SET = ["watch", "board", "board", "board", "board", "gym", "lever", "hold", "board2", "watch2"]
SCN = []
for i, L in enumerate(TIM["lines"]):
    s = Sc()
    s.i, s.w, s.set = i, [t for _, t in L["words"]], SET[i]
    s.t0 = 0.0 if i == 0 else L["start"] - 0.4
    SCN.append(s)
for i, s in enumerate(SCN):
    s.t1 = SCN[i + 1].t0 if i + 1 < len(SCN) else TIM["speech_end"] + 2.3
END = SCN[-1].t1
FREEZE = END - 1.0
W_ = [s.w for s in SCN]


def set_span(i):
    """First scene start and last scene end of the run of scenes sharing scene i's set."""
    a = i
    while a > 0 and SCN[a - 1].set == SCN[i].set:
        a -= 1
    b = i
    while b + 1 < len(SCN) and SCN[b + 1].set == SCN[i].set:
        b += 1
    return SCN[a].t0, SCN[b].t1


# ----------------------------------------------------------------- shared props
def stopwatch(ctx, cx, cy, R, secs, a, d=1.0, press=0.0):
    """Detailed stopwatch: case, crown, pusher, 60 ticks, numerals, sub-dial, sweep sector and hand."""
    cr = press * 6
    solid(ctx, [rrect(cx - 16, cy - R - 34 + cr, cx + 16, cy - R - 6 + cr, 4), capsule((cx, cy - R - 6), (cx, cy - R + 4), 8)], FG, a * d, LW)
    for k in range(5):
        x = cx - 10 + k * 5
        line(ctx, [(x, cy - R - 31 + cr), (x, cy - R - 9 + cr)], a * d * 0.6, 1.2)
    ang = math.radians(-45)
    px, py = cx + (R + 6) * math.cos(ang - math.pi / 2 + 0.0), cy + (R + 6) * math.sin(ang - math.pi / 2)
    solid(ctx, [capsule((cx + R * 0.72, cy - R * 0.72), (px + 14, py - 14), 7)], FG, a * d, LW)
    solid(ctx, [lambda c: (c.new_sub_path(), c.arc(cx, cy, R, 0, 2 * math.pi))], FG, a * d, LW * 1.4)
    circ(ctx, cx, cy, R - 12, a * d * 0.8, 1.4)
    sweep = math.radians(6 * secs)
    if secs > 0:
        ctx.new_path()
        ctx.move_to(cx, cy)
        ctx.arc(cx, cy, R - 14, -math.pi / 2, -math.pi / 2 + sweep)
        ctx.close_path()
        src(ctx, FG, 0.10 * a)
        ctx.fill()
    for k in range(60):
        th = -math.pi / 2 + 2 * math.pi * k / 60
        L = 16 if k % 5 == 0 else 8
        r0 = R - 14
        line(ctx, [(cx + r0 * math.cos(th), cy + r0 * math.sin(th)),
                   (cx + (r0 - L) * math.cos(th), cy + (r0 - L) * math.sin(th))], a * d * (1 if k % 5 == 0 else 0.6),
             2 if k % 5 == 0 else 1.2, frac=1)
        if k % 5 == 0 and R > 120:
            n = 60 if k == 0 else k
            text(ctx, str(n), cx + (r0 - 38) * math.cos(th), cy + (r0 - 38) * math.sin(th) + 7, R * 0.085, GREY, a * d)
    sx, sy, sr = cx, cy + R * 0.38, R * 0.2
    circ(ctx, sx, sy, sr, a * d * 0.8, 1.4)
    for k in range(30):
        th = -math.pi / 2 + 2 * math.pi * k / 30
        line(ctx, [(sx + sr * math.cos(th), sy + sr * math.sin(th)),
                   (sx + (sr - (6 if k % 5 == 0 else 3)) * math.cos(th), sy + (sr - (6 if k % 5 == 0 else 3)) * math.sin(th))],
             a * d * 0.6, 1)
    th = -math.pi / 2 + 2 * math.pi * (secs / 60) / 30 * 30
    line(ctx, [(sx, sy), (sx + sr * 0.8 * math.cos(th), sy + sr * 0.8 * math.sin(th))], a * d * 0.8, 1.6)
    th = -math.pi / 2 + sweep
    tail = (cx - 0.22 * R * math.cos(th), cy - 0.22 * R * math.sin(th))
    tip = (cx + (R - 24) * math.cos(th), cy + (R - 24) * math.sin(th))
    line(ctx, [tail, tip], a, 2.4)
    circ(ctx, tail[0], tail[1], 6, a, 2)
    circ(ctx, cx, cy, 8, a, fill=True)
    circ(ctx, cx, cy, 3, 1, fill=True, col=BLACK)


def office_chair(ctx, x, facing, a, part="back", seat_y=FLOOR - 66):
    f = facing
    back_x = x - f * 52
    if part in ("back", "all"):
        solid(ctx, [lambda c: (c.save(), c.translate(back_x, seat_y - 70), c.rotate(-f * 0.12),
                               rrect(-11, -82, 11, 82, 9)(c), c.restore()),
                    capsule((back_x + f * 4, seat_y - 6), (x - f * 20, seat_y + 6), 5)], FG, a, LW)
        solid(ctx, [rrect(x - 50, seat_y, x + 50, seat_y + 18, 8)], FG, a, LW)
        solid(ctx, [rrect(x - 6, seat_y + 18, x + 6, FLOOR - 24, 3)], FG, a, LW)
        line(ctx, [(x - 6, seat_y + 40), (x + 6, seat_y + 40)], a * 0.6, 1.4)
        line(ctx, [(x - 52, FLOOR - 18), (x + 52, FLOOR - 18)], a, LW * 1.4)
        for wx in (x - 46, x + 46, x - 8):
            circ(ctx, wx, FLOOR - 8, 8, a, LW)
    if part in ("arm", "all"):
        solid(ctx, [rrect(x - 34, seat_y - 34, x + 30, seat_y - 26, 4), rrect(x - 4, seat_y - 30, x + 4, seat_y + 2, 2)], FG, a, LW)


def board_room(ctx, t, a, d, clock_secs, gauge=0.0, needle=0.0, tags=None, doc_x=None):
    # window with blinds and city lights
    wx0, wy0, wx1, wy1 = 60, 200, 300, 600
    solid(ctx, [rrect(wx0 - 8, wy0 - 8, wx1 + 8, wy1 + 8, 3)], FG, a * d, LW, fill=BLACK)
    r = random.Random(5)
    ctx.save()
    ctx.rectangle(wx0, wy0, wx1 - wx0, wy1 - wy0)
    ctx.clip()
    xb = wx0
    while xb < wx1:
        bw, bh = r.uniform(18, 40), r.uniform(60, 220)
        line(ctx, [(xb, wy1), (xb, wy1 - bh), (xb + bw, wy1 - bh), (xb + bw, wy1)], a * d * 0.25, 1.2)
        for q in range(int(bh // 24)):
            if r.random() < 0.5:
                circ(ctx, xb + r.uniform(4, bw - 4), wy1 - 10 - q * 22, 1.6, a * d * (0.35 + 0.3 * math.sin(t * 0.8 + q)), fill=True)
        xb += bw + r.uniform(2, 8)
    for k in range(26):
        y = wy0 + 6 + k * 15
        line(ctx, [(wx0, y), (wx1, y + 3)], a * d * 0.75, 1.6)
    ctx.restore()
    line(ctx, [(wx1 - 18, wy0), (wx1 - 18, wy1 - 40)], a * d * 0.6, 1.2)
    solid(ctx, [capsule((wx1 - 18, wy1 - 40), (wx1 - 18, wy1 - 28), 3)], FG, a * d * 0.8, 1.2)
    # wall clock -> pressure gauge
    cx, cy, R = 505, 290, 50
    solid(ctx, [lambda c: (c.new_sub_path(), c.arc(cx, cy, R, 0, 2 * math.pi))], FG, a * d, LW * 1.2)
    circ(ctx, cx, cy, R - 6, a * d * 0.6, 1.2)
    ca = 1 - gauge
    for k in range(60):
        th = -math.pi / 2 + 2 * math.pi * k / 60
        L = 7 if k % 5 == 0 else 3
        line(ctx, [(cx + (R - 9) * math.cos(th), cy + (R - 9) * math.sin(th)),
                   (cx + (R - 9 - L) * math.cos(th), cy + (R - 9 - L) * math.sin(th))], a * d * ca * (1 if k % 5 == 0 else 0.5), 1.4)
    if ca > 0:
        for ang, L, w_ in ((math.radians(300), 0.5, 2.6), (math.radians(60), 0.72, 2)):
            th = ang - math.pi / 2
            line(ctx, [(cx, cy), (cx + R * L * math.cos(th), cy + R * L * math.sin(th))], a * d * ca, w_)
        th = -math.pi / 2 + math.radians(6 * clock_secs)
        line(ctx, [(cx - 10 * math.cos(th), cy - 10 * math.sin(th)), (cx + (R - 10) * math.cos(th), cy + (R - 10) * math.sin(th))],
             a * d * ca, 1.3)
    if gauge > 0:
        a0, a1 = math.radians(135), math.radians(405)
        for k in range(28):
            th = a0 + (a1 - a0) * k / 27
            L = 8 if k % 3 == 0 else 4
            line(ctx, [(cx + (R - 9) * math.cos(th), cy + (R - 9) * math.sin(th)),
                       (cx + (R - 9 - L) * math.cos(th), cy + (R - 9 - L) * math.sin(th))], a * gauge * (1 if k % 3 == 0 else 0.5), 1.4)
        ctx.new_path()
        ctx.arc(cx, cy, R - 12, a0 + (a1 - a0) * 0.8, a1)
        ctx.set_line_width(5)
        src(ctx, FG, a * gauge * 0.8)
        ctx.stroke()
        th = a0 + (a1 - a0) * needle
        line(ctx, [(cx - 8 * math.cos(th), cy - 8 * math.sin(th)), (cx + (R - 12) * math.cos(th), cy + (R - 12) * math.sin(th))], a * gauge, 2.2)
        text(ctx, "PSI", cx, cy + 26, 10, GREY, a * gauge, bold=True, track=2)
    circ(ctx, cx, cy, 4, a * d, fill=True)
    # pendant lamp with a soft cone
    lx = 415
    line(ctx, [(lx, 0), (lx, 432)], a * d * 0.8, 1.4)
    g = cairo.LinearGradient(0, 470, 0, 712)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.08 * a * d)
    g.add_color_stop_rgba(1, 1, 1, 1, 0.0)
    ctx.new_path()
    ctx.move_to(lx - 44, 470)
    ctx.line_to(lx + 44, 470)
    ctx.line_to(lx + 175, 712)
    ctx.line_to(lx - 175, 712)
    ctx.close_path()
    ctx.set_source(g)
    ctx.fill()
    solid(ctx, [lambda c: (c.new_sub_path(), c.arc_negative(lx, 470, 46, 0, math.pi), c.close_path()),
                rrect(lx - 7, 424, lx + 7, 436, 3)], FG, a * d, LW)
    line(ctx, [(lx - 46, 470), (lx + 46, 470)], a * d, LW)
    circ(ctx, lx, 474, 6, a * d * 0.9, 1.4, frac=0.5, start=0)
    # price tags
    if tags:
        for val, tx, ty, ta, strike, flip in tags:
            if ta <= 0:
                continue
            ctx.save()
            ctx.translate(tx, ty)
            ctx.scale(1, max(0.02, abs(math.cos(math.pi * flip))))
            solid(ctx, [poly([(-70, -22), (58, -22), (78, 0), (58, 22), (-70, 22)], smooth_it=False)], FG, ta, 1.8)
            circ(ctx, 56, 0, 4, ta, 1.4)
            text(ctx, val, -6, 9, 24, FG, ta, bold=True)
            if strike > 0:
                line(ctx, [(-58, 2), (-58 + 110 * strike, -2)], ta, 2.4)
            ctx.restore()


def board_table(ctx, a, d, doc_x=405):
    solid(ctx, [rrect(250, 712, 580, 730, 6)], FG, a * d, LW)
    line(ctx, [(258, 718), (572, 718)], a * d * 0.45, 1.2)
    solid(ctx, [poly([(398, 730), (432, 730), (424, 826), (406, 826)], smooth_it=False)], FG, a * d, LW)
    solid(ctx, [rrect(330, 826, 500, 836, 4)], FG, a * d, LW)
    # glass of water
    solid(ctx, [poly([(332, 668), (358, 668), (355, 712), (335, 712)], smooth_it=False)], FG, a * d, 1.8)
    line(ctx, [(334, 686), (338, 684), (346, 687), (356, 684)], a * d * 0.8, 1.4)
    line(ctx, [(339, 672), (338, 706)], a * d * 0.4, 1.2)
    # documents + pen
    for k in range(3):
        line(ctx, [(doc_x - 30 + k * 2, 710 - k * 3), (doc_x + 34 + k * 2, 710 - k * 3)], a * d, 1.6)
    solid(ctx, [capsule((doc_x - 18, 699), (doc_x + 22, 696), 2.2)], FG, a * d, 1.2)
    solid(ctx, [rrect(506, 704, 538, 710, 2)], FG, a * d, 1.4)


# ----------------------------------------------------------------- figures in the boardroom
OTHER_X, HERO_X = 200, 632


def seated(torso=4, head=2):
    return rig.P(hy=60, torso=torso, head=head, fL=(46, 0), fR=(52, 0))


def draw_other(ctx, t, a, torso=6, head=2, hands=None, tie_loose=0.0, sweat=0.0, p=None):
    p = p or rig.breathe(seated(torso, head), t, 0.6)
    F.draw(ctx, p, OTHER_X, FLOOR, S, 1, "suit", tie=True, tie_loose=tie_loose, col=(0.78, 0.78, 0.78), a=a,
           hands=hands, sweat=sweat, t=t)


def draw_hero(ctx, t, a, p=None, hands=None, buttoned=0.0, x=HERO_X):
    p = p or rig.breathe(seated(4, 4), t, 0.5)
    F.draw(ctx, p, x, FLOOR, S, -1, "suit", a=a, hands=hands, jacket_buttoned=buttoned, t=t)


def hero_neck(p, x=HERO_X):
    return rig.joints(p, x, FLOOR, S, -1)["neck"]


def steeple(p, x=HERO_X):
    n = hero_neck(p, x)
    return {"L": (n[0] - 50, n[1] + 46), "R": (n[0] - 54, n[1] + 40)}


# ----------------------------------------------------------------- scenes
def sc0(ctx, t, s, a):
    """Seven seconds: a detailed stopwatch, crown pressed, the hand sweeps to 7."""
    press = math.sin(math.pi * prog(t, 0.05, 0.3))
    secs = 7 * eio(prog(t, 0.3, 1.7))
    stopwatch(ctx, 410, 500, 215, secs, a, eo3(prog(t, 0, 0.5)), press)


def tag_state(t):
    """Price tags: value, x, y, alpha, strike, flip for the negotiation."""
    w2, w3 = W_[2], W_[3]
    vals = [("$480,000", w2[0] - 0.2), ("$410,000", w2[9]), ("$395,000", w3[7]), ("$370,000", w3[9]), ("$350,000", w3[13])]
    shown = [k for k, (_, ts) in enumerate(vals) if t >= ts]
    out = []
    if not shown:
        return out
    top = shown[-1]
    for k in shown:
        depth = top - k
        if depth > 2:
            continue
        v, ts = vals[k]
        ap = eo3(prog(t, ts, ts + 0.35))
        y = 600 - depth * 52 - 0 * ap
        x = 415 + depth * 14
        strike_t = vals[k + 1][1] - 0.45 if k + 1 < len(vals) else 1e9
        if k == 0:
            strike_t = W_[2][6]
        strike = eo3(prog(t, strike_t, strike_t + 0.35))
        alpha = ap * (1 - 0.55 * eo3(prog(t, vals[k + 1][1], vals[k + 1][1] + 0.3)) if k + 1 < len(vals) else ap)
        alpha *= 1 - 0.5 * (depth == 2)
        out.append((v, x, y + 10 * (1 - ap), alpha, strike, 0))
    return out


def board(ctx, t, s, a):
    """Lines 1-4 share one continuous boardroom."""
    i = s.i
    first = SCN[1].t0
    d = eo3(prog(t, first, first + 0.9))
    w1, w2, w3, w4 = W_[1], W_[2], W_[3], W_[4]
    ticks = [w1[0] + 0.05 + k * 0.31 for k in range(7)]
    n = sum(eo3(prog(t, tk, tk + 0.09)) for tk in ticks)
    gauge = eio(prog(t, SCN[4].t0, SCN[4].t0 + 0.6))
    needle = 0.08 + 0.86 * eio(prog(t, w4[0], w4[7] + 0.1)) + 0.015 * math.sin(t * 37) * prog(t, w4[2], w4[7])
    board_room(ctx, t, a, d, n, gauge, needle, tag_state(t))
    if t < SCN[2].t0 + 0.3 and t >= ticks[0] - 0.2:
        el = min(7, n)
        text(ctx, f"00:{int(el):02d}", 505, 372, 16, GREY, a * d * (1 - prog(t, SCN[2].t0, SCN[2].t0 + 0.3)), bold=True, track=2)
    office_chair(ctx, 205, 1, a * d, "back")
    office_chair(ctx, 628, -1, a * d, "back")
    # ---- the other man
    broke, lowered, price = w2[3], w2[6], w2[9]
    tbl = 708
    if t < SCN[2].t0:
        drum = max(0, math.sin(t * 15)) * 7
        o_hands = {"L": (282, tbl), "R": (300, tbl - drum)}
        op = rig.breathe(seated(8, 4), t, 0.6)
        draw_other(ctx, t, a * d, p=op, hands=o_hands)
    elif t < SCN[3].t0:
        lean = eio(prog(t, broke - 0.2, broke + 0.3))
        talk = prog(t, broke, SCN[3].t0)
        op = rig.breathe(seated(8 + 12 * lean, 4 + 5 * math.sin(t * 8) * talk), t, 0.6)
        open_ = eio(prog(t, broke, broke + 0.4))
        o_hands = {"L": (lerp(282, 330, open_), lerp(tbl, 650 + 8 * math.sin(t * 7), open_)),
                   "R": (lerp(300, 350, open_), lerp(tbl, 662 + 10 * math.sin(t * 9 + 1), open_))}
        if t > lowered - 0.2:
            pw = eio(prog(t, lowered - 0.2, lowered + 0.2)) * (1 - eio(prog(t, price + 0.2, price + 0.6)))
            o_hands["R"] = (lerp(o_hands["R"][0], 405, pw), lerp(o_hands["R"][1], 700, pw))
        draw_other(ctx, t, a * d, p=op, hands=o_hands)
    elif t < SCN[4].t0:
        ex, ju, ne, th = w3[7], w3[9], w3[11], w3[13]
        op = rig.breathe(seated(18 - 22 * eio(prog(t, th, th + 0.6)), 4 + 5 * math.sin(t * 8)), t, 0.6)
        base_L, base_R = (330, 650), (350, 662)
        hl, hr = base_L, base_R
        if ex <= t < ju:
            ch = abs(math.sin((t - ex) * 9))
            hr = (352, 640 + 40 * ch)
        elif ju <= t < ne:
            jj = eio(prog(t, ju, ju + 0.3))
            nk = (225, 690)
            hr = (lerp(350, nk[0] + 40, jj), lerp(662, nk[1] - 40, jj))
        elif ne <= t < th:
            pp = math.sin((t - ne) * 6)
            hl, hr = (330, 680 + 14 * pp), (350, 684 + 14 * pp)
        elif t >= th:
            dd = eio(prog(t, th, th + 0.6))
            hl, hr = (lerp(330, 282, dd), lerp(650, 708, dd)), (lerp(350, 298, dd), lerp(662, 708, dd))
        draw_other(ctx, t, a * d, p=op, hands={"L": hl, "R": hr})
    else:
        pr, nv = w4[2], w4[4]
        loosen = eio(prog(t, pr - 0.1, pr + 0.7))
        op = rig.breathe(seated(-2, -6 + 8 * loosen), t, 1.2)
        n_ = rig.joints(op, OTHER_X, FLOOR, S, 1)["neck"]
        reach = math.sin(math.pi * prog(t, pr - 0.1, pr + 0.9))
        hr = (lerp(298, n_[0] + 24, reach), lerp(708, n_[1] + 14, reach))
        draw_other(ctx, t, a * d, p=op, hands={"L": (282, 708), "R": hr}, tie_loose=loosen,
                   sweat=prog(t, nv, nv + 1.0))
    # ---- the hero: still; steeples at "themselves"
    th = w3[13]
    st = eio(prog(t, th, th + 0.7))
    hp = rig.breathe(seated(4 - 6 * st, 4 - 4 * st), t, 0.45)
    folded = {"L": (548, 708), "R": (536, 706)}
    sp = steeple(hp)
    hands = {k: (lerp(folded[k][0], sp[k][0], st), lerp(folded[k][1], sp[k][1], st)) for k in "LR"}
    draw_hero(ctx, t, a * d, p=hp, hands=hands)
    office_chair(ctx, 205, 1, a * d, "arm")
    office_chair(ctx, 628, -1, a * d, "arm")
    board_table(ctx, a, d)


def sc_gym(ctx, t, s, a):
    """5 a.m.: dawn window, digital clock, wall-mounted bar; slow reps; the grip trembles but holds."""
    d = eo3(prog(t, s.t0, s.t0 + 0.9))
    w = s.w
    # window with a pre-dawn horizon
    wx0, wy0, wx1, wy1 = 80, 190, 260, 620
    solid(ctx, [rrect(wx0 - 8, wy0 - 8, wx1 + 8, wy1 + 8, 3)], FG, a * d, LW)
    line(ctx, [(wx0 + (wx1 - wx0) / 2, wy0), (wx0 + (wx1 - wx0) / 2, wy1)], a * d, 1.8)
    line(ctx, [(wx0, 405), (wx1, 405)], a * d, 1.8)
    ctx.save()
    ctx.rectangle(wx0, wy0, wx1 - wx0, wy1 - wy0)
    ctx.clip()
    line(ctx, [(wx0, 560), (wx1, 560)], a * d * 0.6, 1.2)
    dawn = prog(t, s.t0, s.t1)
    circ(ctx, 170, 560 + 40 - 30 * dawn, 60, a * d * (0.3 + 0.3 * dawn), 1.2)
    for k, (sx, sy) in enumerate([(110, 230), (215, 260), (140, 320), (230, 350), (190, 220)]):
        circ(ctx, sx, sy, 1.6, a * d * (0.6 - 0.5 * dawn) * (0.6 + 0.4 * math.sin(t * 2 + k)), fill=True)
    ctx.restore()
    line(ctx, [(wx0 - 14, wy1 + 10), (wx1 + 14, wy1 + 10)], a * d, LW)
    # digital clock 05:00
    solid(ctx, [rrect(560, 250, 730, 322, 10)], FG, a * d, LW)
    seg7 = {"0": "abcdef", "5": "afgcd"}
    def digit(x, y, ch):
        Wd, Hd = 22, 40
        P = {"a": [(x, y), (x + Wd, y)], "b": [(x + Wd, y), (x + Wd, y + Hd / 2)], "c": [(x + Wd, y + Hd / 2), (x + Wd, y + Hd)],
             "d": [(x, y + Hd), (x + Wd, y + Hd)], "e": [(x, y + Hd / 2), (x, y + Hd)], "f": [(x, y), (x, y + Hd / 2)],
             "g": [(x, y + Hd / 2), (x + Wd, y + Hd / 2)]}
        for sg in "abcdefg":
            on = sg in seg7[ch]
            line(ctx, P[sg], a * d * (1 if on else 0.08), 3.2)
    for k, ch in enumerate("05"):
        digit(576 + k * 32, 266, ch)
    for k, ch in enumerate("00"):
        digit(662 + k * 32, 266, ch)
    blink = 1 if (t % 1.0) < 0.6 else 0.15
    circ(ctx, 645, 278, 2.5, a * d * blink, fill=True)
    circ(ctx, 645, 296, 2.5, a * d * blink, fill=True)
    text(ctx, "AM", 712, 316, 10, GREY, a * d, bold=True, track=1)
    # wall-mounted bar (side view)
    solid(ctx, [rrect(330, 298, 346, 418, 3)], FG, a * d, LW)
    for by in (312, 404):
        circ(ctx, 338, by, 3, a * d, 1.4)
    solid(ctx, [poly([(346, 330), (470, 334), (470, 348), (346, 372)], smooth_it=False)], FG, a * d, LW)
    solid(ctx, [lambda c: (c.new_sub_path(), c.arc(472, 341, 11, 0, 2 * math.pi))], FG, a * d, LW)
    circ(ctx, 472, 341, 5, a * d * 0.7, 1.2)
    # floor mat + kettlebell
    solid(ctx, [rrect(380, 830, 600, 840, 3)], FG, a * d, 1.8)
    kx = 650
    solid(ctx, [lambda c: (c.new_sub_path(), c.arc(kx, 800, 34, 0, 2 * math.pi)), rrect(kx - 24, 828, kx + 24, 840, 3)], FG, a * d, LW)
    ctx.new_path()
    ctx.arc(kx, 768, 24, math.pi * 1.05, math.pi * 1.95)
    ctx.set_line_width(7)
    src(ctx, FG, a * d)
    ctx.stroke()
    ctx.new_path()
    ctx.arc(kx, 768, 24, math.pi * 1.05, math.pi * 1.95)
    ctx.set_line_width(2.6)
    src(ctx, BLACK, 1)
    ctx.stroke()
    # reps, then the trembling hold
    reps = [w[4], w[10], w[13]]
    up = 0.0
    for r in reps:
        up = max(up, eio(prog(t, r - 0.5, r)) * (1 - eio(prog(t, r, r + 0.5))))
    hold = eio(prog(t, w[14] - 0.35, w[14] + 0.1))
    up = max(up, hold)
    shake = 2.2 * prog(t, w[14], w[14] + 0.3) * (1 - eio(prog(t, w[18], w[18] + 0.5)))
    bar = (472, 341)
    neck_y = lerp(bar[1] + 88, bar[1] + 14, up)
    hip_y = neck_y + rig.LIM["torso"] * S
    jx = shake * math.sin(t * 47)
    hx = 462 + jx
    p = rig.P(hy=(FLOOR - hip_y) / S, torso=-4 + jx * 0.4, head=-6 + 6 * up)
    p = rig.breathe(p, t, 0.5)
    F.draw(ctx, p, hx, FLOOR, S, 1, "tee", a=a * d, hands={"L": (bar[0] - 6, bar[1] - 2), "R": (bar[0] + 4, bar[1] + 1)},
           feet={"L": (hx - 16, hip_y + 112), "R": (hx - 28, hip_y + 104)}, shake=shake * 0.5, t=t)


PIV = (600, 470)
ARM_L, ARM_R = 250, 118
CHAIN = 236


def sc_lever(ctx, t, s, a):
    """Discomfort, held calmly, becomes leverage: the bar becomes a lever; his still weight lifts a steel block."""
    d = eo3(prog(t, s.t0, s.t0 + 0.7))
    w = s.w
    th = math.radians(lerp(12, -10, eio(prog(t, w[3] - 0.1, w[4] + 0.6))))
    c, sn = math.cos(th), math.sin(th)
    left = (PIV[0] - ARM_L * c, PIV[1] - ARM_L * sn)
    right = (PIV[0] + ARM_R * c, PIV[1] + ARM_R * sn)
    # fulcrum A-frame with bracing and ground hatching
    solid(ctx, [poly([(PIV[0], PIV[1] + 6), (PIV[0] + 46, FLOOR - 8), (PIV[0] - 46, FLOOR - 8)], smooth_it=False)], FG, a * d, LW)
    for k in range(1, 5):
        y = lerp(PIV[1] + 30, FLOOR - 20, k / 5)
        half = 46 * (y - PIV[1]) / (FLOOR - 8 - PIV[1])
        line(ctx, [(PIV[0] - half + 6, y), (PIV[0] + half - 6, y + 18)], a * d * 0.5, 1.2)
    solid(ctx, [rrect(PIV[0] - 70, FLOOR - 8, PIV[0] + 70, FLOOR, 2)], FG, a * d, LW)
    for k in range(9):
        x = PIV[0] - 64 + k * 16
        line(ctx, [(x, FLOOR + 4), (x - 10, FLOOR + 16)], a * d * 0.45, 1.2)
    # beam with rivets
    nx, ny = -sn, c
    beam = [(left[0] - nx * 8, left[1] - ny * 8), (right[0] - nx * 8, right[1] - ny * 8),
            (right[0] + nx * 8, right[1] + ny * 8), (left[0] + nx * 8, left[1] + ny * 8)]
    solid(ctx, [poly(beam, smooth_it=False)], FG, a * d, LW)
    for k in range(13):
        u = k / 12
        px, py = lerp(left[0], right[0], u), lerp(left[1], right[1], u)
        circ(ctx, px, py, 1.8, a * d * 0.7, fill=True)
    solid(ctx, [lambda cc: (cc.new_sub_path(), cc.arc(PIV[0], PIV[1], 10, 0, 2 * math.pi))], FG, a * d, LW)
    circ(ctx, PIV[0], PIV[1], 3.5, a * d, fill=True)
    # chain + steel block
    top = (right[0], right[1] + CHAIN)
    n_links = 14
    for k in range(n_links):
        y0 = lerp(right[1] + 6, top[1], k / n_links)
        y1 = lerp(right[1] + 6, top[1], (k + 1) / n_links)
        ctx.save()
        ctx.translate(right[0], (y0 + y1) / 2)
        if k % 2:
            ctx.scale(0.35, 1)
        else:
            ctx.scale(0.8, 1)
        ctx.new_path()
        ctx.arc(0, 0, (y1 - y0) * 0.62, 0, 2 * math.pi)
        ctx.restore()
        ctx.set_line_width(1.6)
        src(ctx, FG, a * d)
        ctx.stroke()
    bx, by, sz, dp = right[0] - 50, top[1], 100, 24
    solid(ctx, [poly([(bx, by + dp), (bx + dp, by), (bx + sz + dp, by), (bx + sz + dp, by + sz), (bx + sz, by + sz + dp),
                      (bx, by + sz + dp)], smooth_it=False)], FG, a * d, LW)
    line(ctx, [(bx, by + dp), (bx + sz, by + dp), (bx + sz + dp, by)], a * d, LW)
    line(ctx, [(bx + sz, by + dp), (bx + sz, by + sz + dp)], a * d, LW)
    for (qx, qy) in ((bx + 10, by + dp + 10), (bx + sz - 10, by + dp + 10), (bx + 10, by + sz + dp - 10), (bx + sz - 10, by + sz + dp - 10)):
        circ(ctx, qx, qy, 3, a * d * 0.8, 1.2)
    for k in range(4):
        line(ctx, [(bx + 24 + k * 16, by + dp + 30), (bx + 24 + k * 16, by + sz + dp - 30)], a * d * 0.3, 1.2)
    lift = by + sz + dp
    if lift < FLOOR - 2:
        ctx.save()
        ctx.translate(bx + sz / 2, FLOOR + 2)
        ctx.scale(1, 0.12)
        circ(ctx, 0, 0, 70 * (1 - (FLOOR - lift) / 120), a * d * 0.25, fill=True)
        ctx.restore()
    # he hangs from the long end, calm
    shake = 1.6 * (1 - eio(prog(t, w[1], w[2] + 0.3)))
    jx = shake * math.sin(t * 47)
    neck_y = left[1] + 14 + 74
    hip_y = neck_y + rig.LIM["torso"] * S
    hx = left[0] - 8 + jx
    p = rig.breathe(rig.P(hy=(FLOOR - hip_y) / S, torso=-4, head=0), t, 0.5)
    F.draw(ctx, p, hx, FLOOR, S, 1, "tee", a=a * d, hands={"L": (left[0] - 6, left[1] - 4), "R": (left[0] + 6, left[1] - 4)},
           feet={"L": (hx - 14, hip_y + 112), "R": (hx - 26, hip_y + 104)}, shake=shake * 0.4, t=t)


def plank_pose(F_, phi_deg):
    phi = math.radians(phi_deg)
    Lg = (rig.LIM["thigh"] + rig.LIM["shin"]) * S
    hip = (F_[0] + math.cos(phi) * Lg, F_[1] - math.sin(phi) * Lg)
    return hip, rig.P(hy=(FLOOR - hip[1]) / S, torso=90 - phi_deg, head=8)


def hourglass(ctx, cx, a, flow):
    top, bot = 600, 834
    solid(ctx, [rrect(cx - 56, top - 12, cx + 56, top, 4), rrect(cx - 56, bot, cx + 56, bot + 6, 3)], FG, a, LW)
    for x in (cx - 48, cx + 48):
        solid(ctx, [rrect(x - 4, top, x + 4, bot, 3)], FG, a, 1.8)
    mid = (top + bot) / 2
    bulb = [(cx - 36, top + 6), (cx + 36, top + 6), (cx + 30, mid - 40), (cx + 4, mid - 4), (cx + 4, mid + 4),
            (cx + 30, mid + 40), (cx + 36, bot - 6), (cx - 36, bot - 6), (cx - 30, mid + 40), (cx - 4, mid + 4),
            (cx - 4, mid - 4), (cx - 30, mid - 40)]
    solid(ctx, [poly(bulb)], FG, a, 1.8)
    hs = 70 * (1 - flow)
    ctx.save()
    ctx.new_path()
    F.smooth(ctx, bulb)
    ctx.clip()
    ctx.new_path()
    ctx.move_to(cx - 40, mid - 6 - hs)
    ctx.line_to(cx + 40, mid - 6 - hs)
    ctx.line_to(cx + 4, mid - 4)
    ctx.line_to(cx - 4, mid - 4)
    ctx.close_path()
    src(ctx, FG, 0.55 * a)
    ctx.fill()
    hb = 16 + 60 * flow
    ctx.new_path()
    ctx.move_to(cx - 40, bot - 6)
    ctx.line_to(cx + 40, bot - 6)
    ctx.line_to(cx + 8, bot - 6 - hb)
    ctx.line_to(cx - 8, bot - 6 - hb)
    ctx.close_path()
    src(ctx, FG, 0.55 * a)
    ctx.fill()
    ctx.restore()
    line(ctx, [(cx, mid), (cx, bot - 8 - hb)], a * 0.7, 1.2, dash=[3, 4])


def sc_hold(ctx, t, s, a):
    """Train the body to hold: a timed plank. The mind learns to wait: seated stillness beside an hourglass."""
    w = s.w
    cut = w[5] - 0.15
    d = eo3(prog(t, s.t0, s.t0 + 0.6))
    a1 = a * d * (1 - eio(prog(t, cut - 0.2, cut + 0.2)))
    a2 = a * eio(prog(t, cut - 0.2, cut + 0.25))
    if a1 > 0:
        solid(ctx, [rrect(150, 830, 560, 840, 3)], FG, a1, 1.8)
        trem = 1.0 * math.sin(t * 41)
        Fp = (186, FLOOR - 4)
        hip, p = plank_pose(Fp, 13)
        p["hy"] += trem * 0.3
        J = rig.joints(p, hip[0], FLOOR, S, 1)
        sh = J["neck"]
        F.draw(ctx, p, hip[0], FLOOR, S, 1, "tee", a=a1,
               hands={"L": (sh[0] + 36, FLOOR - 6), "R": (sh[0] + 44, FLOOR - 6)}, feet={"L": Fp, "R": (Fp[0] - 6, Fp[1])})
        secs = 60 * prog(t, s.t0, cut) * 0.75
        stopwatch(ctx, 360, 520, 84, secs, a1)
        hl = w[4]
        u = prog(t, hl, hl + 0.6)
        if 0 < u < 1:
            circ(ctx, 360, 520, 84 + 40 * eo3(u), a1 * (1 - u), 1.6)
    if a2 > 0:
        flow = prog(t, cut, s.t1)
        hourglass(ctx, 560, a2, flow)
        cx = 330
        hip = (cx, FLOOR - 26 * S)
        p = rig.breathe(rig.P(hy=26, torso=0, head=6, hL=(40, 62), hR=(46, 58)), t, 1.0)
        knees = {"L": (hip[0] + 46 * S, hip[1] + 16 * S), "R": (hip[0] + 52 * S, hip[1] + 10 * S)}
        J = rig.joints(p, cx, FLOOR, S, 1, None, {"L": (hip[0] + 10 * S, FLOOR - 2), "R": (hip[0] + 22 * S, FLOOR - 9)})
        F.draw(ctx, p, cx, FLOOR, S, 1, "tee", a=a2, hands={"L": knees["L"], "R": knees["R"]},
               feet={"L": (hip[0] + 10 * S, FLOOR - 2), "R": (hip[0] + 22 * S, FLOOR - 9)})


def sc_board2(ctx, t, s, a):
    """Whoever can wait owns the room: the other man slides the papers across; he stands and buttons his jacket."""
    d = eo3(prog(t, s.t0, s.t0 + 0.7))
    w = s.w
    board_room(ctx, t, a, d, 7 + (t - s.t0), 0, 0, None)
    office_chair(ctx, 205, 1, a * d, "back")
    roll = 40 * eio(prog(t, w[4] - 0.1, w[4] + 0.5))
    office_chair(ctx, 628 + roll, -1, a * d, "back")
    if roll > 20:
        office_chair(ctx, 628 + roll, -1, a * d, "arm")
    # papers slide
    slide = eio(prog(t, w[1], w[3] + 0.1))
    doc_x = lerp(405, 500, slide)
    rise = math.sin(math.pi * prog(t, w[0] - 0.1, w[3] + 0.7))
    op = rig.mix(seated(8, 4), rig.P(hy=84, torso=34, head=10, fL=(-6, 0), fR=(14, 0)), eio(clamp(rise * 1.3)))
    op = rig.breathe(op, t, 0.6)
    look = eio(prog(t, w[4], w[4] + 0.5))
    op["head"] += -18 * look
    hand = (doc_x - 20, 700) if slide < 1 or rise > 0.2 else (290, 708)
    draw_other(ctx, t, a * d, p=op, hands={"L": (282, 708), "R": hand})
    # he rises, then buttons the jacket
    up = eio(prog(t, w[4] - 0.05, w[4] + 0.55))
    hp = rig.mix(seated(4, 4), rig.P(torso=-2, head=-4), up)
    hp = rig.breathe(hp, t, 0.5)
    hx = HERO_X + 12 * up
    btn = eio(prog(t, w[6] - 0.1, w[6] + 0.35))
    n = rig.joints(hp, hx, FLOOR, S, -1)["neck"]
    if up < 1:
        hands = {"L": (548, 708), "R": (536, 706)}
        hands = {k: (lerp(hands[k][0], n[0] - 20, up), lerp(hands[k][1], n[1] + 80, up)) for k in "LR"}
    else:
        bt = (n[0] - 26, n[1] + 52)
        hands = {"L": (lerp(n[0] - 14, bt[0] + 2, btn), lerp(n[1] + 84, bt[1], btn)),
                 "R": (lerp(n[0] - 22, bt[0] - 4, btn), lerp(n[1] + 80, bt[1] + 2, btn))}
        if t > w[6] + 0.45:
            back = eio(prog(t, w[6] + 0.45, w[6] + 0.9))
            hands = {"L": (lerp(hands["L"][0], n[0] - 8, back), lerp(hands["L"][1], n[1] + 84, back)),
                     "R": (lerp(hands["R"][0], n[0] - 14, back), lerp(hands["R"][1], n[1] + 82, back))}
    draw_hero(ctx, t, a * d, p=hp, hands=hands, buttoned=btn, x=hx)
    office_chair(ctx, 205, 1, a * d, "arm")
    if roll <= 20:
        office_chair(ctx, 628 + roll, -1, a * d, "arm")
    board_table(ctx, a, d, doc_x)


def sc_end(ctx, t, s, a):
    """The Complete Fighter: the stopwatch returns, stopped at seven."""
    d = eo3(prog(t, s.t0, s.t0 + 0.6))
    press = math.sin(math.pi * prog(t, s.w[2] - 0.1, s.w[2] + 0.2))
    stopwatch(ctx, 420, 500, 200, 7, a, d, press)


SCENES = [sc0, board, board, board, board, sc_gym, sc_lever, sc_hold, sc_board2, sc_end]


# ----------------------------------------------------------------- text block
TIER = {
    "o": dict(face="Inter", weight=cairo.FONT_WEIGHT_BOLD, size=19, track=7, col=(0.58, 0.58, 0.58), gap=24),
    "t": dict(face="Inter Display", weight=cairo.FONT_WEIGHT_BOLD, size=72, track=0, col=FG, gap=16),
    "s": dict(face="Inter", weight=cairo.FONT_WEIGHT_NORMAL, size=30, track=0, col=(0.72, 0.72, 0.72), gap=16),
}
_mc = cairo.Context(cairo.ImageSurface(cairo.FORMAT_ARGB32, 8, 8))


def setf(ctx, tier, size):
    f = TIER[tier]
    ctx.select_font_face(f["face"], cairo.FONT_SLANT_NORMAL, f["weight"])
    ctx.set_font_size(size)


def word_w(text_, tier, size):
    setf(_mc, tier, size)
    tr = TIER[tier]["track"]
    return sum(_mc.text_extents(ch).x_advance + tr for ch in text_) - tr if tr else _mc.text_extents(text_).x_advance


def layout(i):
    times = SCN[i].w
    n = 0
    rows = []
    for entry in LINES[i]["show"]:
        tier, txt = entry[0], entry[1]
        static = len(entry) > 2 and entry[2] == "static"
        words = txt.split()
        size = TIER[tier]["size"]
        setf(_mc, tier, size)
        sp = _mc.text_extents(" ").x_advance + TIER[tier]["track"] * 2
        width = sum(word_w(w_, tier, size) for w_ in words) + sp * (len(words) - 1)
        if width > TXW:
            size *= TXW / width
            setf(_mc, tier, size)
            sp = _mc.text_extents(" ").x_advance + TIER[tier]["track"] * 2
            width = sum(word_w(w_, tier, size) for w_ in words) + sp * (len(words) - 1)
        items, x = [], TXC - width / 2
        for w_ in words:
            if static:
                wt = SCN[i].t0 + 0.35
            else:
                wt = times[n]
                n += 1
            items.append((w_, x, wt))
            x += word_w(w_, tier, size) + sp
        rows.append(dict(tier=tier, size=size, items=items, cap=0.73 * size))
    total = sum(r["cap"] for r in rows) + sum(TIER[r["tier"]]["gap"] for r in rows[:-1])
    y = TYC - total / 2
    for r in rows:
        y += r["cap"]
        r["base"] = y
        y += TIER[r["tier"]]["gap"]
    return rows


LAYOUTS = [layout(i) for i in range(len(SCN))]


def draw_text(ctx, t, i):
    s = SCN[i]
    out = 1 - eo3(prog(t, s.t1 - 0.35, s.t1)) if i < len(SCN) - 1 else 1
    for r in LAYOUTS[i]:
        f = TIER[r["tier"]]
        for w_, x, wt in r["items"]:
            e = eo3(prog(t, wt - 0.05, wt + 0.4))
            al = e * out
            if al <= 0:
                continue
            setf(ctx, r["tier"], r["size"])
            src(ctx, f["col"], al)
            y = r["base"] + 10 * (1 - e)
            if f["track"]:
                xx = x
                for ch in w_:
                    ctx.move_to(xx, y)
                    ctx.show_text(ch)
                    xx += ctx.text_extents(ch).x_advance + f["track"]
            else:
                ctx.move_to(x, y)
                ctx.show_text(w_)
    if i == len(SCN) - 1:
        bio = s.w[5]
        u = eo3(prog(t, bio + 0.1, bio + 0.5))
        if u > 0:
            r = LAYOUTS[i][-1]
            w_, x, _ = r["items"][-1]
            ax = x + word_w(w_, "s", r["size"]) + 24
            bob = 5 * math.sin((t - bio) * 4) if t < FREEZE else 0
            yb = r["base"] - 4 - bob
            line(ctx, [(ax, yb), (ax, yb - 28 * u)], u, 2.2)
            line(ctx, [(ax - 8, yb - 28 * u + 8), (ax, yb - 28 * u), (ax + 8, yb - 28 * u + 8)], u, 2.2)


# ----------------------------------------------------------------- frame
def scene_index(t):
    for s in SCN:
        if s.t0 <= t < s.t1:
            return s.i
    return len(SCN) - 1


def render(t):
    t = min(t, FREEZE)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ctx.set_antialias(cairo.ANTIALIAS_BEST)
    fo = cairo.FontOptions()
    fo.set_antialias(cairo.ANTIALIAS_GRAY)
    fo.set_hint_style(cairo.HINT_STYLE_NONE)
    fo.set_hint_metrics(cairo.HINT_METRICS_OFF)
    ctx.set_font_options(fo)
    src(ctx, BLACK)
    ctx.paint()
    i = scene_index(t)
    s = SCN[i]
    st0, st1 = set_span(i)
    a = eo3(prog(t, st0, st0 + 0.45))
    if st1 < END:
        a *= 1 - eio(prog(t, st1 - 0.4, st1))
    ctx.push_group()
    ctx.save()
    k = 1 + 0.025 * prog(t, st0, st1)
    ctx.translate(400, FLOOR)
    ctx.scale(k, k)
    ctx.translate(-400 - 12 * prog(t, st0, st1), -FLOOR)
    SCENES[i](ctx, t, s, 1.0)
    ctx.restore()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(a)
    line(ctx, [(0, FLOOR), (W, FLOOR)], 1, 2.6)
    off = (t * 18) % 220
    for q in range(-1, 8):
        x = q * 220 - off
        line(ctx, [(x, FLOOR + 32), (x + 70, FLOOR + 32)], 0.4, 1.8)
    draw_text(ctx, t, i)
    return surf


def frame_bytes(n):
    return bytes(render(n / FPS).get_data())


def ensure_fonts():
    dst = os.path.expanduser("~/.fonts")
    os.makedirs(dst, exist_ok=True)
    added = False
    for f in ("Inter-Bold.otf", "Inter-Regular.otf", "InterDisplay-Bold.otf"):
        if not os.path.exists(os.path.join(dst, f)) and os.path.exists(os.path.join(VIDEO, "fonts", f)):
            subprocess.run(["cp", os.path.join(VIDEO, "fonts", f), dst], check=True)
            added = True
    if added:
        subprocess.run(["fc-cache", "-f"], check=False)


def main():
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "--frames":
        for a in sys.argv[2:]:
            render(float(a)).write_to_png(os.path.join(OUT, f"check_{float(a):05.2f}.png"))
        return
    render(1.55).write_to_png(os.path.join(OUT, "cover.png"))
    n = int(round(END * FPS))
    vid = os.path.join(OUT, "_video.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-tune", "animation", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-movflags", "+faststart", vid]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for k, b in enumerate(pool.imap(frame_bytes, range(n), chunksize=6)):
            ff.stdin.write(b)
            if k % 150 == 0:
                print(f"frame {k}/{n}", flush=True)
    ff.stdin.close()
    ff.wait()
    final = os.path.join(OUT, "the_pause_4x3.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", os.path.join(OUT, "voice.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", f"{END:.3f}", "-movflags", "+faststart", final], check=True)
    os.remove(vid)
    print("wrote", final, f"({END:.2f}s)")


if __name__ == "__main__":
    ensure_fonts()
    main()
