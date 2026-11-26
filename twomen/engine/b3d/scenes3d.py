"""3D scene builders. Each builder(P, job) builds the scene and returns update(t) which poses
everything for shot time t (seconds). P = scene params from the episode JSON, job = timing info."""
import math
import random

import bpy
from mathutils import Euler, Vector

from . import human as Hm
from . import lib as L


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


class Clock:
    def __init__(self, job):
        self.dur = job["dur"]
        self.beats = job.get("beats", [0.0])
        self.speed = job.get("anim_speed", 1.0)

    def m(self, t):  # motion time (slow motion aware)
        return t * self.speed

    def since(self, t, k):
        return t - self.beats[k] if k < len(self.beats) else -1.0

    def beat(self, t):
        i = 0
        for k, s in enumerate(self.beats):
            if t >= s - 1e-6:
                i = k
        return i


def man1(name="Man1", loc=(0, 0, 0), yaw=0.0):
    """The one who reacts: lighter skin, deep burgundy knit."""
    return Hm.Human(name, loc, yaw, muscle=0.6, tone=(0.55, 0.37, 0.28), top=(0.11, 0.014, 0.016),
                    bottom=(0.018, 0.018, 0.022), ethnic=(("caucasian", 0.8), ("asian", 0.2)),
                    iris=((0.12, 0.07, 0.03), (0.38, 0.24, 0.10)))


def man2(name="Man2", loc=(0, 0, 0), yaw=0.0):
    """The calm one: darker skin, black knit."""
    return Hm.Human(name, loc, yaw, muscle=0.68, tone=(0.13, 0.075, 0.045), top=(0.010, 0.010, 0.012),
                    bottom=(0.014, 0.014, 0.017), ethnic=(("african", 0.75), ("caucasian", 0.25)),
                    iris=((0.05, 0.03, 0.015), (0.2, 0.12, 0.05)))


def other(name="Other", loc=(0, 0, 0), yaw=0.0):
    """The insulter / the one who said no: grey knit."""
    return Hm.Human(name, loc, yaw, muscle=0.45, weight=0.55, tone=(0.47, 0.34, 0.25), top=(0.10, 0.10, 0.11),
                    bottom=(0.03, 0.03, 0.035), ethnic=(("asian", 0.5), ("caucasian", 0.5)),
                    iris=((0.06, 0.04, 0.02), (0.25, 0.16, 0.07)))


def place(h, x, y, z=0.0, yaw=None):
    h.arm.location = Vector((x, y, h.base_z + z))
    if yaw is not None:
        h.arm.rotation_euler = (0, 0, yaw)


def man_wood(name, loc=(0, 0, 0), yaw=0.0):
    return L.Mannequin(name, L.wood(name + "_wood"), L.mat(name + "_j", (0.10, 0.07, 0.05), rough=0.35),
                       loc=loc, yaw=yaw)


def man_obsidian(name, loc=(0, 0, 0), yaw=0.0):
    return L.Mannequin(name, L.mat(name + "_obs", (0.015, 0.016, 0.02), rough=0.12, coat=1.0),
                       L.mat(name + "_chrome", (0.9, 0.9, 0.92), metal=1.0, rough=0.15), loc=loc, yaw=yaw)


def man_clay(name, loc=(0, 0, 0), yaw=0.0):
    return L.Mannequin(name, L.mat(name + "_clay", (0.32, 0.32, 0.34), rough=0.6),
                       L.mat(name + "_j", (0.12, 0.12, 0.13), rough=0.4), loc=loc, yaw=yaw)


def mirror_floor(c=(0.012, 0.012, 0.015), rough=0.08):
    return L.plane((0, 0, 0), 300, L.mat("floor", c, rough=rough, coat=0.6))


def nod(sp, deg, turn=0.0, tilt=0.0):
    return Hm.nod(sp, deg, turn, tilt)


def breathe(man, m, amt=1.0):
    man.j["chest"].rotation_euler.x = 0.015 * math.sin(m * 1.6) * amt
    man.j["neck"].rotation_euler.x += 0.01 * math.sin(m * 1.6 + 0.6) * amt


def dust(n, box, material, size=0.012, seed=3, kinds=("octa", "tetra")):
    rnd = random.Random(seed)
    out = []
    for i in range(n):
        ob = L.platonic(kinds[i % len(kinds)], (0, 0, 0), size * rnd.uniform(0.6, 1.6), material)
        p = Vector((rnd.uniform(*box[0]), rnd.uniform(*box[1]), rnd.uniform(*box[2])))
        v = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.5, 1))) * 0.05
        w = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)))
        out.append((ob, p, v, w))
    return out


def move_dust(items, m):
    for ob, p, v, w in items:
        ob.location = p + v * m
        ob.rotation_euler = Euler(w * m * 0.8)


# =================================================================== EPISODE 1
def hook_twins(P, job):
    c = Clock(job)
    L.setup_render(fog=0.02, fog_color=(0.9, 0.88, 0.85))
    mirror_floor()
    a = man1("ManA", (-0.62, 0, 0), yaw=0.12)
    b = man2("ManB", (0.62, 0, 0), yaw=-0.12)
    wire = L.emission("wire", (1.0, 0.95, 0.9), 4.0)
    ico = L.platonic("ico", (0, 3.6, 2.4), 1.7, wire, wire=0.025)
    core = L.platonic("octa", (0, 3.6, 2.4), 0.55, L.mat("chrome", (0.95, 0.95, 0.97), metal=1, rough=0.08))
    ring = L.torus((0, 7.5, 2.4), 3.6, 0.03, L.emission("ring", (1, 0.9, 0.8), 3.0), rot=(math.pi / 2, 0, 0))
    gold = L.mat("gold", (1.0, 0.72, 0.35), metal=1.0, rough=0.25)
    chrome = L.mat("chrome2", (0.9, 0.9, 0.95), metal=1.0, rough=0.12)
    rnd = random.Random(4)
    orbit = []
    for i in range(16):
        kind = ("tetra", "cube", "octa", "dodeca")[i % 4]
        ob = L.platonic(kind, (0, 0, 0), rnd.uniform(0.08, 0.2), gold if i % 3 == 0 else chrome)
        orbit.append((ob, rnd.uniform(2.0, 3.2), rnd.uniform(0, 6.28), rnd.uniform(0.15, 0.35) * rnd.choice((-1, 1)),
                      rnd.uniform(-1.1, 1.1), Vector((rnd.random(), rnd.random(), rnd.random()))))
    L.light("AREA", (0, 6.5, 3.2), 700, (1.0, 0.93, 0.85), size=3, look_at=(0, 0, 1.4))
    L.light("SPOT", (-0.7, -1.0, 5), 900, (1.0, 0.78, 0.55), look_at=(-0.72, 0, 1.2), spot=28)
    L.light("SPOT", (0.7, -1.0, 5), 900, (0.6, 0.75, 1.0), look_at=(0.72, 0, 1.2), spot=28)
    L.light("AREA", (0, -5, 2), 60, (0.8, 0.85, 1.0), size=4, look_at=(0, 0, 1.2))
    cam = L.camera((0, -6.8, 1.55), (0, 0, 1.35), lens=38, dof_target=6.4, fstop=3.2)

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        cam.location = Vector((0.15 * math.sin(m * 0.4), -6.8 + 1.3 * p, 1.55 + 0.1 * p))
        L.aim(cam, (0, 0, 1.38))
        cam.data.dof.focus_distance = 6.4 - 1.3 * p
        ico.rotation_euler = (m * 0.21, m * 0.13, m * 0.3)
        core.rotation_euler = (-m * 0.5, m * 0.4, -m * 0.6)
        for ob, R, ph, sp, z, w in orbit:
            ang = ph + m * sp
            ob.location = Vector((R * math.cos(ang), 3.6 + R * math.sin(ang) * 0.6, 2.4 + z + 0.15 * math.sin(m + ph)))
            ob.rotation_euler = Euler(w * m * 1.5)
        s = c.since(t, 2) if len(c.beats) > 2 else -1
        k = ease(s / 0.8) if s >= 0 else 0.0  # "one loses everything": man 1 sags
        b.apply(nod(Hm.stand(m * 1.6 + 1), -3, 0, 0))
        a.apply(Hm.nod(Hm.lean(Hm.stand(m * 1.6), 6 * k), 22 * k))
        a.face(sad=k)
        b.face()
    return update


