#!/usr/bin/env python3
"""Video 3, "Your enemy is you": 9:16 TikTok render.

Uses the video-2 engine (wipes, captions, punch/shake, grain, vignette, HUD) with:
- environments that change through the video (ring, void, night road, rain,
  gym, dawn, mirror corridor, cage), drawn as faint line art on black;
- a new stickman rig (rig.py): IK knees/elbows, planted feet, walk/run cycles,
  breathing, follow-through, every action timed to the narration.

  python3 render_v3.py                  # full render + mux with out/voice.wav
  python3 render_v3.py --frames 1.2 5.0 # PNG stills for checking
"""
import importlib.util, json, math, os, random, subprocess, sys
from multiprocessing import Pool

import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "v2"))
sys.path.insert(0, os.path.dirname(HERE))
import render_v2 as V  # noqa: E402
from render_v2 import R, CX, CY, W, H, FG, RED, MUTE, BLACK, ring, dot  # noqa: E402
from render import prog, eo3, eox, eio, eiq, lerp, lerpc, clamp, src, draw_poly  # noqa: E402

sys.path.insert(0, HERE)
import rig  # noqa: E402

_spec = importlib.util.spec_from_file_location("script_v3", os.path.join(HERE, "script.py"))
_sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sc)
LINES = _sc.LINES
OUT = os.path.join(HERE, "out")

# ----------------------------------------------------------------- timeline (same rules as video 2)
TIM = json.load(open(os.path.join(OUT, "timings.json")))
SC = []
for i, L in enumerate(TIM["lines"]):
    s = V.Scene()
    s.i, s.w = i, [t for _, t in L["words"]]
    s.t0 = 0.0 if i == 0 else L["start"] - 0.22
    SC.append(s)
for i, s in enumerate(SC):
    s.t1 = SC[i + 1].t0 if i + 1 < len(SC) else TIM["speech_end"] + 2.0
CAPS = []
for i, line in enumerate(LINES):
    s, n, chunks = SC[i], 0, []
    for chunk in line["show"]:
        ws = []
        for word in chunk:
            ws.append(R.Wd(word.rstrip("*"), s.w[n], word.endswith("*")))
            n += 1
        chunks.append(ws)
    for j, ws in enumerate(chunks):
        t_out = chunks[j + 1][0].t if j + 1 < len(chunks) else (None if i == len(SC) - 1 else s.t1 - 0.08)
        CAPS.append(R.Group([ws], t_out, B=50, align="center", x=CX, y0=V.CAP_Y, maxw=820))

S_MAN = 0.86   # stickman scale


def man(ctx, p, x, ground, s=S_MAN, col=None, a=1.0, facing=1, hands=None, feet=None, rot=0.0, lw=5):
    return rig.draw(ctx, p, x, ground, s, col or FG, a, lw, facing, hands, feet, rot)


def J_of(p, x, ground, s=S_MAN, facing=1, hands=None):
    return rig.joints(p, x, ground, s, facing, hands)


# ----------------------------------------------------------------- effect helpers
def zigzag(a, b, n, amp, seed):
    r = random.Random(seed)
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    pts = [a]
    for i in range(1, n):
        u = i / n
        o = r.uniform(-amp, amp)
        pts.append((a[0] + dx * u + nx * o, a[1] + dy * u + ny * o))
    pts.append(b)
    return pts


def cracks(ctx, c, u, seed, n=9, rmax=150, col=None):
    r = random.Random(seed)
    for k in range(n):
        ang = 2 * math.pi * k / n + r.uniform(-0.25, 0.25)
        L = rmax * r.uniform(0.5, 1.0) * eo3(u)
        end = (c[0] + L * math.cos(ang), c[1] + L * math.sin(ang))
        draw_poly(ctx, zigzag(c, end, 5, 9, seed * 31 + k), 1, col or RED, 1, 2)


def dust(ctx, x, y, u, n=8, spread=60, col=None):
    if 0 < u < 1:
        for q in range(n):
            a = math.pi + math.pi * q / (n - 1)
            r = 10 + spread * eo3(u)
            dot(ctx, x + r * math.cos(a), y + r * math.sin(a) * 0.4, 2.5, col or MUTE, 1 - u)


def reticle(ctx, x, y, r, col, a, rot):
    ring(ctx, x, y, r, col, a, 2)
    for q in range(4):
        ang = rot + q * math.pi / 2
        draw_poly(ctx, [(x + (r - 14) * math.cos(ang), y + (r - 14) * math.sin(ang)),
                        (x + (r + 14) * math.cos(ang), y + (r + 14) * math.sin(ang))], 1, col, a, 3)
    dot(ctx, x, y, 3, col, a)


def lerp_angle(a, b, u):
    return a + V.angdiff(a, b) * u


# ----------------------------------------------------------------- scenes
def n1(ctx, t, S):
    """Your enemy is you: he shuffles toward his reflection; jab on ENEMY, the cross meets the mirror on YOU."""
    en, k = S.w[1], S.w[3]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    ctx.save()
    ctx.set_dash([12, 9])
    draw_poly(ctx, [(CX, CY - 250), (CX, CY + 190)], ent, MUTE, 0.8, 2)
    ctx.restore()
    x = lerp(CX - 200, CX - 104, eio(prog(t, S.t0, k - 0.15)))
    p = rig.anim(t, [(S.t0, "guard"), (en - 0.06, "guard"), (en + 0.05, "jab"), (en + 0.25, "guard"),
                     (k - 0.12, "windup"), (k + 0.03, "cross"), (k + 0.3, "cross"), (k + 0.55, "guard")], lag=0.03)
    p = rig.bounce(p, t, 1 - prog(t, k - 0.15, k))
    f = eox(prog(t, k, k + 0.2))
    gnd = CY + 150
    man(ctx, p, x, gnd, a=ent)
    man(ctx, p, 2 * CX - x, gnd, col=lerpc(MUTE, RED, f), a=ent, facing=-1)
    u = prog(t, k + 0.03, k + 0.5)
    if u > 0:
        cy = J_of(p, x, gnd)["handR"][1]
        cracks(ctx, (CX, cy), u, 11, 10, 170)
        if u < 1:
            ring(ctx, CX, cy, 30 + 260 * eo3(u), RED, 0.6 * (1 - u), 3)


_r = random.Random(21)
N2_PART = [(_r.uniform(-1, 1), _r.uniform(-1.4, -0.2), _r.uniform(0.6, 1.4)) for _ in range(30)]


