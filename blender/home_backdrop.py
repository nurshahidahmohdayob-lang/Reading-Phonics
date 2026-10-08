"""
The home screen's background pieces, in the same cartoon-game style as the
island (blender/home_island.py): bold dark outlines, juicy colour, warm sun.

  home-cloud-a / home-cloud-b   puffy clouds that drift across the sky
  home-jungle                   a clump of big jungle leaves and flowers for
                                the bottom corners (the app mirrors it for the
                                right-hand side and sways it in the breeze)

All rendered on transparent backgrounds, seen straight on.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/home_backdrop.py
    python3 scripts/home-island.py      # converts these too
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import island as I  # noqa: E402
import worlds as W  # noqa: E402


def scene_for(w, h, ortho):
    scene = W.reset()
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.film_transparent = True
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = ortho
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0, -20, 0)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 4.0
    sun.color = (1.0, 0.95, 0.8)
    light = bpy.data.objects.new("Sun", sun)
    light.rotation_euler = Euler((math.radians(55), math.radians(-25), math.radians(-30)))
    scene.collection.objects.link(light)
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.5, 0.65, 1.0, 1)
    bg.inputs[1].default_value = 0.35
    # Bold dark outlines, as on the island.
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = 3.0
    fs = scene.view_layers[0].freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new("Lines")
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = False
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("Ink")
    ls.linestyle.color = (0.05, 0.12, 0.25)
    ls.linestyle.thickness = 3.0
    return scene, ls


def cloud(name, seed):
    scene, ls = scene_for(900, 450, 5.2)
    ls.linestyle.color = (0.16, 0.32, 0.6)
    white = I.material("Cloud", (1.0, 1.0, 1.0), rough=0.9)
    rnd = random.Random(seed)
    puffs = [(-1.5, -0.1, 0.72), (-0.6, 0.35, 0.95), (0.45, 0.45, 1.05), (1.4, 0.05, 0.75), (0.0, -0.35, 0.8), (-1.0, -0.4, 0.6), (1.0, -0.4, 0.62)]
    for k, (x, z, r) in enumerate(puffs):
        r *= rnd.uniform(0.9, 1.08)
        I.blob((x, 0.0, z), r, white)
    I.render(name)


def leaf(base, angle, length, width, colour, lean=0.0, seed=0):
    """A big glossy jungle leaf from `base`, pointing at `angle` (degrees from
    straight up), with a lighter vein down the middle."""
    a = math.radians(angle)
    dx, dz = math.sin(a), math.cos(a)
    cx, cz = base[0] + dx * length / 2, base[1] + dz * length / 2
    mat = I.material(f"Leaf{seed}", colour, rough=0.35)
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    # A leaf shape: a flattened, pointed sphere.
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(cx, 0.0 + lean, cz), segments=32, ring_count=16)
    obj = bpy.context.active_object
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    for v in bm.verts:
        t = v.co.z  # -1..1 along the leaf
        taper = (1 - abs(t) ** 1.6)
        v.co.x *= width * max(taper, 0.02)
        v.co.y *= 0.06
        v.co.z *= length / 2
        v.co.y += 0.25 * (t ** 2) * width  # curls back at the ends
    bm.to_mesh(me)
    bm.free()
    obj.rotation_euler = (0, a, 0)
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    vein = I.material(f"Vein{seed}", tuple(min(1, c * 1.6 + 0.08) for c in colour), rough=0.4)
    v = W.cylinder(0.025, length * 0.92, (cx, -0.08 + lean, cz), vein, vertices=6)
    v.rotation_euler = (0, a, 0)
    return obj


def flower(x, z, colour, centre=(1.0, 0.85, 0.1), r=0.32):
    petal = I.material(f"Petal{x}{z}", colour, rough=0.4)
    for k in range(5):
        a = k * math.tau / 5
        p = I.blob((x + math.cos(a) * r * 0.75, -0.3, z + math.sin(a) * r * 0.75), r * 0.55, petal)
        p.scale = (1, 0.4, 1)
    c = I.blob((x, -0.42, z), r * 0.45, I.material(f"Centre{x}{z}", centre, rough=0.4))
    c.scale = (1, 0.5, 1)


def jungle():
    scene, ls = scene_for(1100, 1000, 10.0)
    ls.linestyle.color = (0.04, 0.12, 0.02)
    greens = [(0.02, 0.22, 0.01), (0.05, 0.38, 0.0), (0.12, 0.5, 0.01), (0.03, 0.3, 0.02), (0.2, 0.55, 0.0)]
    rnd = random.Random(5)
    base = (-4.6, -4.8)  # bottom-left corner of the frame
    # Back row: tall dark leaves; front row: shorter, brighter ones.
    k = 0
    for angle, length, width, depth in (
        (5, 8.2, 1.1, 0.9), (22, 7.6, 1.2, 0.8), (40, 7.4, 1.25, 0.7), (58, 6.6, 1.15, 0.6), (75, 5.6, 1.0, 0.5),
        (14, 6.4, 1.15, 0.2), (32, 6.0, 1.2, 0.1), (50, 5.4, 1.1, 0.0), (68, 4.6, 1.0, -0.1), (85, 3.8, 0.9, -0.2),
    ):
        colour = greens[0] if depth > 0.4 else greens[1 + (k % 4)]
        leaf((base[0] + rnd.uniform(-0.3, 0.3), base[1]), angle + rnd.uniform(-3, 3), length, width, colour, lean=depth, seed=k)
        k += 1
    # A few fern fronds and flowers in front.
    flower(-2.6, -1.7, (0.95, 0.12, 0.1))
    flower(-0.9, -3.2, (1.0, 0.45, 0.0), r=0.28)
    flower(-3.6, 0.6, (0.95, 0.15, 0.45), r=0.26)
    for (x, z, r) in ((-3.9, -4.3, 0.9), (-2.4, -4.6, 0.8), (-0.9, -4.7, 0.7)):
        b = I.blob((x, -0.5, z), r, I.material(f"Bush{x}", (0.04, 0.32, 0.01), rough=0.6))
        b.scale = (1.2, 0.5, 0.8)
    I.render("home-jungle")


if __name__ == "__main__":
    cloud("home-cloud-a", 1)
    cloud("home-cloud-b", 7)
    jungle()