def eyes_room(P, job):
    c = Clock(job)
    watch = P.get("watch", False)
    L.setup_render(fog=0.025, fog_color=(1.0, 0.85, 0.7))
    L.plane((0, 0, 0), 200, L.concrete("conc", (0.05, 0.045, 0.04)))
    ped = L.cylinder((0, 0, 0.15), 0.85, 0.3, L.marble("ped", base=(0.5, 0.48, 0.46), scale=6.0))
    man = man1("Mocked", (0, 0, 0.3))
    L.light("SPOT", (0, -0.5, 7), 4200, (1.0, 0.82, 0.6), look_at=(0, 0, 1), spot=26, blend=0.4, size=0.3)
    L.light("AREA", (0, -5, 4), 220, (1.0, 0.9, 0.8), size=6, look_at=(0, 2, 1.5))
    edge = L.emission("tier", (1.0, 0.6, 0.3), 1.6)
    eyes = []
    rnd = random.Random(7)
    head_target = Vector((0, 0, 1.95))
    for row, (R, z, r, n) in enumerate(((3.0, 1.0, 0.22, 9), (4.1, 1.9, 0.27, 11), (5.3, 2.9, 0.33, 13))):
        L.torus((0, 0, z - r - 0.15), R, 0.025, edge)
        mat_eye, pupil = L.eye_material(f"eye{row}", iris=(0.18, 0.10, 0.05), iris2=(0.5, 0.33, 0.12))
        for i in range(n):
            th = math.radians(-118 + 236 * i / (n - 1)) + rnd.uniform(-0.05, 0.05)
            pos = Vector((R * math.sin(th), R * math.cos(th), z + rnd.uniform(-0.1, 0.1)))
            ob = L.sphere(pos, 1.0, (r, r, r), material=mat_eye, seg=32, rings=16)
            ob.rotation_mode = "XYZ"
            eyes.append((ob, pos, rnd.uniform(0, 6.28), rnd.uniform(5, 9), r, rnd.uniform(0.5, 4.0)))
    cam = L.camera((0, -6.2, 2.3), (0, 1.0, 1.6), lens=30, dof_target=6.0, fstop=4.0)

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        if watch:
            cam.location = Vector((0, -6.6 + 3.4 * p, 2.2 - 0.3 * p))
            L.aim(cam, (0, 0, 1.75))
            cam.data.dof.focus_distance = 6.6 - 3.4 * p
        else:
            cam.location = Vector((0.3 * math.sin(m * 0.5), -6.2 + 0.8 * p, 2.3))
            L.aim(cam, (0, 1.0, 1.6))
        man.apply(Hm.nod(Hm.lean(Hm.stand(m * 1.6), 4), 16))
        man.face(sad=0.5)
        for ob, pos, ph, fr, r, blink_at in eyes:
            tgt = head_target.copy()
            if not watch:
                tgt += Vector((0.25 * math.sin(m * fr + ph), 0, 0.2 * math.sin(m * fr * 1.3 + ph)))
            q = (tgt - ob.location).to_track_quat("-Y", "Z")
            ob.rotation_euler = q.to_euler()
            bob = abs(math.sin(m * fr + ph)) * r * 0.5 if not watch else 0.0
            ob.location = pos + Vector((0, 0, bob))
            sq = 0.55 if watch else 1.0
            b = (m + ph) % 4.0
            if abs(b - blink_at) < 0.08:
                sq = 0.12
            ob.scale = (r, r, r * sq)
    return update


def _red_world(fog=0.04):
    L.setup_render(fog=fog * 0.5, fog_color=(1.0, 0.35, 0.25), world=(0.002, 0.0, 0.0))