def n2(ctx, t, S):
    """Not the opponent: a jab at the opponent on NOT; he dissolves; the target lands on himself; he looks at his hands."""
    nt, k = S.w[0], S.w[2]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    gnd = CY + 150
    p = rig.anim(t, [(S.t0, "guard"), (nt - 0.05, "guard"), (nt + 0.06, "jab"), (nt + 0.26, "guard"),
                     (k + 0.12, "guard"), (k + 0.45, "look")], lag=0.04)
    p = rig.bounce(p, t, 1 - prog(t, k, k + 0.3))
    p = rig.breathe(p, t)
    man(ctx, p, CX - 150, gnd, a=ent)
    u = prog(t, k, k + 0.55)
    q = rig.bounce(rig.anim(t, [(S.t0, "guard"), (nt + 0.06, "guard"), (nt + 0.12, rig.mix(rig.POSE["guard"], rig.POSE["skid"], 0.35)),
                                (nt + 0.35, "guard")], lag=0.03), t + 0.4)
    if u < 1:
        man(ctx, q, CX + 150, gnd, col=MUTE, a=ent * (1 - eo3(u)), facing=-1)
    if u > 0:
        Jq = J_of(q, CX + 150, gnd, facing=-1)
        keys = list(Jq.keys())
        for i, (dx, dy, sp) in enumerate(N2_PART):
            pt = Jq[keys[i % len(keys)]]
            d = 170 * eo3(u) * sp
            dot(ctx, pt[0] + dx * d, pt[1] + dy * d, 3, MUTE, 1 - u)
    Jp = J_of(p, CX - 150, gnd)
    me = ((Jp["hip"][0] + Jp["neck"][0]) / 2, (Jp["hip"][1] + Jp["neck"][1]) / 2)
    opp = (CX + 150, me[1])
    m = eio(prog(t, k + 0.05, k + 0.4))
    reticle(ctx, lerp(opp[0], me[0], m), lerp(opp[1], me[1], m), lerp(80, 64, m), lerpc(MUTE, RED, m), ent, t * 1.5 * (1 - m))


def n3(ctx, t, S):
    """The voice in your head: he flinches on VOICE, hands to his head, sways; the noise around his head grows."""
    k, hd = S.w[1], S.w[4]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    gnd = CY + 210
    p = rig.anim(t, [(S.t0, "stand"), (k - 0.05, "stand"), (k + 0.12, "head"), (hd, "head"),
                     (hd + 0.25, rig.mix(rig.POSE["head"], rig.POSE["cower"], 0.55))], lag=0.05)
    sway = prog(t, k, S.t1)
    p["torso"] += 5 * math.sin(t * 5.5) * sway
    p["hx"] += 4 * math.sin(t * 2.7) * sway
    p = rig.breathe(p, t)
    J = man(ctx, p, CX, gnd, s=0.95, a=ent)
    hx, hy = J["head"]
    amp = lerp(10, 72, eo3(prog(t, S.t0, hd)))
    f = eox(prog(t, k, k + 0.2))
    for qq in range(40):
        a = 2 * math.pi * qq / 40
        h = amp * (0.35 + 0.65 * abs(math.sin(t * 13 + qq * 1.7) * math.cos(t * 7 + qq * 0.6)))
        r0 = 44
        draw_poly(ctx, [(hx + r0 * math.cos(a), hy + r0 * math.sin(a)),
                        (hx + (r0 + h * ent) * math.cos(a), hy + (r0 + h * ent) * math.sin(a))], 1,
                  lerpc(MUTE, RED, f), 0.9, 3)
    for j, r in enumerate((150, 195, 240)):
        ctx.save()
        ctx.set_dash([4 + 6 * j, 10])
        ctx.translate(hx, hy)
        ctx.rotate(t * (0.8 if j % 2 else -0.6) * (1 + 2 * f))
        ring(ctx, 0, 0, r * ent, MUTE, 0.6, 1.5)
        ctx.restore()


def n4(ctx, t, S):
    """It says stop: he sprints; on STOP a sign slams down and he skids to a halt, kicking up dust."""
    k = S.w[2]
    gnd = CY + 150
    ent = eo3(prog(t, S.t0, S.t0 + 0.2))
    t_run0, x0, xs = S.t0, CX - 330, CX - 95
    v = (xs - 40 - x0) / max(k - 0.05 - t_run0, 0.3)
    if t < k - 0.05:
        x = x0 + v * (t - t_run0)
        p = rig.run(x - x0, S_MAN)
    else:
        u = prog(t, k - 0.05, k + 0.25)
        x = lerp(xs - 40, xs, eo3(u))
        p = rig.mix(rig.run(xs - 40 - x0, S_MAN), rig.POSE["skid"], eo3(prog(t, k - 0.05, k + 0.1)))
        p = rig.mix(p, rig.POSE["brace"], eio(prog(t, k + 0.35, k + 0.7)))
    man(ctx, p, x, gnd, a=ent)
    if t < k:
        for q in range(4):
            y = CY - 40 + q * 42
            L = 70 + 40 * math.sin(t * 20 + q)
            draw_poly(ctx, [(x - 80 - L, y), (x - 80, y)], 1, MUTE, 0.7 * ent, 2)
    J = J_of(p, x, gnd)
    dust(ctx, J["footR"][0] + 10, gnd, prog(t, k, k + 0.5), 10, 70)
    u = prog(t, k - 0.04, k + 0.16)
    if u > 0:
        sc = lerp(2.4, 1.0, eox(u))
        a = min(1, u * 3)
        c = (CX + 150, CY - 10)
        draw_poly(ctx, R.oct_pts(c[0], c[1], 125 * sc), 1, RED, a, 5, closed=True)
        draw_poly(ctx, R.oct_pts(c[0], c[1], 108 * sc), 1, RED, a * 0.5, 2, closed=True)
        R.set_font(ctx, R.ANTON, 62 * sc)
        e = ctx.text_extents("STOP")
        ctx.move_to(c[0] - e.x_advance / 2, c[1] + e.height / 2)
        src(ctx, FG, a)
        ctx.show_text("STOP")
        vv = prog(t, k + 0.12, k + 0.6)
        if 0 < vv < 1:
            ring(ctx, c[0], c[1], 130 + 220 * eo3(vv), FG, 0.5 * (1 - vv), 2)


_r = random.Random(25)
N5_PTS = [(CX - 250 + i * 50, CY + 140 - i * 30 - _r.uniform(-22, 22)) for i in range(10)]


