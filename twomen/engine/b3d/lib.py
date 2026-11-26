"""Blender building blocks: materials, primitives, articulated mannequin, render setup.

Runs inside Blender (bpy). Everything is procedural: no downloaded models or textures.
"""
import math
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector


# ------------------------------------------------------------------ scene / render
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def setup_render(res=(576, 1024), samples=8, fog=0.0, fog_color=(0.6, 0.7, 0.9), world=(0.002, 0.002, 0.003),
                 bloom=0.9, motion_blur=True):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.fps = 30
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.film_transparent = False
    e = sc.eevee
    e.taa_render_samples = samples
    e.use_bloom = bloom > 0
    e.bloom_intensity = 0.06 * bloom
    e.bloom_threshold = 0.9
    e.bloom_radius = 6.0
    e.use_ssr = True
    e.use_ssr_refraction = True
    e.use_ssr_halfres = True
    e.use_gtao = True
    e.gtao_distance = 0.8
    e.use_soft_shadows = True
    e.shadow_cube_size = "1024"
    e.shadow_cascade_size = "2048"
    e.use_motion_blur = motion_blur
    e.motion_blur_shutter = 0.45
    e.volumetric_tile_size = "8"
    e.volumetric_samples = 48
    e.use_volumetric_lights = True
    e.use_volumetric_shadows = True
    sc.view_settings.view_transform = "Filmic"
    sc.view_settings.look = "Medium High Contrast"
    sc.view_settings.exposure = -0.4
    w = bpy.data.worlds.new("World")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes["Background"].inputs[0].default_value = (*world, 1)
    nt.nodes["Background"].inputs[1].default_value = 1.0
    if fog > 0:
        vs = nt.nodes.new("ShaderNodeVolumeScatter")
        vs.inputs["Density"].default_value = fog * 0.18
        vs.inputs["Color"].default_value = (*fog_color, 1)
        vs.inputs["Anisotropy"].default_value = 0.55
        nt.links.new(vs.outputs[0], nt.nodes["World Output"].inputs["Volume"])
    return sc


def camera(loc, look_at, lens=35, dof_target=None, fstop=2.8, name="Cam"):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 24
    cd.clip_end = 400
    cam = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc)
    aim(cam, look_at)
    if dof_target is not None:
        cd.dof.use_dof = True
        if isinstance(dof_target, bpy.types.Object):
            cd.dof.focus_object = dof_target
        else:
            cd.dof.focus_distance = float(dof_target)
        cd.dof.aperture_fstop = fstop
    if bpy.context.scene.camera is None:
        bpy.context.scene.camera = cam
    return cam


def aim(obj, target, up="Y"):
    d = Vector(target) - obj.location
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = d.to_track_quat("-Z", up).to_euler()


