#!/usr/bin/env python3
"""Video 4, "Quiet power": 4:3 (1440x1080), ultra-minimal.

Pure black, thin white line art, one continuous floor line, a clean title block
on the right (Inter), slow eased motion. The figure uses rig.py (video 3) with a
minimal outline style; every action is timed to the narration.

  python3 render_v4.py                  # full render + mux with out/voice.wav
  python3 render_v4.py --frames 1.2 5.0 # PNG stills for checking
"""
import importlib.util, json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(HERE)
sys.path.insert(0, VIDEO)
sys.path.insert(0, os.path.join(VIDEO, "v3"))
from render import prog, eo3, eio, lerp, clamp  # noqa: E402
import rig  # noqa: E402

_spec = importlib.util.spec_from_file_location("script_v4", os.path.join(HERE, "script.py"))
_sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sc)
LINES = _sc.LINES
OUT = os.path.join(HERE, "out")

W, H, FPS = 1440, 1080, 30
FLOOR = 820
S = 1.2                    # figure scale
FG = (0.95, 0.95, 0.95)
BLACK = (0.0, 0.0, 0.0)
TXC, TXW, TYC = 1085, 540, 455   # text block centre x, max width, centre y


def src(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def line(ctx, pts, a=1.0, lw=3.0, frac=1.0, col=FG, close=False):
    if a <= 0 or frac <= 0:
        return
    if close:
        pts = list(pts) + [pts[0]]
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    left = sum(seg) * clamp(frac)
    ctx.move_to(*pts[0])
    for i, L in enumerate(seg):
        if left >= L:
            ctx.line_to(*pts[i + 1])
            left -= L
        else:
            u = left / L if L else 0
            ctx.line_to(lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u))
            break
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    src(ctx, col, a)
    ctx.stroke()


def circ(ctx, x, y, r, a=1.0, lw=3.0, frac=1.0, start=-math.pi / 2, fill=False, col=FG):
    if a <= 0 or frac <= 0:
        return
    ctx.new_sub_path()
    ctx.arc(x, y, r, start, start + 2 * math.pi * clamp(frac))
    src(ctx, col, a)
    if fill:
        ctx.fill()
    else:
        ctx.set_line_width(lw)
        ctx.stroke()


def rect(ctx, x0, y0, x1, y1, a=1.0, lw=3.0, frac=1.0):
    line(ctx, [(x0, y1), (x0, y0), (x1, y0), (x1, y1)], a, lw, frac)


# ----------------------------------------------------------------- timeline
TIM = json.load(open(os.path.join(OUT, "timings.json")))


class Sc:
    pass


SCN = []
for i, L in enumerate(TIM["lines"]):
    s = Sc()
    s.i, s.w = i, [t for _, t in L["words"]]
    s.t0 = 0.0 if i == 0 else L["start"] - 0.4
    SCN.append(s)
for i, s in enumerate(SCN):
    s.t1 = SCN[i + 1].t0 if i + 1 < len(SCN) else TIM["speech_end"] + 2.3
END = SCN[-1].t1
FREEZE = END - 1.0


# ----------------------------------------------------------------- figure (minimal outline style)
def man(ctx, p, x, ground=FLOOR, s=S, a=1.0, facing=1, hands=None, feet=None, knees=None, col=FG, lw=3.4):
    if a <= 0:
        return None
    J = rig.joints(p, x, ground, s, facing, hands, feet)
    if knees:
        for k, v in knees.items():
            J["knee" + k] = v
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_width(lw)
    for side, al in (("L", a * 0.42), ("R", a)):
        ctx.move_to(*J["neck"])
        ctx.line_to(*J["elbow" + side])
        ctx.line_to(*J["hand" + side])
        ctx.move_to(*J["hip"])
        ctx.line_to(*J["knee" + side])
        ctx.line_to(*J["foot" + side])
        fx, fy = J["foot" + side]
        ctx.line_to(fx + facing * 11 * s, fy)
        src(ctx, col, al)
        ctx.stroke()
    ctx.move_to(*J["hip"])
    ctx.line_to(*J["neck"])
    src(ctx, col, a)
    ctx.stroke()
    hr = rig.LIM["head"] * s * 0.92
    circ(ctx, J["head"][0], J["head"][1], hr, a, lw, col=col)
    return J