def fire_back(P, job):
    c = Clock(job)
    _red_world()
    L.plane((0, 0, 0), 200, L.mat("floor", (0.03, 0.005, 0.005), rough=0.15, coat=0.5))
    man = man1("Fires", (0, 0, 0), yaw=0.35)
    glass = L.mat("redglass", (1.0, 0.25, 0.2), rough=0.02, transmission=0.9, ior=1.5, emit=(1, 0.1, 0.05), strength=0.4)
    pieces = L.shards(4.2, 3.4, 8, 7, 0.03, center=(0, 1.8, 1.75), material=glass, seed=5)
    rnd = random.Random(9)
    motion = []
    for ob, cen in pieces:
        v = Vector(((cen.x) * 1.4 + rnd.uniform(-0.6, 0.6), -rnd.uniform(2.0, 6.0), (cen.z - 1.4) * 1.0 + rnd.uniform(0, 2.2)))
        w = Vector((rnd.uniform(-9, 9), rnd.uniform(-9, 9), rnd.uniform(-9, 9)))
        motion.append((ob, cen.copy(), v, w))
    spark_m = L.emission("spark", (1.0, 0.55, 0.2), 25)
    sp_src = L.sphere((0, 0, -10), 0.015, material=spark_m, seg=8, rings=6)
    sparks = []
    for ob in [sp_src] + L.instances(sp_src, 70):
        d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1.6, -0.2), rnd.uniform(-0.3, 1.2))).normalized() * rnd.uniform(2, 7)
        sparks.append((ob, d, rnd.uniform(0.4, 0.9)))
    back = L.light("AREA", (0, 4.5, 2.2), 1600, (1.0, 0.25, 0.12), size=3, look_at=(0, 0, 1.5))
    L.light("SPOT", (1.5, -2, 4), 1500, (1.0, 0.45, 0.25), look_at=(0, 0, 1.4), spot=35)
    flick = L.light("POINT", (0, 1.2, 1.8), 800, (1.0, 0.3, 0.1), size=0.2)
    cam = L.camera((0.9, -4.0, 1.45), (0, 0.5, 1.5), lens=34)
    t0 = 0.22

    def update(t):
        m = c.m(t)
        jab = math.sin(m * 18) * 0.12
        sp = Hm.lean(Hm.stand(), 10)
        Hm.point(sp, "R", (-0.55, -1.0, 0.12 + jab))
        Hm._arm(sp, "L", (0.25, -0.2, -1), (0.1, -1.0, 0.2))
        Hm.nod(sp, -6, 8)
        man.apply(sp, {**Hm.fist_local("R", 1.0, keep_index=True), **Hm.fist_local("L", 1.0)})
        man.face(angry=1.0, mouth_open=0.35 + 0.35 * abs(math.sin(m * 9)))
        dt = max(0.0, m - t0)
        for ob, cen, v, w in motion:
            ob.location = cen + v * dt + Vector((0, 0, -2.5 * dt * dt))
            ob.rotation_euler = Euler(w * dt)
        for ob, d, life in sparks:
            k = dt / life
            if dt <= 0 or k >= 1:
                ob.location = (0, 0, -10)
                continue
            ob.location = Vector((0, 1.8, 1.7)) + d * dt + Vector((0, 0, -4.9 * dt * dt))
            s = 1 - k
            ob.scale = (s, s, s * 3)
        boom = math.exp(-dt * 4) if dt > 0 else 0
        flick.data.energy = 600 + 4000 * boom + 300 * math.sin(m * 37)
        back.data.energy = 1600 * (0.85 + 0.15 * math.sin(m * 11))
    return update


def loud_cuts(P, job):
    """Three set-ups far apart; the camera cuts between them every cut_every seconds."""
    c = Clock(job)
    _red_world(0.035)
    L.plane((0, 0, 0), 600, L.mat("floor", (0.03, 0.005, 0.005), rough=0.2))
    red = L.emission("redwire", (1.0, 0.15, 0.08), 6)
    # A: profile shouting with sound rings
    A = man1("Shout", (0.5, 0, 0), yaw=-math.pi / 2)
    rings = [L.torus((0, 0, 1.85), 0.2, 0.012, red, rot=(0, math.pi / 2, 0)) for _ in range(6)]
    L.light("AREA", (-3, 1.5, 2.5), 1200, (1, 0.25, 0.12), size=2, look_at=(0, 0, 1.8))
    L.light("AREA", (1.6, -2.2, 2.2), 260, (1.0, 0.6, 0.4), size=1.2, look_at=(0, 0, 1.7))
    camA = L.camera((0.0, -1.7, 1.62), (0.2, 0, 1.5), lens=34, name="camA")
    # B: pointing hand at the camera, red bokeh behind
    B = man1("Point", (30, 0, 0))
    bok = L.emission("bokeh", (1.0, 0.3, 0.12), 8)
    rnd = random.Random(2)
    for i in range(40):
        L.sphere((30 + rnd.uniform(-5, 5), rnd.uniform(6, 14), rnd.uniform(0, 5)), rnd.uniform(0.05, 0.18), material=bok,
                 seg=12, rings=8)
    L.light("AREA", (30.6, -2.0, 2.4), 160, (1.0, 0.6, 0.45), size=1.2, look_at=(29.82, -0.7, 1.55))
    L.light("AREA", (30, 3, 2), 900, (1, 0.2, 0.1), size=2, look_at=(30, 0, 1.4))
    camB = L.camera((30.5, -1.75, 1.62), (29.86, -0.55, 1.55), lens=34, dof_target=1.35, fstop=2.0, name="camB")
    # C: full figure gesturing in front of a spinning red wire cube
    C = man1("Gesture", (60, 0, 0))
    cubew = L.platonic("cube", (60, 2.5, 2.0), 2.0, red, wire=0.03)
    L.light("AREA", (60, 4.5, 2.5), 1300, (1, 0.25, 0.12), size=3, look_at=(60, 0, 1.4))
    L.light("SPOT", (61.5, -2.5, 4), 900, (1, 0.5, 0.3), look_at=(60, 0, 1.3), spot=35)
    camC = L.camera((60, -4.2, 1.4), (60, 0, 1.35), lens=36, name="camC")
    cams = {"shout_profile": camA, "point_close": camB, "gesture": camC}
    variants = P.get("variants", ["shout_profile", "point_close", "gesture"])
    every = float(P.get("cut_every", 0.5))
    sc = bpy.context.scene
    nframes = int(round(c.dur * 30))
    f = 0
    k = 0
    every = every if every > 0 else c.dur + 1.0  # no cuts: one camera
    while f < nframes:
        mk = sc.timeline_markers.new(f"cut{k}", frame=f + 1)
        mk.camera = cams[variants[k % len(variants)]]
        k += 1
        f = max(f + 1, int(round(k * every * 30)))

    def update(t):
        m = c.m(t)
        lean = 8 + 5 * math.sin(m * 9)
        A.apply(Hm.nod(Hm.gesture(Hm.lean(Hm.stand(), lean), m, 0.6), -12), {**Hm.fist_local("L"), **Hm.fist_local("R")})
        A.face(angry=1.0, mouth_open=0.4 + 0.5 * abs(math.sin(m * 7)))
        for i, rg in enumerate(rings):
            ph = ((m * 2.2) + i / len(rings)) % 1.0
            rg.location = Vector((0.25 - ph * 2.6, 0, 1.84))
            s = 1 + ph * 7
            rg.scale = (s, s, max(0.05, 1 - ph))
        sp = Hm.lean(Hm.stand(), 5)
        Hm.point(sp, "R", (-0.08, -1.0, 0.08 + 0.06 * math.sin(m * 14)))
        B.apply(Hm.nod(sp, -4), Hm.fist_local("R", 1.0, keep_index=True))
        B.face(angry=1.0, mouth_open=0.3)
        w = math.sin(m * 8)
        C.apply(Hm.nod(Hm.gesture(Hm.lean(Hm.stand(), 6), m * 1.2), -5, 8 * w))
        C.face(angry=0.8, mouth_open=0.3 + 0.3 * abs(w))
        cubew.rotation_euler = (m * 0.9, m * 0.6, m * 1.1)
    return update


