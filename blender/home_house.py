"""
The home screen: a cosy reading house seen from above with its roof off, like
a doll's house, on a floating island of lawn and layered earth. Every section of
the app has a room (a library for Sentences & Stories, a music room for Sound
It Out, a little theatre for Story Play...) or a spot in the garden. Rendered
once, in isometric view: the app floats the picture over the forest glade
(blender/forest.py) and puts a sign on each room. The app needs to know where each room lands on
the picture: those points go to blender/out/home-house.json.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/home_house.py
    python3 scripts/home-house.py      # → public/images/home-house.webp + src/app/homeHouse.ts

The helpers (island.py, worlds.py) come from LearnNest's island art.
"""

import json
import math
import os
import random
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import forest as F  # noqa: E402
import island as I  # noqa: E402
import worlds as W  # noqa: E402

W_PX, H_PX = 2400, 1350

# The house: 4 rooms across (x) by 3 deep (y), each 3 × 2.67. The camera looks
# from the +x, -y corner, so the walls at -x and +y are the far, tall ones and
# the walls at +x and -y are cut low to see in.
HX, HY = 6.0, 4.0
COLS, ROWS = 4, 3
RW, RD = 2 * HX / COLS, 2 * HY / ROWS
FLOOR = 0.1
TALL, LOW, PART = 1.9, 0.42, 0.34

# Which room each section has: (column from the far side, row from the back).
ROOMS = {
    "stories": (0, 0),
    "guided": (1, 0),
    "tricky": (2, 0),
    "assessment": (3, 0),
    "phonics": (0, 1),
    "soundout": (1, 1),
    "storyplay": (2, 1),
    "threed": (3, 1),
    "flashcards": (0, 2),
    "spelling": (1, 2),
    "formation": (2, 2),
    "assignments": (3, 2),
}
# The two sections out in the garden.
GARDEN = {"interactive": (7.9, 1.4), "tracker": (-0.4, -5.9)}
FOUNTAIN = (-3.9, -5.5)
DOOR_X = 1.5

# Section colours, linear.
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

M = {}


def mat(name, colour, rough=0.7, noise=0.0, scale=12.0):
    """One material per name, made the first time it's asked for."""
    if name not in M:
        M[name] = I.material(name, colour, rough=rough, noise=noise, noise_scale=scale)
    return M[name]


def planks(name, colour, across_x=True):
    """A wooden floor: bands of lighter and darker boards."""
    if name in M:
        return M[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = 0.45
    coord = nodes.new("ShaderNodeTexCoord")
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X" if across_x else "Y"
    wave.inputs["Scale"].default_value = 3.2
    wave.inputs["Distortion"].default_value = 1.5
    links.new(coord.outputs["Object"], wave.inputs["Vector"])
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[c * 0.72 for c in colour], 1)
    ramp.color_ramp.elements[1].color = (*colour, 1)
    links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    M[name] = m
    return m


def tint(c, k, base=(0.72, 0.62, 0.48)):
    """A section colour softened towards cream, for walls and rugs."""
    return tuple(b * (1 - k) + x * k for b, x in zip(base, c))


def box(size, loc, m, bevel=0.02):
    return I.box("Part", size, loc, m, bevel=bevel)


def disc(rx, ry, h, loc, m, vertices=40):
    obj = W.cylinder(1.0, h, loc, m, vertices=vertices)
    obj.scale = (rx, ry, 1)
    return obj


def ball(loc, r, m, scale=(1, 1, 1)):
    obj = I.blob(loc, r, m)
    obj.scale = scale
    return obj


# --- Furniture ----------------------------------------------------------------------


def rug(x, y, rx, ry, c, round_=True):
    if round_:
        disc(rx, ry, 0.02, (x, y, FLOOR + 0.01), mat(f"Rug{c}", c, rough=0.95, noise=0.1, scale=40))
        disc(rx * 0.8, ry * 0.8, 0.022, (x, y, FLOOR + 0.012), mat(f"RugIn{c}", tint(c, 0.4, (1, 0.95, 0.85)), rough=0.95))
    else:
        box((rx * 2, ry * 2, 0.02), (x, y, FLOOR + 0.01), mat(f"Rug{c}", c, rough=0.95, noise=0.1, scale=40), bevel=0)
        box((rx * 1.7, ry * 1.7, 0.022), (x, y, FLOOR + 0.012), mat(f"RugIn{c}", tint(c, 0.4, (1, 0.95, 0.85)), rough=0.95), bevel=0)


def bookshelf(x, y, w, h, along_x=True, d=0.3, wood=(0.32, 0.14, 0.05)):
    sx, sy = (w, d) if along_x else (d, w)
    box((sx, sy, h), (x, y, FLOOR + h / 2), mat("ShelfWood", wood, rough=0.6), bevel=0.015)
    rnd = random.Random(int(x * 97 + y * 13))
    shelves = max(2, int(h / 0.32))
    colours = [(0.75, 0.1, 0.1), (0.05, 0.3, 0.75), (0.95, 0.65, 0.05), (0.1, 0.5, 0.2), (0.55, 0.15, 0.6), (0.95, 0.4, 0.1)]
    face = -1 if along_x else 1  # books show on the side facing the room
    for s in range(shelves):
        z = FLOOR + 0.06 + s * (h - 0.08) / shelves
        t = -w / 2 + 0.06
        while t < w / 2 - 0.08:
            bw = rnd.uniform(0.04, 0.07)
            bh = rnd.uniform(0.16, 0.24)
            c = rnd.choice(colours)
            loc = (x + t + bw / 2, y + face * -0.0 - (d / 2 - 0.13) * (1 if along_x else 0), z + bh / 2) if along_x else (x + (d / 2 - 0.13), y + t + bw / 2, z + bh / 2)
            box((bw, 0.2, bh) if along_x else (0.2, bw, bh), loc, mat(f"Book{c}", c, rough=0.5), bevel=0.005)
            t += bw + 0.005


def sofa(x, y, w, c, facing="-y"):
    m = mat(f"Sofa{c}", c, rough=0.75)
    if facing in ("-y", "+y"):
        box((w, 0.5, 0.2), (x, y, FLOOR + 0.16), m, bevel=0.05)
        by = y + (0.2 if facing == "-y" else -0.2)
        box((w, 0.14, 0.42), (x, by, FLOOR + 0.3), m, bevel=0.05)
        for dx in (-w / 2 + 0.06, w / 2 - 0.06):
            box((0.12, 0.5, 0.3), (x + dx, y, FLOOR + 0.2), m, bevel=0.05)
        for k in (-1, 1):
            ball((x + k * w * 0.22, y + 0.02, FLOOR + 0.34), 0.1, mat("Cushion", (1.0, 0.85, 0.3), rough=0.8), (1.1, 0.5, 0.9))
    else:
        box((0.5, w, 0.2), (x, y, FLOOR + 0.16), m, bevel=0.05)
        bx = x + (-0.2 if facing == "+x" else 0.2)
        box((0.14, w, 0.42), (bx, y, FLOOR + 0.3), m, bevel=0.05)
        for dy in (-w / 2 + 0.06, w / 2 - 0.06):
            box((0.5, 0.12, 0.3), (x, y + dy, FLOOR + 0.2), m, bevel=0.05)


