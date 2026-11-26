"""Blender entry point:  blender -b -noaudio -P engine/b3d/run.py -- job.json

job.json: {"scene", "params", "frames", "dur", "beats", "anim_speed", "out", "res", "samples",
           "preview_frames": optional list of frame numbers to render as stills}"""
import json
import os
import sys

import bpy

job = json.load(open(sys.argv[sys.argv.index("--") + 1]))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from b3d import lib, scenes3d  # noqa: E402

lib.reset()
update = scenes3d.BUILDERS[job["scene"]](job.get("params", {}), job)
sc = bpy.context.scene
res = job.get("res", [576, 1024])
sc.render.resolution_x, sc.render.resolution_y = res
sc.eevee.taa_render_samples = job.get("samples", 8)
sc.frame_start = 1
sc.frame_end = job["frames"]
fps = 30.0


def _handler(scene, depsgraph=None):
    update((scene.frame_current - 1 + scene.frame_subframe) / fps)


bpy.app.handlers.frame_change_pre.append(_handler)
os.makedirs(job["out"], exist_ok=True)
if job.get("preview_frames"):
    for f in job["preview_frames"]:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(job["out"], f"{f:04d}.png")
        bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = job["out"] + "/"
    bpy.ops.render.render(animation=True)
print("B3D_DONE", job["scene"])