def calm_monolith(P, job):
    c = Clock(job)
    L.setup_render(fog=0.025, fog_color=(0.7, 0.8, 1.0), world=(0.001, 0.0015, 0.003))
    L.plane((0, 0, 0), 200, L.mat("wet", (0.01, 0.012, 0.016), rough=0.04, coat=1.0))
    man = man2("Calm", (0, 0, 0))
    mono = L.cube((0, 5.5, 2.4), (1.4, 0.35, 4.8), L.mat("mono", (0.006, 0.006, 0.008), rough=0.06, coat=1.0))
    halo = L.torus((0, 5.3, 2.6), 1.9, 0.02, L.emission("halo", (0.6, 0.8, 1.0), 5), rot=(math.pi / 2, 0, 0))
    drop_m = L.mat("drop", (0.8, 0.9, 1.0), rough=0.0, emit=(0.6, 0.75, 1.0), strength=0.6, transmission=0.6)
    src = L.sphere((0, 0, -5), 1.0, (0.006, 0.006, 0.07), material=drop_m, seg=8, rings=6)
    rnd = random.Random(11)
    rain = [(ob, Vector((rnd.uniform(-3.5, 3.5), rnd.uniform(-2.5, 7), rnd.uniform(0, 5.5))), rnd.uniform(3.5, 5))
            for ob in [src] + L.instances(src, 260)]
    specks = dust(36, ((-2.5, 2.5), (-1.5, 4), (0.2, 3.5)), L.mat("speck", (0.8, 0.85, 0.95), metal=1, rough=0.2), 0.02)
    L.light("SPOT", (0, -0.4, 6.5), 3000, (0.7, 0.82, 1.0), look_at=(0, 0, 0.9), spot=24, blend=0.5, size=0.2)
    L.light("AREA", (0, 3.5, 3), 900, (0.6, 0.75, 1.0), size=3, look_at=(0, 0, 1.4))
    L.light("AREA", (0, -5, 2.5), 50, (0.7, 0.8, 1.0), size=4, look_at=(0, 0, 1.2))
    cam = L.camera((0, -5.4, 1.5), (0, 0, 1.3), lens=44, dof_target=5.4, fstop=2.8)
    nod_beat = int(P.get("nod_beat", -1))

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        cam.location = Vector((0, -5.4 + 0.6 * p, 1.5))
        nd = 0.0
        if nod_beat >= 0:
            s = c.since(t, nod_beat)
            if 0 <= s <= 1.0:
                nd = 20 * math.sin(s / 1.0 * math.pi)
        man.apply(Hm.nod(Hm.stand(m * 1.2), nd))
        man.face()
        mono.rotation_euler = (0, 0, m * 0.12)
        halo.rotation_euler = (math.pi / 2, 0, m * 0.05)
        for ob, p0, spd in rain:
            z = (p0.z - m * spd * 0.35) % 5.5
            ob.location = Vector((p0.x, p0.y, z))
        move_dust(specks, m)
    return update


def eye_close(P, job):
    c = Clock(job)
    L.setup_render(fog=0.0, world=(0.0, 0.0, 0.0), bloom=0.6)
    eye_m, pupil = L.eye_material("bigeye", iris=(0.08, 0.13, 0.18), iris2=(0.35, 0.5, 0.6))
    eye = L.sphere((0, 0, 0), 1.0, material=eye_m, seg=160, rings=80)
    eye.rotation_mode = "XYZ"
    skin = L.mat("skin", (0.05, 0.04, 0.035), rough=0.55)
    face = L.cube((0, -1.22, 0), (4.0, 0.45, 4.0), skin)
    cut = L.cylinder((0, -1.2, 0), 1.0, 2.0, None, rot=(math.pi / 2, 0, 0))
    cut.scale = (0.66, 0.39, 1.0)
    cut.hide_render = True
    cut.display_type = "WIRE"
    bo = face.modifiers.new("hole", "BOOLEAN")
    bo.object = cut
    bo.operation = "DIFFERENCE"
    bv = face.modifiers.new("bevel", "BEVEL")
    bv.width = 0.06
    bv.segments = 4
    key = L.light("AREA", (-1.6, -3.0, 1.6), 260, (0.75, 0.85, 1.0), size=0.8, look_at=(0, 0, 0))
    rim = L.light("AREA", (1.8, -2.2, -0.8), 80, (0.6, 0.7, 1.0), size=1.2, look_at=(0, 0, 0))
    catch = L.cube((-0.9, -4.5, 0.9), (0.5, 0.02, 0.7), L.emission("window", (0.85, 0.92, 1.0), 6))
    catch.visible_camera = False
    cam = L.camera((0, -3.6, 0.0), (0, 0, 0), lens=34, dof_target=2.6, fstop=4.0)
    dim_beat = int(P.get("dim_beat", -1))

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        cam.location = Vector((0, -3.6 + 0.5 * p, 0.0))
        cam.data.dof.focus_distance = 2.6 - 0.5 * p
        sacc = 0.025 * math.sin(m * 1.3) + 0.012 * math.sin(m * 3.1)
        eye.rotation_euler = (0.02 * math.sin(m * 0.9), 0, sacc)
        dim = 1.0
        if dim_beat >= 0:
            s = c.since(t, dim_beat)
            if s >= 0:
                dim = 1 - 0.55 * ease(s / 1.0)
        pupil.outputs[0].default_value = 0.976 + 0.010 * (1 - dim) + 0.003 * math.sin(m * 0.7)
        key.data.energy = 260 * dim
        rim.data.energy = 80 * dim
    return update


def walk_grid(P, job):
    c = Clock(job)
    L.setup_render(fog=0.022, fog_color=(0.6, 0.75, 1.0), world=(0.0005, 0.001, 0.003))
    L.plane((0, 40, 0), 400, L.grid_floor("grid", (0.25, 0.55, 1.0), 2.2, 1.0, 0.012))
    glow = L.emission("arch", (0.75, 0.88, 1.0), 6)
    for i in range(10):
        y = 4 + i * 6
        L.cube((-1.7, y, 2.0), (0.1, 0.1, 4.0), glow)
        L.cube((1.7, y, 2.0), (0.1, 0.1, 4.0), glow)
        L.cube((0, y, 4.0), (3.5, 0.1, 0.1), glow)
    L.sphere((0, 120, 22), 9, material=L.emission("moon", (0.75, 0.85, 1.0), 3), seg=48, rings=24)
    man = man2("Walker", (0, 0, 0), yaw=math.pi)
    L.light("SUN", (0, 50, 10), 1.6, (0.7, 0.82, 1.0), look_at=(0, 0, 0))
    L.light("AREA", (0, 8, 3), 600, (0.6, 0.75, 1.0), size=4, look_at=(0, 0, 1.2))
    cam = L.camera((0, -3.4, 1.6), (0, 2, 1.3), lens=38)
    speed = float(P.get("walk_speed", 1.2))

    def update(t):
        m = c.m(t)
        y = 0.5 + m * speed
        place(man, 0, y)
        man.apply(Hm.walk(m * 2 * math.pi * 0.85))
        cam.location = Vector((0.25 * math.sin(m * 0.3), y - 3.4 - 0.8 * t / c.dur * 1.5, 1.6))
        L.aim(cam, (0, y + 2.0, 1.3))
    return update