def armchair(x, y, c, facing="-y"):
    sofa(x, y, 0.62, c, facing)


def table(x, y, r=0.3, h=0.32, wood=(0.45, 0.2, 0.07)):
    W.cylinder(r, 0.05, (x, y, FLOOR + h), mat("TableWood", wood, rough=0.4))
    W.cylinder(0.04, h, (x, y, FLOOR + h / 2), mat("TableWood", wood, rough=0.4), vertices=12)


def desk(x, y, w=0.9, d=0.45, h=0.42, wood=(0.45, 0.2, 0.07)):
    box((w, d, 0.05), (x, y, FLOOR + h), mat("DeskWood", wood, rough=0.45), bevel=0.01)
    for dx in (-w / 2 + 0.05, w / 2 - 0.05):
        for dy in (-d / 2 + 0.05, d / 2 - 0.05):
            box((0.05, 0.05, h), (x + dx, y + dy, FLOOR + h / 2), mat("DeskWood", wood), bevel=0)


def chair(x, y, c=(0.6, 0.3, 0.1), back="+y"):
    m = mat(f"Chair{c}", c, rough=0.6)
    box((0.26, 0.26, 0.04), (x, y, FLOOR + 0.24), m, bevel=0.01)
    for dx in (-0.1, 0.1):
        for dy in (-0.1, 0.1):
            box((0.03, 0.03, 0.24), (x + dx, y + dy, FLOOR + 0.12), m, bevel=0)
    off = {"+y": (0, 0.12), "-y": (0, -0.12), "+x": (0.12, 0), "-x": (-0.12, 0)}[back]
    size = (0.26, 0.03, 0.26) if back in ("+y", "-y") else (0.03, 0.26, 0.26)
    box(size, (x + off[0], y + off[1], FLOOR + 0.38), m, bevel=0.01)


def plant(x, y, s=1.0):
    W.cylinder(0.11 * s, 0.2 * s, (x, y, FLOOR + 0.1 * s), mat("Pot", (0.75, 0.3, 0.12), rough=0.6), vertices=16)
    leaf = mat("PlantLeaf", (0.05, 0.4, 0.08), rough=0.6, noise=0.2)
    for dx, dy, dz, r in ((0, 0, 0.36, 0.16), (0.08, 0.05, 0.3, 0.12), (-0.07, -0.04, 0.3, 0.12), (0, 0.06, 0.46, 0.1)):
        ball((x + dx * s, y + dy * s, FLOOR + dz * s), r * s, leaf)


def lamp(x, y, h=0.9):
    W.cylinder(0.1, 0.03, (x, y, FLOOR + 0.015), mat("Brass", (0.75, 0.5, 0.15), rough=0.3))
    W.cylinder(0.015, h, (x, y, FLOOR + h / 2), mat("Brass", (0.75, 0.5, 0.15)), vertices=8)
    W.cone(0.16, 0.08, 0.2, (x, y, FLOOR + h), W.glow_material("LampShade", (1.0, 0.8, 0.45), 1.5), vertices=20)


def frame_on_wall(x, y, w, h, z, c, on_x_wall):
    size = (0.03, w, h) if on_x_wall else (w, 0.03, h)
    box(size, (x, y, z), mat("FrameGold", (0.8, 0.55, 0.15), rough=0.35), bevel=0.005)
    inner = (0.035, w * 0.78, h * 0.78) if on_x_wall else (w * 0.78, 0.035, h * 0.78)
    box(inner, (x + (0.005 if on_x_wall else 0), y - (0 if on_x_wall else 0.005), z), mat(f"Art{c}", c, rough=0.6), bevel=0)


# --- The rooms ----------------------------------------------------------------------
# Each gets the room's far corner (fx: its -x side, fy: its +y side) and its
# centre. Tall things go against the far sides, so nothing hides the room.


def room_stories(cx, cy, fx, fy, c):
    bookshelf(cx - 0.65, fy - 0.2, 1.1, 1.5)
    bookshelf(cx + 0.65, fy - 0.2, 1.1, 1.5)
    bookshelf(fx + 0.2, cy - 0.2, 1.2, 1.2, along_x=False)
    rug(cx + 0.1, cy - 0.2, 0.85, 0.65, c)
    armchair(cx + 0.55, cy - 0.15, (0.75, 0.15, 0.15), facing="-x")
    sofa(cx - 0.3, cy + 0.45, 1.0, (0.1, 0.35, 0.75))
    table(cx - 0.1, cy - 0.3, 0.22)
    for k in range(3):
        box((0.22, 0.16, 0.04), (cx - 0.1, cy - 0.3, FLOOR + 0.36 + k * 0.04), mat(f"Book{k}", [(0.75, 0.1, 0.1), (0.95, 0.65, 0.05), (0.1, 0.5, 0.2)][k], rough=0.5), bevel=0.005)
    plant(cx + 1.2, cy + 1.0, 1.1)


def room_guided(cx, cy, fx, fy, c):
    rug(cx, cy, 0.9, 0.7, c)
    armchair(cx - 0.45, cy + 0.55, (0.95, 0.55, 0.1))
    armchair(cx + 0.45, cy + 0.55, (0.95, 0.55, 0.1))
    lamp(cx - 1.15, cy + 0.95)
    table(cx, cy + 0.6, 0.18)
    ball((cx + 0.5, cy - 0.45, FLOOR + 0.15), 0.25, mat("BeanBag", (0.15, 0.6, 0.85), rough=0.8), (1.1, 1.1, 0.65))
    ball((cx - 0.55, cy - 0.5, FLOOR + 0.15), 0.25, mat("BeanBag2", (1.0, 0.35, 0.55), rough=0.8), (1.1, 1.1, 0.65))
    bookshelf(cx + 0.95, fy - 0.2, 0.8, 0.9)
    plant(fx + 0.3, cy - 0.9, 0.9)
    # an open book on the little table
    box((0.24, 0.16, 0.02), (cx, cy + 0.6, FLOOR + 0.35), mat("Page", (1, 0.97, 0.88), rough=0.6), bevel=0.003)


