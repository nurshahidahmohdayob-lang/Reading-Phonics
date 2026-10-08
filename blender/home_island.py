"""
The home screen's island: one tropical island in the sea with a landmark for
every section of the app (giant letters for Phonics, a pencil for Letter
Formation, a circus tent for Story Play...), round a lagoon, with mountains,
palms and a sandy beach. Rendered whole, in perspective, on a transparent
background: the app draws the moving sea, clouds and birds behind and over
it, and puts a glowing sign on each landmark. The app needs to know where
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

# How high above a landmark its sign floats, for the tall ones.
SIGN_LIFT = {"stories": 1.75, "guided": 2.45, "interactive": 1.35}

# Section colours, linear (a touch deeper than the app's pastels, for walls).
COL = {
    "phonics": (0.95, 0.35, 0.6),
    "soundout": (0.45, 0.5, 1.0),
    "flashcards": (0.2, 0.75, 0.78),
    "formation": (1.0, 0.6, 0.25),
    "spelling": (0.3, 0.8, 0.5),
    "tricky": (1.0, 0.8, 0.15),
    "stories": (0.3, 0.6, 1.0),
    "storyplay": (0.2, 0.75, 0.75),
    "guided": (0.6, 0.45, 1.0),
    "assessment": (1.0, 0.45, 0.4),
    "threed": (0.7, 0.45, 1.0),
    "assignments": (1.0, 0.65, 0.2),
    "tracker": (0.15, 0.55, 0.35),
    "interactive": (0.95, 0.3, 0.45),
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


def text(body, loc, size, mat, rot=(math.radians(70), 0, 0), extrude=0.06):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    t = bpy.context.active_object
    t.data.body = body
    t.data.size = size
    t.data.extrude = extrude
    t.data.bevel_depth = 0.01
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.materials.append(mat)
    return t


def hut(x, y, colour, w=0.55, h=0.42, roof_colour=(0.75, 0.22, 0.15)):
    """A little house in the section's colour, with a door and a roof."""
    wall = I.material("Wall", colour, rough=0.6)
    I.box("Hut", (w, w, h), (x, y, h / 2 + 0.12), wall, bevel=0.03)
    roof = I.material("Roof", roof_colour, rough=0.55)
    W.cone(w * 0.82, 0.0, w * 0.55, (x, y, h + 0.12 + w * 0.27), roof, vertices=4, rotation=(0, 0, math.radians(45)))
    I.box("Door", (w * 0.28, 0.02, h * 0.55), (x, y - w / 2 - 0.005, 0.12 + h * 0.28), I.material("Door", (0.25, 0.12, 0.05)), bevel=0)
    for dx in (-0.16, 0.16):
        I.box("Win", (0.1, 0.02, 0.1), (x + dx * w / 0.55, y - w / 2 - 0.006, 0.12 + h * 0.7), W.glow_material("Glass", (1.0, 0.92, 0.6), 0.6), bevel=0)


def pad(x, y, colour, r=0.62):
    """A round stone plaza under each landmark."""
    p = W.cylinder(r, 0.08, (x, y, 0.08), I.material("Plaza", (0.85, 0.75, 0.6), rough=0.8), vertices=40)
    W.cylinder(r * 0.97, 0.02, (x, y, 0.125), I.material("PlazaTop", tuple(min(1, c * 0.75 + 0.18) for c in colour), rough=0.6), vertices=40)
    return p


def star_mesh(x, y, z, r, mat, depth=0.08):
    pts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((x + math.cos(a) * rr, z + math.sin(a) * rr))
    mesh = bpy.data.meshes.new("Star")
    bm = bmesh.new()
    verts = [bm.verts.new((px, y, pz)) for px, pz in pts]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [v for v in res["geom"] if isinstance(v, bmesh.types.BMVert)]:
        v.co.y += depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Star", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


# --- The landmarks -------------------------------------------------------------------