def seated(hy=60, torso=4, head=2, fx=(34, 40), hands=((30, 60), (36, 58))):
    return rig.P(hy=hy, torso=torso, head=head, fL=(fx[0], 0), fR=(fx[1], 0), hL=hands[0], hR=hands[1])


# ----------------------------------------------------------------- scenes (props + action)
def chair(ctx, x, facing, a, frac=1.0, seat_y=FLOOR - 72):
    back = x - facing * 44
    line(ctx, [(back, FLOOR), (back, seat_y - 105)], a, 3, frac)
    line(ctx, [(back, seat_y), (x + facing * 40, seat_y), (x + facing * 40, FLOOR)], a, 3, frac)


def table(ctx, x0, x1, top, a, frac=1.0):
    line(ctx, [(x0 - 10, top), (x1 + 10, top)], a, 3, frac)
    line(ctx, [(x0 + 12, top), (x0 + 12, FLOOR)], a, 3, frac)
    line(ctx, [(x1 - 12, top), (x1 - 12, FLOOR)], a, 3, frac)


def sc0(ctx, t, s, a):
    """Five rules of quiet power: armchair by a moonlit window; he lifts his gaze and steeples his fingers."""
    d = eo3(prog(t, s.t0, s.t0 + 0.9))
    rect(ctx, 110, 330, 330, 600, a, 3, d)
    line(ctx, [(220, 330), (220, 600)], a, 2.5, d)
    line(ctx, [(110, 465), (330, 465)], a, 2.5, d)
    line(ctx, [(96, 600), (344, 600)], a, 3, d)
    ctx.save()
    ctx.rectangle(112, 332, 216, 266)
    ctx.clip()
    circ(ctx, 285, 380, 20, a * d, 2.5)
    ctx.new_sub_path()
    ctx.arc(293, 374, 18, 0, 2 * math.pi)
    src(ctx, BLACK, 1)
    ctx.fill()
    for k, (sx, sy) in enumerate([(140, 360), (180, 410), (250, 520), (150, 540), (305, 450)]):
        tw = 0.5 + 0.5 * math.sin(t * 2.3 + k * 1.7)
        circ(ctx, sx, sy, 1.8, a * d * (0.3 + 0.6 * tw), fill=True)
    ctx.restore()
    for k, x in enumerate((350, 362)):
        pts = [(x + 4 * math.sin(t * 0.8 + y / 40 + k), y) for y in range(318, 612, 14)]
        line(ctx, pts, a * 0.7, 2, d)
    # armchair facing right
    cx, sy = 505, FLOOR - 80
    line(ctx, [(cx - 62, FLOOR), (cx - 58, sy), (cx + 58, sy), (cx + 62, FLOOR)], a, 3, d)
    line(ctx, [(cx - 58, sy), (cx - 78, sy - 150)], a, 3, d)
    line(ctx, [(cx - 50, sy - 34), (cx + 52, sy - 34), (cx + 56, sy)], a, 3, d)
    # floor lamp with a soft cone
    lx = 640
    line(ctx, [(lx - 26, FLOOR), (lx + 26, FLOOR)], a, 3, d)
    line(ctx, [(lx, FLOOR), (lx, 520)], a, 3, d)
    line(ctx, [(lx - 20, 478), (lx + 20, 478), (lx + 36, 520), (lx - 36, 520)], a, 3, d, close=True)
    g = cairo.LinearGradient(0, 520, 0, FLOOR)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.07 * a * d)
    g.add_color_stop_rgba(1, 1, 1, 1, 0)
    ctx.move_to(lx - 36, 520)
    ctx.line_to(lx + 36, 520)
    ctx.line_to(lx + 125, FLOOR)
    ctx.line_to(lx - 125, FLOOR)
    ctx.close_path()
    ctx.set_source(g)
    ctx.fill()
    qu, pw = s.w[3], s.w[4]
    p = rig.anim(t, [(s.t0, seated(hy=66, torso=-14, head=16, fx=(40, 48), hands=((30, 64), (36, 62)))),
                     (qu - 0.1, seated(hy=66, torso=-14, head=16, fx=(40, 48), hands=((30, 64), (36, 62)))),
                     (qu + 0.5, seated(hy=66, torso=-12, head=-4, fx=(40, 48), hands=((30, 64), (36, 62)))),
                     (pw + 0.05, seated(hy=66, torso=-12, head=-4, fx=(40, 48), hands=((30, 64), (36, 62)))),
                     (pw + 0.6, seated(hy=66, torso=-10, head=-6, fx=(40, 48), hands=((40, 26), (44, 22))))], lag=0.08)
    p = rig.breathe(p, t, 0.8)
    man(ctx, p, cx - 10, a=a)