def n5(ctx, t, S):
    """It says you'll fail: he walks up a rising graph; on FAIL it crashes and he tumbles down with it."""
    k = S.w[3]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    base = CY + 180
    draw_poly(ctx, [(CX - 290, CY - 240), (CX - 290, base), (CX + 290, base)], ent, MUTE, 0.9, 2)
    for q in range(1, 5):
        y = base - q * 90
        draw_poly(ctx, [(CX - 296, y), (CX - 284, y)], ent, MUTE, 0.9, 2)
    u = prog(t, S.t0 + 0.05, k)
    n = len(N5_PTS) - 1
    f = u * n
    i = min(int(f), n - 1)
    tip = (lerp(N5_PTS[i][0], N5_PTS[i + 1][0], f - i), lerp(N5_PTS[i][1], N5_PTS[i + 1][1], f - i))
    pts = N5_PTS[: i + 1] + [tip]
    crash = eiq(prog(t, k, k + 0.3))
    col = RED if t >= k else FG
    s = 0.55
    if crash > 0:
        bottom = (tip[0] + 40, base)
        drop = (lerp(tip[0], bottom[0], crash), lerp(tip[1], bottom[1], crash))
        draw_poly(ctx, pts + [drop], 1, col, 1, 4)
    else:
        draw_poly(ctx, pts, 1, col, 1, 4)
    dist = 0.0
    for a_, b_ in zip(pts, pts[1:]):
        dist += math.dist(a_, b_)
    if t < k:
        p = rig.walk(dist, s)
        p["torso"] += 12
        man(ctx, p, tip[0] - 6, tip[1] - 2, s=s, a=ent, lw=4)
    elif crash < 1:
        p = rig.mix(rig.walk(dist, s), rig.POSE["cower"], crash)
        man(ctx, p, drop[0] - 6, drop[1] - 2, s=s, lw=4, rot=-2.6 * crash)
    else:
        land = prog(t, k + 0.3, k + 0.5)
        p = rig.mix(rig.POSE["sit"], rig.POSE["lie"], eo3(land))
        man(ctx, p, tip[0] + 10, base - 2, s=s, lw=4)
        dust(ctx, tip[0] + 40, base, prog(t, k + 0.3, k + 0.8), 9, 50)


def n6(ctx, t, S):
    """So fail. Then go again: he stays down on FAIL, sits up on THEN, kneels on GO, stands on AGAIN."""
    so, fl, th, go, ag = S.w
    ent = eo3(prog(t, S.t0, S.t0 + 0.25))
    gnd = CY + 140
    p = rig.anim(t, [(S.t0, "lie"), (th - 0.05, "lie"), (th + 0.2, "sit"), (go - 0.02, "kneel"),
                     (ag + 0.05, "stand"), (ag + 0.35, "guard")], lag=0.05)
    if t < th:
        p["torso"] += 2 * math.sin(t * 3)
    if t > ag + 0.35:
        p = rig.bounce(p, t)
    man(ctx, p, CX - 10, gnd, a=ent)
    u = eo3(prog(t, th, ag))
    R_ = 235
    cy = CY - 15
    if u > 0:
        a0 = -math.pi / 2 + 0.3
        a1 = a0 + (2 * math.pi - 0.6) * u
        col = RED if t >= ag else FG
        ctx.new_sub_path()
        ctx.arc(CX, cy, R_, a0, a1)
        ctx.set_line_width(4)
        src(ctx, col, 1)
        ctx.stroke()
        tip = (CX + R_ * math.cos(a1), cy + R_ * math.sin(a1))
        tang = a1 + math.pi / 2
        for d in (2.6, -2.6):
            draw_poly(ctx, [tip, (tip[0] + 26 * math.cos(tang + d), tip[1] + 26 * math.sin(tang + d))], 1, col, 1, 4)
    for q in range(6):
        a = -math.pi / 2 + 0.3 + (2 * math.pi - 0.6) * (q + 0.5) / 6
        lit = u >= (q + 0.5) / 6
        dot(ctx, CX + R_ * math.cos(a), cy + R_ * math.sin(a), 7 if lit else 4,
            (RED if t >= ag else FG) if lit else MUTE, ent)


_r = random.Random(27)
N7_BOLTS = [(_r.uniform(0, 6.283), _r.uniform(0, 0.9)) for _ in range(11)]


def n7(ctx, t, S):
    """Pain is not the enemy: bolts strike, each hit jolts him; from NOT he straightens, chest out on ENEMY."""
    k, nt, en = S.w[0], S.w[2], S.w[4]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    c = (CX, CY + 10)
    gnd = CY + 130
    jolt, hit_flash = 0.0, 0.0
    for j, (ang, off) in enumerate(N7_BOLTS):
        ts = k - 0.12 + off
        u = prog(t, ts, ts + 0.22)
        if u <= 0:
            continue
        outer = (c[0] + 420 * math.cos(ang), c[1] + 420 * math.sin(ang))
        inner = (c[0] + 130 * math.cos(ang), c[1] + 130 * math.sin(ang))
        if u < 1:
            head = (lerp(outer[0], inner[0], eiq(u)), lerp(outer[1], inner[1], eiq(u)))
            tail_u = max(0, eiq(u) - 0.45)
            tail = (lerp(outer[0], inner[0], tail_u), lerp(outer[1], inner[1], tail_u))
            draw_poly(ctx, zigzag(tail, head, 7, 14, int(t * 30) + j), 1, RED, 1, 3)
        else:
            d = t - (ts + 0.22)
            jolt += math.exp(-d / 0.09) * (1 if math.cos(ang) > 0 else -1)
            v = prog(t, ts + 0.22, ts + 0.6)
            if v < 1:
                hit_flash = max(hit_flash, 1 - v)
                for sgn in (-1, 1):
                    a2 = ang + sgn * 0.7
                    p0 = (inner[0] + 60 * eo3(v) * math.cos(a2), inner[1] + 60 * eo3(v) * math.sin(a2))
                    p1 = (p0[0] + 22 * math.cos(a2), p0[1] + 22 * math.sin(a2))
                    draw_poly(ctx, [p0, p1], 1, RED, 1 - v, 3)
    ring(ctx, c[0], c[1], 130, FG, (0.35 + 0.65 * hit_flash) * ent, 2 + 3 * hit_flash)
    p = rig.anim(t, [(S.t0, "brace"), (nt, "brace"), (en, "stand"), (en + 0.3, "chest")], lag=0.04)
    resist = 1 - prog(t, nt, en)
    p["torso"] -= 10 * clamp(jolt, -1.5, 1.5) * resist
    p["hy"] -= 4 * min(abs(jolt), 1.5) * resist
    p = rig.breathe(p, t)
    man(ctx, p, CX - 5, gnd, s=0.8, a=ent)


def climber(ctx, hip, hands, feet, s, a):
    """Front view: arms and knees bend outward."""
    L = rig.LIM
    neck = (hip[0], hip[1] - L["torso"] * s)
    head = (neck[0], neck[1] - (L["neck"] + L["head"]) * s)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_width(5)
    ctx.move_to(*hip)
    ctx.line_to(*neck)
    for side, sg in (("L", -1), ("R", 1)):
        e, h = rig.two_bone(neck, hands[side], L["uarm"] * s, L["farm"] * s, sg)
        ctx.move_to(*neck)
        ctx.line_to(*e)
        ctx.line_to(*h)
        kn, ft = rig.two_bone(hip, feet[side], L["thigh"] * s, L["shin"] * s, -sg)
        ctx.move_to(*hip)
        ctx.line_to(*kn)
        ctx.line_to(*ft)
    src(ctx, FG, a)
    ctx.stroke()
    ctx.new_sub_path()
    ctx.arc(head[0], head[1], L["head"] * s, 0, 2 * math.pi)
    ctx.fill()


