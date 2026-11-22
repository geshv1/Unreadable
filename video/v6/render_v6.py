#!/usr/bin/env python3
"""Video 6, "The Pause" v2: 4:3 (1440x1080), stronger hook, faster cut, varied animation.

Builds on video 5's illustrated figure and props (render_v5.py) and adds:
a camera system (push-ins, pans, crane-out), whip-pan / match-cut / wipe /
zoom-through transitions, a mechanical price counter, annotation callouts,
silence rings, a magnifier lens, a heart-rate monitor, a split screen and a
stopwatch-to-octagon morph.

  python3 render_v6.py                  # full render + mux with out/voice.wav
  python3 render_v6.py --frames 1.2 5.0 # PNG stills for checking
"""
import importlib.util, json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(VIDEO, "v5"))
sys.path.insert(0, os.path.join(VIDEO, "v3"))
sys.path.insert(0, VIDEO)
import render_v5 as V5  # noqa: E402
from render_v5 import (FLOOR, S, FG, GREY, BLACK, LW, line, circ, rrect, text, src, stopwatch, office_chair,  # noqa: E402
                       board_room, board_table, seated, draw_other, draw_hero, steeple, plank_pose, hourglass)
from render import prog, eo3, eox, eio, eiq, lerp, clamp  # noqa: E402
import rig  # noqa: E402
import figure as F  # noqa: E402
from figure import solid, capsule, poly  # noqa: E402

_spec = importlib.util.spec_from_file_location("script_v6", os.path.join(HERE, "script.py"))
_sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sc)
LINES = _sc.LINES
OUT = os.path.join(HERE, "out")

W, H, FPS = 1440, 1080, 30
A = (400, 560)               # camera anchor on screen
TXC, TXW, TYC = 1095, 500, 450

# ----------------------------------------------------------------- timeline
TIM = json.load(open(os.path.join(OUT, "timings.json")))


class Sc:
    pass


SCN = []
for i, L in enumerate(TIM["lines"]):
    s = Sc()
    s.i, s.w = i, [t for _, t in L["words"]]
    s.t0 = 0.0 if i == 0 else L["start"] - 0.35
    SCN.append(s)
for i, s in enumerate(SCN):
    s.t1 = SCN[i + 1].t0 if i + 1 < len(SCN) else TIM["speech_end"] + 2.3
END = SCN[-1].t1
FREEZE = END - 1.0
WD = [s.w for s in SCN]
B = [s.t0 for s in SCN]          # scene boundaries