def sc1(ctx, t, s, a):
    """Rule one, say less: across a table the other man talks and gestures; he stays still and nods once."""
    d = eo3(prog(t, s.t0, s.t0 + 0.8))
    top = FLOOR - 98
    table(ctx, 330, 530, top, a, d)
    chair(ctx, 250, 1, a, d)
    chair(ctx, 610, -1, a, d)
    less, know = s.w[3], s.w[6]
    talk = 1 - eo3(prog(t, know, know + 0.6))
    o = seated(hy=60, torso=8 + 4 * math.sin(t * 6) * talk, head=4 + 6 * math.sin(t * 7.5) * talk,
               fx=(34, 40), hands=((46 + 18 * math.sin(t * 8.3) * talk, 24 + 12 * math.cos(t * 6.1) * talk),
                                   (52 + 16 * math.sin(t * 9.1 + 1) * talk, 14 + 14 * math.cos(t * 7.3) * talk)))
    Jo = man(ctx, o, 250, a=a * 0.5)
    if Jo:
        hx, hy = Jo["head"]
        for q in range(3):
            u = ((t * 1.8 + q / 3) % 1)
            r = 22 + 40 * u
            ctx.new_sub_path()
            ctx.arc(hx + 14, hy, r, -0.5, 0.5)
            ctx.set_line_width(2)
            src(ctx, FG, 0.45 * a * talk * (1 - u))
            ctx.stroke()
    nod = math.sin(math.pi * prog(t, less, less + 0.7))
    p = seated(hy=60, torso=6, head=2 + 16 * nod, fx=(34, 40), hands=((44, 44), (40, 40)))
    p = rig.breathe(p, t, 0.6)
    man(ctx, p, 610, a=a, facing=-1, hands={"L": (472, top - 4), "R": (462, top - 6)})