def insult_returns(P, job):
    c = Clock(job)
    L.setup_render(fog=0.03, fog_color=(0.7, 0.75, 0.9), world=(0.0005, 0.0006, 0.001))
    L.plane((0, 0, 0), 200, L.concrete("conc", (0.05, 0.05, 0.055)))
    man = other("Insulter", (0, 1.0, 0))
    orb = L.spiky_orb((0, 0, 0), 0.14, 0.9, L.emission("orb", (1.0, 0.06, 0.04), 9))
    ol = L.light("POINT", (0, 0, 0), 150, (1.0, 0.1, 0.05), size=0.1)
    L.light("SPOT", (0, 0.6, 6.5), 1400, (0.7, 0.8, 1.0), look_at=(0, 1.0, 0.8), spot=22, blend=0.5)
    L.light("AREA", (0, 4, 3), 300, (0.6, 0.7, 0.9), size=4, look_at=(0, 1, 1.2))
    cam = L.camera((0.3, -4.6, 1.7), (0, 1.0, 1.3), lens=36)
    p0, p1, p2 = Vector((1.6, -3.0, 1.2)), Vector((1.2, -0.6, 2.7)), Vector((0, 1.0, 2.15))

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        cam.location = Vector((0.3 - 0.3 * p, -4.6 + 1.3 * p, 1.7))
        L.aim(cam, (0, 1.0, 1.4))
        man.apply(Hm.nod(Hm.lean(Hm.stand(m), 8), 26))
        man.face(sad=0.8)
        k = ease(min(1.0, t / (c.dur * 0.6)))
        pos = (1 - k) ** 2 * p0 + 2 * (1 - k) * k * p1 + k * k * p2
        if k >= 1:
            a = m * 1.2
            pos = p2 + Vector((0.18 * math.cos(a), 0.18 * math.sin(a), 0.05 * math.sin(a * 2)))
        orb.location = pos
        ol.location = pos
        orb.rotation_euler = (m * 1.1, m * 0.7, m * 1.6)
        ol.data.energy = 120 + 60 * math.sin(m * 6)
    return update


# =================================================================== EPISODE 2
def door_slam(P, job):
    c = Clock(job)
    L.setup_render(fog=0.03, fog_color=(1.0, 0.92, 0.8))
    L.plane((0, 0, 0), 200, L.concrete("floor", (0.06, 0.055, 0.05)))
    stone = L.concrete("stone", (0.16, 0.15, 0.14))
    L.cube((-6.4, 3.3, 3), (6, 0.6, 6), stone)
    L.cube((6.4, 3.3, 3), (6, 0.6, 6), stone)
    L.cube((0, 3.3, 8.5), (8, 0.6, 5), stone)
    left = L.cube((-1.6, 3.0, 2.75), (2.2, 0.45, 5.5), stone, bevel=0.02)
    right = L.cube((1.6, 3.0, 2.75), (2.2, 0.45, 5.5), stone, bevel=0.02)
    L.light("AREA", (0, 5.5, 2.6), 2200, (1.0, 0.92, 0.8), size=2.5, look_at=(0, 0, 1.2))
    L.light("AREA", (0, -4, 4), 60, (0.8, 0.85, 1.0), size=5, look_at=(0, 2, 1))
    closed = bool(P.get("closed", False))
    if closed:
        L.light("AREA", (1.2, -1.5, 2.4), 160, (0.7, 0.82, 1.0), size=1.5, look_at=(0, 1.6, 1.5))
        L.light("SPOT", (0, 3.2, 3.5), 900, (0.7, 0.82, 1.0), look_at=(0, 1.6, 1.2), spot=30)
    if closed:
        a = None
        b = man2("NoB", (0, 1.6, 0), yaw=0.0)
    else:
        a = man1("NoA", (-0.55, 0.9, 0), yaw=math.pi)
        b = man2("NoB", (0.55, 0.9, 0), yaw=math.pi)
    motes = dust(60, ((-1.0, 1.0), (0.5, 3.0), (0.2, 4.0)), L.emission("mote", (1, 0.9, 0.75), 3), 0.008)
    cam = L.camera((0.0, -4.6, 1.6), (0, 3, 2.1), lens=32)
    close_from = float(P.get("close_from", 0.25))

    def update(t):
        m = c.m(t)
        u = min(max((t / c.dur - close_from) / (1 - close_from), 0), 1)
        k = u ** 2.2  # accelerating, slams at the end
        gap = 0.0 if closed else 1.2 * (1 - k)
        left.location.x = -1.1 - gap
        right.location.x = 1.1 + gap
        cam.location = Vector((0, -4.6 + 0.6 * ease(t / c.dur), 1.6))
        for i, man in enumerate((a, b)):
            if man is not None:
                man.apply(Hm.stand(m * 1.4 + i))
                man.face()
        move_dust(motes, m)
    return update


