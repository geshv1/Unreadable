"""Realistic 3D men built from the free MakeHuman / MPFB2 base mesh (CC0).

Body shape from MakeHuman targets, skeleton + skin weights from MakeHuman's default rig,
clothes made by inflating the body surface (dark knit top, trousers, leather shoes),
procedural skin with subsurface scattering, buzz-cut hair and brows painted by vertex masks,
procedural eyes, facial expression shape keys. Posing uses directions in body space.
Runs inside Blender.
"""
import gzip
import json
import math
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Quaternion, Vector

from . import lib as L

DATA = Path(__file__).resolve().parents[2] / "cache" / "mh"
_BASE = None

SKIN_PREFIX = ("head", "jaw", "neck03", "eye", "levator", "oculi", "orbicularis", "oris", "risorius",
               "temporalis", "special", "tongue", "wrist", "metacarpal", "finger")
SHOE_PREFIX = ("foot", "toe")
BOTTOM_PREFIX = ("pelvis", "upperleg", "lowerleg", "root", "spine05")


def _load_base():
    global _BASE
    if _BASE is not None:
        return _BASE
    verts, faces = [], []
    group = None
    for line in open(DATA / "base.obj"):
        if line.startswith("v "):
            verts.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("g "):
            group = line.split()[1]
        elif line.startswith("f "):
            faces.append((group, [int(p.split("/")[0]) - 1 for p in line.split()[1:]]))
    rig = json.load(open(DATA / "rig.default.json"))
    weights = json.load(open(DATA / "weights.default.json"))["weights"]
    _BASE = (verts, faces, rig, weights)
    return _BASE


def _target(name):
    out = {}
    p = DATA / "targets" / f"{name}.target.gz"
    for line in gzip.open(p, "rt"):
        parts = line.split()
        if len(parts) == 4 and parts[0].isdigit():
            out[int(parts[0])] = (float(parts[1]), float(parts[2]), float(parts[3]))
    return out


def _conv(v):  # MakeHuman obj (decimetres, Y up, front +Z) -> Blender metres (Z up, front -Y)
    return Vector((v[0] * 0.1, -v[2] * 0.1, v[1] * 0.1))