def sc2(ctx, t, s, a):
    """Rule two, don't react, respond: the opponent slams a piece; he waits, then moves his piece calmly."""
    d = eo3(prog(t, s.t0, s.t0 + 0.8))
    top = FLOOR - 98
    table(ctx, 330, 530, top, a, d)
    chair(ctx, 250, 1, a, d)
    chair(ctx, 610, -1, a, d)
    line(ctx, [(355, top - 1), (505, top - 1)], a, 6, d)
    react, resp = s.w[3], s.w[4]
    jump = 6 * math.sin(math.pi * prog(t, react + 0.05, react + 0.3))

    def piece(x, y, sc=1.0, knight=False):
        if knight:
            line(ctx, [(x - 7 * sc, y), (x - 7 * sc, y - 14 * sc), (x - 2 * sc, y - 24 * sc), (x + 8 * sc, y - 18 * sc),
                       (x + 2 * sc, y - 14 * sc), (x + 7 * sc, y), (x - 7 * sc, y)], a * d, 2.5)
        else:
            line(ctx, [(x - 6, y), (x + 6, y)], a * d, 2.5)
            line(ctx, [(x, y), (x, y - 12)], a * d, 2.5)
            circ(ctx, x, y - 17, 5, a * d, 2.5)
    for x in (372, 398):
        piece(x, top - 4 - jump * (1 if x == 398 else 0.6))
    piece(432, top - 4 - jump)
    # the opponent slams a piece on REACT
    sl = prog(t, react - 0.25, react + 0.05)
    o_hand = (lerp(300 + 46 * 1.2, 410, eio(sl)), lerp(top - 60, top - 10, eo3(sl)))
    if t > react + 0.05:
        o_hand = (lerp(410, 330, eio(prog(t, react + 0.3, react + 0.8))), lerp(top - 10, top - 40, eio(prog(t, react + 0.3, react + 0.8))))
    o = seated(hy=60, torso=12, head=8, fx=(34, 40), hands=((40, 50), (60, 30)))
    man(ctx, o, 250, a=a * 0.5, hands={"R": o_hand})
    u = prog(t, react + 0.05, react + 0.4)
    if 0 < u < 1:
        for k in (-1, 0, 1):
            ang = -math.pi / 2 + k * 0.6
            r0, r1 = 26 + 20 * eo3(u), 40 + 30 * eo3(u)
            line(ctx, [(410 + r0 * math.cos(ang), top - 18 + r0 * math.sin(ang)),
                       (410 + r1 * math.cos(ang), top - 18 + r1 * math.sin(ang))], a * (1 - u), 2.5)
    # his knight: reach, lift, move, release
    kx0, kx1 = 482, 452
    reach = eio(prog(t, resp, resp + 0.35))
    move = eio(prog(t, resp + 0.35, resp + 0.8))
    back = eio(prog(t, resp + 0.85, resp + 1.25))
    kx = lerp(kx0, kx1, move)
    ky = top - 4 - 30 * math.sin(math.pi * move)
    piece(kx, ky, 1.1, knight=True)
    rest = (520, top - 44)
    grip = (kx + 2, ky - 26)
    hand = (lerp(rest[0], grip[0], reach), lerp(rest[1], grip[1], reach)) if back == 0 else \
        (lerp(grip[0], rest[0], back), lerp(grip[1], rest[1], back))
    p = seated(hy=60, torso=8 + 8 * reach * (1 - back), head=10, fx=(34, 40), hands=((10, -6), (30, 40)))
    p = rig.breathe(p, t, 0.6)
    chin = rig.joints(p, 610, FLOOR, S, -1)["head"]
    man(ctx, p, 610, a=a, facing=-1, hands={"L": (chin[0] - 4, chin[1] + 20), "R": hand})


