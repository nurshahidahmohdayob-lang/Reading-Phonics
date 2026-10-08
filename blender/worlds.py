"""
The five island worlds: blocks in each world's colours, the rocky underside a
floating island hangs from, each world's landmark building, and the little
floating islands drawn on the world map. Uses the helpers in island.py.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/worlds.py

`npm run island:art` renders this and island.py, then packs everything into
src/island/art.ts.
"""

import json
import math
import os
import random
import sys

import bpy
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import island as I  # noqa: E402

OUT = I.OUT

# Linear-space colours for each world. `top` and `top2` alternate on the
# grass, `rim` is the edge of the island, `side` the soil under the grass,
# `rock` the cliff the island hangs from, `tree` its trees.
WORLDS = {
    "tropical": dict(
        top=(0.16, 0.62, 0.08), top2=(0.12, 0.52, 0.06), rim=(0.96, 0.66, 0.25), side=(0.42, 0.2, 0.07),
        rock=(0.36, 0.22, 0.12), tree=(0.1, 0.5, 0.05), tuft=(0.2, 0.75, 0.1),
    ),
    "blossom": dict(
        top=(0.55, 0.34, 0.86), top2=(0.47, 0.27, 0.78), rim=(1.0, 0.7, 0.84), side=(0.3, 0.16, 0.4),
        rock=(0.28, 0.17, 0.38), tree=(1.0, 0.45, 0.7), tuft=(0.95, 0.6, 1.0),
    ),
    "jade": dict(
        top=(0.04, 0.56, 0.38), top2=(0.02, 0.46, 0.31), rim=(0.5, 0.6, 0.64), side=(0.16, 0.22, 0.26),
        rock=(0.17, 0.23, 0.29), tree=(0.02, 0.3, 0.16), tuft=(0.15, 0.8, 0.55),
    ),
    "sunset": dict(
        top=(1.0, 0.48, 0.4), top2=(0.94, 0.4, 0.34), rim=(1.0, 0.84, 0.55), side=(0.5, 0.2, 0.17),
        rock=(0.48, 0.2, 0.2), tree=(1.0, 0.35, 0.08), tuft=(1.0, 0.75, 0.4),
    ),
    "moon": dict(
        top=(0.07, 0.17, 0.22), top2=(0.05, 0.13, 0.18), rim=(0.24, 0.24, 0.34), side=(0.07, 0.07, 0.11),
        rock=(0.08, 0.08, 0.13), tree=(0.06, 0.25, 0.3), tuft=(0.2, 1.0, 0.9), glow=True,
    ),
}

GOLD = (1.0, 0.62, 0.15)

# Each world's build spots: a pedestal of its own stone, holding a flame of its
# own colour while nothing stands on it. `sides` is the pedestal's shape.
PEDESTALS = {
    "tropical": dict(stone=(0.78, 0.66, 0.48), trim=GOLD, flame=(1.0, 0.62, 0.12), sides=6),
    "blossom": dict(stone=(0.96, 0.74, 0.88), trim=(1.0, 0.85, 0.95), flame=(1.0, 0.35, 0.85), sides=6),
    "jade": dict(stone=(0.18, 0.62, 0.46), trim=GOLD, flame=(0.4, 1.0, 0.55), sides=8),
    "sunset": dict(stone=(0.82, 0.38, 0.24), trim=(1.0, 0.8, 0.45), flame=(1.0, 0.45, 0.08), sides=4),
    "moon": dict(stone=(0.16, 0.16, 0.3), trim=(0.55, 0.6, 1.0), flame=(0.3, 1.0, 0.95), sides=6),
}
# The bands of soil and rock down the side of an island, top to bottom.
STRATA = {
    "tropical": [(0.55, 0.3, 0.12), (0.42, 0.22, 0.09), (0.62, 0.42, 0.25)],
    "blossom": [(0.42, 0.24, 0.5), (0.32, 0.17, 0.4), (0.55, 0.36, 0.6)],
    "jade": [(0.3, 0.33, 0.36), (0.2, 0.24, 0.28), (0.4, 0.44, 0.46)],
    "sunset": [(0.72, 0.36, 0.22), (0.58, 0.25, 0.16), (0.85, 0.55, 0.32)],
    "moon": [(0.12, 0.12, 0.2), (0.08, 0.08, 0.14), (0.2, 0.2, 0.32)],
}