def _skin_material(name, tone=(0.52, 0.36, 0.28), hair=(0.025, 0.02, 0.018), stubble=0.0):
    m = L.mat(name, tone, rough=0.42, spec=0.5)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Subsurface Weight"].default_value = 0.25
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.2)
    b.inputs["Subsurface Scale"].default_value = 0.008
    # blotchy tone variation
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 18.0
    nz.inputs["Detail"].default_value = 4
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    var = nt.nodes.new("ShaderNodeMix")
    var.data_type = "RGBA"
    var.inputs[0].default_value = 0.25
    var.inputs[6].default_value = (*tone, 1)
    var.inputs[7].default_value = (tone[0] * 0.82, tone[1] * 0.72, tone[2] * 0.70, 1)
    nt.links.new(nz.outputs["Fac"], var.inputs[0])
    # hair / brow / stubble masks from vertex attributes
    attr_h = nt.nodes.new("ShaderNodeAttribute")
    attr_h.attribute_name = "hairmask"
    hairmix = nt.nodes.new("ShaderNodeMix")
    hairmix.data_type = "RGBA"
    hairmix.inputs[7].default_value = (*hair, 1)
    nt.links.new(attr_h.outputs["Fac"], hairmix.inputs[0])
    nt.links.new(var.outputs[2], hairmix.inputs[6])
    nt.links.new(hairmix.outputs[2], b.inputs["Base Color"])
    rmix = nt.nodes.new("ShaderNodeMapRange")
    rmix.inputs["To Min"].default_value = 0.42
    rmix.inputs["To Max"].default_value = 0.75
    nt.links.new(attr_h.outputs["Fac"], rmix.inputs["Value"])
    nt.links.new(rmix.outputs[0], b.inputs["Roughness"])
    # pores / hair grain bump
    pores = nt.nodes.new("ShaderNodeTexNoise")
    pores.inputs["Scale"].default_value = 900.0
    pores.inputs["Detail"].default_value = 2
    nt.links.new(tc.outputs["Object"], pores.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    nt.links.new(pores.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs[0], b.inputs["Normal"])
    return m


def _cloth_material(name, color, rough=0.8, sheen=0.4, scale=420.0, strength=0.12):
    m = L.mat(name, color, rough=rough)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Sheen Weight"].default_value = sheen
    b.inputs["Sheen Tint"].default_value = (1, 1, 1, 1)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.inputs["Scale"].default_value = scale
    wv.inputs["Distortion"].default_value = 2.0
    nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    nt.links.new(wv.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs[0], b.inputs["Normal"])
    return m


class Human:
    """A rigged, clothed man. Facing -Y, his left is +X. Ground at z=0 of his root object."""

    def __init__(self, name, loc=(0, 0, 0), yaw=0.0, muscle=0.55, weight=0.5, tone=(0.50, 0.34, 0.26),
                 top=(0.02, 0.02, 0.022), bottom=(0.025, 0.025, 0.03), shoes=(0.01, 0.01, 0.01),
                 hair=(0.02, 0.016, 0.014), iris=((0.10, 0.06, 0.03), (0.35, 0.22, 0.10)), subdiv=1,
                 ethnic=(("caucasian", 0.7), ("african", 0.15), ("asian", 0.15)), age_old=0.0, vshape=0.5):
        verts, faces, rig, weights = _load_base()
        n = len(verts)
        V = [list(v) for v in verts]
        mix = [("universal-male-young-maxmuscle-averageweight", max(0.0, muscle - 0.5) * 2),
               ("universal-male-young-minmuscle-averageweight", max(0.0, 0.5 - muscle) * 2),
               ("universal-male-young-averagemuscle-maxweight", max(0.0, weight - 0.5) * 2),
               ("universal-male-young-averagemuscle-minweight", max(0.0, 0.5 - weight) * 2),
               ("male-young-averagemuscle-averageweight-idealproportions", 0.6),
               ("torso-vshape-incr", vshape), ("measure-shoulder-dist-incr", vshape * 0.5),
               ("torso-muscle-pectoral-incr", vshape * 0.5), ("measure-hips-circ-decr", 0.3),
               ("measure-waist-circ-decr", 0.25)]
        for eth, w in ethnic:
            mix.append((f"{eth}-male-young", w * (1 - age_old)))
            if age_old:
                mix.append((f"{eth}-male-old", w * age_old))
        for tname, w in mix:
            if w <= 0:
                continue
            for i, d in _target(tname).items():
                V[i][0] += d[0] * w
                V[i][1] += d[1] * w
                V[i][2] += d[2] * w
        P = [_conv(v) for v in V]
        # groups
        gverts = {}
        for g, f in faces:
            gverts.setdefault(g, set()).update(f)

        def cube(name_):
            vs = gverts[name_]
            return sum((P[i] for i in vs), Vector()) / len(vs)

        ground = cube("joint-ground").z
        # dominant bone per vertex
        dom = [("", 0.0)] * n
        for bone, lst in weights.items():
            for vi, w in lst:
                if w > dom[vi][1]:
                    dom[vi] = (bone, w)

        def region(vi):
            b = dom[vi][0]
            if b.startswith(SKIN_PREFIX):
                return "skin"
            if b.startswith(SHOE_PREFIX):
                return "shoes"
            if b.startswith(BOTTOM_PREFIX):
                return "bottom"
            return "top"

        reg = [region(i) for i in range(n)]
        # vertex normals of the body surface
        normals = [Vector() for _ in range(n)]
        body_faces = [f for g, f in faces if g == "body"]
        for f in body_faces:
            a, b_, c = P[f[0]], P[f[1]], P[f[2]]
            nrm = (b_ - a).cross(c - a)
            for vi in f:
                normals[vi] += nrm
        for v in normals:
            if v.length:
                v.normalize()

        # ---------------- armature
        arm_data = bpy.data.armatures.new(name + "_rig")
        arm = bpy.data.objects.new(name, arm_data)
        bpy.context.scene.collection.objects.link(arm)
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode="EDIT")

        def jpos(spec):
            s = spec["strategy"]
            if s == "CUBE":
                return cube(spec["cube_name"])
            if s == "VERTEX":
                return P[spec["vertex_index"]].copy()
            return sum((P[i] for i in spec["vertex_indices"]), Vector()) / len(spec["vertex_indices"])

        order = []
        pending = dict(rig)
        while pending:
            for bn in list(pending):
                par = pending[bn]["parent"]
                if not par or par in order:
                    order.append(bn)
                    del pending[bn]
        for bn in order:
            spec = rig[bn]
            eb = arm_data.edit_bones.new(bn)
            eb.head = jpos(spec["head"])
            eb.tail = jpos(spec["tail"])
            if (eb.tail - eb.head).length < 1e-4:
                eb.tail = eb.head + Vector((0, 0, 0.01))
            eb.roll = spec.get("roll", 0.0)
            if spec["parent"]:
                eb.parent = arm_data.edit_bones[spec["parent"]]
                eb.use_connect = bool(spec.get("use_connect", False))
        bpy.ops.object.mode_set(mode="OBJECT")
        self.order = order
        self.arm = arm
        self.parent_of = {bn: rig[bn]["parent"] for bn in order}

        # ---------------- meshes
        def build_mesh(mname, flist, offset_fn=None, mats=None, mat_of=None):
            used = sorted({vi for f in flist for vi in f})
            idx = {vi: k for k, vi in enumerate(used)}
            co = [P[vi] + (normals[vi] * offset_fn(vi) if offset_fn else Vector()) for vi in used]
            me = bpy.data.meshes.new(mname)
            me.from_pydata([tuple(c) for c in co], [], [[idx[vi] for vi in f] for f in flist])
            me.update()
            ob = bpy.data.objects.new(mname, me)
            bpy.context.scene.collection.objects.link(ob)
            for p in me.polygons:
                p.use_smooth = True
            if mats:
                for m in mats:
                    me.materials.append(m)
                if mat_of:
                    mi = mat_of if isinstance(mat_of, list) else [mat_of(f) for f in flist]
                    me.polygons.foreach_set("material_index", mi)
            for bone, lst in weights.items():
                vg = None
                for vi, w in lst:
                    if vi in idx:
                        if vg is None:
                            vg = ob.vertex_groups.new(name=bone)
                        vg.add([idx[vi]], w, "REPLACE")
            ob.parent = arm
            md = ob.modifiers.new("rig", "ARMATURE")
            md.object = arm
            if subdiv:
                sd = ob.modifiers.new("subd", "SUBSURF")
                sd.levels = 0
                sd.render_levels = subdiv
            return ob, idx, used

        skin_m = _skin_material(name + "_skin", tone, hair)
        teeth_m = L.mat(name + "_teeth", (0.75, 0.72, 0.65), rough=0.3)
        mouth_m = L.mat(name + "_mouth", (0.25, 0.06, 0.06), rough=0.5)
        skin_faces = [f for f in body_faces if any(reg[vi] == "skin" for vi in f)]
        extra = [f for g, f in faces if g in ("helper-upper-teeth", "helper-lower-teeth", "helper-tongue")]
        nskin = len(skin_faces)
        allf = skin_faces + extra
        self.body, bidx, bused = build_mesh(
            name + "_body", allf, mats=[skin_m, teeth_m, mouth_m],
            mat_of=[0] * nskin + [2 if any(vi in gverts["helper-tongue"] for vi in f) else 1 for f in extra])
        # hair & brow mask (vertex attribute)
        eyeL = cube("joint-l-eye")
        eyeR = cube("joint-r-eye")
        eye_z = (eyeL.z + eyeR.z) / 2
        head_c = cube("joint-head-2") if "joint-head-2" in gverts else cube("joint-head")
        att = self.body.data.attributes.new("hairmask", "FLOAT", "POINT")
        vals = []
        for vi in bused:
            p = P[vi]
            hm = 0.0
            if reg[vi] == "skin" and dom[vi][0] not in ("jaw",) and p.z > eye_z - 0.06:
                rel = p - head_c
                # scalp: above the forehead line, or behind the ears
                front_line = eye_z + 0.045 + max(0.0, -rel.y - 0.06) * 0.6
                if p.z > front_line or (rel.y > 0.01 and p.z > eye_z - 0.03):
                    hm = min(1.0, (p.z - front_line) / 0.012 + 0.6) if p.z > front_line else 0.9
                # eyebrows
                for e in (eyeL, eyeR):
                    dx, dz = p.x - e.x, p.z - e.z
                    side = 1 if e.x > 0 else -1
                    u = dx * side  # >0 towards the temple
                    brow_top = 0.021 + 0.003 * (1 - min(1, abs(u + 0.004) / 0.02))
                    if -0.017 < u < 0.024 and 0.0135 + 0.002 * max(0, u) / 0.024 < dz < brow_top and p.y < e.y + 0.01:
                        hm = max(hm, 0.8)
            vals.append(max(0.0, min(1.0, hm)))
        att.data.foreach_set("value", vals)
        # clothes
        cloth_mats = [_cloth_material(name + "_top", top, 0.85, 0.5, 520, 0.16),
                      _cloth_material(name + "_bottom", bottom, 0.65, 0.15, 260, 0.05),
                      L.mat(name + "_shoes", shoes, rough=0.28, coat=0.5)]
        order_r = {"top": 0, "bottom": 1, "shoes": 2}
        cfaces = [f for f in body_faces if all(reg[vi] != "skin" for vi in f)]
        thick = {"top": 0.007, "bottom": 0.012, "shoes": 0.016}

        def mat_of_cloth(f):
            rs = [reg[vi] for vi in f]
            return max(order_r[r] for r in rs)

        self.clothes, _, _ = build_mesh(name + "_clothes", cfaces, offset_fn=lambda vi: thick[reg[vi]],
                                        mats=cloth_mats, mat_of=mat_of_cloth)
        loose = self.clothes.vertex_groups.new(name="loose")
        cl_used = sorted({vi for f in cfaces for vi in f})
        for k, vi in enumerate(cl_used):
            loose.add([k], {"top": 0.35, "bottom": 1.0, "shoes": 1.0}[reg[vi]], "REPLACE")
        sm = self.clothes.modifiers.new("drape", "SMOOTH")
        sm.factor = 0.9
        sm.iterations = 12
        sm.vertex_group = "loose"
        self.clothes.modifiers.move(len(self.clothes.modifiers) - 1, 0)
        so = self.clothes.modifiers.new("thick", "SOLIDIFY")
        so.thickness = 0.004
        so.offset = -1
        self.clothes.modifiers.move(len(self.clothes.modifiers) - 1, 1)
        # expression shape keys on the body
        self.body.shape_key_add(name="Basis")
        self.keys = {}
        for kname, parts in (("angry", [("eyebrows-left-down", 1.0), ("eyebrows-right-down", 1.0),
                                        ("mouth-open", 0.0), ("nose-left-elevation", 0.4), ("nose-right-elevation", 0.4)]),
                             ("mouth_open", [("mouth-open", 1.0)]),
                             ("squint", [("eye-left-slit", 0.8), ("eye-right-slit", 0.8)]),
                             ("sneer", [("mouth-corner-puller", 0.6), ("eye-left-slit", 0.4), ("eye-right-slit", 0.4)]),
                             ("sad", [("eyebrows-left-inner-up", 1.0), ("eyebrows-right-inner-up", 1.0),
                                      ("mouth-depression", 0.6)])):
            sk = self.body.shape_key_add(name=kname)
            for tname, w in parts:
                if w <= 0:
                    continue
                try:
                    tg = _target(tname)
                except FileNotFoundError:
                    continue
                for vi, d in tg.items():
                    if vi in bidx:
                        k = bidx[vi]
                        sk.data[k].co += Vector((d[0] * 0.1, -d[2] * 0.1, d[1] * 0.1)) * w
            sk.value = 0.0
            self.keys[kname] = sk
        # eyes (procedural iris), parented to the head bone
        eye_m, _ = L.eye_material(name + "_eye", iris=iris[0], iris2=iris[1])
        self.eyes = []
        hb = arm_data.bones["head"]
        bone_rest = hb.matrix_local @ Matrix.Translation((0, hb.length, 0))
        for g in ("helper-l-eye", "helper-r-eye"):
            vs = [P[i] for i in gverts[g]]
            c = sum(vs, Vector()) / len(vs)
            r = max((v - c).length for v in vs)
            e = L.sphere(tuple(c), 1.0, (r, r, r), material=eye_m, seg=32, rings=16)
            e.parent = arm
            e.parent_type = "BONE"
            e.parent_bone = "head"
            e.matrix_parent_inverse = bone_rest.inverted()
            e.location = c
            self.eyes.append(e)
        # place the character
        arm.location = Vector(loc) + Vector((0, 0, -ground))
        arm.rotation_euler = (0, 0, yaw)
        self.base_z = -ground
        self.rest_dir = {bn: (arm_data.bones[bn].tail_local - arm_data.bones[bn].head_local).normalized()
                         for bn in order}
        self.rest_q = {bn: arm_data.bones[bn].matrix_local.to_3x3().to_quaternion() for bn in order}
        for pb in arm.pose.bones:
            pb.rotation_mode = "QUATERNION"
        self.loc0 = Vector(loc)

    # ------------------------------------------------------------ posing
    def apply(self, spec, local=None):
        """spec: bone -> Vector (target direction in body space) or tuple of degrees (rotation about body axes,
        relative to the parent). local: bone -> degrees about the bone's own axes (fingers)."""
        W = {}
        for bn in self.order:
            par = self.parent_of[bn]
            Wp = W.get(par, Quaternion())
            s = spec.get(bn)
            if s is None:
                q = Quaternion()
            elif isinstance(s, Vector):
                q = self.rest_dir[bn].rotation_difference(Wp.inverted() @ s.normalized())
            else:
                q = Euler([math.radians(a) for a in s]).to_quaternion()
            W[bn] = Wp @ q
            R = self.rest_q[bn]
            lq = R.inverted() @ q @ R
            if local and bn in local:
                lq = lq @ Euler([math.radians(a) for a in local[bn]]).to_quaternion()
            self.arm.pose.bones[bn].rotation_quaternion = lq

    def face(self, **vals):
        for k, sk in self.keys.items():
            sk.value = vals.get(k, 0.0)