def n8(ctx, t, S):
    """Pain is the teacher: red shards fly in as rungs; he climbs hand over hand; on TEACHER the rungs flash red."""
    k = S.w[3]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    top, bot = CY - 300, CY + 220
    RX0, RX1 = CX - 70, CX + 70
    for x in (RX0, RX1):
        draw_poly(ctx, [(x, bot), (x, lerp(bot, top, ent))], 1, FG, 1, 3)

    def ry(r):
        return bot - 52 * r
    rr = random.Random(28)
    for j in range(1, 10):
        y = ry(j)
        ts = S.t0 + 0.04 * j
        u = eo3(prog(t, ts, ts + 0.25))
        ang = rr.uniform(0, 6.283)
        if u <= 0:
            continue
        ox, oy = 280 * math.cos(ang) * (1 - u), 280 * math.sin(ang) * (1 - u)
        lit = prog(t, k + 0.04 * j, k + 0.04 * j + 0.05) >= 1
        col = RED if (u < 1 or lit) else FG
        draw_poly(ctx, zigzag((RX0 + ox, y + oy), (RX1 + ox, y + oy), 6, 10 * (1 - u), j), 1, col, 1, 4)
    s = 0.64
    c = 4.0 * eio(prog(t, S.t0 + 0.15, k + 0.35))

    def limb(o, base):
        kk = math.floor((c - o) / 2)
        fr = (c - o) / 2 - kk
        m = eio(clamp((fr - 0.5) / 0.5))
        return 2 * kk + o + base + 2 * m, math.sin(math.pi * m)
    hip = (CX, ry(c) - 52)
    hands, feet = {}, {}
    for side, o, x in (("L", 0, RX0), ("R", 1, RX1)):
        r, arc = limb(o, 2)
        hands[side] = (x + (-1 if side == "L" else 1) * 18 * arc, ry(r))
        r2, arc2 = limb(1 - o, 0)
        feet[side] = (CX + (-1 if side == "L" else 1) * (40 + 14 * arc2), ry(max(r2, 0)))
    climber(ctx, hip, hands, feet, s, ent)


def n9(ctx, t, S):
    """Every fall makes you harder: knocked down three times, he gets up each time; a hexagon shell locks after each."""
    k = S.w[4]
    falls = [S.w[0] + 0.02, S.w[1] + 0.02, S.w[2] + 0.0]
    ent = eo3(prog(t, S.t0, S.t0 + 0.25))
    keys = [(S.t0, "guard")]
    for fa in falls:
        keys += [(fa, "guard"), (fa + 0.09, "skid"), (fa + 0.18, "sit"), (fa + 0.3, "kneel"), (fa + 0.42, "guard")]
    keys += [(k, "guard"), (k + 0.15, "brace")]
    p = rig.anim(t, keys, lag=0.03)
    shove = sum(-14 * math.sin(math.pi * prog(t, fa, fa + 0.42)) for fa in falls)
    man(ctx, p, CX + shove, CY + 130, s=0.8, a=ent)
    for fa in falls:
        dust(ctx, CX - 20, CY + 130, prog(t, fa + 0.16, fa + 0.5), 8, 55)
    for j, fa in enumerate(falls):
        u = eox(prog(t, fa + 0.4, fa + 0.62))
        if u <= 0:
            continue
        R_ = 155 + 38 * j
        rot = (1 - u) * 0.8
        pts = [(CX + R_ * math.cos(rot + math.radians(30 + 60 * q)), CY + R_ * math.sin(rot + math.radians(30 + 60 * q)))
               for q in range(6)]
        last = j == 2 and t >= k
        draw_poly(ctx, pts, 1, RED if last else FG, u * (1 if last else 0.8), 5 if last else 3, closed=True)
        if last:
            for pt in pts:
                dot(ctx, pt[0], pt[1], 6 * eox(prog(t, k, k + 0.15)), RED)


_r = random.Random(29)
N10_SEG = []
while len(N10_SEG) < 150:
    x, y = _r.uniform(CX - 330, CX + 330), _r.uniform(CY - 300, CY + 250)
    if math.hypot(x - CX, y - CY - 20) > 120:
        N10_SEG.append((x, y, _r.uniform(0, 6.283), _r.uniform(0, 6.283)))


def n10(ctx, t, S):
    """Fear gets quiet when you move: trembling, he breathes on QUIET, straightens, and walks out on MOVE."""
    q, wh, mv = S.w[2], S.w[3], S.w[5]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    calm = 0.35 * eo3(prog(t, q, q + 0.4)) + 0.65 * eox(prog(t, mv, mv + 0.4))
    for x, y, a0, ph in N10_SEG:
        jit = 14 * (1 - calm)
        px = x + jit * math.sin(t * 31 + ph)
        py = y + jit * math.cos(t * 27 + ph)
        a = lerp_angle(a0 + 3 * math.sin(t * 9 + ph) * (1 - calm), 0, calm)
        L = lerp(16, 34, calm)
        draw_poly(ctx, [(px - L / 2 * math.cos(a), py - L / 2 * math.sin(a)),
                        (px + L / 2 * math.cos(a), py + L / 2 * math.sin(a))], 1, MUTE, ent * (0.9 - 0.4 * calm), 2)
    gnd = CY + 140
    x0 = CX - 70
    if t < mv:
        p = rig.anim(t, [(S.t0, "cower"), (q, "cower"), (wh, "stand")], lag=0.06)
        tr = 1 - prog(t, q, wh)
        p["torso"] += 2.5 * math.sin(t * 47) * tr
        p["hL"] = (p["hL"][0] + 2 * math.sin(t * 53) * tr, p["hL"][1])
        p["hR"] = (p["hR"][0] + 2 * math.sin(t * 41) * tr, p["hR"][1])
        p = rig.breathe(p, t, 1 + 1.5 * prog(t, q, wh))
        x = x0
    else:
        x = x0 + 120 * (t - mv)
        p = rig.mix(rig.POSE["stand"], rig.walk(x - x0, S_MAN), eo3(prog(t, mv, mv + 0.15)))
        for j in range(8):
            fx = x0 + 10 + j * 30
            if fx < x - 28:
                draw_poly(ctx, [(fx, gnd + 2), (fx + 12, gnd + 2)], 1, RED, 0.9, 3)
    man(ctx, p, x, gnd, a=ent)