def lm_phonics(x, y, c):
    pad(x, y, c)
    text("Aa", (x, y, 0.55), 0.85, I.material("Letters", c, rough=0.35), extrude=0.12)
    W.cone(0.06, 0.0, 0.12, (x + 0.42, y, 0.95), W.glow_material("Spark", (1, 0.85, 0.2), 2), vertices=4)


def lm_soundout(x, y, c):
    pad(x, y, c)
    wall = I.material("BellWall", c, rough=0.6)
    for dx in (-0.22, 0.22):
        I.box("Pillar", (0.1, 0.1, 0.8), (x + dx, y, 0.52), wall, bevel=0.02)
    W.cone(0.42, 0.0, 0.3, (x, y, 1.08), I.material("BellRoof", (0.75, 0.22, 0.15), rough=0.5), vertices=4, rotation=(0, 0, math.radians(45)))
    gold = W.metal("Bell", (1.0, 0.72, 0.15))
    W.cone(0.2, 0.08, 0.3, (x, y, 0.72), gold, vertices=24)
    I.blob((x, y, 0.56), 0.04, gold)
    W.cone(0.05, 0.0, 0.1, (x + 0.38, y - 0.1, 0.9), W.glow_material("Ring", (1, 0.85, 0.2), 1.5), vertices=4)
    W.cone(0.04, 0.0, 0.08, (x - 0.36, y - 0.1, 0.8), W.glow_material("Ring2", (1, 0.85, 0.2), 1.5), vertices=4)


def lm_flashcards(x, y, c):
    pad(x, y, c)
    cols = [(1.0, 0.35, 0.5), (0.35, 0.65, 1.0), (1.0, 0.85, 0.2), c]
    for k, col in enumerate(cols):
        card = I.box("Card", (0.4, 0.03, 0.54), (x - 0.2 + k * 0.13, y + 0.12 - k * 0.07, 0.42 + k * 0.015), I.material("Card", col, rough=0.5), bevel=0.02)
        I.tilt(card, (math.radians(-12), 0, math.radians(-20 + k * 13)))
    I.box("Pic", (0.2, 0.02, 0.16), (x + 0.2, y - 0.1, 0.5), I.material("Pic", (1, 1, 1)), bevel=0.01)


def lm_formation(x, y, c):
    pad(x, y, c)
    yellow = I.material("Pencil", (1.0, 0.78, 0.1), rough=0.5)
    body = W.cylinder(0.14, 1.5, (x, y, 0.9), yellow, vertices=6)
    body.rotation_euler = (0, math.radians(28), 0)
    tip = W.cone(0.14, 0.0, 0.32, (x - 0.73 * math.sin(math.radians(28)) * 1.0, y, 0.9 - 0.75 * math.cos(math.radians(28)) - 0.12), I.material("Wood", (0.95, 0.75, 0.5)), vertices=6)
    tip.rotation_euler = (0, math.radians(28 + 180), 0)
    eraser = W.cylinder(0.14, 0.18, (x + 0.75 * math.sin(math.radians(28)) + 0.04, y, 0.9 + 0.75 * math.cos(math.radians(28)) + 0.06), I.material("Eraser", (1.0, 0.45, 0.55)), vertices=16)
    eraser.rotation_euler = (0, math.radians(28), 0)


def lm_spelling(x, y, c):
    pad(x, y, c)
    cols = [(0.95, 0.3, 0.3), (0.3, 0.6, 1.0), (0.3, 0.8, 0.4), (1.0, 0.8, 0.15), (0.75, 0.4, 1.0)]
    letters = "CATAB"
    spots = [(-0.26, 0, 0), (0.0, 0, 0), (0.26, 0, 0), (-0.13, 0, 1), (0.13, 0, 1)]
    for k, (bx, by, bz) in enumerate(spots):
        cx, cz = x + bx, 0.27 + bz * 0.26
        I.box("Block", (0.24, 0.24, 0.24), (cx, y + by, cz), I.material("Block", cols[k], rough=0.45), bevel=0.03)
        text(letters[k], (cx, y - 0.125, cz), 0.2, I.material("Ink", (1, 1, 1)), rot=(math.radians(90), 0, 0), extrude=0.01)