def phone3d(P, job):
    c = Clock(job)
    L.setup_render(fog=0.01, fog_color=(1.0, 0.8, 0.6), world=(0.001, 0.0005, 0.0005))
    L.plane((0, 0, 0), 600, L.mat("floor", (0.02, 0.015, 0.012), rough=0.3))
    black = L.mat("phoneglass", (0.01, 0.01, 0.012), rough=0.05, coat=1.0)
    frame_m = L.mat("phoneframe", (0.6, 0.6, 0.62), metal=1.0, rough=0.25)
    screens = P.get("screens", [])

    def make_phone(loc, scale=1.0, rot=(0, 0, 0)):
        root = bpy.data.objects.new("phone", None)
        bpy.context.scene.collection.objects.link(root)
        body = L.cube((0, 0, 0), (0.36, 0.04, 0.76), frame_m, bevel=0.035)
        front = L.cube((0, -0.0205, 0), (0.355, 0.002, 0.755), black, bevel=0.03)
        planes = []
        for i, path in enumerate(screens):
            pl = L.plane((0, -0.0225, 0), 1.0, L.image_emission(f"scr{i}", path, 1.6), rot=(math.pi / 2, 0, 0))
            pl.scale = (0.33, 0.70, 1)
            planes.append(pl)
        for ob in [body, front] + planes:
            ob.parent = root
        root.location = Vector(loc)
        root.rotation_euler = rot
        root.scale = (scale,) * 3
        return root, planes

    # A: phone close-up with warm bokeh behind
    phA, scrA = make_phone((0, 0, 1.5), 1.0, (0.12, 0, 0.18))
    bok = L.emission("bok", (1.0, 0.55, 0.25), 6)
    rnd = random.Random(5)
    for i in range(45):
        L.sphere((rnd.uniform(-5, 5), rnd.uniform(5, 14), rnd.uniform(-1, 5)), rnd.uniform(0.06, 0.2), material=bok,
                 seg=12, rings=8)
    scr_light = L.light("AREA", (0, -0.6, 1.5), 40, (0.8, 0.85, 1.0), size=0.6, look_at=(0, -2, 1.5))
    camA = L.camera((0.05, -1.75, 1.5), (0, 0, 1.47), lens=40, dof_target=1.75, fstop=1.8, name="camA")
    # B: man hunched over the phone, sitting on a block
    L.cube((30, 0.2, 0.22), (0.6, 0.5, 0.44), L.concrete("block", (0.1, 0.09, 0.08)))
    man = man1("Texter", (30, 0, 0))
    place(man, 30, 0.05, -0.45)

    def hunch_pose(m_=0.0):
        sp = Hm.phone_hold(Hm.sit(Hm.stand()))
        Hm.lean(sp, 26)
        Hm.nod(sp, 30)
        return sp
    man.apply(hunch_pose())
    bpy.context.view_layer.update()
    pl, pr = man.arm.pose.bones["wrist.L"], man.arm.pose.bones["wrist.R"]
    hand = man.arm.matrix_world @ ((pl.tail + pr.tail) / 2)
    phB, scrB = make_phone(tuple(hand + Vector((0, -0.03, 0.02))), 0.2, (-0.7, 0, 0))
    L.light("AREA", tuple(hand + Vector((0, -0.05, 0.05))), 18, (0.85, 0.9, 1.0), size=0.12, look_at=tuple(hand + Vector((0, 0.3, 0.5))))
    L.light("POINT", (32.5, 3, 3), 250, (1.0, 0.6, 0.3), size=0.3)
    camB = L.camera((31.2, -1.5, 1.15), (30, -0.15, 0.95), lens=36, name="camB")
    cams = {"phone_close": camA, "hunched": camB}
    variants = P.get("variants", ["phone_close", "hunched"])
    every = float(P.get("cut_every", 0.6))
    sc = bpy.context.scene
    nframes = int(round(c.dur * 30))
    f, k = 0, 0
    every = every if every > 0 else c.dur + 1.0  # no cuts: one camera
    while f < nframes:
        mk = sc.timeline_markers.new(f"cut{k}", frame=f + 1)
        mk.camera = cams[variants[k % len(variants)]]
        k += 1
        f = max(f + 1, int(round(k * every * 30)))

    def update(t):
        m = c.m(t)
        n = c.beat(t)
        for planes in (scrA, scrB):
            for i, pl in enumerate(planes):
                pl.hide_render = i != min(n, len(planes) - 1)
        phA.rotation_euler = (0.12 + 0.02 * math.sin(m * 1.7), 0.02 * math.sin(m * 1.1), 0.18 + 0.03 * math.sin(m * 0.8))
        man.apply(hunch_pose(m), {"finger1-2.R": (20 * abs(math.sin(m * 10)), 0, 0)})
        man.face(sad=0.6)
    return update


def shrink_pillars(P, job):
    c = Clock(job)
    _red_world(0.03)
    L.plane((0, 0, 0), 300, L.mat("floor", (0.02, 0.005, 0.004), rough=0.12, coat=0.6))
    man = man1("Small", (0, 0, 0))
    pm = L.mat("pillar", (0.01, 0.008, 0.008), rough=0.15, coat=1.0)
    edge = L.emission("pedge", (1.0, 0.15, 0.06), 6)
    rnd = random.Random(12)
    pillars = []
    n = 14
    for i in range(n):
        ang = i / n * 2 * math.pi + rnd.uniform(-0.15, 0.15)
        R = rnd.uniform(1.6, 3.6)
        h = 2.5 + 5.0 * i / n + rnd.uniform(0, 1)
        w = rnd.uniform(0.5, 0.9)
        p = L.cube((0, 0, 0), (w, w, h), pm)
        cap = L.cube((0, 0, h / 2 + 0.01), (w * 1.02, w * 1.02, 0.03), edge)
        cap.parent = p
        cap.location = (0, 0, 0.5 + 0.01 / h)
        cap.scale = (1.02, 1.02, 0.03 / h)
        pillars.append((p, Vector((R * math.sin(ang), R * math.cos(ang) + 0.6, h / 2)), h, i / n * 0.85))
    L.light("SPOT", (0, -0.3, 8), 2600, (1.0, 0.45, 0.3), look_at=(0, 0, 0.8), spot=20, blend=0.5)
    L.light("AREA", (0, 6, 4), 2000, (1.0, 0.2, 0.08), size=5, look_at=(0, 0, 1))
    cam = L.camera((0, -3.2, 1.6), (0, 0, 1.2), lens=28)

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        cam.location = Vector((0.4 * p, -3.2 - 4.5 * p, 1.6 + 6.5 * p))
        L.aim(cam, (0, 0.3, 0.9 - 0.2 * p))
        man.apply(Hm.nod(Hm.lean(Hm.stand(m), 3 + 10 * p), 8 + 22 * p))
        man.face(sad=p)
        for ob, pos, h, start in pillars:
            u = (t / c.dur - start) / 0.12
            if u <= 0:
                ob.location = pos + Vector((0, 0, 30))
            else:
                k = min(1.0, u) ** 2
                ob.location = pos + Vector((0, 0, 30 * (1 - k)))
    return update