def reset():
    """island.py's scene, with less ambient light: the worlds want saturated
    colour, and a bright sky washes it out to pastel."""
    scene = I.reset()
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[1].default_value = 0.45
    return scene


def glow_material(name, colour, strength=4.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*colour, 1)
    bsdf.inputs["Emission Color"].default_value = (*colour, 1)
    bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def metal(name, colour):
    mat = I.material(name, colour, rough=0.3)
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Metallic"].default_value = 1.0
    return mat


def cone(radius1, radius2, depth, location, mat, vertices=24, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=location, rotation=rotation
    )
    obj = bpy.context.active_object
    obj.data.materials.append(mat)
    return obj


def cylinder(radius, depth, location, mat, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.active_object
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


# --- Blocks ---------------------------------------------------------------------------


def block(name, w, top, seed, rim=False):
    scene = reset()
    I.camera(scene)
    I.sun(scene)
    rnd = random.Random(seed)
    side = I.material("Side", w["side"], noise=0.25, noise_scale=8)
    cap = I.material("Cap", top, rough=0.9, noise=0.15 if not rim else 0.08, noise_scale=10 if not rim else 30)
    I.box("Body", (1.0, 1.0, I.HEIGHT - 0.1), (0, 0, -(I.HEIGHT + 0.1) / 2), side)
    I.box("Cap", (1.0, 1.0, 0.16), (0, 0, -0.08), cap, bevel=0.06)
    if not rim:
        tuft = glow_material("Tuft", w["tuft"], 3) if w.get("glow") else I.material("Tuft", w["tuft"], rough=0.9)
        for _ in range(rnd.randint(2, 4)):
            x, y = rnd.uniform(-0.36, 0.36), rnd.uniform(-0.36, 0.36)
            if w.get("glow"):
                # Glowing mushrooms on the moon island.
                cylinder(0.012, 0.06, (x, y, 0.03), I.material("Stalk", (0.8, 0.8, 0.85)))
                cap_m = I.blob((x, y, 0.065), 0.035, tuft)
                cap_m.scale = (1, 1, 0.6)
                continue
            for k in range(3):
                bpy.ops.mesh.primitive_cone_add(radius1=0.03, depth=0.12 + rnd.uniform(0, 0.05), location=(x + k * 0.03 - 0.03, y, 0.06))
                blade = bpy.context.active_object
                blade.rotation_euler = (rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), 0)
                blade.data.materials.append(tuft)
    else:
        # Stepping stones on the edge, so the rim reads as a path.
        stone = I.material("Stone", tuple(c * 0.85 for c in top), rough=0.7)
        for _ in range(rnd.randint(1, 2)):
            s = I.blob((rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), 0.0), 0.08, stone)
            s.scale = (1.3, 1, 0.35)
    I.render(name)


# --- The rock a floating island hangs from --------------------------------------------

UNDER_W, UNDER_H, UNDER_ORTHO, UNDER_TARGET_Z = 512, 640, 3.0, -0.9