def room_tricky(cx, cy, fx, fy, c):
    navy = mat("StarRug", (0.03, 0.04, 0.2), rough=0.95)
    disc(0.95, 0.8, 0.02, (cx, cy - 0.1, FLOOR + 0.01), navy)
    gold = W.glow_material("StarGlow", (1.0, 0.78, 0.15), 1.2)
    rnd = random.Random(5)
    for _ in range(12):
        a, r = rnd.uniform(0, math.tau), rnd.uniform(0.1, 0.72)
        ball((cx + math.cos(a) * r, cy - 0.1 + math.sin(a) * r * 0.8, FLOOR + 0.025), 0.035, gold, (1, 1, 0.3))
    # the telescope on its tripod, pointing up at the window
    tx, ty = cx + 0.3, cy + 0.6
    for a in (0, 2.1, 4.2):
        leg = box((0.03, 0.03, 0.6), (tx + math.cos(a) * 0.12, ty + math.sin(a) * 0.12, FLOOR + 0.28), mat("Brass", (0.75, 0.5, 0.15)), bevel=0)
        I.tilt(leg, (math.sin(a) * 0.3, -math.cos(a) * 0.3, 0))
    tube = W.cylinder(0.07, 0.75, (tx, ty, FLOOR + 0.72), mat("Telescope", (0.1, 0.15, 0.55), rough=0.3), vertices=20)
    tube.rotation_euler = (math.radians(-55), 0, math.radians(20))
    # a globe and star lights on the wall
    W.cylinder(0.03, 0.3, (cx - 0.8, cy + 0.2, FLOOR + 0.15), mat("Brass", (0.75, 0.5, 0.15)), vertices=8)
    ball((cx - 0.8, cy + 0.2, FLOOR + 0.42), 0.16, mat("Globe", (0.1, 0.45, 0.8), rough=0.4, noise=0.4, scale=6))
    for k in range(5):
        ball((cx - 1.1 + k * 0.5, fy - 0.1, FLOOR + 1.35 + (k % 2) * 0.2), 0.05, gold)
    ball((cx + 0.9, cy - 0.8, FLOOR + 0.12), 0.2, mat("Pouf", (1.0, 0.7, 0.1), rough=0.8), (1, 1, 0.6))


def room_assessment(cx, cy, fx, fy, c):
    rug(cx, cy - 0.1, 0.8, 0.55, c, round_=False)
    desk(cx - 0.1, cy + 0.45, 1.1, 0.5)
    box((0.42, 0.04, 0.28), (cx - 0.25, cy + 0.6, FLOOR + 0.6), mat("Screen", (0.05, 0.05, 0.08), rough=0.3), bevel=0.01)
    box((0.38, 0.045, 0.24), (cx - 0.25, cy + 0.585, FLOOR + 0.6), W.glow_material("ScreenGlow", (0.4, 0.75, 1.0), 0.8), bevel=0)
    box((0.2, 0.28, 0.02), (cx + 0.25, cy + 0.4, FLOOR + 0.455), mat("Clipboard", (0.6, 0.35, 0.12), rough=0.5), bevel=0.005)
    box((0.16, 0.22, 0.01), (cx + 0.25, cy + 0.4, FLOOR + 0.47), mat("Page", (1, 0.97, 0.88)), bevel=0)
    chair(cx - 0.1, cy, (0.15, 0.15, 0.2), back="-y")
    box((0.4, 0.4, 0.8), (fx + 0.3, cy + 0.9, FLOOR + 0.4), mat("Cabinet", (0.35, 0.4, 0.45), rough=0.4), bevel=0.02)
    W.cylinder(0.14, 0.03, (cx + 0.7, fy - 0.03, FLOOR + 1.35), mat("ClockFace", (1, 1, 1), rough=0.4)).rotation_euler = (math.radians(90), 0, 0)
    plant(cx + 1.15, cy - 0.85)
    plant(fx + 0.3, cy - 0.9, 0.8)


def room_phonics(cx, cy, fx, fy, c):
    rug(cx, cy, 0.95, 0.75, c)
    colours = [(0.95, 0.15, 0.2), (0.1, 0.4, 0.95), (1.0, 0.75, 0.05), (0.1, 0.7, 0.3), (0.6, 0.2, 0.9)]
    # a little tower of alphabet blocks and a few strewn about
    k = 0
    for row, n in enumerate((3, 2, 1)):
        for i in range(n):
            x = cx - 0.25 + i * 0.25 + row * 0.125
            box((0.22, 0.22, 0.22), (x, cy + 0.15, FLOOR + 0.12 + row * 0.23), mat(f"Block{k % 5}", colours[k % 5], rough=0.35), bevel=0.03)
            k += 1
    for dx, dy in ((0.55, -0.4), (-0.6, -0.35), (0.2, -0.65)):
        b = box((0.2, 0.2, 0.2), (cx + dx, cy + dy, FLOOR + 0.11), mat(f"Block{k % 5}", colours[k % 5], rough=0.35), bevel=0.03)
        I.tilt(b, (0, 0, k * 0.4))
        k += 1
    box((0.8, 0.4, 0.4), (cx - 0.5, fy - 0.25, FLOOR + 0.2), mat("ToyChest", (0.85, 0.2, 0.25), rough=0.5), bevel=0.04)
    ball((fx + 0.35, cy - 0.5, FLOOR + 0.15), 0.25, mat("BeanBag", (0.15, 0.6, 0.85), rough=0.8), (1.1, 1.1, 0.65))
    ball((cx + 0.9, cy + 0.6, FLOOR + 0.12), 0.12, mat("Ball", (1.0, 0.85, 0.1), rough=0.3))
    bookshelf(cx + 0.7, fy - 0.2, 0.8, 0.7)


def room_soundout(cx, cy, fx, fy, c):
    rug(cx, cy - 0.1, 0.9, 0.7, c)
    # an upright piano against the far wall, with its stool
    px, py = cx - 0.45, fy - 0.3
    box((1.0, 0.36, 0.75), (px, py, FLOOR + 0.375), mat("PianoBlack", (0.02, 0.02, 0.03), rough=0.15), bevel=0.02)
    box((0.92, 0.2, 0.04), (px, py - 0.25, FLOOR + 0.47), mat("Keys", (0.95, 0.95, 0.92), rough=0.3), bevel=0.005)
    box((0.5, 0.26, 0.05), (px, py - 0.65, FLOOR + 0.28), mat("Stool", (0.5, 0.05, 0.1), rough=0.6), bevel=0.02)
    # a drum, a xylophone and a music stand
    W.cylinder(0.24, 0.26, (cx + 0.6, cy + 0.3, FLOOR + 0.13), mat("Drum", (0.85, 0.12, 0.12), rough=0.4))
    W.cylinder(0.23, 0.02, (cx + 0.6, cy + 0.3, FLOOR + 0.27), mat("DrumSkin", (0.97, 0.93, 0.85), rough=0.6))
    for i, col in enumerate(colours := [(0.95, 0.15, 0.2), (1.0, 0.5, 0.05), (1.0, 0.8, 0.05), (0.1, 0.7, 0.3), (0.1, 0.4, 0.95), (0.6, 0.2, 0.9)]):
        box((0.07, 0.34 - i * 0.03, 0.03), (cx - 0.3 + i * 0.09, cy - 0.45, FLOOR + 0.1), mat(f"Xylo{i}", col, rough=0.3), bevel=0.005)
    W.cylinder(0.015, 0.7, (cx + 0.9, cy - 0.5, FLOOR + 0.35), mat("Brass", (0.75, 0.5, 0.15)), vertices=8)
    box((0.3, 0.02, 0.22), (cx + 0.9, cy - 0.5, FLOOR + 0.72), mat("Page", (1, 0.97, 0.88)), bevel=0)
    plant(cx + 1.2, fy - 0.3)