def phone_down3d(P, job):
    c = Clock(job)
    L.setup_render(fog=0.0, world=(0.0008, 0.001, 0.0015))
    L.plane((0, 0, 0), 100, L.mat("floor", (0.01, 0.01, 0.012), rough=0.4))
    L.cube((0, 0, 0.72), (2.4, 1.4, 0.06), L.marble("table", base=(0.05, 0.05, 0.055), vein=(0.13, 0.13, 0.15), rough=0.12, scale=9.0))
    back = L.mat("back", (0.012, 0.012, 0.016), rough=0.18, coat=1.0)
    frame_m = L.mat("frame", (0.55, 0.56, 0.6), metal=1.0, rough=0.25)
    ph = bpy.data.objects.new("phone", None)
    bpy.context.scene.collection.objects.link(ph)
    parts = [L.cube((0, 0, 0), (0.075, 0.155, 0.008), frame_m, bevel=0.006),
             L.cube((0, 0, 0.0041), (0.073, 0.153, 0.001), back, bevel=0.005),
             L.cube((-0.018, 0.052, 0.0055), (0.032, 0.034, 0.003), L.mat("bump", (0.03, 0.03, 0.035), rough=0.2),
                    bevel=0.004)]
    lens_m = L.mat("lens", (0.0, 0.0, 0.0), rough=0.02, coat=1.0)
    for dx, dy in ((-0.026, 0.06), (-0.010, 0.06), (-0.026, 0.044)):
        parts.append(L.cylinder((dx, dy, 0.0075), 0.0062, 0.003, lens_m, verts=32))
    for p_ in parts:
        p_.parent = ph
    ph.location = (0.02, 0.0, 0.754)
    ph.rotation_euler = (0, 0, 0.35)
    glass_m = L.mat("glass", (0.95, 0.97, 1.0), rough=0.0, transmission=1.0, ior=1.5)
    L.cylinder((-0.22, 0.12, 0.81), 0.035, 0.12, glass_m)
    L.cylinder((-0.22, 0.12, 0.79), 0.031, 0.075, L.mat("water", (0.9, 0.95, 1.0), rough=0.0, transmission=1.0, ior=1.33))
    L.light("AREA", (-1.4, 0.4, 1.6), 140, (0.7, 0.82, 1.0), size=1.4, look_at=(0, 0, 0.75))
    L.light("AREA", (1.2, 1.2, 1.2), 40, (0.6, 0.7, 0.95), size=1.0, look_at=(0, 0, 0.75))
    cam = L.camera((0.1, -0.62, 1.08), (0.02, 0, 0.76), lens=42, dof_target=ph, fstop=2.2)

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        a = -0.25 + 0.35 * p
        r = 0.66 - 0.12 * p
        cam.location = Vector((r * math.sin(a), -r * math.cos(a), 1.08 - 0.05 * p))
        L.aim(cam, (0.02, 0, 0.76))
    return update


def hourglass(P, job):
    c = Clock(job)
    L.setup_render(fog=0.012, fog_color=(0.7, 0.8, 1.0), world=(0.0008, 0.001, 0.0016))
    L.plane((0, 0, 0), 100, L.mat("floor", (0.01, 0.01, 0.012), rough=0.5))
    L.cube((0, 0.2, 0.72), (1.6, 1.0, 0.05), L.wood("table", (0.2, 0.12, 0.07), (0.1, 0.06, 0.03), 0.3))
    wd = L.wood("hgwood", (0.35, 0.2, 0.1), (0.18, 0.1, 0.05), 0.35)
    z0 = 0.745
    L.cylinder((0, 0, z0 + 0.01), 0.11, 0.02, wd)
    L.cylinder((0, 0, z0 + 0.35), 0.11, 0.02, wd)
    for i in range(3):
        a = i * 2 * math.pi / 3
        L.cylinder((0.088 * math.cos(a), 0.088 * math.sin(a), z0 + 0.18), 0.007, 0.33, wd)
    glass = L.mat("hglass", (0.95, 0.97, 1.0), rough=0.0, transmission=1.0, ior=1.45)
    L.sphere((0, 0, z0 + 0.255), 0.075, (1, 1, 1.15), glass)
    L.sphere((0, 0, z0 + 0.105), 0.075, (1, 1, 1.15), glass)
    sand = L.mat("sand", (0.78, 0.62, 0.42), rough=0.9)
    top = L.cone((0, 0, z0 + 0.235), 0.058, 0.004, 0.06, sand, rot=(math.pi, 0, 0))
    pile = L.cone((0, 0, z0 + 0.04), 0.06, 0.0, 0.05, sand)
    stream = L.cylinder((0, 0, z0 + 0.12), 0.0018, 0.1, sand, verts=8)
    gsrc = L.sphere((0, 0, -3), 0.0025, material=sand, seg=6, rings=4)
    grains = [gsrc] + L.instances(gsrc, 24)
    rnd = random.Random(3)
    gph = [rnd.random() for _ in grains]
    # the other person, blurred in the background, lit by a phone
    oth = other("Other", (0.5, 2.4, 0), yaw=math.pi * 0.85)
    place(oth, 0.5, 2.4, -0.45, math.pi * 0.85)
    L.cube((0.5, 2.55, 0.22), (0.5, 0.5, 0.44), L.mat("seat", (0.04, 0.04, 0.045), rough=0.6))
    L.light("POINT", (0.42, 2.1, 1.05), 15, (0.7, 0.8, 1.0), size=0.05)
    for i in range(3):
        L.cube((-1.0 + i * 0.9, 4.2, 2.0), (0.75, 0.05, 2.2), L.emission(f"win{i}", (0.6, 0.72, 1.0), 1.4))
    L.light("AREA", (-0.8, -0.6, 1.4), 70, (0.75, 0.85, 1.0), size=0.8, look_at=(0, 0, 0.9))
    L.light("AREA", (0.6, 0.8, 1.3), 30, (0.6, 0.7, 1.0), size=0.6, look_at=(0, 0, 0.9))
    cam = L.camera((0.3, -1.1, 1.0), (0, 0, 0.93), lens=42, dof_target=1.1, fstop=2.4)

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        a = 0.4 - 0.3 * p
        r = 1.15 - 0.2 * p
        cam.location = Vector((r * math.sin(a), -r * math.cos(a), 1.0))
        L.aim(cam, (0, 0, 0.93))
        cam.data.dof.focus_distance = r
        f = 0.55 + 0.25 * (t / c.dur)  # fraction of sand already fallen
        top.scale = (1 - f * 0.6, 1 - f * 0.6, max(0.05, 1 - f))
        pile.scale = (0.6 + 0.4 * f, 0.6 + 0.4 * f, f)
        stream.location.z = z0 + 0.11
        for g, ph_ in zip(grains, gph):
            u = (m * 1.8 + ph_) % 1.0
            g.location = Vector((0.002 * math.sin(ph_ * 40), 0.002 * math.cos(ph_ * 40), z0 + 0.175 - u * 0.12))
        oth.apply(Hm.nod(Hm.lean(Hm.phone_hold(Hm.sit(Hm.stand())), 18), 28))
        oth.face(sad=0.7)
    return update


