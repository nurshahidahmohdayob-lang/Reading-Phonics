"""
The home screen's island: one tropical island with a LocoRoco-style
jelly friend for every section of the app, each in its section's colour,
round a lagoon, with mountains,
palms and a sandy beach. Rendered whole, in perspective, on a transparent
background: the app floats it on its own sky, with clouds and birds passing,
and puts a glowing sign on each landmark. The app needs to know where
each landmark lands on the picture: those points go to
blender/out/home-island.json.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/home_island.py
    python3 scripts/home-island.py      # → public/images/home-island.webp + src/app/homeIsland.ts

The helpers (island.py, worlds.py) come from LearnNest's island art.
"""

import json
import math
import os
import random
import sys

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import island as I  # noqa: E402
import worlds as W  # noqa: E402

W_PX, H_PX = 1920, 1080

# Where each section's landmark stands, in scene units (front is -y).
ZONES = {
    # back row
    "tricky": (-3.7, 1.75),
    "stories": (-1.3, 2.05),
    "guided": (1.3, 2.05),
    "assessment": (3.7, 1.75),
    # middle row, either side of the lagoon
    "phonics": (-4.75, 0.15),
    "soundout": (-2.55, 0.25),
    "storyplay": (2.55, 0.25),
    "threed": (4.75, 0.15),
    # front row
    "flashcards": (-3.75, -1.55),
    "spelling": (-1.85, -1.95),
    "formation": (0.0, -2.05),
    "assignments": (1.85, -1.95),
    "tracker": (3.75, -1.55),
    # on the little island in the lagoon
    "interactive": (0.0, 0.32),
}

LAGOON = (0.0, 0.3)

# Each friend's loop: a jelly bounce (stretch up, squash down) with a little
# sway, each a beat apart from its neighbours, and one blink.
FRAMES = 12

# How high above a landmark its sign floats, for the tall ones.
SIGN_LIFT = {}
SIGN_HEIGHT = 1.25

# Section colours, linear (a touch deeper than the app's pastels, for walls).
COL = {
    "phonics": (0.9, 0.08, 0.38),
    "soundout": (0.2, 0.25, 0.95),
    "flashcards": (0.0, 0.62, 0.68),
    "formation": (1.0, 0.38, 0.04),
    "spelling": (0.05, 0.68, 0.28),
    "tricky": (1.0, 0.68, 0.0),
    "stories": (0.05, 0.4, 0.95),
    "storyplay": (0.0, 0.62, 0.6),
    "guided": (0.45, 0.2, 0.95),
    "assessment": (0.95, 0.15, 0.12),
    "threed": (0.6, 0.18, 0.95),
    "assignments": (1.0, 0.5, 0.0),
    "tracker": (0.02, 0.45, 0.22),
    "interactive": (0.9, 0.1, 0.3),
}


def outline(rx, ry, wobble, seed, n=96):
    """An irregular, rounded island outline: an ellipse with gentle bays."""
    rnd = random.Random(seed)
    waves = [(rnd.uniform(0.04, 0.09) * wobble, k, rnd.uniform(0, math.tau)) for k in (2, 3, 5, 7)]
    pts = []
    for i in range(n):
        a = i * math.tau / n
        f = 1 + sum(amp * math.sin(k * a + ph) for amp, k, ph in waves)
        pts.append((math.cos(a) * rx * f, math.sin(a) * ry * f))
    return pts