def room_storyplay(cx, cy, fx, fy, c):
    # a small stage on the far side with red curtains and footlights
    box((2.4, 0.9, 0.18), (cx, fy - 0.5, FLOOR + 0.09), planks("StageWood", (0.5, 0.25, 0.08)), bevel=0.02)
    red = mat("Curtain", (0.65, 0.03, 0.06), rough=0.6, noise=0.25, scale=30)
    for k in (-1, 1):
        box((0.42, 0.1, 1.35), (cx + k * 0.98, fy - 0.12, FLOOR + 0.18 + 0.67), red, bevel=0.04)
    box((2.4, 0.12, 0.25), (cx, fy - 0.12, FLOOR + 1.45), red, bevel=0.04)
    for k in range(5):
        ball((cx - 0.8 + k * 0.4, fy - 0.92, FLOOR + 0.21), 0.04, W.glow_material("Footlight", (1, 0.85, 0.4), 3))
    # two puppets on the stage
    ball((cx - 0.25, fy - 0.5, FLOOR + 0.42), 0.14, mat("PuppetA", (1.0, 0.6, 0.15), rough=0.5))
    ball((cx + 0.25, fy - 0.5, FLOOR + 0.42), 0.14, mat("PuppetB", (0.2, 0.6, 1.0), rough=0.5))
    # the audience
    for i in range(3):
        for j in range(2):
            chair(cx - 0.6 + i * 0.6, cy - 0.15 - j * 0.5, (0.65, 0.05, 0.1), back="-y")


def room_threed(cx, cy, fx, fy, c):
    rug(cx, cy, 0.85, 0.65, c, round_=False)
    # an easel with a bright canvas
    ex, ey = cx - 0.6, fy - 0.45
    for dx in (-0.18, 0.18):
        leg = box((0.04, 0.04, 1.1), (ex + dx, ey, FLOOR + 0.55), mat("EaselWood", (0.55, 0.3, 0.1)), bevel=0)
        I.tilt(leg, (math.radians(-8), 0, 0))
    box((0.6, 0.04, 0.5), (ex, ey - 0.06, FLOOR + 0.75), mat("Canvas", (1, 0.97, 0.9), rough=0.8), bevel=0.005)
    for i, col in enumerate([(0.95, 0.2, 0.2), (0.1, 0.5, 0.95), (1.0, 0.8, 0.1)]):
        ball((ex - 0.15 + i * 0.15, ey - 0.09, FLOOR + 0.75 + (i % 2) * 0.1), 0.07, mat(f"Paint{i}", col, rough=0.5), (1, 0.3, 1))
    # a work table with shapes: a cube, a cone, a ball, a pyramid
    desk(cx + 0.35, cy + 0.45, 1.1, 0.55)
    top = FLOOR + 0.445
    box((0.18, 0.18, 0.18), (cx + 0.0, cy + 0.45, top + 0.09), mat("ShapeA", (0.95, 0.2, 0.4), rough=0.3), bevel=0.02)
    W.cone(0.1, 0.0, 0.24, (cx + 0.3, cy + 0.5, top + 0.12), mat("ShapeB", (0.1, 0.7, 0.9), rough=0.3))
    ball((cx + 0.58, cy + 0.42, top + 0.1), 0.1, mat("ShapeC", (1.0, 0.75, 0.1), rough=0.3))
    W.cone(0.12, 0.0, 0.2, (cx + 0.8, cy + 0.5, top + 0.1), mat("ShapeD", (0.55, 0.25, 0.95), rough=0.3), vertices=4)
    chair(cx + 0.35, cy - 0.05, (0.95, 0.75, 0.15), back="-y")
    for i, col in enumerate([(0.95, 0.2, 0.2), (0.1, 0.5, 0.95), (1.0, 0.8, 0.1), (0.1, 0.7, 0.3)]):
        W.cylinder(0.06, 0.1, (fx + 0.3 + i * 0.15, cy - 0.85, FLOOR + 0.05), mat(f"PaintPot{i}", col, rough=0.4), vertices=16)
    plant(cx + 1.15, cy - 0.85, 0.9)


def room_flashcards(cx, cy, fx, fy, c):
    rug(cx, cy, 0.85, 0.65, c, round_=False)
    # a pinboard of bright cards
    box((1.4, 0.06, 0.9), (cx - 0.1, fy - 0.15, FLOOR + 0.75), mat("Cork", (0.6, 0.38, 0.18), rough=0.9, noise=0.2, scale=40), bevel=0.02)
    box((0.04, 0.04, 0.35), (cx - 0.7, fy - 0.15, FLOOR + 0.17), mat("EaselWood", (0.55, 0.3, 0.1)), bevel=0)
    box((0.04, 0.04, 0.35), (cx + 0.5, fy - 0.15, FLOOR + 0.17), mat("EaselWood", (0.55, 0.3, 0.1)), bevel=0)
    rnd = random.Random(3)
    cards = [(0.95, 0.2, 0.3), (0.1, 0.55, 0.95), (1.0, 0.8, 0.1), (0.1, 0.75, 0.4), (0.7, 0.3, 0.95), (1.0, 0.5, 0.1)]
    for i in range(3):
        for j in range(2):
            card = box((0.3, 0.02, 0.22), (cx - 0.55 + i * 0.45, fy - 0.19, FLOOR + 0.55 + j * 0.35), mat(f"Card{(i + j * 3) % 6}", cards[(i + j * 3) % 6], rough=0.5), bevel=0.005)
            I.tilt(card, (0, rnd.uniform(-0.12, 0.12), 0))
    desk(cx + 0.2, cy - 0.15, 0.9, 0.45)
    chair(cx + 0.2, cy - 0.6, (0.1, 0.55, 0.6), back="-y")
    for i in range(4):
        box((0.16, 0.11, 0.015), (cx + 0.0 + i * 0.12, cy - 0.12, FLOOR + 0.455 + i * 0.012), mat(f"Card{i}", cards[i], rough=0.5), bevel=0.003)
    lamp(fx + 0.3, cy + 0.9, 0.8)
    plant(cx + 1.2, cy + 0.9)