def sc3(ctx, t, s, a):
    """Rule three, master your body: pull-ups in a doorway; the week's calendar ticks off; he drops down."""
    d = eo3(prog(t, s.t0, s.t0 + 0.8))
    x0, x1, lint, bar = 300, 520, 330, 372
    line(ctx, [(x0, FLOOR), (x0, lint), (x1, lint), (x1, FLOOR)], a, 3, d)
    line(ctx, [(x0 - 12, bar), (x1 + 12, bar)], a, 4, d)
    for x in (x0, x1):
        line(ctx, [(x, bar - 10), (x, bar + 10)], a, 5, d)
    cx0, cy0 = 590, 440
    rect(ctx, cx0, cy0, cx0 + 140, cy0 + 96, a, 2.5, d)
    line(ctx, [(cx0, cy0 + 26), (cx0 + 140, cy0 + 26)], a, 2, d)
    ev, day = s.w[6], s.w[7]
    for k in range(7):
        bx = cx0 + 12 + k * 18
        rect(ctx, bx, cy0 + 50, bx + 12, cy0 + 62, a * 0.8, 1.8, d)
        tk = eo3(prog(t, ev + k * 0.07, ev + k * 0.07 + 0.18))
        line(ctx, [(bx + 2, cy0 + 56), (bx + 5, cy0 + 60), (bx + 11, cy0 + 50)], a, 2, tk)
    reps = [s.w[2], s.w[4], s.w[5]]
    up = 0.0
    for r in reps:
        up = max(up, eio(prog(t, r - 0.38, r)) * (1 - eio(prog(t, r, r + 0.38))))
    hx = 418
    neck_hang, neck_top = bar + 86, bar + 6
    drop = eio(prog(t, day + 0.1, day + 0.5))
    if drop <= 0:
        neck_y = lerp(neck_hang, neck_top, up)
        hip = (hx - 4, neck_y + rig.LIM["torso"] * S)
        p = rig.P(hy=(FLOOR - hip[1]) / S, torso=-3, head=-4 + 6 * up)
        p = rig.breathe(p, t, 0.5)
        sw = 3 * math.sin(t * 2.2)
        man(ctx, p, hx + sw, a=a, hands={"L": (hx + 8, bar), "R": (hx + 20, bar)},
            feet={"L": (hx - 14 + sw, hip[1] + 92), "R": (hx - 24 + sw, hip[1] + 86)})
    else:
        hang_hip = neck_hang + rig.LIM["torso"] * S
        hy = lerp((FLOOR - hang_hip) / S, 91, drop)
        settle = rig.anim(t, [(day + 0.5, "stand"), (day + 0.9, rig.P(head=12, hR=(30, 50)))], lag=0.05)
        p = rig.mix(rig.P(hy=(FLOOR - hang_hip) / S, torso=-3, hL=(8, -80), hR=(18, -80)), settle, drop)
        p["hy"] = hy
        man(ctx, p, hx, a=a)


def sc4(ctx, t, s, a):
    """Rule four, move in silence: a slow walk down a night street under lamps."""
    d = eo3(prog(t, s.t0, s.t0 + 0.8))
    r = random.Random(4)
    xb = 0
    while xb < 760:
        w_ = r.uniform(50, 110)
        h_ = r.uniform(60, 200)
        rect(ctx, xb, FLOOR - h_, xb + w_ - 8, FLOOR, a * 0.18, 2, d)
        xb += w_
    for lx in (110, 350, 590):
        g = cairo.LinearGradient(0, 400, 0, FLOOR)
        g.add_color_stop_rgba(0, 1, 1, 1, 0.09 * a * d)
        g.add_color_stop_rgba(1, 1, 1, 1, 0.0)
        ctx.move_to(lx + 32, 400)
        ctx.line_to(lx + 48, 400)
        ctx.line_to(lx + 150, FLOOR)
        ctx.line_to(lx - 70, FLOOR)
        ctx.close_path()
        ctx.set_source(g)
        ctx.fill()
        line(ctx, [(lx, FLOOR), (lx, 380)] + R_bez((lx, 380), (lx, 350), (lx + 30, 350), (lx + 40, 372)), a, 3, d)
        line(ctx, [(lx + 28, 388), (lx + 52, 388), (lx + 46, 400), (lx + 34, 400)], a, 2.5, d, close=True)
    xs, xe = 70, 640
    u = prog(t, s.t0 + 0.15, s.t1 - 0.1)
    dist = (xe - xs) * u
    x = xs + dist
    p = rig.walk(dist, S, A=19, lift=9, swing=9)
    p["head"] = 4
    ctx.save()
    ctx.translate(x, FLOOR + 4)
    ctx.scale(1, 0.12)
    circ(ctx, 0, 0, 60, a * 0.18, fill=True)
    ctx.restore()
    man(ctx, p, x, a=a)


def R_bez(p0, p1, p2, p3, n=16):
    out = []
    for i in range(1, n + 1):
        u = i / n
        m = 1 - u
        out.append((m ** 3 * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u ** 3 * p3[0],
                    m ** 3 * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u ** 3 * p3[1]))
    return out