def lm_tricky(x, y, c):
    pad(x, y, c)
    W.cylinder(0.18, 0.9, (x, y, 0.55), I.material("Tower", (0.95, 0.9, 0.8), rough=0.7), vertices=16)
    star_mesh(x, y - 0.04, 1.35, 0.42, W.glow_material("StarGold", (1.0, 0.75, 0.1), 0.8))


def lm_stories(x, y, c):
    pad(x, y, c, r=0.78)
    page = I.material("Page", (1.0, 0.98, 0.92), rough=0.6)
    cover = I.material("Cover", c, rough=0.5)
    ink = I.material("Ink", (0.35, 0.35, 0.45))
    # A giant storybook standing open, leaning back so its pages face the
    # viewer, with lines of words and a picture.
    tilt = math.radians(-32)
    for side in (-1, 1):
        cv = I.box("Cover", (0.95, 0.07, 1.25), (x + side * 0.47, y + 0.1, 0.78), cover, bevel=0.03)
        I.tilt(cv, (tilt, 0, math.radians(side * 16)))
        pg = I.box("Pages", (0.86, 0.09, 1.12), (x + side * 0.44, y + 0.02, 0.8), page, bevel=0.03)
        I.tilt(pg, (tilt, 0, math.radians(side * 16)))
        for k in range(5):
            if side == 1 and k < 2:
                continue
            ln = I.box("Line", (0.58, 0.02, 0.05), (x + side * 0.45, y - 0.08 + k * 0.06, 1.1 - k * 0.17), ink, bevel=0)
            I.tilt(ln, (tilt, 0, math.radians(side * 16)))
    pic = I.box("Picture", (0.5, 0.02, 0.32), (x + 0.45, y - 0.12, 1.08), I.material("BookPic", (0.4, 0.75, 1.0)), bevel=0.01)
    I.tilt(pic, (tilt, 0, math.radians(16)))
    sunpic = I.blob((x + 0.58, y - 0.16, 1.14), 0.07, I.material("BookSun", (1.0, 0.8, 0.15)))
    W.cylinder(0.05, 1.2, (x, y + 0.12, 0.78), cover, vertices=8).rotation_euler = (tilt, 0, 0)


def lm_storyplay(x, y, c):
    pad(x, y, c)
    tent = W.cone(0.55, 0.0, 0.9, (x, y, 0.58), W.striped("Tent", (0.95, 0.25, 0.3), (1, 1, 1), gores=8), vertices=32)
    W.cylinder(0.56, 0.12, (x, y, 0.18), I.material("TentBase", (0.95, 0.25, 0.3)), vertices=32)
    W.cylinder(0.012, 0.3, (x, y, 1.15), I.material("Pole", (0.3, 0.2, 0.1)), vertices=6)
    flag = I.box("Flag", (0.18, 0.01, 0.1), (x + 0.09, y, 1.25), I.material("Flag", (1.0, 0.8, 0.1)), bevel=0)
    I.box("TentDoor", (0.22, 0.02, 0.3), (x, y - 0.5, 0.3), I.material("TentDoor", (0.3, 0.05, 0.1)), bevel=0)