# ------------------------------------------------------------ pose presets (body space: +X = his left, -Y = forward)
def _arm(spec, side, upper, lower):
    s = 1 if side == "L" else -1
    spec[f"upperarm01.{side}"] = Vector((s * upper[0], upper[1], upper[2]))
    spec[f"lowerarm01.{side}"] = Vector((s * lower[0], lower[1], lower[2]))


def stand(breath=0.0):
    sp = {}
    _arm(sp, "L", (0.13, 0.02, -1), (0.06, -0.12, -1))
    _arm(sp, "R", (0.13, 0.02, -1), (0.06, -0.12, -1))
    sp["spine03"] = (1.2 * math.sin(breath), 0, 0)
    return sp


def fist_local(side, amount=1.0, keep_index=False):
    loc = {}
    for f in range(2, 6):
        if keep_index and f == 2:
            continue
        for k in (1, 2, 3):
            loc[f"finger{f}-{k}.{side}"] = (70 * amount if k == 1 else 80 * amount, 0, 0)
    loc[f"finger1-2.{side}"] = (25 * amount, 0, 0)
    loc[f"finger1-3.{side}"] = (30 * amount, 0, 0)
    return loc


def walk(phase, amount=1.0):
    sp = stand()
    for side, ph in (("L", phase), ("R", phase + math.pi)):
        s = 1 if side == "L" else -1
        a = 0.42 * math.sin(ph) * amount
        b = (0.8 * max(0.0, math.sin(ph + 1.4)) + 0.06) * amount
        sp[f"upperleg01.{side}"] = Vector((s * 0.03, -math.sin(a), -math.cos(a)))
        sp[f"lowerleg01.{side}"] = Vector((s * 0.02, -math.sin(a - b), -math.cos(a - b)))
        sw = -0.35 * math.sin(ph) * amount
        _arm(sp, side, (0.12, -math.sin(sw), -math.cos(sw)), (0.06, -math.sin(sw + 0.35), -math.cos(sw + 0.35)))
    sp["spine03"] = (3, 0, 4 * math.sin(phase) * amount)
    return sp