def sc5(ctx, t, s, a):
    """Rule five, let them underestimate you: two laugh and point; on YOU he lifts his head; they step back."""
    you = s.w[5]
    stop = eio(prog(t, you + 0.15, you + 0.6))
    back = eio(prog(t, you + 0.25, you + 0.9))
    for k, x in enumerate((140, 260)):
        lg = (1 - stop)
        p = rig.P(hy=90 - 2 * abs(math.sin(t * 9 + k)) * lg, torso=4 + 5 * math.sin(t * 9 + k) * lg,
                  head=-8 * lg + 6 * math.sin(t * 9 + k) * lg,
                  hL=(lerp(20, -4, stop), lerp(46, 70, stop)) if k == 0 else (lerp(78, 8, stop), lerp(6, 70, stop)),
                  hR=(lerp(80, 8, stop), lerp(4, 70, stop)) if k == 0 else (lerp(24, 6, stop), lerp(48, 70, stop)))
        xx = x - 40 * back
        if 0 < back < 1:
            p = rig.mix(p, rig.walk(40 * back, S, A=12, lift=6), 0.6)
        man(ctx, p, xx, a=a * 0.5)
    p = rig.anim(t, [(s.t0, rig.P(torso=6, head=20, hL=(4, 66), hR=(10, 64))), (you, rig.P(torso=6, head=20, hL=(4, 66), hR=(10, 64))),
                     (you + 0.7, rig.P(torso=-3, head=-6, hL=(2, 66), hR=(8, 64)))], lag=0.06)
    p = rig.breathe(p, t, 0.7)
    man(ctx, p, 580, a=a, facing=-1)


def sc6(ctx, t, s, a):
    """Calm mind, strong body, quiet power: he meditates, rises, stands tall; a large circle draws behind him."""
    calm, strong, quiet, power = s.w[0], s.w[2], s.w[4], s.w[5]
    cx = 410
    circ(ctx, cx, 600, 215, a * 0.85, 2.5, eio(prog(t, calm, power + 0.4)))
    circ(ctx, cx, 600, 232, a * 0.25, 1.5, eio(prog(t, quiet, power + 0.6)))
    rise = eio(prog(t, strong - 0.05, strong + 0.75))
    med = rig.P(hy=26, torso=0, head=4, fL=(16, 2), fR=(22, 2), hL=(30, 82), hR=(36, 80))
    if rise < 1:
        hip = (cx, FLOOR - 26 * S)
        p = rig.mix(med, rig.POSE["kneel"], clamp(rise * 1.6))
        p = rig.mix(p, rig.POSE["stand"], clamp((rise - 0.5) * 2))
        p = rig.breathe(p, t, 1.0)
        knees = None
        if rise == 0:
            knees = {"L": (hip[0] + 46 * S, hip[1] + 16 * S), "R": (hip[0] + 52 * S, hip[1] + 10 * S)}
            p["hL"], p["hR"] = (40, 62), (46, 58)
        man(ctx, p, cx, a=a, knees=knees, feet={"L": (hip[0] + 10 * S, FLOOR - 2), "R": (hip[0] + 22 * S, FLOOR - 9)} if rise == 0 else None)
    else:
        p = rig.anim(t, [(strong + 0.75, "stand"), (quiet, "stand"), (power + 0.3, rig.P(torso=-2, head=-6, hL=(-10, 70), hR=(14, 70)))], lag=0.06)
        p = rig.breathe(p, t, 1.0)
        man(ctx, p, cx, a=a)


