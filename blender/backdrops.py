"""
Extra stages for 3D Drawings: a market street, the ocean floor and outer
space. Each is a short film that loops seamlessly (like the jungle), built the
same way — a path or floor running away from the camera, scenery along the
sides and the middle left clear for the children's drawings to stand on.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/backdrops.py -- [market ocean space]

Frames go to blender/out/backdrops/<name>/; then ffmpeg packs each into
public/video/<name>.mp4 with a poster (see the end of this file's run).
"""

import math
import os
import random
import subprocess
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "out", "backdrops")
VIDEO = os.path.join(ROOT, "public", "video")

FRAMES = 120  # 5 seconds at 24 fps
W, H = 1280, 720
TAU = math.tau


# ---------- scene basics ----------

def reset(sky, strength=1.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = FRAMES
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    try:
        scene.eevee.taa_render_samples = 24
    except AttributeError:
        pass
    try:
        scene.view_settings.view_transform = "Standard"
    except TypeError:
        pass
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    bg = next(n for n in nodes if n.type == "BACKGROUND")
    bg.inputs[1].default_value = strength
    # A vertical gradient: horizon colour low, deeper colour overhead.
    coord = nodes.new("ShaderNodeTexCoord")
    sep = nodes.new("ShaderNodeSeparateXYZ")
    ramp = nodes.new("ShaderNodeValToRGB")
    links.new(coord.outputs["Generated"], sep.inputs[0])
    links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*sky[0], 1)
    ramp.color_ramp.elements[1].position = 0.35
    ramp.color_ramp.elements[1].color = (*sky[1], 1)
    links.new(ramp.outputs["Color"], bg.inputs[0])
    return scene


def camera(scene, z=2.6, pitch=84):
    data = bpy.data.cameras.new("Cam")
    data.lens = 35
    data.clip_end = 400
    cam = bpy.data.objects.new("Cam", data)
    cam.location = (0, -12, z)
    cam.rotation_euler = (math.radians(pitch), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam


def sun(scene, energy=3.0, colour=(1, 0.95, 0.85), rot=(50, -20, 30)):
    data = bpy.data.lights.new("Sun", "SUN")
    data.energy = energy
    data.color = colour
    data.angle = math.radians(6)
    light = bpy.data.objects.new("Sun", data)
    light.rotation_euler = tuple(math.radians(a) for a in rot)
    scene.collection.objects.link(light)


_mats = {}


def mat(colour, rough=0.6, emit=0.0, noise=0.0, noise_scale=8.0, alpha=1.0):
    key = (tuple(round(c, 3) for c in colour), rough, emit, noise, noise_scale, alpha)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new("M")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = rough
    if noise:
        tex = nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = noise_scale
        ramp = nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (*(c * (1 - noise) for c in colour), 1)
        ramp.color_ramp.elements[1].color = (*(min(1, c * (1 + noise)) for c in colour), 1)
        links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = (*colour, 1)
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*colour, 1)
        bsdf.inputs["Emission Strength"].default_value = emit
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        try:
            m.surface_render_method = "BLENDED"
        except (AttributeError, TypeError):
            pass
    _mats[key] = m
    return m


def finish(obj, material, smooth=True, bevel=0.0):
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    obj.data.materials.append(material)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def box(size, loc, material, bevel=0.04, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, material, smooth=False, bevel=bevel)


def ball(r, loc, material, scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, material)


def cyl(r, depth, loc, material, rot=(0, 0, 0), verts=24, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot, vertices=verts)
    return finish(bpy.context.active_object, material)


def ground(material, size=(60, 80), y=25, subdiv=0, bump=0.0, seed=1):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, y, 0))
    o = bpy.context.active_object
    o.scale = (size[0], size[1], 1)
    bpy.ops.object.transform_apply(scale=True)
    if subdiv:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.subdivide(number_cuts=subdiv)
        bpy.ops.object.mode_set(mode="OBJECT")
        rnd = random.Random(seed)
        for v in o.data.vertices:
            # Keep the middle strip flat, where the drawings stand.
            side = min(1.0, max(0.0, (abs(v.co.x) - 3.0) / 6.0))
            v.co.z += bump * (math.sin(v.co.x * 0.7 + seed) * math.cos(v.co.y * 0.5) * 0.5 + rnd.random() * 0.3) * (0.25 + side)
    return finish(o, material)