_r = random.Random(30)
N11_SH = [(_r.uniform(-1, 1), _r.uniform(-0.6, 0.6), _r.uniform(-2, 2)) for _ in range(12)]


def n11(ctx, t, S):
    """Beat yourself: wind-up on BEAT, the cross shatters the mirror on YOURSELF; he walks through; arms up on EVERYTHING."""
    b1, k1, k2 = S.w[0], S.w[1], S.w[5]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    gnd = CY + 150
    top, bot = CY - 260, CY + 190
    sh = prog(t, k1 + 0.04, k1 + 0.6)
    if sh <= 0:
        draw_poly(ctx, [(CX, top), (CX, bot)], ent, FG, 0.7, 3)
    else:
        for j, (dx, dy, rot) in enumerate(N11_SH):
            y0 = lerp(top, bot, j / 12)
            y1 = lerp(top, bot, (j + 1) / 12)
            c = (CX + dx * 260 * eo3(sh), (y0 + y1) / 2 + dy * 200 * eo3(sh))
            h = (y1 - y0) / 2
            a = rot * eo3(sh)
            draw_poly(ctx, [(c[0] - h * math.sin(a), c[1] - h * math.cos(a)),
                            (c[0] + h * math.sin(a), c[1] + h * math.cos(a))], 1, FG, 0.7 * (1 - sh), 3)
    wstart, wend = k1 + 0.45, S.w[4] - 0.05
    xs = CX - 104
    if t < wstart:
        p = rig.anim(t, [(S.t0, "guard"), (b1 - 0.05, "guard"), (b1 + 0.15, "windup"), (k1 - 0.03, "windup"),
                         (k1 + 0.04, "cross"), (k1 + 0.3, "cross"), (wstart, "stand")], lag=0.03)
        p = rig.bounce(p, t, 1 - prog(t, b1 - 0.05, b1 + 0.1))
        x = xs
    elif t < wend:
        x = lerp(xs, CX - 5, prog(t, wstart, wend))
        p = rig.walk(x - xs, S_MAN)
    else:
        x = CX - 5
        p = rig.anim(t, [(wend, rig.walk(CX - 5 - xs, S_MAN)), (k2 - 0.05, "stand"), (k2 + 0.2, "victory")], lag=0.05)
        p = rig.breathe(p, t)
    man(ctx, p, x, gnd, a=ent)
    ga = ent * (1 - eo3(prog(t, k1 + 0.04, k1 + 0.35)))
    if ga > 0:
        man(ctx, p, 2 * CX - x, gnd, col=MUTE, a=ga, facing=-1)
    if k1 + 0.04 <= t < k1 + 0.45:
        cracks(ctx, (CX, CY - 40), prog(t, k1 + 0.04, k1 + 0.25), 7, 8, 120, FG)
    u = prog(t, k2, k2 + 0.4)
    if u > 0:
        for q in range(28):
            a = 2 * math.pi * q / 28
            r0, r1 = 130, 130 + (150 + 70 * (q % 2)) * eox(u)
            draw_poly(ctx, [(CX + r0 * math.cos(a), CY - 20 + r0 * math.sin(a)),
                            (CX + r1 * math.cos(a), CY - 20 + r1 * math.sin(a))], 1, RED, 1, 3)
        ring(ctx, CX, CY - 20, 340 * eox(u), RED, 0.8, 2)


def n12(ctx, t, S):
    """The Complete Fighter: the cage forms; MIND finger to temple + ring, FIGHT jab-cross, BODY chest out + bars."""
    w = S.w
    k, mi, fi, bo = w[2], w[3], w[4], w[5]
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
        u = eo3(prog(t, bo + 0.025 * j, bo + 0.025 * j + 0.25))
        if u > 0:
            h = (16 + j * 13) * u
            x = CX - 165 + j * 30
            ctx.rectangle(x - 9, CY + 175 - h, 18, h)
            src(ctx, MUTE, 0.55)
            ctx.fill()
    p = rig.anim(t, [(S.t0, "guard"), (mi - 0.05, "guard"), (mi + 0.15, "temple"), (fi - 0.08, "guard"),
                     (fi + 0.04, "jab"), (fi + 0.16, "guard"), (fi + 0.26, "cross"), (bo - 0.05, "guard"),
                     (bo + 0.2, "chest")], lag=0.03)
    if t < mi - 0.05 or (fi - 0.08 < t < bo):
        p = rig.bounce(p, t, 0.8)
    p = rig.breathe(p, t)
    gnd = CY + 175
    J = man(ctx, p, CX - 20, gnd, s=0.82)
    if t >= mi:
        for q in range(6):
            u = eo3(prog(t, mi + 0.04 * q, mi + 0.04 * q + 0.12))
            a0 = -math.pi / 2 + q * math.pi / 3 + 0.08
            ctx.new_sub_path()
            ctx.arc(J["head"][0], J["head"][1], 34, a0, a0 + (math.pi / 3 - 0.16) * u)
            ctx.set_line_width(6)
            src(ctx, RED, 1)
            ctx.stroke()
    for ts in (fi + 0.04, fi + 0.26):
        u = prog(t, ts, ts + 0.4)
        if 0 < u < 1:
            hx, hy = J["handR"] if ts > fi + 0.1 else J["handL"]
            for q in range(8):
                a = 2 * math.pi * q / 8
                r0, r1 = 12 + 40 * eo3(u), 26 + 60 * eo3(u)
                draw_poly(ctx, [(hx + r0 * math.cos(a), hy + r0 * math.sin(a)),
                                (hx + r1 * math.cos(a), hy + r1 * math.sin(a))], 1, FG, 1 - u, 3)