def lm_guided(x, y, c):
    pad(x, y, c, r=0.72)
    # A big stage with a giant microphone on a stand.
    W.cylinder(0.6, 0.22, (x, y, 0.22), I.material("Stage", c, rough=0.5), vertices=32)
    W.cylinder(0.62, 0.04, (x, y, 0.34), W.metal("StageRim", (1.0, 0.75, 0.25)), vertices=32)
    metal = W.metal("Mic", (0.8, 0.82, 0.88))
    W.cylinder(0.25, 0.05, (x, y, 0.38), metal, vertices=24)
    W.cylinder(0.045, 1.1, (x, y, 0.95), metal, vertices=12)
    W.cylinder(0.07, 0.35, (x, y, 1.55), I.material("Grip", (0.15, 0.15, 0.2), rough=0.4), vertices=16)
    head = I.blob((x, y, 1.9), 0.3, I.material("MicHead", (0.4, 0.4, 0.48), rough=0.35))
    head.scale = (1, 1, 1.25)
    W.cylinder(0.31, 0.06, (x, y, 1.78), W.metal("MicBand", (1.0, 0.75, 0.25)), vertices=24)
    note = W.glow_material("Note", (1, 0.85, 0.2), 1.5)
    for (dx, dz, r) in ((0.5, 2.0, 0.09), (-0.48, 1.75, 0.07), (0.62, 1.6, 0.06)):
        I.blob((x + dx, y - 0.05, dz), r, note)
        W.cylinder(0.012, 0.22, (x + dx + r * 0.9, y - 0.05, dz + 0.11), note, vertices=6)


def lm_assessment(x, y, c):
    pad(x, y, c)
    W.cylinder(0.22, 1.0, (x, y, 0.6), I.material("Tower", (0.95, 0.92, 0.85), rough=0.7), vertices=12)
    W.cone(0.28, 0.0, 0.35, (x, y, 1.28), I.material("Spire", c, rough=0.5), vertices=12)
    W.cylinder(0.012, 0.35, (x, y, 1.6), I.material("Pole", (0.3, 0.2, 0.1)), vertices=6)
    I.box("Flag", (0.26, 0.01, 0.16), (x + 0.13, y, 1.7), I.material("FlagGreen", (0.2, 0.75, 0.35)), bevel=0)
    for k in range(3):
        I.box("Slit", (0.06, 0.02, 0.12), (x, y - 0.22, 0.45 + k * 0.25), I.material("Slit", (0.25, 0.15, 0.1)), bevel=0)


def lm_threed(x, y, c):
    pad(x, y, c)
    wood = I.material("Easel", (0.55, 0.32, 0.15), rough=0.7)
    for dx in (-0.25, 0.25):
        leg = W.cylinder(0.03, 1.2, (x + dx, y + 0.05, 0.7), wood, vertices=8)
        leg.rotation_euler = (math.radians(-10), math.radians(dx * 30), 0)
    canvas = I.box("Canvas", (0.62, 0.04, 0.5), (x, y - 0.03, 0.85), I.material("Canvas", (1, 1, 1)), bevel=0.01)
    I.tilt(canvas, (math.radians(-10), 0, 0))
    for k, col in enumerate([(1.0, 0.35, 0.5), (0.35, 0.65, 1.0), (1.0, 0.8, 0.2)]):
        I.blob((x - 0.15 + k * 0.15, y - 0.07, 0.85 + (k % 2) * 0.08), 0.07, I.material("Paint", col, rough=0.4))
    cube = I.box("Cube3D", (0.22, 0.22, 0.22), (x + 0.42, y - 0.25, 0.28), W.glow_material("Cube", c, 0.4), bevel=0.02)
    I.tilt(cube, (math.radians(20), math.radians(30), math.radians(15)))


def lm_assignments(x, y, c):
    pad(x, y, c)
    red = I.material("PostBox", (0.9, 0.18, 0.15), rough=0.45)
    W.cylinder(0.24, 0.8, (x, y, 0.52), red, vertices=24)
    top = I.blob((x, y, 0.92), 0.24, red)
    top.scale = (1, 1, 0.5)
    I.box("Slot", (0.24, 0.03, 0.04), (x, y - 0.24, 0.75), I.material("SlotDark", (0.1, 0.05, 0.05)), bevel=0)
    for k in range(3):
        env = I.box("Letter", (0.26, 0.02, 0.17), (x + 0.42, y - 0.15 + k * 0.05, 0.25 + k * 0.17), I.material("Envelope", (1, 0.97, 0.88)), bevel=0.01)
        I.tilt(env, (0, math.radians(-15 + k * 15), math.radians(10)))
    I.box("Tick", (0.07, 0.025, 0.07), (x + 0.42, y - 0.17, 0.25), I.material("TickGreen", (0.2, 0.75, 0.35)), bevel=0.01)