def light(kind, loc, energy, color=(1, 1, 1), size=1.0, look_at=None, spot=45, blend=0.3, name=None, shadow=True):
    ld = bpy.data.lights.new(name or kind, kind)
    ld.energy = energy
    ld.color = color
    if kind == "AREA":
        ld.size = size
    elif kind in ("POINT", "SPOT"):
        ld.shadow_soft_size = size
    if kind == "SPOT":
        ld.spot_size = math.radians(spot)
        ld.spot_blend = blend
    ld.use_shadow = shadow
    ob = bpy.data.objects.new(name or kind, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = Vector(loc)
    if look_at is not None:
        aim(ob, look_at)
    return ob


# ------------------------------------------------------------------ materials
def _bsdf(m):
    return m.node_tree.nodes["Principled BSDF"]


def mat(name, color=(0.8, 0.8, 0.8), metal=0.0, rough=0.5, emit=None, strength=0.0, transmission=0.0, ior=1.45,
        coat=0.0, alpha=1.0, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = _bsdf(m)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = spec
    if emit is not None:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
        b.inputs["IOR"].default_value = ior
        m.use_screen_refraction = True
        m.refraction_depth = 0.05
        m.blend_method = "HASHED"
        m.shadow_method = "HASHED"
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.05
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    return m


def emission(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (*color, 1)
    em.inputs[1].default_value = strength
    nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs[0])
    return m


def _tex_ramp(m, tex, stops, scale=4.0, detail=8.0, coord="Object"):
    nt = m.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(tc.outputs[coord], tex.inputs["Vector"])
    if "Scale" in tex.inputs:
        tex.inputs["Scale"].default_value = scale
    if "Detail" in tex.inputs:
        tex.inputs["Detail"].default_value = detail
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], (*stops[0][1], 1)
    els[1].position, els[1].color = stops[-1][0], (*stops[-1][1], 1)
    for p, c in stops[1:-1]:
        e = els.new(p)
        e.color = (*c, 1)
    nt.links.new(tex.outputs[0], ramp.inputs[0])
    return ramp


def marble(name="Marble", base=(0.85, 0.84, 0.82), vein=(0.25, 0.25, 0.27), rough=0.18, scale=1.6):
    m = mat(name, base, rough=rough, coat=0.4)
    nt = m.node_tree
    tex = nt.nodes.new("ShaderNodeTexWave")
    tex.wave_type = "BANDS"
    tex.inputs["Distortion"].default_value = 9.0
    tex.inputs["Detail"].default_value = 10
    tex.inputs["Detail Scale"].default_value = 2.0
    ramp = _tex_ramp(m, tex, [(0.0, vein), (0.06, base), (1.0, base)], scale=scale)
    nt.links.new(ramp.outputs[0], _bsdf(m).inputs["Base Color"])
    return m


def wood(name="Wood", light_c=(0.62, 0.42, 0.25), dark_c=(0.38, 0.22, 0.11), rough=0.45):
    m = mat(name, light_c, rough=rough, coat=0.25)
    nt = m.node_tree
    tex = nt.nodes.new("ShaderNodeTexWave")
    tex.wave_type = "RINGS"
    tex.inputs["Distortion"].default_value = 4.0
    tex.inputs["Detail"].default_value = 3
    ramp = _tex_ramp(m, tex, [(0.0, dark_c), (0.55, light_c), (1.0, dark_c)], scale=3.5)
    nt.links.new(ramp.outputs[0], _bsdf(m).inputs["Base Color"])
    return m


def concrete(name="Concrete", c=(0.16, 0.16, 0.17), rough=0.85):
    m = mat(name, c, rough=rough)
    nt = m.node_tree
    tex = nt.nodes.new("ShaderNodeTexNoise")
    ramp = _tex_ramp(m, tex, [(0.3, tuple(x * 0.55 for x in c)), (0.7, c)], scale=6.0, detail=12)
    nt.links.new(ramp.outputs[0], _bsdf(m).inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    nt.links.new(tex.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs[0], _bsdf(m).inputs["Normal"])
    return m


def grid_floor(name="Grid", line=(0.25, 0.6, 1.0), strength=2.5, spacing=1.0, width=0.015, base=(0.004, 0.005, 0.007)):
    """Glossy black floor with glowing grid lines."""
    m = mat(name, base, rough=0.12, metal=0.3)
    nt = m.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    outs = []
    for axis in ("X", "Y"):
        div = nt.nodes.new("ShaderNodeMath")
        div.operation = "DIVIDE"
        div.inputs[1].default_value = spacing
        nt.links.new(sep.outputs[axis], div.inputs[0])
        fr = nt.nodes.new("ShaderNodeMath")
        fr.operation = "PINGPONG"
        fr.inputs[1].default_value = 0.5
        nt.links.new(div.outputs[0], fr.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = width / spacing
        nt.links.new(fr.outputs[0], lt.inputs[0])
        outs.append(lt)
    mx = nt.nodes.new("ShaderNodeMath")
    mx.operation = "MAXIMUM"
    nt.links.new(outs[0].outputs[0], mx.inputs[0])
    nt.links.new(outs[1].outputs[0], mx.inputs[1])
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = strength
    nt.links.new(mx.outputs[0], mul.inputs[0])
    b = _bsdf(m)
    b.inputs["Emission Color"].default_value = (*line, 1)
    nt.links.new(mul.outputs[0], b.inputs["Emission Strength"])
    return m


def eye_material(name="Eye", iris=(0.20, 0.12, 0.06), iris2=(0.55, 0.38, 0.16)):
    """Sclera + fibrous iris + pupil, looking along the object's -Y axis. Returns (mat, pupil_value_node)."""
    m = mat(name, (0.9, 0.88, 0.86), rough=0.08, coat=1.0)
    nt = m.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    # polar angle around the view axis for iris fibres
    at = nt.nodes.new("ShaderNodeMath")
    at.operation = "ARCTAN2"
    nt.links.new(sep.outputs["X"], at.inputs[0])
    nt.links.new(sep.outputs["Z"], at.inputs[1])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = 9.0
    nt.links.new(at.outputs[0], mul.inputs[0])
    nt.links.new(mul.outputs[0], comb.inputs["X"])
    nt.links.new(sep.outputs["Y"], comb.inputs["Y"])
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 6
    nt.links.new(comb.outputs[0], noise.inputs["Vector"])
    fib = nt.nodes.new("ShaderNodeMix")
    fib.data_type = "RGBA"
    fib.inputs[6].default_value = (*iris, 1)
    fib.inputs[7].default_value = (*iris2, 1)
    nt.links.new(noise.outputs["Fac"], fib.inputs[0])
    # radial mask from -Y component: pupil (< -p), iris (< -0.86), sclera
    neg = nt.nodes.new("ShaderNodeMath")
    neg.operation = "MULTIPLY"
    neg.inputs[1].default_value = -1.0
    nt.links.new(sep.outputs["Y"], neg.inputs[0])
    pupil = nt.nodes.new("ShaderNodeValue")
    pupil.outputs[0].default_value = 0.965
    is_pupil = nt.nodes.new("ShaderNodeMath")
    is_pupil.operation = "GREATER_THAN"
    nt.links.new(neg.outputs[0], is_pupil.inputs[0])
    nt.links.new(pupil.outputs[0], is_pupil.inputs[1])
    is_iris = nt.nodes.new("ShaderNodeMath")
    is_iris.operation = "SMOOTH_MAX" if False else "GREATER_THAN"
    is_iris.inputs[1].default_value = 0.86
    nt.links.new(neg.outputs[0], is_iris.inputs[0])
    mix1 = nt.nodes.new("ShaderNodeMix")
    mix1.data_type = "RGBA"
    mix1.inputs[6].default_value = (0.88, 0.86, 0.84, 1)
    nt.links.new(is_iris.outputs[0], mix1.inputs[0])
    nt.links.new(fib.outputs[2], mix1.inputs[7])
    mix2 = nt.nodes.new("ShaderNodeMix")
    mix2.data_type = "RGBA"
    mix2.inputs[7].default_value = (0.005, 0.005, 0.005, 1)
    nt.links.new(is_pupil.outputs[0], mix2.inputs[0])
    nt.links.new(mix1.outputs[2], mix2.inputs[6])
    nt.links.new(mix2.outputs[2], _bsdf(m).inputs["Base Color"])
    return m, pupil


def image_emission(name, path, strength=1.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = _bsdf(m)
    img = bpy.data.images.load(path)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.links.new(tex.outputs[0], b.inputs["Base Color"])
    nt.links.new(tex.outputs[0], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = strength
    b.inputs["Roughness"].default_value = 0.08
    return m


# ------------------------------------------------------------------ primitives
def _finish(ob, material=None, smooth=True, name=None):
    if name:
        ob.name = name
    if material is not None:
        ob.data.materials.clear()
        ob.data.materials.append(material)
    if smooth and ob.type == "MESH":
        for p in ob.data.polygons:
            p.use_smooth = True
    return ob


def sphere(loc=(0, 0, 0), r=1.0, scale=(1, 1, 1), material=None, seg=32, rings=16, name=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    ob = bpy.context.object
    ob.scale = scale
    return _finish(ob, material, name=name)


def cube(loc=(0, 0, 0), size=(1, 1, 1), material=None, bevel=0.0, rot=(0, 0, 0), name=None, smooth=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.scale = size
    if bevel:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        md = ob.modifiers.new("bevel", "BEVEL")
        md.width = bevel
        md.segments = 4
        smooth = True
    return _finish(ob, material, smooth=smooth, name=name)


def cylinder(loc=(0, 0, 0), r=1.0, depth=1.0, material=None, verts=48, rot=(0, 0, 0), name=None, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    return _finish(bpy.context.object, material, smooth=smooth, name=name)


def cone(loc=(0, 0, 0), r1=1.0, r2=0.0, depth=1.0, material=None, verts=48, rot=(0, 0, 0), name=None):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    return _finish(bpy.context.object, material, name=name)


def torus(loc=(0, 0, 0), R=1.0, r=0.05, material=None, rot=(0, 0, 0), name=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=64, minor_segments=12,
                                     location=loc, rotation=rot)
    return _finish(bpy.context.object, material, name=name)


def plane(loc=(0, 0, 0), size=100, material=None, rot=(0, 0, 0), name=None):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc, rotation=rot)
    return _finish(bpy.context.object, material, smooth=False, name=name)


_PHI = (1 + 5 ** 0.5) / 2
_SOLIDS = {
    "tetra": [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)],
    "octa": [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)],
    "cube": [(x, y, z) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)],
    "ico": [(0, a, b) for a in (-1, 1) for b in (-_PHI, _PHI)] + [(a, b, 0) for a in (-1, 1) for b in (-_PHI, _PHI)]
           + [(b, 0, a) for a in (-1, 1) for b in (-_PHI, _PHI)],
    "dodeca": [(x, y, z) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
              + [(0, a / _PHI, b * _PHI) for a in (-1, 1) for b in (-1, 1)]
              + [(a / _PHI, b * _PHI, 0) for a in (-1, 1) for b in (-1, 1)]
              + [(a * _PHI, 0, b / _PHI) for a in (-1, 1) for b in (-1, 1)],
}


def platonic(kind, loc=(0, 0, 0), r=1.0, material=None, wire=0.0, name=None):
    """Platonic solid (tetra, octa, cube, ico, dodeca) of circumradius r; wire>0 = glowing wireframe."""
    pts = [Vector(p) for p in _SOLIDS[kind]]
    k = r / max(p.length for p in pts)
    me = bpy.data.meshes.new(kind)
    bm = bmesh.new()
    for p in pts:
        bm.verts.new(p * k)
    bmesh.ops.convex_hull(bm, input=bm.verts[:])
    bmesh.ops.dissolve_limit(bm, angle_limit=0.02, verts=bm.verts[:], edges=bm.edges[:])
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name or kind, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = Vector(loc)
    if wire:
        md = ob.modifiers.new("wire", "WIREFRAME")
        md.thickness = wire
        md.use_replace = True
    return _finish(ob, material, smooth=False)


def spiky_orb(loc=(0, 0, 0), r=0.5, spike=0.6, material=None, name="orb"):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=loc)
    ob = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    res = bmesh.ops.extrude_discrete_faces(bm, faces=bm.faces[:])
    for f in res["faces"]:
        c = f.calc_center_median()
        n = f.normal.copy()
        for v in f.verts:
            v.co = c + n * r * spike * random.uniform(0.6, 1.2)
            break
        bmesh.ops.scale(bm, vec=(0.25, 0.25, 0.25), space=Matrix.Translation(-c), verts=f.verts[1:])
    bm.to_mesh(ob.data)
    bm.free()
    return _finish(ob, material, smooth=False, name=name)


def shards(width=3.0, height=3.0, nx=7, nz=7, thick=0.02, center=(0, 0, 1.5), material=None, seed=1, normal_y=True):
    """Tile a pane with jittered triangles; returns list of (object, centre)."""
    rnd = random.Random(seed)
    pts = {}
    for i in range(nx + 1):
        for k in range(nz + 1):
            jx = 0 if i in (0, nx) else rnd.uniform(-0.35, 0.35)
            jz = 0 if k in (0, nz) else rnd.uniform(-0.35, 0.35)
            pts[i, k] = Vector(((i + jx) / nx * width - width / 2, 0, (k + jz) / nz * height - height / 2))
    out = []
    for i in range(nx):
        for k in range(nz):
            a, b, c, d = pts[i, k], pts[i + 1, k], pts[i + 1, k + 1], pts[i, k + 1]
            tris = [(a, b, c), (a, c, d)] if rnd.random() < 0.5 else [(a, b, d), (b, c, d)]
            for tri in tris:
                cen = (tri[0] + tri[1] + tri[2]) / 3
                me = bpy.data.meshes.new("shard")
                bm = bmesh.new()
                vs = [bm.verts.new(p - cen) for p in tri]
                f = bm.faces.new(vs)
                bmesh.ops.extrude_face_region(bm, geom=[f])
                for v in bm.verts[3:]:
                    v.co.y += thick
                bm.normal_update()
                bm.to_mesh(me)
                bm.free()
                ob = bpy.data.objects.new("shard", me)
                bpy.context.scene.collection.objects.link(ob)
                ob.location = Vector(center) + cen
                if material:
                    me.materials.append(material)
                out.append((ob, Vector(center) + cen))
    return out


def instances(src, n):
    """Linked duplicates of a mesh object (cheap)."""
    out = []
    for _ in range(n):
        ob = src.copy()
        bpy.context.scene.collection.objects.link(ob)
        out.append(ob)
    return out


# ------------------------------------------------------------------ mannequin
class Mannequin:
    """Artist's wooden-mannequin style figure (1.8 m) built from ellipsoids with posable joints.
    Forward is -Y. Joint rotations are radians: rot_x > 0 bends forward/down for neck & spine,
    rot_x < 0 raises an arm forward, knee rot_x > 0 bends the shin backwards."""

    def __init__(self, name, body, joint=None, loc=(0, 0, 0), yaw=0.0, scale=1.0):
        joint = joint or body
        self.name = name
        self.j = {}
        root = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(root)
        root.location = Vector(loc)
        root.rotation_euler = (0, 0, yaw)
        root.scale = (scale, scale, scale)
        self.base = root
        pel = self._joint("pelvis", root, (0, 0, 1.0))
        self._seg(pel, (0, 0, 0.0), (0.16, 0.11, 0.10), body)
        sp = self._joint("spine", pel, (0, 0, 0.09))
        self._seg(sp, (0, 0, 0.11), (0.115, 0.09, 0.13), body)
        ch = self._joint("chest", sp, (0, 0, 0.22))
        self._seg(ch, (0, 0, 0.14), (0.19, 0.115, 0.17), body)
        nk = self._joint("neck", ch, (0, 0, 0.32))
        self._seg(nk, (0, 0, 0.05), (0.045, 0.045, 0.07), joint)
        hd = self._joint("head", nk, (0, 0, 0.09))
        self._seg(hd, (0, -0.01, 0.12), (0.092, 0.105, 0.13), body)
        for side, sx in (("L", 1), ("R", -1)):
            sh = self._joint(f"shoulder{side}", ch, (sx * 0.215, 0, 0.25))
            self._seg(sh, (0, 0, 0), (0.06, 0.06, 0.06), joint)
            self._seg(sh, (0, 0, -0.15), (0.052, 0.052, 0.16), body)
            el = self._joint(f"elbow{side}", sh, (0, 0, -0.30))
            self._seg(el, (0, 0, 0), (0.045, 0.045, 0.045), joint)
            self._seg(el, (0, 0, -0.135), (0.042, 0.042, 0.145), body)
            wr = self._joint(f"wrist{side}", el, (0, 0, -0.27))
            self._seg(wr, (0, -0.005, -0.075), (0.032, 0.05, 0.085), body)
            fi = self._joint(f"finger{side}", wr, (0, -0.02, -0.14))
            f = self._seg(fi, (0, 0, -0.05), (0.011, 0.011, 0.055), body)
            f.hide_render = True
            self.j[f"fingermesh{side}"] = f
            hp = self._joint(f"hip{side}", pel, (sx * 0.095, 0, -0.06))
            self._seg(hp, (0, 0, 0), (0.07, 0.07, 0.07), joint)
            self._seg(hp, (0, 0, -0.215), (0.07, 0.07, 0.23), body)
            kn = self._joint(f"knee{side}", hp, (0, 0, -0.43))
            self._seg(kn, (0, 0, 0), (0.055, 0.055, 0.055), joint)
            self._seg(kn, (0, 0, -0.21), (0.055, 0.055, 0.22), body)
            an = self._joint(f"ankle{side}", kn, (0, 0, -0.42))
            self._seg(an, (0, -0.06, -0.035), (0.05, 0.12, 0.04), body)
        self.rest()

    def _joint(self, nm, parent, off):
        e = bpy.data.objects.new(f"{self.name}_{nm}", None)
        bpy.context.scene.collection.objects.link(e)
        e.parent = parent
        e.location = Vector(off)
        e.rotation_mode = "XYZ"
        self.j[nm] = e
        return e

    def _seg(self, parent, off, rad, material):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=1.0)
        ob = bpy.context.object
        ob.scale = rad
        _finish(ob, material)
        ob.parent = parent
        ob.location = Vector(off)
        return ob

    # --- posing
    def set(self, **rot):
        for k, v in rot.items():
            if isinstance(v, (int, float)):
                v = (v, 0, 0)
            self.j[k].rotation_euler = Euler(v, "XYZ")

    def rest(self):
        for k, e in self.j.items():
            if not k.startswith("fingermesh"):
                e.rotation_euler = (0, 0, 0)
        self.set(shoulderL=(0, 0.10, 0), shoulderR=(0, -0.10, 0), elbowL=(-0.12, 0, 0), elbowR=(-0.12, 0, 0))
        self.point(False)

    def point(self, on, side="R"):
        self.j[f"fingermesh{side}"].hide_render = not on

    def walk(self, phase, amount=1.0):
        s = math.sin(phase)
        c = math.cos(phase)
        a = amount
        self.set(hipL=(0.42 * s * a, 0, 0), hipR=(-0.42 * s * a, 0, 0),
                 kneeL=(max(0, 0.75 * math.sin(phase + 1.3)) * a + 0.05, 0, 0),
                 kneeR=(max(0, 0.75 * math.sin(phase + 1.3 + math.pi)) * a + 0.05, 0, 0),
                 ankleL=(-0.15 * s * a, 0, 0), ankleR=(0.15 * s * a, 0, 0),
                 shoulderL=(-0.35 * s * a, 0.08, 0), shoulderR=(0.35 * s * a, -0.08, 0),
                 elbowL=(-0.30, 0, 0), elbowR=(-0.30, 0, 0), spine=(0.04, 0, 0.05 * s * a),
                 chest=(0.02, 0, -0.08 * s * a))
        self.j["pelvis"].location.z = 1.0 + 0.02 * abs(c) * a - 0.02 * a

    def sit(self):
        self.set(hipL=(-1.5, 0.05, 0), hipR=(-1.5, -0.05, 0), kneeL=(1.45, 0, 0), kneeR=(1.45, 0, 0),
                 ankleL=(0.1, 0, 0), ankleR=(0.1, 0, 0))
        self.j["pelvis"].location.z = 0.55