def n13(ctx, t, S):
    """Start now, link in bio: reels land on NOW; he walks in on LINK and points up on BIO as the arrow rises."""
    w = S.w
    kp, li, kb = w[1], w[2], w[4]
    ent = eo3(prog(t, S.t0, S.t0 + 0.3))
    R.set_font(ctx, R.ALICE, 34)
    lab = "THE COMPLETE FIGHTER"
    e = ctx.text_extents(lab)
    ctx.move_to(CX - e.x_advance / 2, CY - 215)
    src(ctx, MUTE, ent)
    ctx.show_text(lab)
    size, glyphs = 200, ["N", "O", "W"]
    R.set_font(ctx, R.ANTON, size)
    adv = [ctx.text_extents(g).x_advance for g in glyphs]
    total = sum(adv) + 24
    x0 = CX - total / 2 - 40
    topy, boty = CY - 170, CY + 70
    draw_poly(ctx, [(x0 - 20, topy), (x0 + total + 20, topy)], ent, MUTE, 0.8, 2)
    draw_poly(ctx, [(x0 - 20, boty), (x0 + total + 20, boty)], ent, MUTE, 0.8, 2)
    x = x0
    for j, g in enumerate(glyphs):
        strip = list("XKAERTSQMZBH"[j * 3:] + "XKAERTSQMZBH"[:j * 3]) + [g]
        land = kp + 0.1 * j
        pos = (len(strip) - 1) * eo3(prog(t, S.t0, land))
        ctx.save()
        ctx.rectangle(x - 5, topy + 4, adv[j] + 10, boty - topy - 8)
        ctx.clip()
        for nn in (int(pos), int(pos) + 1):
            if nn >= len(strip):
                continue
            col = RED if (t >= land and nn == len(strip) - 1) else FG
            R.set_font(ctx, R.ANTON, size)
            ctx.move_to(x, CY + (nn - pos) * 230)
            src(ctx, col, ent)
            ctx.show_text(strip[nn])
        ctx.restore()
        x += adv[j] + 12
    u = eo3(prog(t, kp + 0.25, kp + 0.55))
    ctx.rectangle(x0, boty + 18, total * u, 5)
    src(ctx, RED, 1)
    ctx.fill()
    ax = x0 + total + 45
    sx = ax + 80
    gnd = CY + 175
    if t >= li - 0.45:
        wx = lerp(sx + 170, sx, eo3(prog(t, li - 0.45, li + 0.25)))
        if t < li + 0.25:
            p = rig.walk(sx + 170 - wx, 0.72)
        else:
            p = rig.anim(t, [(li + 0.25, rig.walk(170, 0.72)), (li + 0.45, "stand"), (kb - 0.05, "stand"),
                             (kb + 0.2, "point")], lag=0.05)
            p = rig.breathe(p, t)
        man(ctx, p, wx, gnd, s=0.72, a=eo3(prog(t, li - 0.45, li - 0.2)), facing=-1)
    au = eo3(prog(t, kb, kb + 0.3))
    if au > 0:
        lift = 0
        for p0 in (kb + 0.3, kb + 0.6):
            pp = prog(t, p0, p0 + 0.28)
            if 0 < pp < 1:
                lift = 16 * math.sin(math.pi * pp)
        y0, y1 = CY + 160, CY - 190
        ytip = lerp(y0, y1, au) - lift
        draw_poly(ctx, [(ax, y0), (ax, ytip)], 1, RED, 1, 5)
        draw_poly(ctx, [(ax - 24, ytip + 24), (ax, ytip), (ax + 24, ytip + 24)], 1, RED, 1, 5)


# ----------------------------------------------------------------- environments
def env_ring(ctx, t):
    # spotlight cone with drifting dust
    g = cairo.LinearGradient(0, 0, 0, CY + 420)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.07)
    g.add_color_stop_rgba(1, 1, 1, 1, 0.0)
    ctx.move_to(CX - 90, 0)
    ctx.line_to(CX + 90, 0)
    ctx.line_to(CX + 470, CY + 420)
    ctx.line_to(CX - 470, CY + 420)
    ctx.close_path()
    ctx.set_source(g)
    ctx.fill()
    r = random.Random(41)
    for _ in range(46):
        bx, by, ph = r.uniform(-1, 1), r.uniform(0, 1), r.uniform(0, 6.28)
        y = (by * (CY + 400) - t * 14) % (CY + 400)
        x = CX + bx * (90 + 380 * y / (CY + 420)) + 12 * math.sin(t * 0.6 + ph)
        dot(ctx, x, y, 1.6, FG, 0.22)
    back, front = CY + 40, H + 200
    draw_poly(ctx, [(160, back), (920, back)], 1, FG, 0.12, 2)
    draw_poly(ctx, [(160, back), (-260, front)], 1, FG, 0.10, 2)
    draw_poly(ctx, [(920, back), (1340, front)], 1, FG, 0.10, 2)
    for q in range(1, 8):
        xb = lerp(160, 920, q / 8)
        draw_poly(ctx, [(xb, back), (lerp(-260, 1340, q / 8), front)], 1, FG, 0.04, 1.5)
    for x in (160, 920):
        draw_poly(ctx, [(x, back), (x, CY - 210)], 1, FG, 0.14, 6)
    for j, y in enumerate((CY - 40, CY - 105, CY - 170)):
        col, al = (RED, 0.35) if j == 2 else (FG, 0.13)
        sag = 6 + 2 * math.sin(t * 1.3 + j)
        draw_poly(ctx, R.bezier((160, y), (420, y + sag), (660, y + sag), (920, y), 24), 1, col, al, 3)
        draw_poly(ctx, [(160, y), (-260, y + 520)], 1, col, al * 0.8, 3)
        draw_poly(ctx, [(920, y), (1340, y + 520)], 1, col, al * 0.8, 3)


_r = random.Random(42)
VOID_P = [(math.acos(_r.uniform(-1, 1)), _r.uniform(0, 6.283)) for _ in range(70)]


def env_void(ctx, t):
    pts = []
    for th, ph in VOID_P:
        x, y, z = math.sin(th) * math.cos(ph + t * 0.12), math.cos(th), math.sin(th) * math.sin(ph + t * 0.12)
        y, z = y * math.cos(0.4) - z * math.sin(0.4), y * math.sin(0.4) + z * math.cos(0.4)
        f = 900 / (900 + 380 * z)
        pts.append((CX + 620 * x * f, CY + 620 * y * f, z))
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            d = math.dist(pts[i][:2], pts[j][:2])
            if d < 190:
                draw_poly(ctx, [pts[i][:2], pts[j][:2]], 1, FG, 0.07 * (1 - d / 190) * (1.2 - pts[i][2]) / 2.2 + 0.01, 1)
    for x, y, z in pts:
        dot(ctx, x, y, 2.2 - z, FG, 0.12 + 0.1 * (1 - z) / 2)


_r = random.Random(43)
ROAD_B = []
xb = -40
while xb < W + 40:
    w_ = _r.uniform(36, 90)
    ROAD_B.append((xb, w_, _r.uniform(30, 170), [(_r.uniform(0.15, 0.85), _r.uniform(0.15, 0.9), _r.uniform(0, 6.3))
                                                for _ in range(_r.randint(1, 5))]))
    xb += w_ + _r.uniform(2, 14)