def sit(sp=None):
    sp = sp if sp is not None else stand()
    for side in ("L", "R"):
        s = 1 if side == "L" else -1
        sp[f"upperleg01.{side}"] = Vector((s * 0.12, -1.0, -0.08))
        sp[f"lowerleg01.{side}"] = Vector((s * 0.02, -0.12, -1.0))
    return sp


def lean(sp, deg):
    sp["spine03"] = (deg * 0.5, 0, 0)
    sp["spine02"] = (deg * 0.5, 0, 0)
    return sp


def nod(sp, deg, turn=0.0, tilt=0.0):
    sp["neck01"] = (deg * 0.35, 0, turn * 0.4)
    sp["head"] = (deg * 0.65, tilt, turn * 0.6)
    return sp


def point(sp, side, d):
    d = Vector(d).normalized()
    sp[f"upperarm01.{side}"] = d
    sp[f"lowerarm01.{side}"] = d
    return sp


def gesture(sp, t, amount=1.0):
    for side, ph in (("L", 0.0), ("R", 1.7)):
        s = 1 if side == "L" else -1
        w = math.sin(t * 7.0 + ph) * amount
        _arm(sp, side, (0.45, -0.55, -0.7), (0.25 + 0.15 * w, -1.0, 0.35 + 0.35 * w))
    return sp


def phone_hold(sp):
    _arm(sp, "L", (0.08, -0.35, -1), (-0.25, -1.0, 0.45))
    _arm(sp, "R", (0.08, -0.35, -1), (-0.25, -1.0, 0.45))
    return sp