def lm_tracker(x, y, c):
    pad(x, y, c)
    W.cylinder(0.42, 0.55, (x, y, 0.4), I.material("Obs", (0.95, 0.95, 0.98), rough=0.4), vertices=32)
    dome = I.blob((x, y, 0.68), 0.43, I.material("Dome", c, rough=0.35))
    dome.scale = (1, 1, 0.8)
    scope = W.cylinder(0.06, 0.6, (x - 0.1, y - 0.15, 1.0), W.metal("Scope", (1.0, 0.75, 0.25)), vertices=12)
    scope.rotation_euler = (math.radians(35), math.radians(-25), 0)


def lm_interactive(x, y, c):
    """A puppet theatre on the lagoon's island: a stage with red curtains
    and two puppets, a gold arch and a star on top."""
    red = I.material("Curtain", (0.85, 0.08, 0.15), rough=0.6)
    gold = W.metal("TheatreGold", (1.0, 0.72, 0.18))
    wood = I.material("TheatreWood", c, rough=0.5)
    I.box("Stage", (0.95, 0.5, 0.3), (x, y, 0.25), wood, bevel=0.03)
    I.box("Back", (0.95, 0.08, 0.95), (x, y + 0.22, 0.85), I.material("Backdrop", (0.15, 0.2, 0.55), rough=0.7), bevel=0.02)
    for side in (-1, 1):
        I.box("Curtain", (0.22, 0.1, 0.9), (x + side * 0.38, y - 0.12, 0.85), red, bevel=0.05)
        W.cylinder(0.035, 1.0, (x + side * 0.5, y - 0.2, 0.85), gold, vertices=12)
    I.box("Valance", (1.05, 0.12, 0.16), (x, y - 0.2, 1.32), red, bevel=0.04)
    I.box("Arch", (1.1, 0.1, 0.06), (x, y - 0.22, 1.42), gold, bevel=0.02)
    star_mesh(x, y - 0.24, 1.62, 0.16, W.glow_material("TheatreStar", (1.0, 0.8, 0.15), 1.2), depth=0.05)
    # two puppets on the stage
    for (dx, col) in ((-0.15, (1.0, 0.75, 0.2)), (0.17, (0.35, 0.7, 1.0))):
        I.blob((x + dx, y - 0.05, 0.6), 0.12, I.material("PuppetBody", col, rough=0.5))
        I.blob((x + dx, y - 0.05, 0.8), 0.1, I.material("PuppetHead", (1.0, 0.85, 0.7), rough=0.5))
        for ex in (-0.035, 0.035):
            I.blob((x + dx + ex, y - 0.14, 0.82), 0.018, I.material("Eye", (0.05, 0.05, 0.08)))