def room_spelling(cx, cy, fx, fy, c):
    # a green chalkboard with letters, and little desks facing it
    box((1.6, 0.08, 0.85), (cx, fy - 0.15, FLOOR + 0.9), mat("BoardFrame", (0.55, 0.3, 0.1), rough=0.5), bevel=0.02)
    box((1.48, 0.09, 0.73), (cx, fy - 0.16, FLOOR + 0.9), mat("Chalkboard", (0.04, 0.2, 0.1), rough=0.9), bevel=0)
    for dx in (-0.7, 0.7):
        box((0.05, 0.05, 0.5), (cx + dx, fy - 0.15, FLOOR + 0.25), mat("BoardFrame", (0.55, 0.3, 0.1)), bevel=0)
    chalk = mat("Chalk", (0.95, 0.95, 0.9), rough=0.9)
    for i in range(5):
        box((0.12, 0.02, 0.16), (cx - 0.45 + i * 0.22, fy - 0.21, FLOOR + 1.0), chalk, bevel=0)
    for i in range(2):
        for j in range(2):
            x, y = cx - 0.45 + i * 0.9, cy - 0.05 - j * 0.7
            desk(x, y, 0.55, 0.36, 0.36)
            chair(x, y - 0.32, (0.95, 0.55, 0.1), back="-y")
    rug(cx, cy - 0.4, 0.95, 0.7, c, round_=False)


def room_formation(cx, cy, fx, fy, c):
    rug(cx, cy, 0.9, 0.7, c)
    desk(cx - 0.1, cy + 0.35, 1.2, 0.6)
    top = FLOOR + 0.445
    for i in range(3):
        p = box((0.3, 0.22, 0.005), (cx - 0.45 + i * 0.35, cy + 0.35, top + 0.003), mat("Page", (1, 0.97, 0.88)), bevel=0)
        I.tilt(p, (0, 0, (i - 1) * 0.2))
    W.cylinder(0.07, 0.16, (cx + 0.38, cy + 0.5, top + 0.08), mat("PencilCup", (0.1, 0.45, 0.85), rough=0.4), vertices=16)
    for i, col in enumerate([(0.95, 0.2, 0.2), (1.0, 0.8, 0.1), (0.1, 0.7, 0.3)]):
        W.cylinder(0.012, 0.24, (cx + 0.34 + i * 0.04, cy + 0.5, top + 0.2), mat(f"Pencil{i}", col, rough=0.4), vertices=6)
    for dx in (-0.4, 0.3):
        chair(cx - 0.1 + dx, cy - 0.15, (0.95, 0.4, 0.1), back="-y")
    # a giant pencil standing in the corner
    W.cylinder(0.12, 1.2, (fx + 0.3, fy - 0.35, FLOOR + 0.7), mat("PencilBody", (1.0, 0.7, 0.05), rough=0.4), vertices=6)
    W.cone(0.12, 0.0, 0.2, (fx + 0.3, fy - 0.35, FLOOR + 0.0 + 0.1 - 0.0), mat("PencilWood", (0.95, 0.75, 0.5), rough=0.6), vertices=6).rotation_euler = (math.pi, 0, 0)
    W.cylinder(0.12, 0.14, (fx + 0.3, fy - 0.35, FLOOR + 1.37), mat("Eraser", (1.0, 0.45, 0.55), rough=0.6), vertices=6)
    plant(cx + 1.15, fy - 0.3)


def room_assignments(cx, cy, fx, fy, c):
    rug(cx, cy - 0.1, 0.85, 0.65, c, round_=False)
    # the teacher's desk with stacks of work, and a row of school bags
    desk(cx - 0.1, cy + 0.4, 1.2, 0.55)
    top = FLOOR + 0.445
    for k, (dx, n) in enumerate(((-0.4, 6), (-0.1, 4), (0.25, 8))):
        for i in range(n):
            box((0.24, 0.3, 0.012), (cx - 0.1 + dx, cy + 0.4, top + 0.008 + i * 0.014), mat("Page", (1, 0.97, 0.88)), bevel=0)
    ball((cx + 0.35, cy + 0.45, top + 0.07), 0.07, mat("Apple", (0.85, 0.05, 0.05), rough=0.3))
    chair(cx - 0.1, cy + 0.9, (0.45, 0.2, 0.07), back="+y")
    for i, col in enumerate([(0.95, 0.2, 0.3), (0.1, 0.5, 0.95), (1.0, 0.75, 0.1), (0.1, 0.65, 0.3)]):
        bag = box((0.24, 0.14, 0.3), (cx - 0.6 + i * 0.36, cy - 0.65, FLOOR + 0.15), mat(f"Bag{i}", col, rough=0.5), bevel=0.05)
        box((0.18, 0.04, 0.12), (cx - 0.6 + i * 0.36, cy - 0.73, FLOOR + 0.12), mat(f"Bag{i}", col), bevel=0.03)
    # a coat stand by the door
    W.cylinder(0.02, 1.0, (cx + 1.15, cy - 0.85, FLOOR + 0.5), mat("EaselWood", (0.55, 0.3, 0.1)), vertices=8)
    ball((cx + 1.15, cy - 0.85, FLOOR + 0.85), 0.14, mat("Coat", (0.15, 0.35, 0.7), rough=0.8), (0.8, 0.8, 1.4))
    plant(fx + 0.3, fy - 0.3)


ROOM_BUILD = {
    "stories": room_stories,
    "guided": room_guided,
    "tricky": room_tricky,
    "assessment": room_assessment,
    "phonics": room_phonics,
    "soundout": room_soundout,
    "storyplay": room_storyplay,
    "threed": room_threed,
    "flashcards": room_flashcards,
    "spelling": room_spelling,
    "formation": room_formation,
    "assignments": room_assignments,
}

# Floors: mostly warm wood, a few tiled or carpeted, for variety.
FLOORS = {
    "stories": ("wood", (0.42, 0.18, 0.06)),
    "guided": ("carpet", (0.55, 0.42, 0.62)),
    "tricky": ("wood", (0.3, 0.13, 0.05)),
    "assessment": ("wood", (0.5, 0.26, 0.1)),
    "phonics": ("carpet", (0.35, 0.6, 0.75)),
    "soundout": ("wood", (0.48, 0.22, 0.07)),
    "storyplay": ("carpet", (0.45, 0.08, 0.12)),
    "threed": ("tile", (0.78, 0.78, 0.75)),
    "flashcards": ("wood", (0.5, 0.26, 0.1)),
    "spelling": ("tile", (0.75, 0.68, 0.55)),
    "formation": ("wood", (0.42, 0.18, 0.06)),
    "assignments": ("tile", (0.6, 0.6, 0.62)),
}


def room_bounds(col, row):
    x0 = -HX + col * RW
    y1 = HY - row * RD
    return x0, x0 + RW, y1 - RD, y1


# --- The house ----------------------------------------------------------------------