def env_road(ctx, t):
    hz = CY - 110
    for x, w_, h_, wins in ROAD_B:
        ctx.rectangle(x, hz - h_, w_, h_)
        src(ctx, FG, 0.05)
        ctx.fill()
        for wx, wy, ph in wins:
            if math.sin(t * 0.7 + ph) > -0.6:
                dot(ctx, x + wx * w_, hz - h_ + wy * h_, 1.8, FG, 0.25)
    ring(ctx, 830, 380, 46, FG, 0.18, 2)
    dot(ctx, 830, 380, 46, FG, 0.04)
    draw_poly(ctx, [(0, hz), (W, hz)], 1, FG, 0.12, 1.5)
    draw_poly(ctx, [(CX - 14, hz), (-260, H)], 1, FG, 0.16, 2)
    draw_poly(ctx, [(CX + 14, hz), (W + 260, H)], 1, FG, 0.16, 2)
    for k in range(14):
        z = ((k + t * 2.2) % 14) / 14
        y0 = hz + (H - hz) * z ** 2.2
        y1 = hz + (H - hz) * min(1, z + 0.025) ** 2.2
        wdt = 1 + 9 * z
        ctx.rectangle(CX - wdt / 2, y0, wdt, max(1, y1 - y0))
        src(ctx, FG, 0.12 + 0.1 * z)
        ctx.fill()
    for k in range(6):
        z = ((k + t * 1.1) % 6) / 6
        for sd in (-1, 1):
            xb2 = CX + sd * (30 + 900 * z ** 2.2)
            yb = hz + (H - hz) * z ** 2.2
            hgt = 20 + 380 * z ** 2.2
            draw_poly(ctx, [(xb2, yb), (xb2, yb - hgt)], 1, FG, 0.12 * z, 1 + 3 * z)


_r = random.Random(44)
RAIN = [(_r.uniform(0, W + 300), _r.uniform(0, H + 200), _r.uniform(36, 70), _r.uniform(0.8, 1.2)) for _ in range(150)]
RIPPLE = [(_r.uniform(60, W - 60), _r.uniform(0, 1)) for _ in range(14)]
FLASHES = []


def env_rain(ctx, t):
    for ft in FLASHES:
        u = prog(t, ft, ft + 0.35)
        if 0 < u < 1:
            fl = (1 - u) * (0.7 + 0.3 * math.sin(u * 40))
            ctx.rectangle(0, 0, W, H)
            src(ctx, FG, 0.09 * fl)
            ctx.fill()
            draw_poly(ctx, zigzag((780, 0), (700, CY - 160), 9, 40, int(ft * 10)), 1, FG, 0.5 * fl, 3)
    ang = math.radians(12)
    for x0, y0, L, sp in RAIN:
        y = (y0 + t * 1500 * sp) % (H + 200) - 100
        x = (x0 - (y + 100) * math.tan(ang)) % (W + 300) - 150
        draw_poly(ctx, [(x, y), (x + L * math.sin(ang), y + L * math.cos(ang))], 1, FG, 0.11, 1.5)
    gy = CY + 300
    draw_poly(ctx, [(0, gy), (W, gy)], 1, FG, 0.10, 1.5)
    for x, ph in RIPPLE:
        u = (t * 1.3 + ph) % 1
        ctx.save()
        ctx.translate(x, gy + 6)
        ctx.scale(1, 0.25)
        ring(ctx, 0, 0, 6 + 40 * u, FG, 0.18 * (1 - u), 2 / 0.25 * 0.5)
        ctx.restore()


def env_gym(ctx, t):
    fy = CY + 300
    draw_poly(ctx, [(0, fy), (W, fy)], 1, FG, 0.12, 2)
    for q in range(1, 6):
        y = fy + q * q * 14
        draw_poly(ctx, [(0, y), (W, y)], 1, FG, 0.04, 1.5)
    for q in range(-6, 7):
        draw_poly(ctx, [(CX + q * 60, fy), (CX + q * 260, H)], 1, FG, 0.04, 1.5)
    for x in (120, 290):
        draw_poly(ctx, [(x, fy), (x, CY - 260)], 1, FG, 0.11, 6)
    draw_poly(ctx, [(120, CY - 260), (290, CY - 260)], 1, FG, 0.11, 6)
    draw_poly(ctx, [(60, CY - 60), (350, CY - 60)], 1, FG, 0.12, 5)
    for x in (88, 322):
        ring(ctx, x, CY - 60, 52, FG, 0.10, 4)
        ring(ctx, x, CY - 60, 14, FG, 0.10, 2)
    sw = 0.06 * math.sin(t * 1.4)
    top = (900, 300)
    end = (top[0] + 170 * math.sin(sw), top[1] + 170 * math.cos(sw))
    ctx.save()
    ctx.set_dash([6, 5])
    draw_poly(ctx, [top, end], 1, FG, 0.14, 2)
    ctx.restore()
    ctx.save()
    ctx.translate(*end)
    ctx.rotate(-sw)
    ctx.rectangle(-42, 0, 84, 250)
    ctx.set_line_width(3)
    src(ctx, FG, 0.11)
    ctx.stroke()
    for q in (60, 190):
        draw_poly(ctx, [(-42, q), (42, q)], 1, FG, 0.07, 2)
    ctx.restore()
    ring(ctx, CX, 380, 34, FG, 0.12, 2)
    a = math.floor(t) * math.pi / 30 - math.pi / 2
    draw_poly(ctx, [(CX, 380), (CX + 26 * math.cos(a), 380 + 26 * math.sin(a))], 1, RED, 0.35, 2)


DAWN = {}


def env_dawn(ctx, t):
    g0, g1 = DAWN.get("range", (0, 1))
    g = 0.15 + 0.85 * eio(prog(t, g0, g1))
    hz = CY + 200
    rg = cairo.RadialGradient(CX, hz, 20, CX, hz, 900)
    rg.add_color_stop_rgba(0, RED[0], RED[1], RED[2], 0.28 * g)
    rg.add_color_stop_rgba(1, RED[0], RED[1], RED[2], 0)
    ctx.save()
    ctx.rectangle(0, 0, W, hz)
    ctx.clip()
    ctx.set_source(rg)
    ctx.paint()
    sy = hz + 130 - 190 * g
    ring(ctx, CX, sy, 120, FG, 0.25, 2)
    dot(ctx, CX, sy, 120, RED, 0.08 + 0.1 * g)
    for q in range(1, 9):
        ring(ctx, CX, sy, 120 + q * 70, RED, 0.05 * g * (1 - q / 9), 1.5)
    ctx.restore()
    draw_poly(ctx, [(0, hz), (W, hz)], 1, FG, 0.2, 2)
    for q in range(16):
        z = ((q + t * 0.8) % 16) / 16
        y = hz + (H - hz) * z ** 2
        draw_poly(ctx, [(0, y), (W, y)], 1, FG, 0.05 + 0.05 * z, 1.5)


def env_mirror(ctx, t):
    c = (CX, CY - 20)
    for k in range(12):
        z = ((k + t * 0.9) % 12) / 12
        sc = 0.05 + z ** 2 * 1.7
        hw, hh = 470 * sc, 720 * sc
        a = 0.14 * 4 * z * (1 - z)
        ctx.rectangle(c[0] - hw, c[1] - hh, 2 * hw, 2 * hh)
        ctx.set_line_width(1 + 2 * z)
        src(ctx, FG, a)
        ctx.stroke()
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        draw_poly(ctx, [c, (c[0] + sx * 900, c[1] + sy * 1380)], 1, FG, 0.05, 1.5)