def slab(name, pts, z0, z1, mat, bevel=0.0):
    """A flat shape from an outline, from height z0 up to z1."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z0)) for x, y in pts]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [v for v in res["geom"] if isinstance(v, bmesh.types.BMVert)]
    for v in top:
        v.co.z = z1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 4
        mod.limit_method = "ANGLE"
    return obj


def pad(x, y, colour, r=0.62):
    """A round stone plaza under each landmark."""
    p = W.cylinder(r, 0.08, (x, y, 0.08), I.material("Plaza", (0.55, 0.4, 0.28), rough=0.8), vertices=40)
    W.cylinder(r * 0.97, 0.02, (x, y, 0.125), I.material("PlazaTop", tuple(min(1, c * 0.55 + 0.12) for c in colour), rough=0.5), vertices=40)
    return p


# --- The landmarks: a LocoRoco jelly friend for every section ---------------------------

CAM = Vector((0, -9.8, 9.6))
JELLY_R = 0.46


def facing(centre):
    """Directions for a face on a body at centre, looking at the camera."""
    d = (CAM - centre).normalized()
    right = d.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(d).normalized()
    return d, right, up


def ellipsoid(name, loc, size, aim, mat):
    """A squashed sphere at loc whose local z points along aim."""
    obj = I.blob(loc, 1.0, mat)
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = aim.to_track_quat("Z", "Y")
    obj.scale = size
    return obj


def jelly(x, y, c):
    """A round, glossy jelly blob in the section's colour, with big eyes,
    an open smile, rosy cheeks and a little sprout on top."""
    pad(x, y, c)
    R = JELLY_R
    centre = Vector((x, y, 0.12 + R * 0.88))
    body = I.blob(centre, R, I.material("Jelly", c, rough=0.15))
    body.scale = (1.15, 1.1, 0.9)
    body.modifiers.new("Smooth", "SUBSURF").levels = 2
    d, right, up = facing(centre)
    white = I.material("EyeWhite", (1, 1, 1), rough=0.2)
    ink = I.material("Pupil", (0.02, 0.01, 0.04), rough=0.2)
    for side in (-1, 1):
        on = (d + right * side * 0.34 + up * 0.26).normalized()
        spot = centre + Vector((on.x * R * 1.1, on.y * R * 1.05, on.z * R * 0.88))
        eye = ellipsoid("Eye", spot, (0.11, 0.15, 0.05), on, white)
        eye["blink"] = True
        pupil = ellipsoid("Pupil", spot + on * 0.045 + up * -0.015, (0.06, 0.085, 0.025), on, ink)
        pupil["blink"] = True
        ellipsoid("Glint", spot + on * 0.07 + up * 0.03 + right * -0.02, (0.022, 0.022, 0.01), on, W.glow_material("Glint", (1, 1, 1), 2))
        cheek_on = (d + right * side * 0.62 - up * 0.08).normalized()
        cheek = centre + Vector((cheek_on.x * R * 1.12, cheek_on.y * R * 1.07, cheek_on.z * R * 0.9))
        ellipsoid("Cheek", cheek, (0.06, 0.04, 0.01), cheek_on, I.material("Cheek", (1.0, 0.35, 0.45), rough=0.6))
    # a wide grin: the bottom half of a dark oval, with a pink tongue
    mouth_on = (d - up * 0.1).normalized()
    mouth = centre + Vector((mouth_on.x * R * 1.12, mouth_on.y * R * 1.07, mouth_on.z * R * 0.9))
    grin = ellipsoid("Mouth", mouth, (0.15, 0.11, 0.03), mouth_on, I.material("Mouth", (0.35, 0.02, 0.08), rough=0.4))
    bm = bmesh.new()
    bm.from_mesh(grin.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > 0.02], context="VERTS")
    bm.to_mesh(grin.data)
    bm.free()
    ellipsoid("Tongue", mouth + mouth_on * 0.018 - up * 0.06, (0.07, 0.035, 0.02), mouth_on, I.material("Tongue", (1.0, 0.35, 0.45), rough=0.4))
    top = centre.z + R * 0.9
    W.cylinder(0.018, 0.2, (x, y, top + 0.08), I.material("Sprout", (0.05, 0.35, 0.05), rough=0.5), vertices=12)
    leaf = I.blob((x + 0.06, y, top + 0.2), 0.07, I.material("Leaf", (0.15, 0.75, 0.1), rough=0.3))
    leaf.scale = (1.4, 0.6, 0.7)


LANDMARKS = {zone: jelly for zone in ZONES}


def shine(objs):
    """Glossy toy-like finish on a landmark: a clear coat over its colours."""
    seen = set()
    for obj in objs:
        for slot in getattr(obj.data, "materials", []) or []:
            if slot is None or slot.name in seen or not slot.use_nodes:
                continue
            seen.add(slot.name)
            bsdf = next((n for n in slot.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if not bsdf:
                continue
            for key in ("Coat Weight", "Clearcoat"):
                if key in bsdf.inputs:
                    bsdf.inputs[key].default_value = 0.8
                    break
            bsdf.inputs["Roughness"].default_value = min(bsdf.inputs["Roughness"].default_value, 0.35)


def build_landmark(scene, zone, x, y):
    """Builds one landmark into its own collection. Its plaza (the two
    plaza discs) goes back on the island."""
    col = bpy.data.collections.new(f"LM_{zone}")
    scene.collection.children.link(col)
    layer = bpy.context.view_layer
    layer.active_layer_collection = layer.layer_collection.children[col.name]
    before = set(bpy.data.objects)
    LANDMARKS[zone](x, y, COL[zone])
    made = [o for o in bpy.data.objects if o not in before]
    layer.active_layer_collection = layer.layer_collection
    parts = []
    for obj in made:
        is_plaza = any(m and m.name.startswith("Plaza") for m in getattr(obj.data, "materials", []) or [])
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        (scene.collection if is_plaza else col).objects.link(obj)
        if not is_plaza:
            parts.append(obj)
    shine(parts)
    # A pivot at the landmark's foot that the whole landmark turns and
    # bounces on, for its animation loop.
    pivot = bpy.data.objects.new(f"Pivot_{zone}", None)
    pivot.location = (x, y, 0.12)
    col.objects.link(pivot)
    bpy.context.view_layer.update()
    for obj in parts:
        world = obj.matrix_world.copy()
        obj.parent = pivot
        obj.matrix_world = world
    beat = list(ZONES).index(zone) / len(ZONES)
    eyes = [o for o in parts if o.get("blink")]
    shut = (list(ZONES).index(zone) * 5) % FRAMES
    for f in range(FRAMES + 1):
        w = math.cos((f / FRAMES + beat) * math.tau)
        pivot.scale = (1 - 0.08 * w, 1 - 0.08 * w, 1 + 0.13 * w)
        pivot.rotation_euler = (0, 0, 0)
        pivot.rotation_euler.y = math.radians(6) * math.sin((f / FRAMES + beat) * math.tau)
        pivot.location = (x, y, 0.12 + 0.09 * max(0.0, w))
        for k in ("scale", "rotation_euler", "location"):
            pivot.keyframe_insert(k, frame=f + 1)
        for eye in eyes:
            base = eye.get("open_z", eye.scale.z)
            eye["open_z"] = base
            eye.scale.z = base
            eye.scale.y = eye.get("open_y", eye.scale.y)
            eye["open_y"] = eye.scale.y
            if f % FRAMES == shut:
                eye.scale.y = eye["open_y"] * 0.12
            eye.keyframe_insert("scale", frame=f + 1)
    if pivot.animation_data and pivot.animation_data.action:
        for fc in getattr(pivot.animation_data.action, "fcurves", []):
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
    for eye in eyes:
        for fc in getattr(eye.animation_data.action, "fcurves", []):
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"
    return col


def clear_of_zones(x, y, gap=0.95):
    if math.hypot((x - LAGOON[0]) / 1.55, (y - LAGOON[1]) / 1.05) < 1.15:
        return False
    return all(math.hypot(x - zx, y - zy) > gap for zx, zy in ZONES.values())


def build():
    scene = W.reset()
    scene.render.resolution_x = W_PX
    scene.render.resolution_y = H_PX
    scene.render.film_transparent = True
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 38
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0, -9.8, 9.6)
    target = Vector((0, 0.15, -0.4))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    I.sun(scene)
    sun = bpy.data.objects["Sun"]
    # A cartoon-game look: warm sunshine, deep cool shadows and bold dark
    # outlines round every shape (Freestyle).
    sun.data.energy = 4.2
    sun.data.color = (1.0, 0.93, 0.75)
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.35, 0.5, 1.0, 1)
    bg.inputs[1].default_value = 0.22
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = 2.2
    lineset = scene.view_layers[0].freestyle_settings.linesets[0] if scene.view_layers[0].freestyle_settings.linesets else scene.view_layers[0].freestyle_settings.linesets.new("Lines")
    lineset.select_by_visibility = True
    lineset.select_silhouette = True
    lineset.select_border = True
    lineset.select_crease = True
    if lineset.linestyle is None:
        lineset.linestyle = bpy.data.linestyles.new("Ink")
    lineset.linestyle.color = (0.06, 0.09, 0.03)
    lineset.linestyle.thickness = 2.2
    # Punchier contrast for deep, vibrant colour.
    for look in ("AgX - High Contrast", "High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue

    # The beach, a low cliff and the grass (no water round it: the island
    # floats on the app's own sky).
    sand = I.material("Sand", (0.95, 0.55, 0.05), rough=0.9, noise=0.12, noise_scale=20)
    slab("Beach", outline(6.15, 3.45, 1.0, 4), -0.2, -0.02, sand, bevel=0.06)
    cliff = I.material("Cliff", (0.35, 0.14, 0.03), rough=0.9, noise=0.25, noise_scale=10)
    land = outline(5.7, 3.1, 1.1, 4)
    slab("Cliff", land, -0.05, 0.02, cliff)
    grass = I.material("Grass", (0.07, 0.38, 0.01), rough=0.85, noise=0.35, noise_scale=6)
    slab("Grass", land, 0.0, 0.06, grass, bevel=0.05)

    # The lagoon in the middle, with a sandy rim and a little island.
    lx, ly = LAGOON
    rim = [(lx + px * 1.0, ly + py) for px, py in outline(1.55, 1.0, 1.4, 9, n=64)]
    slab("LagoonRim", rim, 0.0, 0.075, I.material("Rim", (0.95, 0.55, 0.05), rough=0.9))
    pool = [(lx + px, ly + py) for px, py in outline(1.38, 0.86, 1.4, 9, n=64)]
    slab("Lagoon", pool, 0.0, 0.085, W.glow_material("LagoonWater", (0.0, 0.45, 0.95), 0.3))
    isle_sand = [(lx + px, ly + py) for px, py in outline(0.82, 0.5, 0.8, 2, n=48)]
    slab("IsletSand", isle_sand, 0.0, 0.1, I.material("IsletSand", (0.95, 0.55, 0.05), rough=0.9))
    islet = [(lx + px, ly + 0.02 + py) for px, py in outline(0.7, 0.42, 0.8, 2, n=48)]
    slab("Islet", islet, 0.0, 0.12, grass)

    # Paths from the lagoon out to every landmark.
    dirt = I.material("Path", (0.6, 0.3, 0.05), rough=0.9)
    for zone, (zx, zy) in ZONES.items():
        if zone == "interactive":
            continue
        ax, ay = lx + (zx - lx) * 0.33, ly + (zy - ly) * 0.33
        bx, by = zx - (zx - lx) * 0.12, zy - (zy - ly) * 0.12
        length = math.hypot(bx - ax, by - ay)
        p = I.box("Path", (0.22, length, 0.03), ((ax + bx) / 2, (ay + by) / 2, 0.075), dirt, bevel=0.01)
        I.tilt(p, (0, 0, -math.atan2(bx - ax, by - ay)))

    # Each landmark goes in its own collection, so it can be rendered on its
    # own as a sprite the app animates; its stone plaza stays on the island.
    groups = {}
    for zone, (zx, zy) in ZONES.items():
        groups[zone] = build_landmark(scene, zone, zx, zy)

    # Mountains at the back corners, palms on the beach, trees and bushes.
    rockc = I.material("Mountain", (0.18, 0.13, 0.32), rough=0.85, noise=0.3, noise_scale=6)
    snow = I.material("Snowcap", (0.96, 0.97, 1.0), rough=0.6)
    for (mx, my, mh, mr) in ((-5.0, 2.2, 1.5, 0.9), (-4.3, 2.75, 1.1, 0.7), (5.0, 2.25, 1.4, 0.85), (4.35, 2.75, 1.0, 0.65), (0.0, 2.95, 0.9, 0.7)):
        W.cone(mr, 0.0, mh, (mx, my, mh / 2), rockc, vertices=7)
        W.cone(mr * 0.32, 0.0, mh * 0.32, (mx, my, mh - mh * 0.16), snow, vertices=7)
    rnd = random.Random(21)
    for k in range(30):
        a = k * math.tau / 30 + rnd.uniform(-0.05, 0.05)
        x, y = math.cos(a) * 5.65, math.sin(a) * 3.15
        if clear_of_zones(x, y, 0.8):
            W.palm(x, y, scale=rnd.uniform(1.0, 1.35))
    palette = dict(tree=(0.03, 0.3, 0.0))
    for k in range(80):
        x, y = rnd.uniform(-5.2, 5.2), rnd.uniform(-2.6, 2.7)
        if (x / 5.3) ** 2 + (y / 2.85) ** 2 > 0.85 or not clear_of_zones(x, y):
            continue
        if rnd.random() < 0.55:
            W.tree(x, y, palette, "pine" if rnd.random() < 0.3 else "round", scale=rnd.uniform(1.1, 1.5))
        else:
            I.blob((x, y, 0.12), rnd.uniform(0.1, 0.16), I.material("Bush", (0.02, 0.26, 0.0), rough=0.8))
            I.blob((x + 0.05, y - 0.06, 0.22), 0.045, I.material("Bloom", rnd.choice([(1, 0.3, 0.5), (1, 0.85, 0.2), (0.75, 0.45, 1), (1, 1, 1)])))
    for k in range(10):
        a = k * math.tau / 10 + 0.3
        W.rock(math.cos(a) * 6.1, math.sin(a) * 3.4, (0.18, 0.17, 0.2), scale=rnd.uniform(0.8, 1.3))

    # Where each landmark lands on the picture: the sign goes above it.
    spots = {}
    for zone, (zx, zy) in ZONES.items():
        lift = SIGN_LIFT.get(zone, SIGN_HEIGHT)
        top = world_to_camera_view(scene, cam, Vector((zx, zy, lift)))
        foot = world_to_camera_view(scene, cam, Vector((zx, zy, 0.1)))
        spots[zone] = {
            "sign": [round(top.x * 100, 2), round((1 - top.y) * 100, 2)],
            "foot": [round(foot.x * 100, 2), round((1 - foot.y) * 100, 2)],
        }
    lag = world_to_camera_view(scene, cam, Vector((lx, ly, 0.1)))
    spots["lagoon"] = {"sign": [round(lag.x * 100, 2), round((1 - lag.y) * 100, 2)], "foot": [round(lag.x * 100, 2), round((1 - lag.y) * 100, 2)]}
    with open(os.path.join(I.OUT, "home-island.json"), "w") as f:
        json.dump({"w": W_PX, "h": H_PX, "spots": spots}, f, indent=1)

    # Everything that isn't a landmark goes in one collection, so the island
    # and the landmarks can each be rendered without the other.
    base = bpy.data.collections.new("Base")
    scene.collection.children.link(base)
    for obj in list(scene.collection.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            continue
        scene.collection.objects.unlink(obj)
        base.objects.link(obj)

    # The island with only the plazas where the landmarks stand.
    for col in groups.values():
        col.hide_render = True
    I.render("home-island")
    # Each landmark alone, from the same camera so it lines up exactly, one
    # picture per frame of its loop.
    base.hide_render = True
    scene.frame_set(1)
    for zone, col in groups.items():
        for other in groups.values():
            other.hide_render = other is not col
        for f in range(FRAMES):
            scene.frame_set(f + 1)
            I.render(f"lm-{zone}-{f:02d}")
    scene.frame_set(1)


if __name__ == "__main__":
    build()