def parent_to(child, parent):
    bpy.context.view_layer.update()  # parent's matrix_world must be current
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def empty(loc):
    e = bpy.data.objects.new("E", None)
    e.location = loc
    bpy.context.scene.collection.objects.link(e)
    return e


def animate(obj, fn, path="location"):
    """Key obj.<path> on every frame from fn(phase), phase 0..1 over the loop."""
    for f in range(1, FRAMES + 1):
        setattr(obj, path, fn((f - 1) / FRAMES))
        obj.keyframe_insert(path, frame=f)


def tri(points, material):
    mesh = bpy.data.meshes.new("Tri")
    mesh.from_pydata(points, [], [(0, 1, 2)])
    o = bpy.data.objects.new("Tri", mesh)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material)
    return o


# ---------- the market ----------

FRUIT = [(1.0, 0.45, 0.02), (0.85, 0.05, 0.05), (1.0, 0.85, 0.05), (0.3, 0.75, 0.1), (0.55, 0.1, 0.5)]
STRIPES = [((0.9, 0.08, 0.1), (1, 1, 1)), ((0.05, 0.45, 0.85), (1, 1, 1)), ((0.1, 0.6, 0.25), (1, 0.95, 0.7)),
           ((1.0, 0.55, 0.0), (1, 0.95, 0.7)), ((0.6, 0.2, 0.75), (1, 1, 1))]


def stall(x, y, side, seed):
    """A stall on the left (side=-1) or right (side=1) of the street, facing it."""
    rnd = random.Random(seed)
    wood = mat((0.45, 0.24, 0.1), 0.8, noise=0.25, noise_scale=20)
    wood2 = mat((0.62, 0.36, 0.16), 0.8)
    front = x - side * 0.6  # the edge nearest the street
    box((1.2, 2.6, 1.0), (x, y, 0.5), wood2)
    box((1.35, 2.8, 0.12), (x, y, 1.04), wood)
    for dx in (-0.6, 0.6):
        for dy in (-1.3, 1.3):
            cyl(0.07, 3.0, (x + dx, y + dy, 1.5), wood)
    # striped awning, sloping down toward the street
    a, b = STRIPES[seed % len(STRIPES)]
    n = 7
    for i in range(n):
        box((1.9, 2.9 / n, 0.06), (x - side * 0.15, y - 1.45 + (i + 0.5) * 2.9 / n, 3.05),
            mat(a if i % 2 == 0 else b, 0.7), bevel=0.01, rot=(0, math.radians(16 * side), 0))
    for i in range(n):
        ball(0.21, (front - side * 0.45, y - 1.45 + (i + 0.5) * 2.9 / n, 2.82),
             mat(a if i % 2 == 0 else b, 0.7), scale=(0.25, 1, 0.8), seg=12)
    # fruit on the counter and in crates in front of it
    for i in range(14):
        ball(rnd.uniform(0.12, 0.17), (x + rnd.uniform(-0.45, 0.45), y + rnd.uniform(-1.1, 1.1), 1.22),
             mat(FRUIT[rnd.randrange(len(FRUIT))], 0.35), seg=14)
    for dy in (-0.75, 0.75):
        box((0.55, 0.7, 0.45), (front - side * 0.4, y + dy, 0.23), wood, bevel=0.02)
        for i in range(4):
            ball(0.14, (front - side * 0.4 + rnd.uniform(-0.15, 0.15), y + dy + rnd.uniform(-0.2, 0.2), 0.52),
                 mat(FRUIT[rnd.randrange(len(FRUIT))], 0.35), seg=12)


def bunting(y, height, colours, phase0):
    pole_mat = mat((0.95, 0.95, 0.95), 0.4)
    for x in (-5.8, 5.8):
        cyl(0.06, height + 0.4, (x, y, (height + 0.4) / 2), pole_mat)
    holder = empty((0, y, height))
    count = 13
    for i in range(count):
        t = (i + 0.5) / count
        x = -5.8 + 11.6 * t
        sag = -0.6 * math.sin(math.pi * t)
        flag = tri([(-0.28, 0, 0), (0.28, 0, 0), (0, 0, -0.6)], mat(colours[i % len(colours)], 0.6))
        flag.location = (x, y, height + sag)
        ph = phase0 + i * 0.35
        animate(flag, lambda p, ph=ph: (math.radians(12) * math.sin(TAU * p + ph), 0, 0), "rotation_euler")


