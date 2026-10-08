"""
The background behind every page: a storybook forest glade, in the chunky,
papercraft style of a cartoon platform game. A giant tree arches over the
top with fairy lights strung under its canopy, chunky zig-zag trees and
bushes, layered cliffs of grass, cream and earth, red toadstools, a windmill
and a cottage in a tree stump, with a picket fence and a stepping-stone path.

It's rendered in depth layers so the app can move them apart as the pointer
moves (2.5D parallax) and animate parts of it: the far scenery, the ground,
the treetops (which sway), the foreground bushes and the windmill's sails
(which turn). Each layer leaves holes where nearer layers cover it, so the
app can stack them in order. Where the sails' hub and the fairy lights land
on the picture go to blender/out/forest.json.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/forest.py
    python3 scripts/forest.py      # → public/images/forest/*.webp + src/app/forestScene.ts
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

W_PX, H_PX = 2048, 1152
LAYERS = ("back", "mid", "crowns", "front", "sails")
M = {}


def mat(name, colour, rough=0.75, noise=0.0, scale=10.0):
    if name not in M:
        M[name] = I.material(name, colour, rough=rough, noise=noise, noise_scale=scale)
    return M[name]


def zigzag(name, light, dark, bands=3.0, teeth=7):
    """The trees' and bushes' pattern: darker zig-zag bands round them."""
    key = f"zz-{name}"
    if key in M:
        return M[key]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    nt, links = m.node_tree.nodes, m.node_tree.links
    bsdf = next(n for n in nt if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = 0.7
    coord = nt.new("ShaderNodeTexCoord")
    sep = nt.new("ShaderNodeSeparateXYZ")
    links.new(coord.outputs["Object"], sep.inputs[0])
    angle = nt.new("ShaderNodeMath")
    angle.operation = "ARCTAN2"
    links.new(sep.outputs["Y"], angle.inputs[0])
    links.new(sep.outputs["X"], angle.inputs[1])
    teeth_n = nt.new("ShaderNodeMath")
    teeth_n.operation = "MULTIPLY"
    teeth_n.inputs[1].default_value = teeth / math.tau
    links.new(angle.outputs[0], teeth_n.inputs[0])
    tri = nt.new("ShaderNodeMath")
    tri.operation = "PINGPONG"
    tri.inputs[1].default_value = 0.5
    links.new(teeth_n.outputs[0], tri.inputs[0])
    tri_s = nt.new("ShaderNodeMath")
    tri_s.operation = "MULTIPLY"
    tri_s.inputs[1].default_value = 0.35
    links.new(tri.outputs[0], tri_s.inputs[0])
    zk = nt.new("ShaderNodeMath")
    zk.operation = "MULTIPLY"
    zk.inputs[1].default_value = bands
    links.new(sep.outputs["Z"], zk.inputs[0])
    add = nt.new("ShaderNodeMath")
    add.operation = "ADD"
    links.new(zk.outputs[0], add.inputs[0])
    links.new(tri_s.outputs[0], add.inputs[1])
    fr = nt.new("ShaderNodeMath")
    fr.operation = "FRACT"
    links.new(add.outputs[0], fr.inputs[0])
    lt = nt.new("ShaderNodeMath")
    lt.operation = "LESS_THAN"
    lt.inputs[1].default_value = 0.16
    links.new(fr.outputs[0], lt.inputs[0])
    mix = nt.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = (*light, 1)
    mix.inputs[7].default_value = (*dark, 1)
    links.new(lt.outputs[0], mix.inputs[0])
    links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    M[key] = m
    return m


def into(col, objs):
    for o in objs:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        col.objects.link(o)


class Grab:
    """Collects the objects made inside a `with` block into a collection."""

    def __init__(self, col):
        self.col = col

    def __enter__(self):
        self.before = set(bpy.data.objects)

    def __exit__(self, *exc):
        # Things a nested block already put in a layer stay in that layer.
        layers = {c for c in bpy.data.collections if c.name in LAYERS}
        into(self.col, [o for o in bpy.data.objects if o not in self.before and not layers & set(o.users_collection)])


def flat(obj):
    for p in obj.data.polygons:
        p.use_smooth = False
    return obj


def blob(loc, r, m, scale=(1, 1, 1), segs=(14, 8)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs[0], ring_count=segs[1])
    o = bpy.context.active_object
    o.data.materials.append(m)
    o.scale = scale
    return flat(o)


def cyl(r, h, loc, m, v=10, r2=None):
    if r2 is None:
        o = W.cylinder(r, h, loc, m, vertices=v)
    else:
        o = W.cone(r, r2, h, loc, m, vertices=v)
    return flat(o)


def outline(rx, ry, seed, n=40, wobble=0.12):
    rnd = random.Random(seed)
    waves = [(rnd.uniform(0.3, 1.0) * wobble, k, rnd.uniform(0, math.tau)) for k in (2, 3, 5)]
    return [(math.cos(a) * rx * (1 + sum(w * math.sin(k * a + p) for w, k, p in waves)), math.sin(a) * ry * (1 + sum(w * math.sin(k * a + p) for w, k, p in waves))) for a in (i * math.tau / n for i in range(n))]


def slab(pts, cx, cy, z0, z1, m):
    mesh = bpy.data.meshes.new("Slab")
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((cx + x, cy + y, z0)) for x, y in pts])
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]:
        v.co.z = z1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new("Slab", mesh)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(m)
    return o


STRATA = [(0.86, 0.72, 0.48), (0.55, 0.32, 0.16), (0.78, 0.55, 0.3), (0.42, 0.24, 0.12)]


def terrace(cx, cy, rx, ry, top, depth, seed):
    """A chunky plateau: a grass top over bands of cream and earth."""
    pts = outline(rx, ry, seed)
    slab(pts, cx, cy, top - 0.22, top, mat("Grass", (0.2, 0.52, 0.08), rough=0.8, noise=0.15, scale=4))
    lip = [(x * 1.02, y * 1.02) for x, y in pts]
    slab(lip, cx, cy, top - 0.3, top - 0.18, mat("GrassLip", (0.14, 0.4, 0.05), rough=0.8))
    z = top - 0.3
    k = 0
    while z > top - depth:
        h = 0.28 + (k % 3) * 0.08
        s = 1.0 - 0.015 * k
        band = [(x * s, y * s) for x, y in pts]
        slab(band, cx, cy, max(z - h, top - depth), z, mat(f"Strata{k % 4}", STRATA[k % 4], rough=0.9))
        z -= h
        k += 1


def chunky_tree(x, y, z, s=1.0, light=(0.3, 0.62, 0.1), dark=(0.12, 0.38, 0.04), seed=0, crowns=None, trunk_col=None):
    """A tree with a stout trunk and a crown of stacked, flattened puffs."""
    rnd = random.Random(seed)
    with Grab(trunk_col or bpy.context.scene.collection):
        cyl(0.22 * s, 2.0 * s, (x, y, z + 1.0 * s), mat("Trunk", (0.42, 0.24, 0.1), rough=0.8), v=8, r2=0.14 * s)
    with Grab(crowns):
        zz = zigzag(f"tree{seed % 3}", light, dark, bands=2.2 / s)
        for k in range(3):
            r = (1.15 - k * 0.25) * s
            blob((x + rnd.uniform(-0.1, 0.1) * s, y, z + (2.1 + k * 0.62) * s), r, zz, (1.1, 1.0, 0.62), segs=(12, 7))


def bush(x, y, z, s=1.0, light=(0.55, 0.85, 0.15), dark=(0.3, 0.62, 0.06), seed=0):
    zz = zigzag(f"bush{seed % 2}", light, dark, bands=3.5 / s, teeth=6)
    blob((x, y, z + 0.4 * s), 0.6 * s, zz, (1.1, 1.0, 1.05), segs=(12, 8))


def toadstool(x, y, z, s=1.0, cap=(0.85, 0.08, 0.06)):
    cyl(0.12 * s, 0.6 * s, (x, y, z + 0.3 * s), mat("Stalk", (0.95, 0.9, 0.8), rough=0.6), v=10, r2=0.09 * s)
    c = blob((x, y, z + 0.62 * s), 0.42 * s, mat(f"Cap{cap}", cap, rough=0.45), (1, 1, 0.55), segs=(14, 7))
    rnd = random.Random(int(x * 10 + y))
    for _ in range(6):
        a = rnd.uniform(0, math.tau)
        blob((x + math.cos(a) * 0.26 * s, y + math.sin(a) * 0.26 * s, z + 0.76 * s), 0.06 * s, mat("Spot", (1, 0.97, 0.9), rough=0.5), (1, 1, 0.5), segs=(8, 4))
    return c


def fence(x0, y0, x1, y1, z):
    white = mat("Fence", (0.95, 0.93, 0.86), rough=0.6)
    n = int(math.hypot(x1 - x0, y1 - y0) / 0.3)
    ang = math.atan2(y1 - y0, x1 - x0)
    for i in range(n + 1):
        t = i / n
        p = I.box("Picket", (0.12, 0.05, 0.55), (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z + 0.27), white, bevel=0.01)
        I.tilt(p, (0, 0, ang))
    for h in (0.18, 0.4):
        r = I.box("Rail", (math.hypot(x1 - x0, y1 - y0), 0.04, 0.06), ((x0 + x1) / 2, (y0 + y1) / 2, z + h), white, bevel=0)
        I.tilt(r, (0, 0, ang))


def stump_house(x, y, z):
    """A cottage in a tree stump: a round door, a window and a red roof."""
    wood = mat("StumpWood", (0.5, 0.3, 0.14), rough=0.8, noise=0.25, scale=14)
    cyl(1.0, 1.7, (x, y, z + 0.85), wood, v=12, r2=0.85)
    cyl(0.92, 0.12, (x, y, z + 1.75), mat("StumpRing", (0.85, 0.66, 0.4), rough=0.7), v=12)
    roof = blob((x, y, z + 2.0), 1.15, mat("Roof", (0.8, 0.12, 0.1), rough=0.5), (1, 1, 0.55), segs=(14, 7))
    roof.location.z += 0.05
    door = cyl(0.42, 0.08, (x, y - 0.98, z + 0.55), mat("Door", (0.95, 0.95, 0.9), rough=0.5), v=16)
    door.rotation_euler = (math.radians(90), 0, 0)
    ring = cyl(0.28, 0.1, (x, y - 1.0, z + 0.55), mat("DoorRed", (0.8, 0.12, 0.1), rough=0.5), v=16)
    ring.rotation_euler = (math.radians(90), 0, 0)
    win = cyl(0.22, 0.08, (x + 0.55, y - 0.8, z + 1.25), W.glow_material("Window", (1, 0.85, 0.45), 1.2), v=12)
    win.rotation_euler = (math.radians(90), 0, math.radians(-30))
    cyl(0.1, 0.5, (x - 0.5, y + 0.2, z + 2.55), mat("Chimney", (0.55, 0.5, 0.48)), v=8)


def windmill(x, y, z, sails_col):
    """A wooden windmill; its sails, facing the camera, go in their own layer."""
    wood = mat("MillWood", (0.62, 0.42, 0.22), rough=0.8)
    for dx in (-0.45, 0.45):
        leg = I.box("MillLeg", (0.12, 0.12, 3.2), (x + dx * 0.6, y, z + 1.6), wood, bevel=0.01)
        I.tilt(leg, (0, math.radians(-dx * 14), 0))
    I.box("MillBox", (0.7, 0.6, 0.7), (x, y, z + 3.2), mat("MillBox", (0.75, 0.55, 0.3)), bevel=0.04)
    W.cone(0.55, 0.0, 0.5, (x, y, z + 3.8), mat("MillRoof", (0.6, 0.15, 0.1)), vertices=4)
    hub = Vector((x, y - 0.4, z + 3.25))
    with Grab(sails_col):
        cloth = mat("Sail", (0.95, 0.9, 0.78), rough=0.7)
        for k in range(4):
            a = k * math.pi / 2 + 0.3
            mid = hub + Vector((math.cos(a) * 1.0, -0.05, math.sin(a) * 1.0))
            arm = I.box("Arm", (2.1, 0.05, 0.08), tuple(mid), wood, bevel=0)
            I.tilt(arm, (0, -a, 0))
            sail = I.box("Sail", (1.4, 0.03, 0.42), tuple(hub + Vector((math.cos(a) * 1.25 + math.cos(a + 1.57) * 0.25, -0.06, math.sin(a) * 1.25 + math.sin(a + 1.57) * 0.25))), cloth, bevel=0)
            I.tilt(sail, (0, -a, 0))
        cyl(0.14, 0.2, tuple(hub + Vector((0, -0.1, 0))), mat("Hub", (0.35, 0.2, 0.1)), v=10).rotation_euler = (math.radians(90), 0, 0)
    return hub


def build():
    scene = W.reset()
    scene.render.resolution_x = W_PX
    scene.render.resolution_y = H_PX
    scene.render.film_transparent = True
    try:
        scene.eevee.use_gtao = True
    except AttributeError:
        pass
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    cols = {}
    for name in LAYERS:
        cols[name] = bpy.data.collections.new(name)
        scene.collection.children.link(cols[name])

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 26
    cam_data.clip_end = 200
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0, -16.5, 6.2)
    target = Vector((0, 4, 2.9))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    I.sun(scene)
    sun = bpy.data.objects["Sun"]
    sun.data.energy = 3.8
    sun.data.color = (1.0, 0.9, 0.72)
    sun.rotation_euler = (math.radians(50), math.radians(-25), math.radians(-30))
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (1.0, 0.88, 0.62, 1)
    bg.inputs[1].default_value = 0.35

    # --- the far scenery: a warm, misty sky, cliffs and the giant tree's trunk
    with Grab(cols["back"]):
        sky = I.box("Sky", (90, 0.2, 50), (0, 34, 14), W.glow_material("Sky", (1.0, 0.78, 0.42), 0.7), bevel=0)
        sky.visible_shadow = False
        I.box("Floor", (120, 120, 0.2), (0, 20, -1.6), mat("Floor", (0.1, 0.3, 0.05), rough=0.9), bevel=0)
        # a deep wall of forest behind the glade, with hazy gaps of golden light
        far = [zigzag("far0", (0.1, 0.3, 0.07), (0.05, 0.2, 0.04), bands=0.8), zigzag("far1", (0.14, 0.36, 0.08), (0.07, 0.24, 0.04), bands=0.8)]
        rnd = random.Random(31)
        for k in range(26):
            x = -22 + k * 1.75 + rnd.uniform(-0.5, 0.5)
            if abs(x - 1.0) < 2.2:
                continue
            blob((x, 24 + rnd.uniform(-1, 2), rnd.uniform(6, 13)), rnd.uniform(3.0, 4.5), far[k % 2], (1, 0.8, 1.15), segs=(12, 8))
        for side, (cx, rx) in ((-1, (-13, 6)), (1, (13, 6))):
            for k, (cy, top) in enumerate(((16, 9.5), (10, 6.0))):
                terrace(cx + side * k * 1.5, cy, rx, 3.5, top, top + 1.5, seed=10 + k + (side > 0) * 5)
        terrace(0, 18, 9, 3, 3.5, 5, seed=3)
        for x, y, z, s, sd in ((-6, 17, 3.5, 1.6, 1), (5, 17.5, 3.5, 1.8, 2), (-11, 16, 9.5, 1.5, 3), (12, 16, 9.5, 1.4, 4), (0, 19, 3.5, 1.4, 5)):
            chunky_tree(x, y, z, s, light=(0.36, 0.6, 0.22), dark=(0.2, 0.42, 0.12), seed=sd, crowns=cols["back"], trunk_col=cols["back"])
        cyl(1.5, 12, (1.5, 9.5, 6), mat("BigTrunk", (0.4, 0.22, 0.1), rough=0.85, noise=0.3, scale=6), v=12, r2=1.0)
        for a in (0.6, 2.4, 4.0, 5.4):
            root = cyl(0.5, 3.0, (1.5 + math.cos(a) * 1.6, 9.5 + math.sin(a) * 1.2, 0.9), mat("BigTrunk", (0.4, 0.22, 0.1)), v=8, r2=0.15)
            root.rotation_euler = (math.sin(a) * 0.9, -math.cos(a) * 0.9, 0)

    # --- the ground: terraces, the cottage, the windmill, the fence and the path
    with Grab(cols["mid"]):
        terrace(1.5, 8.0, 6.5, 2.6, 1.5, 4, seed=21)
        terrace(-6.0, 6.0, 4.2, 2.6, 1.0, 3.5, seed=22)
        terrace(7.5, 5.0, 4.0, 2.4, 0.9, 3.5, seed=23)
        terrace(0.0, 1.5, 9.5, 3.4, 0.0, 3, seed=24)
        stump_house(1.5, 7.0, 1.5)
        hub = windmill(-6.2, 6.4, 1.0, cols["sails"])
        stone = mat("PathStone", (0.86, 0.82, 0.72), rough=0.7)
        rnd = random.Random(4)
        for k in range(9):
            t = k / 8
            px, py = 1.5 + math.sin(t * 3) * 0.6 - t * 1.2, 5.6 - t * 6.4
            pz = 1.5 if py > 5.4 else 0.0
            cyl(rnd.uniform(0.28, 0.38), 0.06, (px, py, pz + 0.02), stone, v=9)
        fence(-6.5, 0.4, -2.0, -0.4, 0.0)
        fence(3.6, -0.6, 7.5, 0.6, 0.0)
        I.box("Mailbox", (0.3, 0.45, 0.3), (3.2, 4.4, 1.4), mat("Mail", (0.35, 0.38, 0.45), rough=0.4), bevel=0.06)
        I.box("MailPost", (0.08, 0.08, 1.0), (3.2, 4.4, 0.8), mat("Trunk", (0.42, 0.24, 0.1)), bevel=0)
        for x, y, z, s in ((8.5, 5.4, 0.9, 1.5), (-8.6, 6.8, 1.0, 1.1), (5.2, 7.6, 1.5, 0.8), (-3.4, 7.2, 1.0, 0.6)):
            toadstool(x, y, z, s)
        for x, y, z in ((-2.6, 2.5, 0.0), (2.4, 2.2, 0.0), (6.2, 3.6, 0.0), (-5.0, 3.4, 0.0), (4.0, 6.0, 1.5), (-1.5, 6.6, 1.5)):
            for k in range(3):
                toadstool(x + k * 0.25, y + (k % 2) * 0.2, z, 0.3 + k * 0.08, cap=(0.95, 0.93, 0.88))
        for x, y, z, s, sd in ((-3.2, 8.2, 1.5, 0.9, 1), (5.8, 8.4, 1.5, 1.0, 2), (9.6, 4.4, 0.9, 1.1, 1), (-8.0, 4.6, 1.0, 1.0, 2), (-1.0, 1.6, 0.0, 0.7, 1), (3.0, 0.6, 0.0, 0.8, 2)):
            bush(x, y, z, s, seed=sd)
    # The giant tree's canopy and the chunky trees' crowns sway: they go in
    # their own layer, with the fairy lights strung under the big canopy.
    bulbs = []
    with Grab(cols["crowns"]):
        big = zigzag("canopy", (0.12, 0.36, 0.06), (0.06, 0.22, 0.03), bands=1.4, teeth=9)
        for k, (dx, dz, r) in enumerate(((0, 0, 7.5), (-3.5, 0.8, 5.0), (4.0, 0.9, 5.2), (0, 1.8, 5.5))):
            blob((1.5 + dx, 9.0, 11.6 + dz), r, big, (1.15, 0.8, 0.32), segs=(18, 9))
        glow = W.glow_material("Bulb", (1.0, 0.6, 0.12), 1.6)
        wire = mat("Wire", (0.1, 0.12, 0.08))
        for strand, (x0, x1, y, z, sag) in enumerate(((-6.5, 9.5, 5.2, 10.4, 1.2), (-4.0, 7.5, 3.6, 10.0, 1.0), (-7.5, -1.0, 6.0, 10.0, 0.8))):
            n = 18
            prev = None
            for i in range(n + 1):
                t = i / n
                p = Vector((x0 + (x1 - x0) * t, y, z - sag * 4 * t * (1 - t)))
                bulb = blob(tuple(p + Vector((0, 0, -0.12))), 0.08, glow, (1, 1, 1.3), segs=(8, 5))
                bulb.visible_shadow = False
                bulbs.append(p + Vector((0, 0, -0.12)))
                if prev is not None:
                    seg = I.box("Wire", ((p - prev).length, 0.02, 0.02), tuple((p + prev) / 2), wire, bevel=0)
                    I.tilt(seg, (0, -math.atan2(p.z - prev.z, p.x - prev.x), 0))
                prev = p
    palettes = [((0.3, 0.62, 0.1), (0.12, 0.38, 0.04)), ((0.08, 0.36, 0.12), (0.03, 0.22, 0.06)), ((0.55, 0.8, 0.12), (0.3, 0.58, 0.05)), ((0.12, 0.45, 0.2), (0.05, 0.28, 0.1))]
    for x, y, z, s, sd in ((-9.5, 4.0, 1.0, 1.25, 1), (10.5, 3.2, 0.9, 1.3, 2), (-4.8, 9.6, 1.0, 1.1, 3), (7.6, 8.6, 1.5, 1.0, 4), (-12.0, 8.0, 1.0, 1.4, 5), (12.5, 7.5, 0.9, 1.5, 6)):
        light, dark = palettes[sd % 4]
        chunky_tree(x, y, z, s, light=light, dark=dark, seed=sd, crowns=cols["crowns"], trunk_col=cols["mid"])
    # big pink flowers and blue-green leaf fans round the cottage
    with Grab(cols["mid"]):
        for x, y, z, s in ((3.4, 7.8, 1.5, 1.0), (-0.6, 8.2, 1.5, 0.8), (6.6, 4.4, 0.9, 0.9), (-7.4, 5.2, 1.0, 0.8)):
            cyl(0.05 * s, 1.2 * s, (x, y, z + 0.6 * s), mat("FlowerStem", (0.1, 0.4, 0.08)), v=6)
            petal = mat("Petal", (0.95, 0.3, 0.55), rough=0.5)
            for k in range(6):
                a = k * math.tau / 6
                p = blob((x + math.cos(a) * 0.32 * s, y + math.sin(a) * 0.2 * s, z + 1.25 * s), 0.3 * s, petal, (1.0, 0.5, 0.25), segs=(8, 5))
                p.rotation_euler = (0.5 * math.sin(a), -0.5 * math.cos(a), a)
            blob((x, y, z + 1.32 * s), 0.14 * s, mat("FlowerHeart", (1.0, 0.8, 0.2)), segs=(8, 5))
        for x, y, z, s in ((-1.8, 7.4, 1.5, 1.0), (4.6, 6.6, 1.5, 0.9), (-9.0, 2.4, 1.0, 1.0), (9.6, 2.0, 0.9, 1.0)):
            leaf = mat("Fan", (0.1, 0.5, 0.55), rough=0.6)
            for k in range(7):
                a = -1.2 + k * 0.4
                f = blob((x + math.sin(a) * 0.5 * s, y, z + 0.45 * s + math.cos(a) * 0.35 * s), 0.38 * s, leaf, (0.45, 0.12, 1.0), segs=(8, 5))
                f.rotation_euler = (0, a, 0)

    # --- the foreground: big zig-zag bushes and toadstools framing the bottom corners
    with Grab(cols["front"]):
        for x, y, s, sd in ((-8.0, -5.0, 2.0, 1), (-5.6, -6.2, 1.3, 2), (8.4, -5.2, 2.2, 1), (6.0, -6.4, 1.2, 2)):
            bush(x, y, -1.2, s, seed=sd)
        toadstool(-6.9, -6.0, -0.6, 1.0)
        toadstool(7.1, -6.3, -0.6, 0.8, cap=(0.95, 0.6, 0.1))
        for x in (-9.8, 9.8):
            leaf = blob((x, -4.0, 2.5), 1.2, mat("FrontLeaf", (0.08, 0.32, 0.05), rough=0.6), (0.25, 0.6, 2.2), segs=(8, 6))
            leaf.rotation_euler = (0, math.copysign(0.5, -x), 0)

    # Where the sails' hub and some of the fairy lights land on the picture.
    def px(v):
        p = world_to_camera_view(scene, cam, v)
        return [round(p.x * 100, 2), round((1 - p.y) * 100, 2)]

    with open(os.path.join(I.OUT, "forest.json"), "w") as f:
        json.dump({"w": W_PX, "h": H_PX, "hub": px(hub), "bulbs": [px(b) for b in bulbs[::2]]}, f, indent=1)

    # One render per layer, stacked in the app in the order of LAYERS (sails
    # above the ground, below the treetops). Layers drawn below this one are
    # hold-outs, so it has holes only where one of them is nearer the camera;
    # layers drawn above are left out, since they're painted over it anyway.
    # So nothing has a hole that shows when the layers drift apart.
    view = bpy.context.view_layer
    order = ["back", "mid", "sails", "crowns", "front"]
    for name in LAYERS:
        for other in LAYERS:
            lc = view.layer_collection.children[other]
            below = order.index(other) < order.index(name)
            lc.exclude = other != name and not below
            lc.holdout = below
        scene.render.film_transparent = name != "back"
        I.render(f"forest-{name}")


if __name__ == "__main__":
    build()