def env_cage(ctx, t):
    c = (CX, CY + 190)
    rot = t * 0.15
    oc = [(c[0] + 560 * math.cos(rot + math.radians(22.5 + 45 * k)),
           c[1] + 150 * math.sin(rot + math.radians(22.5 + 45 * k))) for k in range(8)]
    draw_poly(ctx, oc, 1, FG, 0.12, 2, closed=True)
    for k in range(8):
        a = rot + math.radians(22.5 + 45 * k)
        if math.sin(a) < 0.2:
            x, y = oc[k]
            draw_poly(ctx, [(x, y), (x, y - 330)], 1, FG, 0.12, 4)
    top = [(x, y - 330) for x, y in oc]
    for k in range(8):
        a1 = rot + math.radians(22.5 + 45 * k)
        a2 = rot + math.radians(22.5 + 45 * (k + 1))
        if math.sin(a1) < 0.2 and math.sin(a2) < 0.2:
            draw_poly(ctx, [top[k], top[(k + 1) % 8]], 1, RED, 0.25, 3)
            ctx.save()
            ctx.move_to(*oc[k])
            ctx.line_to(*oc[(k + 1) % 8])
            ctx.line_to(*top[(k + 1) % 8])
            ctx.line_to(*top[k])
            ctx.close_path()
            ctx.clip()
            for q in range(-12, 13):
                x0 = (oc[k][0] + oc[(k + 1) % 8][0]) / 2 + q * 24
                for sgn in (-1, 1):
                    ctx.move_to(x0 - sgn * 200, c[1] - 600)
                    ctx.line_to(x0 + sgn * 200, c[1] + 200)
            ctx.set_line_width(1)
            src(ctx, FG, 0.035)
            ctx.stroke()
            ctx.restore()
    ctx.rectangle(CX - 300, 320, 600, 10)
    src(ctx, FG, 0.10)
    ctx.fill()
    for q in range(8):
        x = CX - 262 + q * 75
        dot(ctx, x, 336, 6, FG, 0.25 + 0.15 * math.sin(t * 3 + q))
        g = cairo.LinearGradient(0, 340, 0, CY + 200)
        g.add_color_stop_rgba(0, 1, 1, 1, 0.035)
        g.add_color_stop_rgba(1, 1, 1, 1, 0)
        ctx.move_to(x - 4, 340)
        ctx.line_to(x + 4, 340)
        ctx.line_to(x + 60 + (x - CX) * 0.3, CY + 200)
        ctx.line_to(x - 60 + (x - CX) * 0.3, CY + 200)
        ctx.close_path()
        ctx.set_source(g)
        ctx.fill()


ENV_FNS = dict(ring=env_ring, void=env_void, road=env_road, rain=env_rain, gym=env_gym, dawn=env_dawn,
               mirror=env_mirror, cage=env_cage)
ENV = ["ring", "ring", "void", "road", "road", "rain", "rain", "gym", "gym", "dawn", "mirror", "cage", "cage"]
WIPE_KINDS = ["iris", "blade", "shutter"]
FLASHES[:] = [SC[6].w[0] - 0.02, SC[6].w[4] - 0.02, SC[5].w[1]]
DAWN["range"] = (SC[9].w[2] - 0.2, SC[9].w[5] + 0.6)


def draw_bg(ctx, t, i):
    def layer(env):
        src(ctx, BLACK)
        ctx.paint()
        dx = 8 * math.sin(t * 0.35)
        ctx.save()
        ctx.translate(dx, 0)
        ENV_FNS[env](ctx, t)
        ctx.restore()
    S = SC[i]
    u = prog(t, S.t0, S.t0 + 0.34)
    if i == 0 or ENV[i] == ENV[i - 1] or u >= 1:
        layer(ENV[i])
        return
    layer(ENV[i - 1])
    nchange = sum(1 for j in range(1, i + 1) if ENV[j] != ENV[j - 1])
    kind = WIPE_KINDS[nchange % 3]
    e = eio(u)
    ctx.save()
    if kind == "iris":
        ctx.arc(CX, CY, 2300 * e + 0.1, 0, 2 * math.pi)
    elif kind == "shutter":
        for b in range(8):
            ctx.rectangle(0, b * H / 8, W, H / 8 * e)
    else:
        x = -H + (W + 2 * H) * e
        ctx.move_to(-H, 0)
        ctx.line_to(x, 0)
        ctx.line_to(x - H * 0.5, H)
        ctx.line_to(-H, H)
        ctx.close_path()
    path = ctx.copy_path()
    ctx.clip()
    layer(ENV[i])
    ctx.restore()
    ctx.append_path(path)
    ctx.set_line_width(3)
    src(ctx, RED if nchange % 2 else FG, 0.6 * (1 - u))
    ctx.stroke()


# ----------------------------------------------------------------- wire into the video-2 engine
V.SC, V.CAPS = SC, CAPS
V.FREEZE, V.END = SC[-1].t1 - 1.0, SC[-1].t1
V.KEY_TIMES = sorted(w.t for g in CAPS for line in g.lines for w in line if w.key)
V.IMPACTS = [SC[0].w[3] + 0.03, SC[3].w[2], SC[4].w[3] + 0.3, SC[6].w[0], SC[10].w[1] + 0.04, SC[10].w[5]]
V.SCENE_FNS = [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12, n13]
V.draw_bg = draw_bg


def frame_bytes(n):
    return bytes(V.render(n / V.FPS, n).get_data())


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--frames":
        for a in sys.argv[2:]:
            V.render(float(a)).write_to_png(os.path.join(OUT, f"check_{float(a):05.2f}.png"))
        return
    V.render(SC[0].w[3] + 0.4).write_to_png(os.path.join(OUT, "cover.png"))
    n = int(round(V.END * V.FPS))
    vid = os.path.join(OUT, "_video.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{V.W}x{V.H}",
           "-r", str(V.FPS), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-maxrate", "14M", "-bufsize", "28M", "-tune", "grain",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-colorspace", "bt709", "-movflags", "+faststart", vid]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for k, b in enumerate(pool.imap(frame_bytes, range(n), chunksize=6)):
            ff.stdin.write(b)
            if k % 150 == 0:
                print(f"frame {k}/{n}", flush=True)
    ff.stdin.close()
    ff.wait()
    final = os.path.join(OUT, "enemy_tiktok.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", os.path.join(OUT, "voice.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "apad", "-t", f"{V.END:.3f}", "-movflags", "+faststart", final], check=True)
    os.remove(vid)
    print("wrote", final, f"({V.END:.2f}s)")


if __name__ == "__main__":
    R.ensure_fonts()
    main()