LANDMARKS = {
    "interactive": lm_interactive,
    "phonics": lm_phonics,
    "soundout": lm_soundout,
    "flashcards": lm_flashcards,
    "formation": lm_formation,
    "spelling": lm_spelling,
    "tricky": lm_tricky,
    "stories": lm_stories,
    "storyplay": lm_storyplay,
    "guided": lm_guided,
    "assessment": lm_assessment,
    "threed": lm_threed,
    "assignments": lm_assignments,
    "tracker": lm_tracker,
}


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
    sun.data.energy = 4.2
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.55, 0.75, 1.0, 1)
    bg.inputs[1].default_value = 0.42

    # Shallow water round the shore, the beach, a low cliff and the grass.
    shallows = I.material("Shallows", (0.05, 0.72, 0.78), rough=0.15)
    slab("Shallows", outline(6.55, 3.75, 1.0, 4), -0.22, -0.2, shallows)
    sand = I.material("Sand", (1.0, 0.68, 0.28), rough=0.9, noise=0.1, noise_scale=20)
    slab("Beach", outline(6.15, 3.45, 1.0, 4), -0.2, -0.02, sand, bevel=0.06)
    cliff = I.material("Cliff", (0.55, 0.36, 0.2), rough=0.9, noise=0.2, noise_scale=10)
    land = outline(5.7, 3.1, 1.1, 4)
    slab("Cliff", land, -0.05, 0.02, cliff)
    grass = I.material("Grass", (0.1, 0.5, 0.04), rough=0.9, noise=0.2, noise_scale=7)
    slab("Grass", land, 0.0, 0.06, grass, bevel=0.05)

    # The lagoon in the middle, with a sandy rim and a little island.
    lx, ly = LAGOON
    rim = [(lx + px * 1.0, ly + py) for px, py in outline(1.55, 1.0, 1.4, 9, n=64)]
    slab("LagoonRim", rim, 0.0, 0.075, I.material("Rim", (1.0, 0.7, 0.3), rough=0.9))
    pool = [(lx + px, ly + py) for px, py in outline(1.38, 0.86, 1.4, 9, n=64)]
    slab("Lagoon", pool, 0.0, 0.085, W.glow_material("LagoonWater", (0.0, 0.5, 0.9), 0.2))
    isle_sand = [(lx + px, ly + py) for px, py in outline(0.82, 0.5, 0.8, 2, n=48)]
    slab("IsletSand", isle_sand, 0.0, 0.1, I.material("IsletSand", (1.0, 0.7, 0.3), rough=0.9))
    islet = [(lx + px, ly + 0.02 + py) for px, py in outline(0.7, 0.42, 0.8, 2, n=48)]
    slab("Islet", islet, 0.0, 0.12, grass)

    # Paths from the lagoon out to every landmark.
    dirt = I.material("Path", (0.85, 0.6, 0.3), rough=0.9)
    for zone, (zx, zy) in ZONES.items():
        if zone == "interactive":
            continue
        ax, ay = lx + (zx - lx) * 0.33, ly + (zy - ly) * 0.33
        bx, by = zx - (zx - lx) * 0.12, zy - (zy - ly) * 0.12
        length = math.hypot(bx - ax, by - ay)
        p = I.box("Path", (0.22, length, 0.03), ((ax + bx) / 2, (ay + by) / 2, 0.075), dirt, bevel=0.01)
        I.tilt(p, (0, 0, -math.atan2(bx - ax, by - ay)))

    for zone, (zx, zy) in ZONES.items():
        LANDMARKS[zone](zx, zy, COL[zone])

    # Mountains at the back corners, palms on the beach, trees and bushes.
    rockc = I.material("Mountain", (0.3, 0.33, 0.45), rough=0.85, noise=0.25, noise_scale=6)
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
    palette = dict(tree=(0.1, 0.48, 0.08))
    for k in range(80):
        x, y = rnd.uniform(-5.2, 5.2), rnd.uniform(-2.6, 2.7)
        if (x / 5.3) ** 2 + (y / 2.85) ** 2 > 0.85 or not clear_of_zones(x, y):
            continue
        if rnd.random() < 0.55:
            W.tree(x, y, palette, "pine" if rnd.random() < 0.3 else "round", scale=rnd.uniform(1.1, 1.5))
        else:
            I.blob((x, y, 0.12), rnd.uniform(0.1, 0.16), I.material("Bush", (0.08, 0.45, 0.1), rough=0.8))
            I.blob((x + 0.05, y - 0.06, 0.22), 0.045, I.material("Bloom", rnd.choice([(1, 0.3, 0.5), (1, 0.85, 0.2), (0.75, 0.45, 1), (1, 1, 1)])))
    for k in range(10):
        a = k * math.tau / 10 + 0.3
        W.rock(math.cos(a) * 6.1, math.sin(a) * 3.4, (0.5, 0.48, 0.45), scale=rnd.uniform(0.8, 1.3))

    # Where each landmark lands on the picture: the sign goes above it.
    spots = {}
    for zone, (zx, zy) in ZONES.items():
        lift = SIGN_LIFT.get(zone, 1.05)
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
    I.render("home-island")


if __name__ == "__main__":
    build()