def window(x, y, along_x, z=1.05):
    """A tall window with a white frame in an outer wall."""
    w, h = 0.6, 0.75
    frame = mat("WinFrame", (0.95, 0.93, 0.88), rough=0.4)
    glass = W.glow_material("WinGlass", (0.55, 0.8, 1.0), 0.5)
    if along_x:
        box((w, 0.24, h), (x, y, z), frame, bevel=0.01)
        box((w - 0.1, 0.26, h - 0.1), (x, y, z), glass, bevel=0)
        box((0.03, 0.27, h - 0.1), (x, y, z), frame, bevel=0)
    else:
        box((0.24, w, h), (x, y, z), frame, bevel=0.01)
        box((0.26, w - 0.1, h - 0.1), (x, y, z), glass, bevel=0)
        box((0.27, 0.03, h - 0.1), (x, y, z), frame, bevel=0)


def house():
    brick = mat("Brick", (0.62, 0.22, 0.09), rough=0.85, noise=0.18, scale=30)
    trim = mat("Trim", (0.92, 0.85, 0.72), rough=0.5)
    # the plinth the house stands on
    box((2 * HX + 0.6, 2 * HY + 0.6, 0.3), (0, 0, -0.1), mat("Plinth", (0.55, 0.5, 0.45), rough=0.8, noise=0.1), bevel=0.04)
    # each room's floor
    for zone, (col, row) in ROOMS.items():
        x0, x1, y0, y1 = room_bounds(col, row)
        kind, colour = FLOORS[zone]
        if kind == "wood":
            fm = planks(f"Floor{zone}", colour)
        elif kind == "tile":
            fm = mat(f"Floor{zone}", colour, rough=0.35, noise=0.12, scale=8)
        else:
            fm = mat(f"Floor{zone}", colour, rough=0.95, noise=0.08, scale=50)
        box((RW, RD, FLOOR), (x0 + RW / 2, y0 + RD / 2, FLOOR / 2), fm, bevel=0)
    # the far walls: tall, papered inside in each room's colour, brick outside
    t = 0.16
    for col in range(COLS):
        x0, x1, y0, y1 = room_bounds(col, 0)
        zone = next(z for z, (c, r) in ROOMS.items() if c == col and r == 0)
        box((RW, t, TALL), (x0 + RW / 2, HY + t / 2, TALL / 2), brick, bevel=0)
        box((RW, 0.02, TALL - FLOOR), (x0 + RW / 2, HY - 0.01, FLOOR + (TALL - FLOOR) / 2), mat(f"Paper{zone}", tint(COL[zone], 0.55), rough=0.8, noise=0.05, scale=60), bevel=0)
        box((RW, 0.05, 0.12), (x0 + RW / 2, HY - 0.03, FLOOR + 0.06), trim, bevel=0)
        if zone not in ("stories", "storyplay"):
            window(x0 + RW * 0.3, HY + t / 2 - 0.02, True)
    for row in range(ROWS):
        x0, x1, y0, y1 = room_bounds(0, row)
        zone = next(z for z, (c, r) in ROOMS.items() if c == 0 and r == row)
        box((t, RD, TALL), (-HX - t / 2, y0 + RD / 2, TALL / 2), brick, bevel=0)
        box((0.02, RD, TALL - FLOOR), (-HX + 0.01, y0 + RD / 2, FLOOR + (TALL - FLOOR) / 2), mat(f"Paper{zone}", tint(COL[zone], 0.55), rough=0.8, noise=0.05, scale=60), bevel=0)
        box((0.05, RD, 0.12), (-HX + 0.03, y0 + RD / 2, FLOOR + 0.06), trim, bevel=0)
        window(-HX - t / 2 + 0.02, y0 + RD * 0.55, False)
    # a cornice along the top of the far walls
    box((2 * HX + t, t + 0.12, 0.12), (-t / 2, HY + t / 2, TALL + 0.06), trim, bevel=0.02)
    box((t + 0.12, 2 * HY + t, 0.12), (-HX - t / 2, t / 2, TALL + 0.06), trim, bevel=0.02)
    # the near walls, cut low so we can see in, with a door to the garden
    box((t, 2 * HY, LOW), (HX + t / 2, 0, LOW / 2), brick, bevel=0)
    box((t + 0.08, 2 * HY + 0.08, 0.06), (HX + t / 2, 0, LOW + 0.03), trim, bevel=0.01)
    gap = 0.8
    for a, b in ((-HX, DOOR_X - gap / 2), (DOOR_X + gap / 2, HX)):
        box((b - a, t, LOW), ((a + b) / 2, -HY - t / 2, LOW / 2), brick, bevel=0)
        box((b - a, t + 0.08, 0.06), ((a + b) / 2, -HY - t / 2, LOW + 0.03), trim, bevel=0.01)
    for k in range(3):
        box((gap + 0.3 + k * 0.25, 0.3, 0.08), (DOOR_X, -HY - 0.3 - k * 0.25, -0.0 - k * 0.08), mat("Step", (0.7, 0.66, 0.6), rough=0.7), bevel=0.01)
    # low partitions between the rooms, with a wooden rail on top
    wood = mat("Rail", (0.4, 0.17, 0.06), rough=0.5)
    cream = mat("Partition", (0.9, 0.84, 0.72), rough=0.7)
    for col in range(1, COLS):
        x = -HX + col * RW
        for row in range(ROWS):
            y0, y1 = HY - (row + 1) * RD, HY - row * RD
            # a doorway in the middle of each stretch
            for a, b in ((y0, (y0 + y1) / 2 - 0.4), ((y0 + y1) / 2 + 0.4, y1)):
                box((0.1, b - a, PART), (x, (a + b) / 2, FLOOR + PART / 2), cream, bevel=0)
                box((0.14, b - a, 0.05), (x, (a + b) / 2, FLOOR + PART + 0.025), wood, bevel=0.01)
    for row in range(1, ROWS):
        y = HY - row * RD
        for col in range(COLS):
            x0, x1 = -HX + col * RW, -HX + (col + 1) * RW
            for a, b in ((x0, (x0 + x1) / 2 - 0.4), ((x0 + x1) / 2 + 0.4, x1)):
                box((b - a, 0.1, PART), ((a + b) / 2, y, FLOOR + PART / 2), cream, bevel=0)
                box((b - a, 0.14, 0.05), ((a + b) / 2, y, FLOOR + PART + 0.025), wood, bevel=0.01)
    # pictures on the far walls
    rnd = random.Random(8)
    for col in range(COLS):
        x0 = -HX + col * RW
        zone = next(z for z, (c, r) in ROOMS.items() if c == col and r == 0)
        if zone in ("guided", "assessment", "tricky"):
            frame_on_wall(x0 + RW * 0.72, HY - 0.03, 0.42, 0.32, 1.25, rnd.choice([(0.1, 0.5, 0.8), (0.9, 0.5, 0.1), (0.2, 0.6, 0.25)]), False)
    for row in range(ROWS):
        y0 = HY - (row + 1) * RD
        frame_on_wall(-HX + 0.03, y0 + RD * 0.18, 0.36, 0.3, 1.2, rnd.choice([(0.1, 0.5, 0.8), (0.9, 0.5, 0.1), (0.8, 0.2, 0.4)]), True)
    for zone, (col, row) in ROOMS.items():
        x0, x1, y0, y1 = room_bounds(col, row)
        ROOM_BUILD[zone]((x0 + x1) / 2, (y0 + y1) / 2, x0, y1, COL[zone])