def face_close(P, job):
    """Head-and-shoulders close-up. who: man1/man2; mood: red (angry, shouting) or cold (calm stare)."""
    c = Clock(job)
    red = P.get("mood", "cold") == "red"
    if red:
        _red_world(0.02)
    else:
        L.setup_render(fog=0.0, world=(0.0006, 0.0008, 0.0012))
    h = (man1 if P.get("who", "man2") == "man1" else man2)("Face", (0, 0, 0))
    L.plane((0, 0, 0), 50, L.mat("floor", (0.01, 0.01, 0.012), rough=0.5))
    bpy.context.view_layer.update()
    head = h.arm.matrix_world @ h.arm.pose.bones["head"].head
    if red:
        key = L.light("AREA", (0.9, -1.2, head.z + 0.3), 90, (1.0, 0.5, 0.35), size=0.6, look_at=head)
        rim = L.light("AREA", (-0.8, 0.9, head.z + 0.4), 260, (1.0, 0.15, 0.06), size=0.8, look_at=head)
        L.light("AREA", (0.0, 2.0, head.z), 400, (1.0, 0.12, 0.05), size=2.0, look_at=(0, 0, head.z))
        bok = L.emission("emb", (1.0, 0.35, 0.1), 10)
        rnd = random.Random(8)
        embers = [(L.sphere((0, 0, -5), 0.006, material=bok, seg=8, rings=6),
                   Vector((rnd.uniform(-0.8, 0.8), rnd.uniform(0.3, 1.5), head.z + rnd.uniform(-0.6, 0.4))),
                   rnd.uniform(0.15, 0.5)) for _ in range(40)]
    else:
        key = L.light("AREA", (-0.9, -1.1, head.z + 0.35), 70, (0.75, 0.85, 1.0), size=0.7, look_at=head)
        rim = L.light("AREA", (0.9, 0.8, head.z + 0.3), 140, (0.6, 0.75, 1.0), size=0.8, look_at=head)
        embers = []
    cam = L.camera((0.0, -0.95, head.z + 0.03), (0, 0, head.z + 0.0), lens=50, dof_target=0.9, fstop=2.8)
    dim_beat = int(P.get("dim_beat", -1))
    e_key, e_rim = key.data.energy, rim.data.energy

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        d = 0.95 - 0.25 * p
        cam.location = Vector((0.0, -d, head.z + 0.03))
        L.aim(cam, (0, 0, head.z + 0.01))
        cam.data.dof.focus_distance = d - 0.06
        dim = 1.0
        if dim_beat >= 0 and c.since(t, dim_beat) >= 0:
            dim = 1 - 0.55 * ease(c.since(t, dim_beat) / 1.0)
        key.data.energy = e_key * dim
        rim.data.energy = e_rim * dim
        if red:
            sp = Hm.nod(Hm.lean(Hm.stand(), 6 + 4 * math.sin(m * 8)), -10 + 6 * math.sin(m * 8), 5 * math.sin(m * 3))
            h.apply(sp)
            h.face(angry=1.0, mouth_open=0.25 + 0.6 * abs(math.sin(m * 6.5)))
            for ob, p0, sp_ in embers:
                ob.location = p0 + Vector((0.05 * math.sin(m + p0.x * 9), 0, (m * sp_) % 1.2 - 0.3))
        else:
            h.apply(Hm.nod(Hm.stand(m * 1.0), 1.5 * math.sin(m * 0.5)))
            h.face()
    return update


def untouchable(P, job):
    """The calm man stands still; red spiky orbs fly at him and dissolve before they touch him."""
    c = Clock(job)
    L.setup_render(fog=0.02, fog_color=(0.7, 0.8, 1.0), world=(0.0005, 0.0008, 0.0015))
    L.plane((0, 0, 0), 200, L.mat("wet", (0.01, 0.012, 0.016), rough=0.05, coat=1.0))
    man = man2("Still", (0, 0, 0))
    ring = L.torus((0, 0, 0.01), 0.75, 0.008, L.emission("ring", (0.6, 0.8, 1.0), 4))
    orb_m = L.emission("orbm", (1.0, 0.06, 0.04), 8)
    spark_m = L.emission("sparkm", (1.0, 0.5, 0.3), 20)
    rnd = random.Random(21)
    orbs = []
    n = 9
    for i in range(n):
        ang = rnd.uniform(0, 2 * math.pi)
        start = Vector((3.5 * math.cos(ang), 3.5 * math.sin(ang) + 1.0, rnd.uniform(0.6, 2.4)))
        end = Vector((0.55 * math.cos(ang), 0.55 * math.sin(ang), rnd.uniform(0.9, 1.7)))
        t0 = (i / n) * c.dur * 0.85
        o = L.spiky_orb((0, 0, -9), 0.09, 0.8, orb_m)
        fl = L.sphere((0, 0, -9), 0.05, material=spark_m, seg=12, rings=8)
        orbs.append((o, fl, start, end, t0))
    L.light("SPOT", (0, -0.3, 6), 2200, (0.7, 0.82, 1.0), look_at=(0, 0, 0.9), spot=22, blend=0.5)
    L.light("AREA", (0, 3, 3), 700, (0.6, 0.75, 1.0), size=3, look_at=(0, 0, 1.3))
    L.light("AREA", (0, -4, 2), 40, (0.7, 0.8, 1.0), size=4, look_at=(0, 0, 1.2))
    cam = L.camera((0, -4.2, 1.2), (0, 0, 1.2), lens=38)
    fly = 0.9

    def update(t):
        m = c.m(t)
        p = ease(t / c.dur)
        a = -0.25 + 0.5 * p
        cam.location = Vector((4.0 * math.sin(a), -4.0 * math.cos(a), 1.15))
        L.aim(cam, (0, 0, 1.15))
        man.apply(Hm.stand(m * 1.1))
        man.face()
        for o, fl, s0, e0, t0 in orbs:
            u = (t - t0) / fly
            if u < 0 or u > 1.35:
                o.location = fl.location = (0, 0, -9)
                continue
            if u <= 1:
                k = ease(u)
                o.location = s0.lerp(e0, k)
                sc_ = 1.0 if u < 0.85 else max(0.0, 1 - (u - 0.85) / 0.15)
                o.scale = (sc_, sc_, sc_)
                o.rotation_euler = (m * 3, m * 2, m * 4)
                fl.location = (0, 0, -9)
            else:
                o.location = (0, 0, -9)
                fl.location = e0
                g = (u - 1) / 0.35
                s = 0.3 + 2.5 * g
                fl.scale = (s * (1 - g), s * (1 - g), s * (1 - g))
        ring.scale = (1 + 0.03 * math.sin(m * 2),) * 3
    return update


BUILDERS = {
    "face_close": face_close,
    "untouchable": untouchable,
    "hook_twins": hook_twins,
    "eyes_room": eyes_room,
    "fire_back": fire_back,
    "loud_cuts": loud_cuts,
    "calm_monolith": calm_monolith,
    "eye_close": eye_close,
    "walk_grid": walk_grid,
    "insult_returns": insult_returns,
    "door_slam": door_slam,
    "phone3d": phone3d,
    "shrink_pillars": shrink_pillars,
    "phone_down3d": phone_down3d,
    "hourglass": hourglass,
}