def sc7(ctx, t, s, a):
    """The Complete Fighter, link in bio: he walks to a door that opens to light, a silhouette in the doorway."""
    d = eo3(prog(t, s.t0, s.t0 + 0.8))
    fi = s.w[2]
    dx0, dx1, dtop = 170, 300, 440
    op = eio(prog(t, fi - 0.1, fi + 0.6))
    if op > 0:
        ctx.rectangle(dx0, dtop, dx1 - dx0, FLOOR - dtop)
        src(ctx, FG, 0.92 * op * a)
        ctx.fill()
        g = cairo.LinearGradient(dx1, 0, dx1 + 420, 0)
        g.add_color_stop_rgba(0, 1, 1, 1, 0.22 * op * a)
        g.add_color_stop_rgba(1, 1, 1, 1, 0)
        ctx.move_to(dx0, FLOOR)
        ctx.line_to(dx1, FLOOR)
        ctx.line_to(dx1 + 420, FLOOR + 130)
        ctx.line_to(dx0 + 120, FLOOR + 130)
        ctx.close_path()
        ctx.set_source(g)
        ctx.fill()
    line(ctx, [(dx0 - 8, FLOOR), (dx0 - 8, dtop - 8), (dx1 + 8, dtop - 8), (dx1 + 8, FLOOR)], a, 3, d)
    pw = lerp(dx1 - dx0, 26, op)
    skew = 30 * op
    line(ctx, [(dx0, FLOOR), (dx0, dtop), (dx0 + pw, dtop + skew), (dx0 + pw, FLOOR - skew * 0.3)], a, 3, d, close=True)
    if op < 0.2:
        circ(ctx, dx0 + pw - 16, 640, 4, a * d, fill=True)
    xs, xe = 600, 262
    wu = eio(prog(t, fi + 0.1, fi + 1.4))
    x = lerp(xs, xe, wu)
    if 0 < wu < 1:
        p = rig.walk(xs - x, S, A=19, lift=9, swing=9)
    else:
        p = rig.breathe(rig.P(head=2 if wu < 1 else -2), t, 0.7)
    J = rig.joints(p, x, FLOOR, S, -1)
    inside = dx0 - 40 < J["hip"][0] < dx1 + 40 and op > 0.3
    if inside:
        ctx.save()
        ctx.rectangle(dx0, dtop, dx1 - dx0, FLOOR - dtop + 2)
        ctx.clip()
        man(ctx, p, x, a=a, facing=-1, col=BLACK)
        ctx.restore()
        ctx.save()
        ctx.rectangle(0, 0, W, H)
        ctx.rectangle(dx0, dtop, dx1 - dx0, FLOOR - dtop + 2)
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        ctx.clip()
        man(ctx, p, x, a=a, facing=-1)
        ctx.restore()
    else:
        man(ctx, p, x, a=a, facing=-1)


SCENES = [sc0, sc1, sc2, sc3, sc4, sc5, sc6, sc7]


# ----------------------------------------------------------------- text block
TIER = {
    "o": dict(face="Inter", weight=cairo.FONT_WEIGHT_BOLD, size=21, track=7, col=(0.6, 0.6, 0.6), gap=26),
    "t": dict(face="Inter Display", weight=cairo.FONT_WEIGHT_BOLD, size=86, track=0, col=FG, gap=16),
    "s": dict(face="Inter", weight=cairo.FONT_WEIGHT_NORMAL, size=36, track=0, col=(0.72, 0.72, 0.72), gap=20),
}
_mc = cairo.Context(cairo.ImageSurface(cairo.FORMAT_ARGB32, 8, 8))


def setf(ctx, tier, size):
    f = TIER[tier]
    ctx.select_font_face(f["face"], cairo.FONT_SLANT_NORMAL, f["weight"])
    ctx.set_font_size(size)


def word_w(text, tier, size):
    setf(_mc, tier, size)
    tr = TIER[tier]["track"]
    return sum(_mc.text_extents(ch).x_advance + tr for ch in text) - tr if tr else _mc.text_extents(text).x_advance