# --- The garden ---------------------------------------------------------------------


def hedge(x, y, sx, sy, h=0.45):
    box((sx, sy, h), (x, y, h / 2), mat("Hedge", (0.04, 0.24, 0.03), rough=0.85, noise=0.35, scale=18), bevel=0.12)


def tree(x, y, s=1.0, fruit=None):
    W.cylinder(0.08 * s, 0.9 * s, (x, y, 0.45 * s), mat("Bark", (0.3, 0.15, 0.06), rough=0.9), vertices=10)
    leaf = mat("TreeLeaf", (0.06, 0.32, 0.04), rough=0.75, noise=0.3, scale=10)
    rnd = random.Random(int(x * 31 + y * 17))
    for _ in range(5):
        ball((x + rnd.uniform(-0.3, 0.3) * s, y + rnd.uniform(-0.3, 0.3) * s, (1.1 + rnd.uniform(0, 0.4)) * s), rnd.uniform(0.35, 0.5) * s, leaf)
    if fruit:
        for _ in range(7):
            a = rnd.uniform(0, math.tau)
            ball((x + math.cos(a) * 0.5 * s, y + math.sin(a) * 0.5 * s, (1.1 + rnd.uniform(0, 0.4)) * s), 0.06 * s, mat(f"Fruit{fruit}", fruit, rough=0.3))


def flowers(x, y, n, spread, seed):
    rnd = random.Random(seed)
    colours = [(1, 0.15, 0.3), (1, 0.8, 0.1), (0.7, 0.3, 1), (1, 1, 1), (1, 0.45, 0.6), (1, 0.45, 0.05)]
    ball((x, y, 0.08), spread, mat("FlowerBed", (0.05, 0.28, 0.03), rough=0.8, noise=0.3), (1.2, 1.0, 0.35))
    for _ in range(n):
        a, r = rnd.uniform(0, math.tau), rnd.uniform(0, spread)
        ball((x + math.cos(a) * r * 1.1, y + math.sin(a) * r * 0.9, 0.16), 0.055, mat(f"Bloom{rnd.randrange(6)}", rnd.choice(colours), rough=0.5))


def fence(x0, y0, x1, y1):
    white = mat("Fence", (0.95, 0.94, 0.9), rough=0.5)
    n = int(math.hypot(x1 - x0, y1 - y0) / 0.22)
    for i in range(n + 1):
        t = i / n
        box((0.06, 0.06, 0.5), (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.25), white, bevel=0.01)
    length = math.hypot(x1 - x0, y1 - y0)
    for z in (0.18, 0.38):
        rail = box((length, 0.04, 0.05), ((x0 + x1) / 2, (y0 + y1) / 2, z), white, bevel=0)
        I.tilt(rail, (0, 0, math.atan2(y1 - y0, x1 - x0)))


def path(points, w=0.8):
    stone = mat("PathStone", (0.62, 0.57, 0.5), rough=0.8, noise=0.15, scale=14)
    for (ax, ay), (bx, by) in zip(points, points[1:]):
        length = math.hypot(bx - ax, by - ay)
        p = box((length + w * 0.5, w, 0.04), ((ax + bx) / 2, (ay + by) / 2, 0.02), stone, bevel=0.01)
        I.tilt(p, (0, 0, math.atan2(by - ay, bx - ax)))


def fountain(x, y):
    stone = mat("FountainStone", (0.72, 0.7, 0.66), rough=0.6)
    W.cylinder(0.95, 0.3, (x, y, 0.15), stone, vertices=8)
    W.cylinder(0.82, 0.04, (x, y, 0.29), W.glow_material("Water", (0.1, 0.6, 1.0), 0.6), vertices=8)
    W.cylinder(0.12, 0.8, (x, y, 0.5), stone, vertices=12)
    W.cylinder(0.4, 0.08, (x, y, 0.85), stone, vertices=16)
    W.cylinder(0.33, 0.03, (x, y, 0.89), W.glow_material("Water", (0.1, 0.6, 1.0), 0.6), vertices=16)
    ball((x, y, 1.05), 0.12, W.glow_material("Spray", (0.6, 0.9, 1.0), 1.0), (1, 1, 1.6))


def bench(x, y, along_x=True):
    wood = mat("BenchWood", (0.5, 0.25, 0.08), rough=0.6)
    sx, sy = (1.0, 0.32) if along_x else (0.32, 1.0)
    box((sx, sy, 0.05), (x, y, 0.3), wood, bevel=0.01)
    box((sx, 0.05, 0.25) if along_x else (0.05, sy, 0.25), (x, y + (0.15 if along_x else 0), 0.48) if along_x else (x - 0.15, y, 0.48), wood, bevel=0.01)
    for d in (-0.4, 0.4):
        box((0.05, 0.3, 0.3) if along_x else (0.3, 0.05, 0.3), (x + d, y, 0.15) if along_x else (x, y + d, 0.15), mat("Iron", (0.08, 0.08, 0.1), rough=0.4), bevel=0)


def puppet_booth(x, y):
    """Interactive Stories: a striped puppet theatre on the lawn."""
    red, white = mat("BoothRed", (0.8, 0.05, 0.12), rough=0.5), mat("BoothWhite", (0.97, 0.95, 0.9), rough=0.5)
    for k in range(5):
        box((0.3, 0.6, 1.3), (x - 0.6 + k * 0.3, y, 0.65), red if k % 2 == 0 else white, bevel=0.01)
    box((1.4, 0.62, 0.45), (x, y - 0.01, 1.35), W.glow_material("BoothStage", (0.15, 0.08, 0.3), 0.2), bevel=0)
    box((1.6, 0.8, 0.12), (x, y, 1.66), mat("BoothRoof", (1.0, 0.75, 0.1), rough=0.4), bevel=0.04)
    for k, col in enumerate([(1.0, 0.55, 0.1), (0.15, 0.55, 1.0)]):
        ball((x - 0.25 + k * 0.5, y - 0.3, 1.32), 0.16, mat(f"Puppet{k}", col, rough=0.4))
        for side in (-1, 1):
            ball((x - 0.25 + k * 0.5 + side * 0.06, y - 0.44, 1.37), 0.03, mat("PupEye", (0.02, 0.02, 0.03), rough=0.2))
    W.cone(0.12, 0.0, 0.3, (x, y, 1.87), mat("BoothRed", (0.8, 0.05, 0.12)), vertices=4)