def build_market():
    scene = reset(((0.45, 0.75, 1.0), (0.08, 0.3, 0.9)), 0.5)
    camera(scene)
    sun(scene, 2.6, (1, 0.9, 0.75))
    ground(mat((0.62, 0.36, 0.14), 0.9, noise=0.18, noise_scale=30))
    # a lighter path down the middle, where the drawings walk
    box((5.2, 70, 0.02), (0, 25, 0.005), mat((0.9, 0.6, 0.3), 0.9, noise=0.12, noise_scale=40), bevel=0)
    for i, y in enumerate((-2, 3.5, 9, 14.5, 20, 25.5)):
        stall(-5.2, y, -1, i * 2)
        stall(5.2, y, 1, i * 2 + 1)
    # shop houses at the end of the street
    rnd = random.Random(4)
    houses = [(1.0, 0.8, 0.6), (0.98, 0.62, 0.55), (0.6, 0.82, 0.95), (1.0, 0.9, 0.55), (0.75, 0.9, 0.7)]
    x = -16.0
    while x < 16:
        w = rnd.uniform(2.6, 3.6)
        h = rnd.uniform(4.5, 7.5)
        house_y = 34 if abs(x) < 4 else 30
        box((w, 3, h), (x + w / 2, house_y, h / 2), mat(houses[rnd.randrange(len(houses))], 0.8))
        cyl(w * 0.62, 1.6, (x + w / 2, house_y, h + 0.6), mat((0.75, 0.25, 0.15), 0.7), rot=(math.radians(90), 0, 0),
            verts=3).rotation_euler = (math.radians(90), 0, math.radians(0))
        for wy in range(int(h // 1.6)):
            for wx in (-0.6, 0.6):
                box((0.55, 0.1, 0.7), (x + w / 2 + wx, house_y - 1.52, 1.2 + wy * 1.6), mat((0.25, 0.45, 0.65), 0.2), bevel=0.02)
        x += w + 0.1
    for i, y in enumerate((4.5, 13.5)):
        bunting(y, 4.6, [(0.95, 0.15, 0.2), (1.0, 0.8, 0.0), (0.1, 0.55, 0.95), (0.2, 0.75, 0.3), (1.0, 0.45, 0.7)], i)
    # balloons tied to two stalls, bobbing
    for (bx, by, cols) in ((-3.9, 6.0, [(1, 0.2, 0.3), (0.2, 0.6, 1), (1, 0.85, 0.1)]),
                           (3.9, 11.0, [(0.6, 0.3, 0.95), (0.2, 0.8, 0.4), (1, 0.5, 0.1)])):
        for j, c in enumerate(cols):
            b = ball(0.38, (0, 0, 0), mat(c, 0.25), scale=(1, 1, 1.2))
            base = Vector((bx + (j - 1) * 0.45, by, 3.6 + j * 0.3))
            animate(b, lambda p, base=base, j=j: base + Vector((0.08 * math.sin(TAU * p + j), 0, 0.12 * math.sin(TAU * p + j * 2))))
    # clouds drifting once across over the loop
    cloud_mat = mat((1, 1, 1), 0.9)
    for k, (cy, cz) in enumerate(((60, 18), (70, 24), (55, 26))):
        c = empty((0, 0, 0))
        for dx, r in ((-1.6, 1.4), (0, 2.0), (1.7, 1.5), (0.6, 1.2)):
            parent_to(ball(r, (dx, 0, 0.4 if r > 1.8 else 0), cloud_mat, scale=(1.3, 0.6, 0.9)), c)
        start = -40 + k * 27
        animate(c, lambda p, start=start, cy=cy, cz=cz: Vector(((start + 81 * p + 40) % 81 - 40, cy, cz)))
    return scene


# ---------- the ocean ----------

def seaweed(x, y, h, colour, ph):
    root = empty((x, y, 0))
    segs = 6
    prev = root
    m = mat(colour, 0.5)
    for i in range(segs):
        seg_e = empty((x, y, i * h / segs))
        parent_to(seg_e, prev)
        ball(0.12 * (1 - i / (segs + 1)) + 0.03, (x, y, i * h / segs), m, seg=10).parent = None
        joint = bpy.context.active_object
        parent_to(joint, seg_e)
        leaf = cyl(0.12 * (1 - i / (segs + 1)) + 0.03, h / segs * 1.15, (x, y, i * h / segs + h / segs / 2), m, verts=10)
        parent_to(leaf, seg_e)
        animate(seg_e, lambda p, i=i: (math.radians(5 + i * 1.5) * math.sin(TAU * p + ph + i * 0.4), 0, 0), "rotation_euler")
        prev = seg_e


def coral(x, y, colour, seed, scale=1.0):
    rnd = random.Random(seed)
    m = mat(colour, 0.6)
    for i in range(7):
        h = rnd.uniform(0.6, 1.6) * scale
        ang = rnd.uniform(-0.5, 0.5)
        cx = x + rnd.uniform(-0.6, 0.6) * scale
        cy = y + rnd.uniform(-0.5, 0.5) * scale
        cyl(0.12 * scale, h, (cx, cy, h / 2), m, rot=(ang * 0.5, ang, 0), verts=10, r2=0.07 * scale)
        ball(0.17 * scale, (cx + math.sin(ang) * h / 2, cy, h * math.cos(ang * 0.5)), m, seg=12)


def fish(y, z, colour, speed_dir, offset, size=1.0):
    holder = empty((0, y, z))
    body = ball(0.42 * size, (0, y, z), mat(colour, 0.3), scale=(1.4, 0.55, 0.9))
    tail = cyl(0.36 * size, 0.5 * size, (-0.7 * size, y, z), mat(colour, 0.3), rot=(0, math.radians(90), 0), verts=3, r2=0.0)
    tail.scale = (1, 0.25, 1)
    stripe = ball(0.43 * size, (0.15 * size, y, z), mat((1, 1, 1), 0.3), scale=(0.25, 0.57, 0.92))
    eye = ball(0.08 * size, (0.38 * size, y - 0.2 * size, z + 0.1 * size), mat((0.02, 0.02, 0.05), 0.2), seg=10)
    for part in (body, tail, stripe, eye):
        parent_to(part, holder)
    span = 34.0
    if speed_dir < 0:
        holder.rotation_euler = (0, 0, math.pi)
    animate(holder, lambda p: Vector((speed_dir * (((p + offset) % 1.0) * span - span / 2), y, z + 0.25 * math.sin(TAU * p * 2 + offset * 7))))


def build_ocean():
    scene = reset(((0.05, 0.45, 0.65), (0.02, 0.2, 0.4)), 0.45)
    camera(scene, z=2.4, pitch=86)
    sun(scene, 2.0, (0.85, 1.0, 0.95), rot=(30, -10, 10))
    # a blue wall far off, so the reef fades into the water
    box((120, 1, 60), (0, 45, 10), mat((0.04, 0.38, 0.55), 1.0, emit=0.55), bevel=0)
    ground(mat((0.85, 0.62, 0.32), 0.95, noise=0.15, noise_scale=25), subdiv=60, bump=0.5, seed=3)
    rnd = random.Random(8)
    corals = [(1.0, 0.35, 0.5), (1.0, 0.55, 0.15), (0.65, 0.3, 0.95), (1.0, 0.85, 0.2), (0.2, 0.8, 0.75)]
    for side in (-1, 1):
        for i in range(9):
            y = -3 + i * 4 + rnd.uniform(-1, 1)
            x = side * rnd.uniform(4.2, 7.5)
            coral(x, y, corals[rnd.randrange(len(corals))], seed=i * 10 + side, scale=rnd.uniform(1.0, 1.7))
            seaweed(side * rnd.uniform(3.5, 8), y + 1.5, rnd.uniform(2.5, 4.5), (0.15, 0.6, 0.2), rnd.uniform(0, 6))
            ball(rnd.uniform(0.6, 1.3), (side * rnd.uniform(5, 9), y + 2, 0), mat((0.45, 0.45, 0.5), 0.9, noise=0.2),
                 scale=(1.3, 1, 0.6))
    # a few shells and starfish on the open sand
    for i in range(6):
        sx, sy = rnd.uniform(-3, 3), rnd.uniform(0, 14)
        star = cyl(0.35, 0.06, (sx, sy, 0.1), mat((1.0, 0.45, 0.25), 0.6), verts=5)
        star.rotation_euler = (0, 0, rnd.uniform(0, 6))
    # fish crossing over the loop
    fish(8, 3.0, (1.0, 0.5, 0.05), 1, 0.0, 1.0)
    fish(12, 4.2, (0.2, 0.55, 1.0), -1, 0.35, 1.1)
    fish(16, 2.4, (1.0, 0.85, 0.1), 1, 0.6, 0.9)
    fish(6, 4.6, (1.0, 0.3, 0.55), -1, 0.8, 0.8)
    fish(20, 5.2, (0.3, 0.9, 0.6), 1, 0.15, 1.3)
    # bubbles rising, each wrapping round once per loop
    bub = mat((0.85, 0.97, 1.0), 0.05, emit=0.6, alpha=0.6)
    for i in range(26):
        bx = rnd.choice((-1, 1)) * rnd.uniform(2.5, 7)
        by = rnd.uniform(0, 18)
        off = rnd.random()
        b = ball(rnd.uniform(0.06, 0.14), (bx, by, 0), bub, seg=10)
        animate(b, lambda p, bx=bx, by=by, off=off: Vector((bx + 0.15 * math.sin(TAU * (p * 3 + off)), by, ((p + off) % 1.0) * 9)))
    return scene


# ---------- outer space ----------

def planet(r, loc, colour, ring=None, spin=1, bands=None):
    p = ball(r, loc, mat(colour, 0.6, noise=0.25, noise_scale=3), seg=48)
    if bands:
        for i, (dz, c) in enumerate(bands):
            b = ball(r * 1.005, loc, mat(c, 0.6), scale=(1, 1, 0.12), seg=48)
            b.location.z += dz * r
            parent_to(b, p)
    if ring:
        bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.7, minor_radius=r * 0.18, location=loc)
        t = bpy.context.active_object
        t.scale = (1, 1, 0.08)
        t.rotation_euler = (math.radians(70), math.radians(15), 0)
        finish(t, mat(ring, 0.5))
    animate(p, lambda ph: (0, 0, TAU * ph * spin), "rotation_euler")
    return p


def build_space():
    scene = reset(((0.2, 0.08, 0.35), (0.01, 0.01, 0.08)), 1.0)
    camera(scene)
    sun(scene, 2.6, (0.9, 0.9, 1.0), rot=(55, 20, -40))
    # moon ground with craters, a smooth band down the middle
    ground(mat((0.62, 0.58, 0.72), 0.95, noise=0.25, noise_scale=18), subdiv=60, bump=0.6, seed=5)
    rnd = random.Random(12)
    for i in range(14):
        side = rnd.choice((-1, 1))
        x = side * rnd.uniform(3.5, 12)
        y = rnd.uniform(-2, 30)
        r = rnd.uniform(0.6, 1.6)
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=r * 0.22, location=(x, y, 0.05))
        t = bpy.context.active_object
        t.scale = (1, 1, 0.35)
        finish(t, mat((0.5, 0.46, 0.6), 0.95))
    # glowing crystals along the edges
    crystal_cols = [(0.3, 0.9, 1.0), (1.0, 0.4, 0.9), (0.6, 0.5, 1.0)]
    for i in range(16):
        side = rnd.choice((-1, 1))
        x = side * rnd.uniform(3.8, 9)
        y = rnd.uniform(-2, 24)
        h = rnd.uniform(0.6, 1.8)
        c = cyl(0.25, h, (x, y, h / 2), mat(crystal_cols[i % 3], 0.1, emit=1.5), verts=6, r2=0.0,
                rot=(rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), 0))
    # planets
    planet(5.5, (-16, 70, 13), (0.95, 0.7, 0.35), ring=(0.95, 0.85, 0.65), spin=1,
           bands=[(-0.3, (0.85, 0.5, 0.25)), (0.25, (1.0, 0.85, 0.55))])
    planet(2.4, (12, 50, 9), (0.9, 0.3, 0.25), spin=-1)
    planet(1.3, (4, 45, 11), (0.3, 0.6, 1.0), spin=1)
    # stars, some twinkling
    star_mat = mat((1, 1, 1), 0.5, emit=6)
    for i in range(260):
        a = rnd.uniform(-1.2, 1.2)
        e = rnd.uniform(0.03, 0.35)
        d = 140
        loc = (math.sin(a) * d, math.cos(a) * d * math.cos(e), math.sin(e) * d)
        s = ball(rnd.uniform(0.15, 0.45), loc, star_mat, seg=6)
        if i % 5 == 0:
            ph = rnd.random()
            base = s.scale.copy()
            animate(s, lambda p, ph=ph: Vector((1, 1, 1)) * (0.6 + 0.6 * (0.5 + 0.5 * math.sin(TAU * (p * 2 + ph)))), "scale")
    # a rocket parked on the left, gently hovering, flame flickering
    rocket = empty((-5.5, 6, 0))
    body_m = mat((0.95, 0.95, 0.98), 0.3)
    red = mat((0.9, 0.12, 0.15), 0.4)
    parts = [
        cyl(0.55, 2.4, (-5.5, 6, 1.9), body_m),
        cyl(0.55, 1.0, (-5.5, 6, 3.6), red, r2=0.0),
        ball(0.25, (-5.5, 5.45, 2.3), mat((0.3, 0.7, 1.0), 0.1, emit=0.6), seg=16),
    ]
    for ang in (0, 120, 240):
        a = math.radians(ang)
        parts.append(box((0.1, 0.6, 0.9), (-5.5 + math.sin(a) * 0.6, 6 + math.cos(a) * 0.6, 0.95), red,
                         bevel=0.03, rot=(0, 0, -a)))
    flame = cyl(0.35, 0.9, (-5.5, 6, 0.3), mat((1.0, 0.6, 0.1), 0.2, emit=4), r2=0.0, rot=(math.pi, 0, 0))
    parts.append(flame)
    for part in parts:
        parent_to(part, rocket)
    animate(rocket, lambda p: Vector((-5.5, 6, 0.6 + 0.2 * math.sin(TAU * p))))
    animate(flame, lambda p: Vector((1, 1, 0.8 + 0.3 * abs(math.sin(TAU * p * 6)))), "scale")
    # a little satellite crossing the sky once per loop
    sat = empty((0, 40, 16))
    sb = box((0.8, 0.8, 0.8), (0, 40, 16), mat((0.85, 0.75, 0.3), 0.3))
    for dx in (-1.4, 1.4):
        parent_to(box((1.6, 0.05, 0.7), (dx, 40, 16), mat((0.15, 0.3, 0.8), 0.2), bevel=0.01), sat)
    parent_to(sb, sat)
    animate(sat, lambda p: Vector((-30 + 60 * p, 40, 16 + 3 * math.sin(TAU * p))))
    animate(sat, lambda p: (0, TAU * p, 0), "rotation_euler")
    return scene


BUILDERS = {"market": build_market, "ocean": build_ocean, "space": build_space}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    names = argv or list(BUILDERS)
    preview = os.environ.get("PREVIEW")  # render a single frame only
    for name in names:
        _mats.clear()
        scene = BUILDERS[name]()
        folder = os.path.join(OUT, name)
        os.makedirs(folder, exist_ok=True)
        if preview:
            scene.frame_set(int(preview))
            scene.render.filepath = os.path.join(OUT, f"{name}-preview.png")
            bpy.ops.render.render(write_still=True)
            continue
        scene.render.filepath = os.path.join(folder, "")
        bpy.ops.render.render(animation=True)
        mp4 = os.path.join(VIDEO, f"{name}.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", os.path.join(folder, "%04d.png"),
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "slow",
                        "-movflags", "+faststart", "-an", mp4], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(folder, "0001.png"),
                        "-q:v", "4", os.path.join(VIDEO, f"{name}-poster.jpg")], check=True)
        print("made", mp4)


main()