def layout(i):
    line_def = LINES[i]
    times = SCN[i].w
    n = 0
    rows = []
    n_t = sum(1 for tier, _ in line_def["show"] if tier == "t")
    for tier, txt in line_def["show"]:
        words = txt.split()
        size = TIER[tier]["size"] * (0.78 if (tier == "t" and n_t >= 3) else 1)
        setf(_mc, tier, size)
        sp = _mc.text_extents(" ").x_advance + TIER[tier]["track"] * 2
        width = sum(word_w(w, tier, size) for w in words) + sp * (len(words) - 1)
        if width > TXW:
            size *= TXW / width
            setf(_mc, tier, size)
            sp = _mc.text_extents(" ").x_advance + TIER[tier]["track"] * 2
            width = sum(word_w(w, tier, size) for w in words) + sp * (len(words) - 1)
        items, x = [], TXC - width / 2
        for w in words:
            items.append((w, x, times[n]))
            x += word_w(w, tier, size) + sp
            n += 1
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
    out = 1 - eo3(prog(t, s.t1 - 0.4, s.t1)) if i < len(SCN) - 1 else 1
    for r in LAYOUTS[i]:
        f = TIER[r["tier"]]
        for w, x, wt in r["items"]:
            e = eo3(prog(t, wt - 0.05, wt + 0.4))
            a = e * out
            if a <= 0:
                continue
            setf(ctx, r["tier"], r["size"])
            src(ctx, f["col"], a)
            y = r["base"] + 10 * (1 - e)
            if f["track"]:
                xx = x
                for ch in w:
                    ctx.move_to(xx, y)
                    ctx.show_text(ch)
                    xx += ctx.text_extents(ch).x_advance + f["track"]
            else:
                ctx.move_to(x, y)
                ctx.show_text(w)
    if i == len(SCN) - 1:
        bio = s.w[5]
        u = eo3(prog(t, bio + 0.1, bio + 0.5))
        if u > 0:
            r = LAYOUTS[i][-1]
            w, x, _ = r["items"][-1]
            ax = x + word_w(w, "s", r["size"]) + 26
            bob = 5 * math.sin((t - bio) * 4) if t < FREEZE else 0
            yb = r["base"] - 4 - bob
            line(ctx, [(ax, yb), (ax, yb - 30 * u)], u, 2.5)
            line(ctx, [(ax - 9, yb - 30 * u + 9), (ax, yb - 30 * u), (ax + 9, yb - 30 * u + 9)], u, 2.5)


# ----------------------------------------------------------------- frame
_r = random.Random(7)
STARS = [(_r.uniform(20, W - 20), _r.uniform(30, FLOOR - 120), _r.uniform(0, 6.28), _r.uniform(0.8, 1.8)) for _ in range(46)]


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
    for x, y, ph, r in STARS:
        circ(ctx, x, y, r * 0.8, 0.10 + 0.14 * (0.5 + 0.5 * math.sin(t * 0.9 + ph)), fill=True)
    i = scene_index(t)
    s = SCN[i]
    a = eo3(prog(t, s.t0, s.t0 + 0.45))
    if i < len(SCN) - 1:
        a *= 1 - eio(prog(t, s.t1 - 0.4, s.t1))
    ctx.save()
    k = 1 + 0.025 * prog(t, s.t0, s.t1)
    ctx.translate(400, FLOOR)
    ctx.scale(k, k)
    ctx.translate(-400 - 14 * prog(t, s.t0, s.t1), -FLOOR)
    SCENES[i](ctx, t, s, a)
    ctx.restore()
    line(ctx, [(0, FLOOR), (W, FLOOR)], 1, 3)
    off = (t * 18) % 220
    for q in range(-1, 8):
        x = q * 220 - off
        line(ctx, [(x, FLOOR + 32), (x + 70, FLOOR + 32)], 0.45, 2)
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
    render(SCN[0].w[4] + 0.6).write_to_png(os.path.join(OUT, "cover.png"))
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
    final = os.path.join(OUT, "quiet_power_4x3.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", os.path.join(OUT, "voice.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", f"{END:.3f}", "-movflags", "+faststart", final], check=True)
    os.remove(vid)
    print("wrote", final, f"({END:.2f}s)")


if __name__ == "__main__":
    ensure_fonts()
    main()