def rock_cone(w, seed, scale=1.0, z=0.0, cap=0.3):
    """A ragged upside-down cone of rock with its flat top at height z."""
    rnd = random.Random(seed)
    rock = I.material("Rock", w["rock"], rough=0.85, noise=0.35, noise_scale=6)
    body = cone(0.04 * scale, 1.0 * scale, 1.8 * scale, (0, 0, z - 0.9 * scale), rock, vertices=40)
    sub = body.modifiers.new("Sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 4
    tex = bpy.data.textures.new(f"RockNoise{seed}", "CLOUDS")
    tex.noise_scale = 0.35
    disp = body.modifiers.new("Disp", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.22 * scale
    disp.mid_level = 0.5
    # Lumps of rock bulging out of the sides, and a strip of soil on top.
    for _ in range(9):
        a = rnd.uniform(0, math.tau)
        d = rnd.uniform(0.2, 1.1)
        r = (1.0 - d / 1.8) * scale * 0.95
        lump = I.blob((math.cos(a) * r, math.sin(a) * r, z - d * scale), rnd.uniform(0.12, 0.22) * scale, rock)
        lump.scale = (1, 1, 1.3)
    # A clean cap of soil over the top, which the displaced rock would make ragged.
    soil = I.material("Soil", w["side"], rough=0.9, noise=0.2, noise_scale=10)
    top = cylinder(1.06 * scale, cap * scale, (0, 0, z - cap / 3 * scale), soil, vertices=48)
    bev = top.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.05 * scale
    bev.segments = 3
    return body


def underbelly(name, w, seed):
    scene = reset()
    scene.render.resolution_x = UNDER_W
    scene.render.resolution_y = UNDER_H
    I.camera(scene, ortho=UNDER_ORTHO, target=(0, 0, UNDER_TARGET_Z))
    I.sun(scene)
    rock_cone(w, seed)
    # A few pebbles floating underneath.
    rock = I.material("Rock2", w["rock"], rough=0.85)
    rnd = random.Random(seed + 1)
    for _ in range(3):
        I.blob((rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), rnd.uniform(-2.2, -1.8)), rnd.uniform(0.06, 0.12), rock)
    I.render(name)


# --- Landmarks ------------------------------------------------------------------------


def roof(size, z, mat, trim=None):
    """A pagoda roof: a wide flat pyramid with a gold edge."""
    r = cone(size * 0.78, size * 0.22, size * 0.32, (0, 0, z), mat, vertices=4, rotation=(0, 0, math.radians(45)))
    if trim:
        edge = cone(size * 0.8, size * 0.78, 0.03, (0, 0, z - size * 0.16), trim, vertices=4, rotation=(0, 0, math.radians(45)))
    return r


def door(size, z, h):
    dark = I.material("Door", (0.08, 0.03, 0.02), rough=0.6)
    I.box("Door", (size * 0.3, 0.02, h), (0.0, -size / 2 - 0.005, z), dark, bevel=0)
    I.box("Door2", (0.02, size * 0.3, h), (size / 2 + 0.005, 0.0, z), dark, bevel=0)


def pagoda(tiers, wall, roof_c, base_c, trim=GOLD, width=0.62, glow_windows=None):
    stone = I.material("Base", base_c, rough=0.8)
    I.box("Base", (0.92, 0.92, 0.12), (0, 0, 0.06), stone, bevel=0.03)
    I.box("Step", (0.3, 0.12, 0.06), (0, -0.5, 0.03), stone, bevel=0.01)
    walls = I.material("Wall", wall, rough=0.6)
    roofs = I.material("Roof", roof_c, rough=0.4)
    gold = metal("Trim", trim)
    z = 0.12
    s = width
    for t in range(tiers):
        h = 0.3 if t == 0 else 0.22
        I.box(f"Wall{t}", (s, s, h), (0, 0, z + h / 2), walls, bevel=0.015)
        if t == 0:
            door(s, z + 0.11, 0.2)
        if glow_windows:
            win = glow_material("Win", glow_windows, 3)
            I.box("WinA", (s * 0.5, 0.01, 0.06), (0, -s / 2 - 0.006, z + h * 0.72), win, bevel=0)
        z += h
        roof(s + 0.34, z + (s + 0.34) * 0.16 - 0.02, roofs, gold)
        z += (s + 0.34) * 0.2
        s *= 0.74
    cylinder(0.025, 0.25, (0, 0, z + 0.1), gold, vertices=12)
    I.blob((0, 0, z + 0.25), 0.05, gold)


def blossom_tree(x, y, scale, leaf):
    bark = I.material("Bark", (0.25, 0.12, 0.08), rough=0.9)
    trunk = cylinder(0.04 * scale, 0.45 * scale, (x, y, 0.22 * scale + 0.12), bark, vertices=10)
    pink = I.material("Blossom", leaf, rough=0.7, noise=0.15, noise_scale=20)
    rnd = random.Random(int(x * 100 + y * 10))
    for _ in range(6):
        I.blob((x + rnd.uniform(-0.12, 0.12) * scale, y + rnd.uniform(-0.12, 0.12) * scale, (0.5 + rnd.uniform(0, 0.14)) * scale + 0.12), rnd.uniform(0.1, 0.15) * scale, pink)


def lighthouse():
    stone = I.material("Rocks", (0.45, 0.42, 0.4), rough=0.9)
    for a in range(5):
        I.blob((math.cos(a * 1.3) * 0.32, math.sin(a * 1.3) * 0.32, 0.05), 0.13, stone)
    I.box("Base", (0.7, 0.7, 0.1), (0, 0, 0.05), stone, bevel=0.03)
    red = I.material("Red", (0.9, 0.05, 0.04), rough=0.4)
    white = I.material("White", (0.95, 0.95, 0.92), rough=0.4)
    for i in range(5):
        r1 = 0.24 - i * 0.025
        cone(r1, r1 - 0.025, 0.22, (0, 0, 0.21 + i * 0.22), red if i % 2 == 0 else white, vertices=32)
    glass = glow_material("Lamp", (1.0, 0.85, 0.3), 6)
    cylinder(0.13, 0.16, (0, 0, 1.28), glass, vertices=16)
    I.box("Rail", (0.36, 0.36, 0.03), (0, 0, 1.19), I.material("Dark", (0.05, 0.05, 0.06)), bevel=0.01)
    cone(0.17, 0.02, 0.2, (0, 0, 1.46), red, vertices=16)
    I.blob((0, 0, 1.57), 0.03, metal("Ball", GOLD))
    # A palm beside it.
    trunk = I.material("Palm", (0.45, 0.28, 0.12), rough=0.9)
    cylinder(0.03, 0.5, (0.32, -0.28, 0.35), trunk, vertices=8)
    leaf = I.material("Leaf", (0.1, 0.55, 0.06), rough=0.7)
    for k in range(6):
        a = k * math.tau / 6
        l = I.box("Frond", (0.32, 0.07, 0.015), (0.32 + math.cos(a) * 0.14, -0.28 + math.sin(a) * 0.14, 0.6), leaf, bevel=0)
        I.tilt(l, (0, math.radians(18), a))


def gate(colour, x, y):
    post = I.material("Gate", colour, rough=0.5)
    for dx in (-0.16, 0.16):
        I.box("Post", (0.04, 0.04, 0.42), (x + dx, y, 0.33), post, bevel=0.005)
    I.box("Beam", (0.46, 0.05, 0.04), (x, y, 0.55), post, bevel=0.005)
    I.box("Beam2", (0.38, 0.04, 0.03), (x, y, 0.47), post, bevel=0.005)


def lantern(x, y, colour=(1.0, 0.3, 0.1)):
    post = I.material("Post", (0.15, 0.12, 0.1))
    cylinder(0.015, 0.2, (x, y, 0.22), post, vertices=8)
    light = glow_material("Lantern", colour, 6)
    l = I.blob((x, y, 0.36), 0.045, light)
    l.scale = (1, 1, 1.3)


def landmark(world):
    if world == "tropical":
        lighthouse()
    elif world == "blossom":
        pagoda(3, (1.0, 0.75, 0.85), (0.35, 0.12, 0.6), (0.85, 0.75, 0.9))
        blossom_tree(0.36, -0.3, 0.9, (1.0, 0.5, 0.75))
    elif world == "jade":
        pagoda(2, (0.95, 0.9, 0.75), (0.0, 0.42, 0.38), (0.55, 0.6, 0.62), width=0.7)
        lantern(-0.36, -0.38, (1.0, 0.8, 0.3))
        lantern(0.38, 0.36, (1.0, 0.8, 0.3))
    elif world == "sunset":
        pagoda(2, (1.0, 0.92, 0.75), (0.75, 0.04, 0.03), (0.95, 0.75, 0.5), width=0.78)
        gate((0.85, 0.08, 0.04), 0.0, -0.62)
    elif world == "moon":
        pagoda(3, (0.18, 0.14, 0.22), (0.1, 0.06, 0.16), (0.2, 0.2, 0.26), glow_windows=(1.0, 0.75, 0.3))
        lantern(-0.38, -0.36)
        lantern(0.38, -0.36)
        moon = glow_material("Moon", (1.0, 0.95, 0.7), 3)
        I.blob((0.0, 0.0, 1.85), 0.0001, moon)


def landmark_render(name, world):
    scene = reset()
    scene.render.resolution_x = 384
    scene.render.resolution_y = 384
    I.camera(scene, ortho=2.2, target=(0, 0, 0.75))
    I.sun(scene)
    landmark(world)
    I.render(name)


# --- World-map islands ----------------------------------------------------------------


def tree(x, y, w, kind, scale=1.0):
    bark = I.material("Bark", (0.25, 0.13, 0.07), rough=0.9)
    leaf = glow_material("Leaf", w["tree"], 0.6) if w.get("glow") else I.material("Leaf", w["tree"], rough=0.7, noise=0.15, noise_scale=12)
    if kind == "pine":
        cylinder(0.035 * scale, 0.2 * scale, (x, y, 0.1 * scale), bark, vertices=8)
        for k in range(3):
            cone((0.2 - k * 0.05) * scale, 0.0, 0.22 * scale, (x, y, (0.25 + k * 0.13) * scale), leaf, vertices=12)
    else:
        cylinder(0.035 * scale, 0.3 * scale, (x, y, 0.15 * scale), bark, vertices=8)
        rnd = random.Random(int(x * 1000 + y * 100))
        for _ in range(4):
            I.blob((x + rnd.uniform(-0.08, 0.08) * scale, y + rnd.uniform(-0.08, 0.08) * scale, (0.36 + rnd.uniform(0, 0.1)) * scale), rnd.uniform(0.1, 0.15) * scale, leaf)


def waterfall(x, y, top, length):
    water = glow_material("Water", (0.35, 0.8, 1.0), 1.2)
    fall = I.box("Fall", (0.16, 0.02, length), (x, y, top - length / 2), water, bevel=0)
    foam = I.material("Foam", (1, 1, 1), rough=0.3)
    for k in range(4):
        I.blob((x + (k - 1.5) * 0.05, y, top - length), 0.05, foam)
    return fall



# --- Diorama ground, pedestals and edge scenery ---------------------------------------

GROUND_DEPTH = 0.55


def ground(name, world, top, seed):
    """A seamless square of island: a grass (or path) top over bands of soil and
    rock, so neighbouring squares read as one thick slab."""
    scene = reset()
    I.camera(scene)
    I.sun(scene)
    cap = I.material("Top", top, rough=0.9, noise=0.12, noise_scale=7)
    I.box("Top", (1.0, 1.0, 0.1), (0, 0, -0.05), cap, bevel=0)
    bands = STRATA[world]
    z = -0.1
    for i, (h, col) in enumerate(zip((0.14, 0.17, GROUND_DEPTH - 0.41), bands)):
        I.box(f"Band{i}", (1.0, 1.0, h), (0, 0, z - h / 2), I.material(f"B{i}", col, rough=0.9, noise=0.25, noise_scale=9), bevel=0)
        z -= h
    I.render(name)


def pedestal(name, world, lit):
    p = PEDESTALS[world]
    scene = reset()
    I.camera(scene)
    I.sun(scene)
    rot = (0, 0, math.radians(45 if p["sides"] == 4 else 0))
    stone = I.material("Stone", p["stone"], rough=0.5, noise=0.12, noise_scale=14)
    trim = metal("Trim", p["trim"])
    base = cone(0.47, 0.45, 0.08, (0, 0, 0.04), stone, vertices=p["sides"], rotation=rot)
    body = cone(0.41, 0.38, 0.16, (0, 0, 0.16), stone, vertices=p["sides"], rotation=rot)
    cone(0.395, 0.395, 0.018, (0, 0, 0.245), trim, vertices=p["sides"], rotation=rot)
    for obj in (base, body):
        bev = obj.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.015
        bev.segments = 2
    # The bowl on top, and its flame while the spot is empty.
    dark = I.material("Bowl", tuple(c * 0.45 for c in p["stone"]), rough=0.6)
    cone(0.24, 0.24, 0.01, (0, 0, 0.255), dark, vertices=p["sides"], rotation=rot)
    if lit:
        ember = glow_material("Ember", p["flame"], 1.4)
        core = glow_material("Core", tuple(min(1, c + 0.35) for c in p["flame"]), 1.8)
        cone(0.075, 0.0, 0.26, (0, 0, 0.38), ember, vertices=12)
        cone(0.04, 0.0, 0.14, (0, 0, 0.32), core, vertices=12)
        I.blob((0, 0, 0.27), 0.06, ember)
    I.render(name)


def palm(x, y, scale=1.0):
    trunk = I.material("Palm", (0.45, 0.28, 0.12), rough=0.9)
    t = cylinder(0.035 * scale, 0.6 * scale, (x, y, 0.3 * scale), trunk, vertices=8)
    I.tilt(t, (math.radians(6), 0, 0))
    leaf = I.material("Frond", (0.04, 0.34, 0.0), rough=0.7)
    for k in range(7):
        a = k * math.tau / 7
        l = I.box("Frond", (0.36 * scale, 0.08 * scale, 0.015), (x + math.cos(a) * 0.16 * scale, y + math.sin(a) * 0.16 * scale, 0.6 * scale), leaf, bevel=0)
        I.tilt(l, (0, math.radians(22), a))


def rock(x, y, colour, scale=1.0):
    mat = I.material("Rock", colour, rough=0.85, noise=0.2, noise_scale=10)
    r = I.blob((x, y, 0.1 * scale), 0.2 * scale, mat)
    r.scale = (1.2, 1.0, 0.75)
    I.blob((x + 0.16 * scale, y - 0.1 * scale, 0.06 * scale), 0.11 * scale, mat)


def stone_lantern(x, y, colour, light):
    mat = I.material("Lantern", colour, rough=0.7)
    I.box("L0", (0.18, 0.18, 0.05), (x, y, 0.03), mat, bevel=0.01)
    cylinder(0.04, 0.22, (x, y, 0.16), mat, vertices=8)
    I.box("L1", (0.16, 0.16, 0.1), (x, y, 0.32), glow_material("LLight", light, 1.2), bevel=0.01)
    cone(0.16, 0.02, 0.1, (x, y, 0.42), mat, vertices=4, rotation=(0, 0, math.radians(45)))


def torii(x, y, colour):
    post = I.material("Torii", colour, rough=0.5)
    for dx in (-0.16, 0.16):
        I.box("Post", (0.05, 0.05, 0.5), (x + dx, y, 0.25), post, bevel=0.005)
    I.box("Beam", (0.5, 0.06, 0.05), (x, y, 0.52), post, bevel=0.005)
    I.box("Beam2", (0.42, 0.04, 0.035), (x, y, 0.43), post, bevel=0.005)


def mushrooms(x, y, glow):
    stalk = I.material("Stalk", (0.85, 0.85, 0.9))
    cap = glow_material("Cap", glow, 1.2)
    for (dx, dy, s) in ((0, 0, 1.0), (0.12, -0.08, 0.7), (-0.1, 0.06, 0.6)):
        cylinder(0.025 * s, 0.16 * s, (x + dx, y + dy, 0.08 * s), stalk, vertices=8)
        c = I.blob((x + dx, y + dy, 0.17 * s), 0.08 * s, cap)
        c.scale = (1, 1, 0.55)


def crystal(x, y, colour):
    mat = glow_material("Crystal", colour, 0.8)
    for (dx, dy, h, tilt_x) in ((0, 0, 0.5, 0), (0.1, -0.06, 0.3, 0.3), (-0.09, 0.05, 0.28, -0.3)):
        c = cone(0.07, 0.0, h, (x + dx, y + dy, h / 2), mat, vertices=6)
        I.tilt(c, (tilt_x, tilt_x * 0.5, 0))


def scenery(world, k):
    """The kth piece of edge scenery for a world, centred on its tile."""
    w = WORLDS[world]
    if world == "tropical":
        [lambda: palm(0, 0, 1.0), lambda: tree(0, 0, w, "round", 1.3), lambda: rock(0, 0, (0.55, 0.5, 0.45))][k]()
    elif world == "blossom":
        [lambda: blossom_tree(0, 0, 1.25, (1.0, 0.5, 0.78)), lambda: tree(0, 0, dict(w, tree=(0.95, 0.55, 0.85)), "round", 1.1),
         lambda: stone_lantern(0, 0, (0.92, 0.85, 0.9), (1.0, 0.75, 0.9))][k]()
    elif world == "jade":
        [lambda: tree(0, 0, w, "pine", 1.5), lambda: stone_lantern(0, 0, (0.6, 0.62, 0.6), (1.0, 0.85, 0.4)),
         lambda: rock(0, 0, (0.4, 0.45, 0.48))][k]()
    elif world == "sunset":
        [lambda: tree(0, 0, w, "round", 1.3), lambda: torii(0, 0, (0.85, 0.08, 0.04)), lambda: rock(0, 0, (0.7, 0.42, 0.3))][k]()
    else:
        [lambda: tree(0, 0, w, "pine", 1.5), lambda: mushrooms(0, 0, (0.3, 1.0, 0.95)), lambda: crystal(0, 0, (0.55, 0.5, 1.0))][k]()


SCENERY_H = 384  # taller than a block, so a tree is not cut off; same scale


def scenery_render(name, world, k):
    scene = reset()
    scene.render.resolution_y = SCENERY_H
    # Same pixels per unit as a block (ortho follows the taller side), and the
    # tile's middle still in the middle of the picture.
    I.camera(scene, ortho=I.ORTHO * SCENERY_H / I.SIZE)
    I.sun(scene)
    scenery(world, k)
    I.render(name)


def map_island(name, world, seed):
    """A world as a chunky diorama for the world map: a thick rounded slab with
    bands of soil, its landmark, scenery and pedestals on top, and a waterfall."""
    w = WORLDS[world]
    scene = reset()
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    I.camera(scene, ortho=3.4, target=(0, 0, -0.35))
    I.sun(scene)
    bands = STRATA[world]
    z = -0.1
    for i, (h, col) in enumerate(zip((0.18, 0.22, 0.3), bands)):
        slab = I.box(f"Slab{i}", (2.1 - i * 0.08, 2.1 - i * 0.08, h), (0, 0, z - h / 2), I.material(f"S{i}", col, rough=0.9, noise=0.25, noise_scale=6), bevel=0.12)
        z -= h
    rock_cone(dict(w, rock=bands[1]), seed, scale=0.8, z=z + 0.05, cap=0.02)
    top = I.box("Top", (2.12, 2.12, 0.12), (0, 0, -0.04), I.material("Top", w["top"], rough=0.9, noise=0.12, noise_scale=8), bevel=0.1)
    path = I.material("Path", w["rim"], rough=0.85)
    I.box("Path", (0.32, 1.9, 0.02), (0.15, -0.05, 0.03), path, bevel=0.02)
    bpy.ops.object.select_all(action="DESELECT")
    before = set(bpy.data.objects)
    landmark(world)
    for obj in set(bpy.data.objects) - before:
        obj.location = obj.location * 0.85 + Vector((0.2, 0.35, 0.02))
        obj.scale = obj.scale * 0.85
    for i, (x, y) in enumerate(((-0.75, 0.6), (-0.8, -0.1), (0.8, -0.55), (-0.45, 0.85), (0.85, 0.75))):
        before = set(bpy.data.objects)
        scenery(world, i % 3)
        for obj in set(bpy.data.objects) - before:
            obj.location = obj.location * 0.8 + Vector((x, y, 0.02))
            obj.scale = obj.scale * 0.8
    # A few lit pedestals on the lawn.
    p = PEDESTALS[world]
    stone = I.material("PStone", p["stone"], rough=0.5)
    flame = glow_material("PFlame", p["flame"], 1.4)
    for (x, y) in ((-0.3, -0.55), (0.45, -0.75), (-0.2, 0.1)):
        cone(0.14, 0.12, 0.1, (x, y, 0.06), stone, vertices=p["sides"])
        cone(0.04, 0.0, 0.12, (x, y, 0.17), flame, vertices=10)
    waterfall(0.55, -1.08, 0.0, 1.5)
    I.render(name)


# --- Sky props: hot-air balloons for Sunset, sky lanterns for Moonlight -------------


def striped(name, a, b, gores=8):
    """A material in vertical stripes round an object, like a balloon's gores."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = 0.45
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ang = nt.nodes.new("ShaderNodeMath")
    ang.operation = "ARCTAN2"
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = gores / math.pi
    mod = nt.nodes.new("ShaderNodeMath")
    mod.operation = "FLOORED_MODULO"
    mod.inputs[1].default_value = 2.0
    step = nt.nodes.new("ShaderNodeMath")
    step.operation = "GREATER_THAN"
    step.inputs[1].default_value = 1.0
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = (*a, 1)
    mix.inputs["B"].default_value = (*b, 1)
    l = nt.links
    l.new(coord.outputs["Object"], sep.inputs[0])
    l.new(sep.outputs["Y"], ang.inputs[0])
    l.new(sep.outputs["X"], ang.inputs[1])
    l.new(ang.outputs[0], mul.inputs[0])
    l.new(mul.outputs[0], mod.inputs[0])
    l.new(mod.outputs[0], step.inputs[0])
    l.new(step.outputs[0], mix.inputs["Factor"])
    l.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    return mat


def balloon(name, a, b):
    scene = reset()
    I.camera(scene, ortho=2.6, target=(0, 0, 0.9))
    I.sun(scene)
    skin = striped("Skin", a, b)
    env = I.blob((0, 0, 1.25), 0.62, skin)
    env.scale = (1, 1, 1.12)
    cone(0.18, 0.5, 0.42, (0, 0, 0.62), skin, vertices=32)
    rope = I.material("Rope", (0.25, 0.18, 0.1))
    for dx, dy in ((-0.12, -0.12), (0.12, -0.12), (-0.12, 0.12), (0.12, 0.12)):
        r = I.box("Rope", (0.012, 0.012, 0.32), (dx, dy, 0.28), rope, bevel=0)
    basket = I.material("Basket", (0.45, 0.25, 0.08), rough=0.9, noise=0.3, noise_scale=40)
    I.box("Basket", (0.3, 0.3, 0.2), (0, 0, 0.06), basket, bevel=0.02)
    flame = glow_material("Flame", (1.0, 0.6, 0.1), 8)
    I.blob((0, 0, 0.4), 0.05, flame)
    I.render(name)


def sky_lantern(name):
    scene = reset()
    scene.render.resolution_x = 160
    scene.render.resolution_y = 200
    I.camera(scene, ortho=1.3, target=(0, 0, 0.35))
    I.sun(scene)
    paper = glow_material("Paper", (1.0, 0.32, 0.06), 1.1)
    body = cone(0.2, 0.28, 0.55, (0, 0, 0.35), paper, vertices=4, rotation=(0, 0, math.radians(45)))
    cap = I.material("Top", (0.55, 0.12, 0.04), rough=0.6)
    cone(0.29, 0.29, 0.03, (0, 0, 0.64), cap, vertices=4, rotation=(0, 0, math.radians(45)))
    core = glow_material("Core", (1.0, 0.85, 0.4), 6)
    I.blob((0, 0, 0.12), 0.05, core)
    I.render(name)


if __name__ == "__main__":
    for i, (world, w) in enumerate(WORLDS.items()):
        ground(f"{world}-ground", world, w["top"], 10 + i * 7)
        ground(f"{world}-ground-rim", world, w["rim"], 11 + i * 7)
        pedestal(f"{world}-pedestal", world, lit=False)
        pedestal(f"{world}-pedestal-lit", world, lit=True)
        for k in range(3):
            scenery_render(f"{world}-scenery-{k}", world, k)
        underbelly(f"{world}-under", w, 13 + i * 7)
        landmark_render(f"{world}-landmark", world)
        map_island(f"{world}-map", world, 14 + i * 7)

    balloon("balloon-a", (0.95, 0.08, 0.06), (1.0, 0.75, 0.05))
    balloon("balloon-b", (0.1, 0.35, 0.95), (1.0, 1.0, 1.0))
    sky_lantern("sky-lantern")

    # Where a floating island's top sits in its underbelly image.
    px = UNDER_H / UNDER_ORTHO
    top_y = UNDER_H / 2 - (0 - UNDER_TARGET_Z) * math.sin(math.radians(60)) * px
    with open(os.path.join(OUT, "under.json"), "w") as f:
        json.dump({"w": UNDER_W, "h": UNDER_H, "topY": round(top_y, 1), "circleW": round(2 * px, 1)}, f)