def cam_lerp(t, keys):
    """keys: [(time, (fx, fy, zoom)), ...] eased."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t < t1:
            u = eio(prog(t, t0, t1))
            return tuple(lerp(x, y, u) for x, y in zip(a, b))
    return keys[-1][1]


def apply_cam(ctx, cam):
    fx, fy, z = cam
    ctx.translate(A[0], A[1])
    ctx.scale(z, z)
    ctx.translate(-fx, -fy)


ID = (A[0], A[1], 1.0)


def floor_world(ctx, t, a=1.0):
    line(ctx, [(-1400, FLOOR), (2800, FLOOR)], a, 2.6)
    off = (t * 18) % 220
    for q in range(-8, 14):
        x = q * 220 - off
        line(ctx, [(x, FLOOR + 32), (x + 70, FLOOR + 32)], 0.4 * a, 1.8)


# ----------------------------------------------------------------- 0: the hook
def odometer(ctx, cx, cy, value, a, flash=0.0):
    digits = 6
    dw, dh, gap = 40, 58, 6
    total = 34 + digits * (dw + gap) + 14
    x = cx - total / 2
    solid(ctx, [rrect(x - 14, cy - dh / 2 - 12, x + total + 6, cy + dh / 2 + 12, 10)], FG, a, LW)
    ctx.select_font_face("Inter Display", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(44)
    ctx.move_to(x, cy + 16)
    src(ctx, FG, a)
    ctx.show_text("$")
    x += 34
    for k in range(digits):
        p = 10 ** (digits - 1 - k)
        if p < 10000:
            dv = 0.0
        elif p == 10000:
            dv = (value / p) % 10
        else:
            rem = value % p
            dv = math.floor(value / p) % 10 + clamp((rem - (p - 10000)) / 10000)
        bx = x + k * (dw + gap) + (14 if k >= 3 else 0)
        solid(ctx, [rrect(bx, cy - dh / 2, bx + dw, cy + dh / 2, 5)], FG, a * 0.9, 1.6)
        ctx.save()
        ctx.rectangle(bx + 2, cy - dh / 2 + 2, dw - 4, dh - 4)
        ctx.clip()
        base = math.floor(dv)
        fr = dv - base
        for n, off in ((base, -fr), ((base + 1) % 10, 1 - fr)):
            e = ctx.text_extents(str(n))
            ctx.move_to(bx + dw / 2 - e.x_advance / 2, cy + 16 + off * dh)
            src(ctx, FG, a)
            ctx.show_text(str(n))
        ctx.restore()
        line(ctx, [(bx + 3, cy), (bx + dw - 3, cy)], a * 0.25, 1)
        if k == 2:
            ctx.move_to(bx + dw + 3, cy + 26)
            ctx.show_text(",")
    if flash > 0:
        ctx.new_path()
        rrect(x - 48 - 10, cy - dh / 2 - 22, x + digits * (dw + gap) + 30, cy + dh / 2 + 22, 14)(ctx)
        ctx.set_line_width(2)
        src(ctx, FG, a * flash)
        ctx.stroke()


TICKS0 = [0.30 + k * 0.17 for k in range(7)]


def sc_hook(ctx, t, s, a):
    n = sum(eox(prog(t, tk, tk + 0.07)) for tk in TICKS0)
    roll = sum(eio(prog(t, tk, tk + 0.16)) for tk in TICKS0)
    stopwatch(ctx, 410, 450, 225, n, a, 1.0, math.sin(math.pi * prog(t, 0.15, 0.32)))
    sev = s.w[4]
    flash = math.sin(math.pi * prog(t, sev, sev + 0.7))
    odometer(ctx, 410, 520, 480000 - 10000 * roll, a, flash)
    u = prog(t, sev, sev + 0.5)
    if u > 0:
        text(ctx, "−$70,000", 410, 610 + 8 * (1 - eo3(u)), 30, FG, a * eo3(u), bold=True)


def cam_hook(t):
    sev = WD[0][4]
    return cam_lerp(t, [(0.0, (440, 440, 2.15)), (sev - 0.3, (430, 460, 2.35)), (sev + 0.55, (410, 545, 1.0)),
                        (B[1], (405, 545, 0.98))])


# ----------------------------------------------------------------- 1-5: the boardroom
PRICES = [("$480,000", lambda: WD[1][3]), ("$465,000", lambda: WD[4][7]), ("$440,000", lambda: WD[4][9]),
          ("$410,000", lambda: WD[4][14])]


def tags_v6(t):
    shown = [k for k, (_, f) in enumerate(PRICES) if t >= f()]
    out = []
    if not shown:
        return out
    top = shown[-1]
    for k in shown:
        depth = top - k
        if depth > 2:
            continue
        v, f = PRICES[k]
        ts = f()
        ap = eo3(prog(t, ts, ts + 0.35))
        nxt = PRICES[k + 1][1]() if k + 1 < len(PRICES) else 1e9
        strike = eo3(prog(t, nxt - 0.3, nxt + 0.05))
        alpha = ap * (1 - 0.55 * eo3(prog(t, nxt, nxt + 0.3)))
        alpha *= 1 - 0.5 * (depth == 2)
        out.append((v, 415 + depth * 14, 600 - depth * 52 + 10 * (1 - ap), alpha, strike, 0))
    return out


def clock_secs(t):
    w2, w4 = WD[2], WD[4]
    t0, t1 = w2[6], w4[14]
    return 7 * clamp((t - t0) / (t1 - t0)) if t >= t0 else 0.0


def cam_board(t):
    w1, w2, w3, w4, w5 = WD[1], WD[2], WD[3], WD[4], WD[5]
    return cam_lerp(t, [
        (B[1], (300, 610, 1.45)), (w1[5], (320, 610, 1.38)), (B[2], (330, 610, 1.32)),
        (w2[0], (420, 600, 1.06)), (B[3], (430, 600, 1.08)),
        (w3[0], (640, 640, 2.35)), (w3[4] + 0.2, (645, 640, 2.45)),
        (B[4] + 0.1, (300, 610, 1.45)), (w4[13], (330, 610, 1.4)),
        (B[5], (420, 600, 1.05)), (w5[7], (430, 600, 1.12)),
        (B[6] - 0.35, (430, 600, 1.12)), (B[6], (575, 668, 2.9)),
    ])


def other_man(ctx, t, a):
    w1, w4, w5 = WD[1], WD[4], WD[5]
    tbl = 708
    if t < B[4]:
        op = rig.breathe(seated(2, 2), t, 0.6)
        drum = max(0, math.sin(t * 15)) * 6 if t > WD[2][6] else 0
        hands = {"L": (282, tbl), "R": (300, tbl - drum)}
        draw_other(ctx, t, a, p=op, hands=hands)
    elif t < B[5]:
        ex, ju, low, pr = w4[7], w4[9], w4[13], w4[14]
        op = rig.breathe(seated(16 - 20 * eio(prog(t, pr, pr + 0.6)), 4 + 5 * math.sin(t * 8)), t, 0.6)
        hl, hr = (330, 650), (350, 662)
        if t < ex:
            o = eio(prog(t, B[4], B[4] + 0.5))
            hl, hr = (lerp(282, 330, o), lerp(tbl, 650, o)), (lerp(300, 350, o), lerp(tbl, 662, o))
        elif t < ju:
            ch = abs(math.sin((t - ex) * 9))
            hr = (352, 640 + 40 * ch)
        elif t < low:
            jj = eio(prog(t, ju, ju + 0.3))
            hr = (lerp(350, 265, jj), lerp(662, 650, jj))
        elif t < pr + 0.1:
            pp = math.sin((t - low) * 7)
            hl, hr = (330, 682 + 14 * pp), (350, 686 + 14 * pp)
        else:
            dd = eio(prog(t, pr, pr + 0.6))
            hl, hr = (lerp(330, 282, dd), lerp(650, 708, dd)), (lerp(350, 298, dd), lerp(662, 708, dd))
        draw_other(ctx, t, a, p=op, hands={"L": hl, "R": hr})
    else:
        pr, nv = w5[2], w5[4]
        loosen = eio(prog(t, pr - 0.1, pr + 0.6))
        op = rig.breathe(seated(-2, -6 + 8 * loosen), t, 1.3)
        n_ = rig.joints(op, V5.OTHER_X, FLOOR, S, 1)["neck"]
        reach = math.sin(math.pi * prog(t, pr - 0.1, pr + 0.8))
        hr = (lerp(298, n_[0] + 24, reach), lerp(708, n_[1] + 14, reach))
        draw_other(ctx, t, a, p=op, hands={"L": (282, 708), "R": hr}, tie_loose=loosen, sweat=prog(t, nv, nv + 0.9))


def hero_pose(t):
    w2 = WD[2]
    off, wt = w2[3], w2[6]
    lean = eio(prog(t, wt - 0.1, wt + 0.5))
    hp = rig.breathe(seated(6 - 10 * lean, 6 - 4 * lean), t, 0.45)
    rest = {"L": (548, 708), "R": (536, 706)}
    push = eio(prog(t, off - 0.3, off + 0.05)) * (1 - eio(prog(t, off + 0.25, off + 0.6)))
    hands = dict(rest)
    hands["R"] = (lerp(536, 452, push), 706)
    sp = steeple(hp)
    hands = {k: (lerp(hands[k][0], sp[k][0], lean), lerp(hands[k][1], sp[k][1], lean)) for k in "LR"}
    return hp, hands


def offer_paper(ctx, t, a):
    off = WD[2][3]
    u = eio(prog(t, off - 0.3, off + 0.05))
    if t < off - 0.6:
        x = 520
    else:
        x = lerp(520, 438, u)
    solid(ctx, [poly([(x - 26, 708), (x + 26, 708), (x + 22, 703), (x - 22, 703)], smooth_it=False)], FG, a, 1.4)
    line(ctx, [(x - 14, 705.5), (x + 10, 705.5)], a * 0.6, 1)


def annotations(ctx, t, a, head):
    w3 = WD[3]
    hx, hy = head
    z = 2.4
    lw = 2.0 / z * 1.6

    def callout(cx, cy, t0, draw_icon):
        u = eo3(prog(t, t0 - 0.1, t0 + 0.25))
        if u <= 0:
            return
        fade = 1 - eio(prog(t, w3[4] - 0.05, w3[4] + 0.35))
        al = a * u * fade
        line(ctx, [(hx - 22, hy - 4), (lerp(hx - 22, cx + 16, u), lerp(hy - 4, cy, u))], al * 0.7, lw * 0.8, dash=[3, 3])
        circ(ctx, cx, cy, 15, al, lw)
        draw_icon(cx, cy, al)
        st = eo3(prog(t, t0 + 0.15, t0 + 0.4))
        line(ctx, [(cx - 11, cy + 11), (cx - 11 + 22 * st, cy + 11 - 22 * st)], al, lw * 1.2)

    def smile(cx, cy, al):
        ctx.new_path()
        ctx.arc(cx, cy - 1, 7, 0.2 * math.pi, 0.8 * math.pi)
        ctx.set_line_width(lw)
        src(ctx, FG, al)
        ctx.stroke()
        circ(ctx, cx - 4, cy - 4, 1.2, al, fill=True)
        circ(ctx, cx + 4, cy - 4, 1.2, al, fill=True)

    def nod(cx, cy, al):
        line(ctx, [(cx, cy - 8), (cx, cy + 8)], al, lw)
        line(ctx, [(cx - 3, cy - 5), (cx, cy - 8), (cx + 3, cy - 5)], al, lw)
        line(ctx, [(cx - 3, cy + 5), (cx, cy + 8), (cx + 3, cy + 5)], al, lw)
    callout(hx - 62, hy - 34, w3[1], smile)
    callout(hx - 62, hy + 12, w3[3], nod)
    u = eo3(prog(t, w3[4], w3[4] + 0.3))
    if u > 0:
        fade = 1 - eio(prog(t, B[4] - 0.3, B[4] + 0.1))
        r = lerp(46, 30, u)
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            cx, cy = hx + sx * r, hy + sy * r
            line(ctx, [(cx, cy - sy * 9), (cx, cy), (cx - sx * 9, cy)], a * u * fade, lw)
        text(ctx, "0.0", hx, hy - r - 8, 8, FG, a * u * fade, bold=True)


def silence_rings(ctx, t, a, origin):
    w5 = WD[5]
    if not (w5[0] - 0.1 <= t < B[6]):
        return
    for k in range(8):
        ts = w5[0] + k * 0.32
        u = prog(t, ts, ts + 1.1)
        if 0 < u < 1:
            r = 30 + 360 * eo3(u)
            ctx.new_path()
            ctx.arc(origin[0], origin[1], r, math.pi - 0.45, math.pi + 0.45)
            ctx.set_line_width(1.6)
            src(ctx, FG, a * 0.5 * (1 - u))
            ctx.stroke()


def sc_board(ctx, t, s, a):
    d = eo3(prog(t, B[1] - 0.2, B[1] + 0.6))
    w5 = WD[5]
    gauge = eio(prog(t, B[5], B[5] + 0.6))
    needle = 0.08 + 0.86 * eio(prog(t, w5[0], w5[7] + 0.1)) + 0.015 * math.sin(t * 37) * prog(t, w5[2], w5[7])
    board_room(ctx, t, a, d, clock_secs(t), gauge, needle, tags_v6(t))
    if WD[2][6] - 0.1 <= t < B[5] + 0.3:
        el = clock_secs(t)
        text(ctx, f"00:{int(el):02d}", 505, 372, 16, GREY, a * d * (1 - prog(t, B[5], B[5] + 0.3)), bold=True, track=2)
    office_chair(ctx, 205, 1, a * d, "back")
    office_chair(ctx, 628, -1, a * d, "back")
    other_man(ctx, t, a * d)
    hp, hands = hero_pose(t)
    draw_hero(ctx, t, a * d, p=hp, hands=hands)
    office_chair(ctx, 205, 1, a * d, "arm")
    office_chair(ctx, 628, -1, a * d, "arm")
    board_table(ctx, a, d, 405)
    offer_paper(ctx, t, a * d)
    J = rig.joints(hp, V5.HERO_X, FLOOR, S, -1)
    head = (J["neck"][0] - 4, J["neck"][1] - 24 * S)
    if B[3] - 0.2 <= t < B[4] + 0.2:
        annotations(ctx, t, a * d, head)
    silence_rings(ctx, t, a * d, (J["neck"][0] - 30, J["neck"][1] + 10))


# ----------------------------------------------------------------- 6: the 5 a.m. bar (+ magnifier)
def cam_gym(t):
    return cam_lerp(t, [(B[6], (472, 352, 2.9)), (B[6] + 0.9, (420, 560, 1.0))])


def sc_gym(ctx, t, s, a):
    V5.sc_gym(ctx, t, s, a)
    w = s.w
    u = eo3(prog(t, w[14] - 0.15, w[14] + 0.3))
    if u > 0:
        lx, ly, lr, z = 660, 560, 92 * u, 3.0
        hands = (472, 343)
        line(ctx, [(hands[0] + 18, hands[1] + 10), (lx - lr * 0.7, ly - lr * 0.7)], a * u, 1.4, dash=[4, 4])
        circ(ctx, hands[0], hands[1], 20, a * u * 0.8, 1.4)
        ctx.save()
        ctx.new_path()
        ctx.arc(lx, ly, lr, 0, 2 * math.pi)
        ctx.clip()
        src(ctx, BLACK)
        ctx.paint()
        ctx.translate(lx, ly)
        ctx.scale(z, z)
        ctx.translate(-hands[0], -hands[1] - 6)
        V5.sc_gym(ctx, t, s, a)
        ctx.restore()
        circ(ctx, lx, ly, lr, a * u, 2.6)
        circ(ctx, lx, ly, lr + 6, a * u * 0.4, 1.2)
        text(ctx, "GRIP", lx, ly + lr + 24, 11, GREY, a * u, bold=True, track=3)


# ----------------------------------------------------------------- 7: leverage (+ heart-rate monitor)
_HR = {}


def hr_at(tau, s):
    w = s.w
    return lerp(146, 62, eio(prog(tau, w[1] - 0.2, w[2] + 0.6)))


def phase_table(s):
    if s.i in _HR:
        return _HR[s.i]
    t0, t1 = s.t0 - 3.5, s.t1 + 0.1
    dt = 0.004
    ph, out, tau = 0.0, [], t0
    while tau <= t1:
        out.append(ph)
        ph += hr_at(tau, s) / 60 * dt
        tau += dt
    _HR[s.i] = (t0, dt, out)
    return _HR[s.i]


def beat(ph, jitter):
    f = ph % 1.0
    v = 0.0
    v += 0.12 * math.exp(-((f - 0.12) / 0.035) ** 2)
    v -= 0.15 * math.exp(-((f - 0.29) / 0.012) ** 2)
    v += 1.0 * math.exp(-((f - 0.32) / 0.012) ** 2)
    v -= 0.28 * math.exp(-((f - 0.35) / 0.012) ** 2)
    v += 0.25 * math.exp(-((f - 0.58) / 0.06) ** 2)
    return v * (1 + jitter * math.sin(ph * 7.3))


def sc_lever(ctx, t, s, a):
    V5.sc_lever(ctx, t, s, a)
    d = eo3(prog(t, s.t0, s.t0 + 0.5))
    x0, x1, yb = 110, 560, 205
    t0, dt, tab = phase_table(s)
    calm = eio(prog(t, s.w[1], s.w[2] + 0.4))
    pts = []
    for k in range(181):
        tau = t - 2.6 + 2.6 * k / 180
        idx = int((tau - t0) / dt)
        ph = tab[max(0, min(idx, len(tab) - 1))]
        pts.append((lerp(x0, x1, k / 180), yb - 46 * beat(ph, 0.25 * (1 - calm))))
    line(ctx, [(x0, yb + 26), (x1, yb + 26)], a * d * 0.3, 1)
    line(ctx, pts, a * d, 2)
    circ(ctx, pts[-1][0], pts[-1][1], 3.5, a * d, fill=True)
    bpm = int(round(hr_at(t, s)))
    text(ctx, "BPM", x1 + 40, yb - 26, 11, GREY, a * d, bold=True, track=2)
    text(ctx, str(bpm), x1 + 40, yb + 6, 30, FG, a * d, bold=True)


# ----------------------------------------------------------------- 8: hold | wait (split screen)
def sc_split(ctx, t, s, a):
    w = s.w
    div = eio(prog(t, s.t0, s.t0 + 0.45))
    hold_hi = 1 - 0.65 * eio(prog(t, w[5] - 0.2, w[5] + 0.2))
    wait_hi = 0.35 + 0.65 * eio(prog(t, w[5] - 0.2, w[5] + 0.2))
    mid = 405
    # left: the plank + stopwatch
    ctx.save()
    ctx.rectangle(-200, 0, mid + 200, H)
    ctx.clip()
    ctx.translate(-128, 42)
    ctx.scale(0.95, 0.95)
    trem = math.sin(t * 41)
    Fp = (186, FLOOR - 4)
    hip, p = plank_pose(Fp, 13)
    p["hy"] += trem * 0.3
    sh = rig.joints(p, hip[0], FLOOR, S, 1)["neck"]
    solid(ctx, [rrect(150, 830, 560, 840, 3)], FG, a * hold_hi, 1.8)
    F.draw(ctx, p, hip[0], FLOOR, S, 1, "tee", a=a * hold_hi,
           hands={"L": (sh[0] + 36, FLOOR - 6), "R": (sh[0] + 44, FLOOR - 6)}, feet={"L": Fp, "R": (Fp[0] - 6, Fp[1])})
    stopwatch(ctx, 370, 560, 96, 60 * prog(t, s.t0, s.t1) * 0.8, a * hold_hi)
    line(ctx, [(-400, FLOOR), (1200, FLOOR)], a * hold_hi, 2.6)
    ctx.restore()
    # right: stillness + hourglass
    ctx.save()
    ctx.rectangle(mid, 0, 820 - mid, H)
    ctx.clip()
    ctx.translate(176, 42)
    ctx.scale(0.95, 0.95)
    hourglass(ctx, 500, a * wait_hi, prog(t, w[5], s.t1 + 0.6))
    cx = 290
    hipm = (cx, FLOOR - 26 * S)
    pm = rig.breathe(rig.P(hy=26, torso=0, head=6), t, 1.0)
    knees = {"L": (hipm[0] + 46 * S, hipm[1] + 16 * S), "R": (hipm[0] + 52 * S, hipm[1] + 10 * S)}
    F.draw(ctx, pm, cx, FLOOR, S, 1, "tee", a=a * wait_hi, hands=knees,
           feet={"L": (hipm[0] + 10 * S, FLOOR - 2), "R": (hipm[0] + 22 * S, FLOOR - 9)})
    line(ctx, [(-400, FLOOR), (1200, FLOOR)], a * wait_hi, 2.6)
    ctx.restore()
    line(ctx, [(mid, 140), (mid, lerp(140, 960, div))], a, 1.6)
    text(ctx, "HOLD", 200, 230, 13, GREY, a * hold_hi * div, bold=True, track=4)
    text(ctx, "WAIT", 610, 230, 13, GREY, a * wait_hi * div, bold=True, track=4)


# ----------------------------------------------------------------- 9: owns the room (crane out)
def cam_board2(t):
    return cam_lerp(t, [(B[9], (430, 610, 1.22)), (WD[9][4], (420, 600, 1.12)), (WD[9][6] + 0.4, (420, 520, 0.9)),
                        (B[10] - 0.4, (420, 520, 0.9)), (B[10], (505, 290, 7.5))])


def sc_board2(ctx, t, s, a):
    V5.sc_board2(ctx, t, s, a)


# ----------------------------------------------------------------- 10: the end (stopwatch -> octagon)
def cam_end(t):
    return cam_lerp(t, [(B[10], (420, 500, 2.4)), (B[10] + 0.7, (420, 545, 1.0))])


def sc_end(ctx, t, s, a):
    fi = s.w[2]
    m = eio(prog(t, fi - 0.15, fi + 0.5))
    cx, cy, R = 420, 500, 205
    stopwatch(ctx, cx, cy, R, 7, a * (1 - m), 1.0, math.sin(math.pi * prog(t, fi - 0.15, fi + 0.1)))
    pts = []
    for k in range(96):
        th = -math.pi / 2 + 2 * math.pi * k / 96
        d = (th + math.radians(22.5) + math.pi / 2) % math.radians(45) - math.radians(22.5)
        ro = R * math.cos(math.radians(22.5)) / math.cos(d)
        r = lerp(R, ro, m)
        pts.append((cx + r * math.cos(th), cy + r * math.sin(th)))
    if m > 0:
        line(ctx, pts, a, LW * 1.4, close=True)
        oc = [(cx + R * 0.93 * math.cos(math.radians(22.5 + 45 * k)), cy + R * 0.93 * math.sin(math.radians(22.5 + 45 * k)))
              for k in range(8)]
        line(ctx, oc, a * m * 0.5, 1.2, close=True)
        for k in range(8):
            p0 = oc[k]
            line(ctx, [p0, (lerp(p0[0], cx, 0.18 * m), lerp(p0[1], cy, 0.18 * m))], a * m * 0.5, 1.2)
        th = -math.pi / 2 + math.radians(42)
        line(ctx, [(cx, cy), (cx + (R - 40) * math.cos(th), cy + (R - 40) * math.sin(th))], a * m, 2.4)
        circ(ctx, cx, cy, 8, a * m, fill=True)


# ----------------------------------------------------------------- scenes, cameras and transitions
SCENES = [sc_hook, sc_board, sc_board, sc_board, sc_board, sc_board, sc_gym, sc_lever, sc_split, sc_board2, sc_end]
CAMS = [cam_hook, cam_board, cam_board, cam_board, cam_board, cam_board, cam_gym, lambda t: ID, lambda t: ID,
        cam_board2, cam_end]
FLOORED = [False, True, True, True, True, True, True, True, False, True, False]
TRANS = {1: "whip", 6: "match", 7: "fade", 8: "wipe", 9: "whip", 10: "zoom"}


def scene_index(t):
    for s in SCN:
        if s.t0 <= t < s.t1:
            return s.i
    return len(SCN) - 1


def draw_scene(ctx, t, i, dx=0.0):
    ctx.save()
    ctx.translate(dx, 0)
    apply_cam(ctx, CAMS[i](t))
    if FLOORED[i]:
        floor_world(ctx, t)
    SCENES[i](ctx, t, SCN[i], 1.0)
    ctx.restore()


def streaks(ctx, sp, seed):
    r = random.Random(seed)
    for _ in range(18):
        y = r.uniform(120, 960)
        x = r.uniform(-100, 900)
        L = 300 * sp * r.uniform(0.5, 1.4)
        line(ctx, [(x, y), (x + L, y)], 0.35 * sp, r.uniform(1, 2.5))


def stage(ctx, t):
    i = scene_index(t)
    win = {"whip": (0.22, 0.26), "fade": (0.25, 0.25), "wipe": (0.05, 0.45), "match": (0.12, 0.14), "zoom": (0.12, 0.14)}
    for j in (i, i + 1):
        if j in TRANS and 0 < j < len(SCN):
            kind = TRANS[j]
            pre, post = win[kind]
            b = B[j]
            if b - pre <= t < b + post:
                u = prog(t, b - pre, b + post)
                if kind == "whip":
                    e = eio(u)
                    draw_scene(ctx, min(t, b - 0.001), j - 1, -1500 * e)
                    draw_scene(ctx, max(t, b), j, 1500 * (1 - e))
                    streaks(ctx, math.sin(math.pi * u), j)
                elif kind in ("fade", "match", "zoom"):
                    ctx.push_group()
                    draw_scene(ctx, min(t, b - 0.001), j - 1)
                    ctx.pop_group_to_source()
                    ctx.paint_with_alpha(1 - eio(u))
                    ctx.push_group()
                    draw_scene(ctx, max(t, b), j)
                    ctx.pop_group_to_source()
                    ctx.paint_with_alpha(eio(u))
                elif kind == "wipe":
                    xw = lerp(-20, 840, eio(u))
                    ctx.save()
                    ctx.rectangle(xw, 0, W, H)
                    ctx.clip()
                    draw_scene(ctx, min(t, b - 0.001), j - 1)
                    ctx.restore()
                    ctx.save()
                    ctx.rectangle(0, 0, xw, H)
                    ctx.clip()
                    draw_scene(ctx, max(t, b), j)
                    ctx.restore()
                    line(ctx, [(xw, 0), (xw, H)], 0.8, 2)
                return
    draw_scene(ctx, t, i)


# ----------------------------------------------------------------- text block
TIER = V5.TIER
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
        opts = entry[2] if len(entry) > 2 else None
        words = txt.split()
        size = TIER[tier]["size"] * (1.18 if (tier == "t" and i == 0) else 1)
        setf(_mc, tier, size)
        sp = _mc.text_extents(" ").x_advance + TIER[tier]["track"] * 2
        width = sum(word_w(w_, tier, size) for w_ in words) + sp * (len(words) - 1)
        if width > TXW:
            size *= TXW / width
            setf(_mc, tier, size)
            sp = _mc.text_extents(" ").x_advance + TIER[tier]["track"] * 2
            width = sum(word_w(w_, tier, size) for w_ in words) + sp * (len(words) - 1)
        items, x = [], TXC - width / 2
        for k, w_ in enumerate(words):
            if opts == "static":
                wt = SCN[i].t0 + 0.3
            elif isinstance(opts, dict) and "at" in opts:
                wt = times[opts["at"][k]]
            else:
                wt = times[n]
                n += 1
            items.append((w_, x, wt))
            x += word_w(w_, tier, size) + sp
        if isinstance(opts, dict) and "at" in opts:
            n = max(n, max(opts["at"]) + 1)
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
    out = 1 - eo3(prog(t, s.t1 - 0.3, s.t1)) if i < len(SCN) - 1 else 1
    for r in LAYOUTS[i]:
        f = TIER[r["tier"]]
        for w_, x, wt in r["items"]:
            e = eo3(prog(t, wt - 0.05, wt + 0.32))
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
    ctx.push_group()
    stage(ctx, t)
    ctx.pop_group_to_source()
    g = cairo.LinearGradient(770, 0, 870, 0)
    g.add_color_stop_rgba(0, 0, 0, 0, 1)
    g.add_color_stop_rgba(1, 0, 0, 0, 0)
    ctx.mask(g)
    draw_text(ctx, t, scene_index(t))
    return surf


def frame_bytes(n):
    return bytes(render(n / FPS).get_data())


def main():
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "--frames":
        for a in sys.argv[2:]:
            render(float(a)).write_to_png(os.path.join(OUT, f"check_{float(a):05.2f}.png"))
        return
    render(WD[0][6] + 0.05).write_to_png(os.path.join(OUT, "cover.png"))
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
    final = os.path.join(OUT, "the_pause_v2_4x3.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", os.path.join(OUT, "voice.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", f"{END:.3f}", "-movflags", "+faststart", final], check=True)
    os.remove(vid)
    print("wrote", final, f"({END:.2f}s)")


if __name__ == "__main__":
    V5.ensure_fonts()
    main()