def podium(x, y):
    """Class Tracker: a winners' podium with a gold trophy and a flag."""
    for dx, h, col in ((-0.55, 0.35, (0.75, 0.75, 0.8)), (0.0, 0.55, (1.0, 0.75, 0.1)), (0.55, 0.25, (0.8, 0.45, 0.2))):
        box((0.5, 0.5, h), (x + dx, y, h / 2), mat(f"Podium{dx}", col, rough=0.35), bevel=0.03)
    gold = W.metal("Gold", (1.0, 0.72, 0.15))
    W.cylinder(0.12, 0.06, (x, y, 0.58), gold)
    W.cylinder(0.03, 0.15, (x, y, 0.68), gold, vertices=12)
    W.cone(0.18, 0.08, 0.26, (x, y, 0.88), gold).rotation_euler = (math.pi, 0, 0)
    W.cylinder(0.02, 1.6, (x + 0.95, y + 0.1, 0.8), mat("Iron", (0.08, 0.08, 0.1)), vertices=8)
    box((0.5, 0.02, 0.32), (x + 1.2, y + 0.1, 1.4), mat("Flag", (0.05, 0.6, 0.25), rough=0.6), bevel=0)


ISLAND = (1.0, -1.4, 9.8, 7.3)  # centre x, y and half-width, half-depth


def on_island(x, y, margin=0.0):
    cx, cy, rx, ry = ISLAND
    return (abs(x - cx) / (rx - margin)) ** 4 + (abs(y - cy) / (ry - margin)) ** 4 < 1


def island():
    """The ground: a chunky floating island, a lawn on top of bands of cream
    and earth, like the cliffs in the forest behind it."""
    cx, cy, rx, ry = ISLAND
    rnd = random.Random(9)
    waves = [(rnd.uniform(0.01, 0.03), k, rnd.uniform(0, math.tau)) for k in (3, 5, 7)]
    pts = []
    for i in range(72):
        a = i * math.tau / 72
        c, s_ = math.cos(a), math.sin(a)
        f = 1 + sum(w * math.sin(k * a + ph) for w, k, ph in waves)
        pts.append((math.copysign(abs(c) ** 0.5, c) * rx * f, math.copysign(abs(s_) ** 0.5, s_) * ry * f))
    F.slab(pts, cx, cy, -0.25, 0.0, mat("Lawn", (0.1, 0.36, 0.04), rough=0.9, noise=0.25, scale=2.5))
    F.slab([(x * 1.012, y * 1.012) for x, y in pts], cx, cy, -0.36, -0.2, mat("LawnLip", (0.07, 0.28, 0.03), rough=0.9))
    z, k = -0.36, 0
    while z > -2.6:
        h = 0.3 + (k % 3) * 0.08
        sc = 1 - 0.02 * (k + 1)
        F.slab([(x * sc, y * sc) for x, y in pts], cx, cy, z - h, z, mat(f"Strata{k % 4}", F.STRATA[k % 4], rough=0.9))
        z -= h
        k += 1


def garden():
    """The island and everything on it round the house."""
    island()
    # paths: from the door out to the front, and round to the fountain and the booth
    path([(DOOR_X, -HY - 1.1), (DOOR_X, -6.9)])
    path([(DOOR_X, -6.9), (-4.6, -6.9)])
    path([(DOOR_X, -6.9), (6.6, -6.9), (7.9, 0.4)], 0.7)
    # hedges and flower beds round the house
    hedge(HX + 0.7, -2.2, 0.5, 2.6)
    flowers(HX + 0.75, 3.2, 14, 0.45, 1)
    flowers(-1.9, -HY - 0.9, 14, 0.5, 2)
    flowers(4.2, -HY - 1.0, 12, 0.5, 3)
    flowers(9.6, -1.2, 14, 0.55, 4)
    flowers(3.6, -5.9, 10, 0.4, 5)
    fountain(*FOUNTAIN)
    bench(4.6, -7.6)
    puppet_booth(*GARDEN["interactive"])
    podium(*GARDEN["tracker"])
    # trees round the edge of the island, behind and beside the house
    rnd = random.Random(14)
    fruit = [None, (0.9, 0.08, 0.08), None, (1.0, 0.55, 0.05)]
    for x, y, s in ((-7.6, 4.6, 1.2), (-4.5, 5.0, 1.1), (-1.0, 5.1, 1.2), (2.5, 5.2, 1.1), (6.0, 4.9, 1.2), (8.8, 3.6, 1.1),
                    (-7.8, 1.0, 1.1), (-7.9, -2.6, 1.0), (10.0, -3.6, 1.0), (-6.4, -6.4, 1.0)):
        if on_island(x, y, 0.6):
            tree(x, y, s, fruit[rnd.randrange(4)])


def build():
    scene = W.reset()
    scene.render.resolution_x = W_PX
    scene.render.resolution_y = H_PX
    scene.render.film_transparent = True
    try:
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 0.6
    except AttributeError:
        pass
    try:
        scene.eevee.use_shadows = True
    except AttributeError:
        pass
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    # An isometric camera, looking from the near (+x, -y) corner and lifted so
    # the house sits in the lower part of the picture, under the app's header.
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 24.0
    cam_data.clip_end = 200
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    rot = Euler((math.radians(52), 0, math.radians(45)))
    cam.rotation_euler = rot
    up = rot.to_matrix() @ Vector((0, 1, 0))
    back = rot.to_matrix() @ Vector((0, 0, 1))
    target = Vector((0.4, -0.4, 0)) + up * 2.25
    cam.location = target + back * 60
    scene.camera = cam
    I.sun(scene)
    sun = bpy.data.objects["Sun"]
    sun.data.energy = 4.2
    sun.data.color = (1.0, 0.95, 0.85)
    sun.rotation_euler = Euler((math.radians(42), math.radians(-14), math.radians(-35)))
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.75, 0.85, 1.0, 1)
    bg.inputs[1].default_value = 0.45

    garden()
    house()

    # Where each room lands on the picture: its sign goes up above its middle.
    spots = {}
    for zone, (col, row) in ROOMS.items():
        x0, x1, y0, y1 = room_bounds(col, row)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        spots[zone] = (Vector((cx, cy, 1.15)), Vector((cx, cy, FLOOR)))
    for zone, (gx, gy) in GARDEN.items():
        spots[zone] = (Vector((gx, gy, 2.1)), Vector((gx, gy, 0.0)))
    spots["hub"] = (Vector((DOOR_X, -HY - 0.6, 0.6)), Vector((DOOR_X, -HY - 0.6, 0.0)))
    spots["fountain"] = (Vector((*FOUNTAIN, 1.2)), Vector((*FOUNTAIN, 0.9)))
    out = {}
    for zone, (top, foot) in spots.items():
        a, b = world_to_camera_view(scene, cam, top), world_to_camera_view(scene, cam, foot)
        out[zone] = {"sign": [round(a.x * 100, 2), round((1 - a.y) * 100, 2)], "foot": [round(b.x * 100, 2), round((1 - b.y) * 100, 2)]}
    with open(os.path.join(I.OUT, "home-house.json"), "w") as f:
        json.dump({"w": W_PX, "h": H_PX, "spots": out}, f, indent=1)
    I.render("home-house")


if __name__ == "__main__":
    build()
