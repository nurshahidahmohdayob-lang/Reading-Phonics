"""
Extra stages for 3D Drawings: a market street, the ocean floor and outer
space, made to sit beside the filmed jungle — soft light, haze, depth of
field, textured ground — as a short film of walking along a path through the
place. Scenery passes on both sides and the middle is left clear for the
children's drawings, so they seem to walk along with you.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/backdrops.py -- [market ocean space]

It loops without a jump because the scenery repeats every PERIOD along the
path (one stretch is built, the rest are copies), the ground's textures are
periodic too, and the camera walks exactly one PERIOD per loop. Far-off things
(the town, the sky, planets, fish) travel with the camera.

Frames go to blender/out/backdrops/<name>/; ffmpeg packs each into
public/video/<name>.mp4 with a poster. PREVIEW=<frame> renders one frame.
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

FRAMES = 192  # 8 seconds at 24 fps
PERIOD = 11.0  # the scenery repeats this often along the path
TILES = [k * PERIOD for k in range(-1, 9)]
W, H = 1280, 720
TAU = math.tau


# ---------- render set-up ----------

def reset(samples=24):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = FRAMES
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    ee = scene.eevee
    ee.taa_render_samples = samples
    ee.use_raytracing = True
    ee.use_shadows = True
    ee.shadow_ray_count = 2
    ee.shadow_step_count = 6
    ee.use_volumetric_shadows = True
    ee.volumetric_tile_size = "4"
    ee.volumetric_samples = 32
    ee.volumetric_end = 140
    ee.use_fast_gi = True
    scene.view_settings.view_transform = "AgX"
    for look in ("AgX - Punchy", "Punchy", "AgX - Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    world = bpy.data.worlds.new("World")
    scene.world = world
    return scene


def glow(scene, threshold=1.0, strength=0.6, saturation=1.35, contrast=10.0):
    """Bright things (bulbs, crystals, lanterns) bleed a soft glow."""
    try:
        ng = bpy.data.node_groups.new("Comp", "CompositorNodeTree")
        ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        rl = ng.nodes.new("CompositorNodeRLayers")
        gl = ng.nodes.new("CompositorNodeGlare")
        out = ng.nodes.new("NodeGroupOutput")
        for attr, val in (("glare_type", "FOG_GLOW"), ("glare_type", "BLOOM")):
            try:
                setattr(gl, attr, val)
            except (TypeError, AttributeError):
                pass
        if "Type" in gl.inputs:
            try:
                gl.inputs["Type"].default_value = "Bloom"
            except TypeError:
                pass
        for name, val in (("Threshold", threshold), ("Strength", strength), ("Size", 0.6)):
            if name in gl.inputs:
                try:
                    gl.inputs[name].default_value = val
                except TypeError:
                    pass
        ng.links.new(rl.outputs["Image"], gl.inputs["Image"])
        # a little more colour and contrast than AgX gives on its own
        hs = ng.nodes.new("CompositorNodeHueSat")
        hs.inputs["Saturation"].default_value = saturation
        bc = ng.nodes.new("CompositorNodeBrightContrast")
        bc.inputs["Contrast"].default_value = contrast
        ng.links.new(gl.outputs["Image"] if "Image" in gl.outputs else gl.outputs[0], hs.inputs["Image"])
        ng.links.new(hs.outputs["Image"], bc.inputs["Image"])
        ng.links.new(bc.outputs["Image"], out.inputs[0])
        scene.compositing_node_group = ng
        scene.render.use_compositing = True
    except Exception as e:  # never let the glow stop a render
        print("glow skipped:", e)


def world_gradient(scene, low, high, strength=1.0):
    scene.world.use_nodes = True
    nt = scene.world.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    bg.inputs[1].default_value = strength
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    nt.links.new(coord.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*low, 1)
    ramp.color_ramp.elements[1].position = 0.4
    ramp.color_ramp.elements[1].color = (*high, 1)
    nt.links.new(ramp.outputs["Color"], bg.inputs[0])
    return nt, bg, ramp


def camera(scene, z=2.6, pitch=84, focus=9.0, fstop=2.8):
    data = bpy.data.cameras.new("Cam")
    data.lens = 30
    data.clip_end = 400
    data.dof.use_dof = True
    data.dof.focus_distance = focus
    data.dof.aperture_fstop = fstop
    cam = bpy.data.objects.new("Cam", data)
    cam.location = (0, -12, z)
    cam.rotation_euler = (math.radians(pitch), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam
    return cam


def walk(cam):
    """Walk one PERIOD down the path over the loop, with a gentle step bob.
    Called last, once everything that travels with the camera is attached."""
    start = cam.location.copy()
    animate(cam, lambda p: start + Vector((0.03 * math.sin(TAU * p * 4), PERIOD * p, 0.05 * math.sin(TAU * p * 8))))


def sun(scene, energy, colour, rot, angle=3):
    data = bpy.data.lights.new("Sun", "SUN")
    data.energy = energy
    data.color = colour
    data.angle = math.radians(angle)
    light = bpy.data.objects.new("Sun", data)
    light.rotation_euler = tuple(math.radians(a) for a in rot)
    scene.collection.objects.link(light)
    return light


def point(loc, colour, energy, radius=0.1):
    data = bpy.data.lights.new("P", "POINT")
    data.energy = energy
    data.color = colour
    data.shadow_soft_size = radius
    o = bpy.data.objects.new("P", data)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    return o


def haze(colour, density, anisotropy=0.3, size=(160, 420, 60), centre=(0, 180, 20)):
    """A big box of thin mist, so far things fade and sunlight shows as rays."""
    m = bpy.data.materials.new("Haze")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == "BSDF_PRINCIPLED":
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (*colour, 1)
    vol.inputs["Density"].default_value = density
    vol.inputs["Anisotropy"].default_value = anisotropy
    nt.links.new(vol.outputs[0], out.inputs["Volume"])
    bpy.ops.mesh.primitive_cube_add(size=1, location=centre)
    o = bpy.context.active_object
    o.scale = size
    o.data.materials.append(m)
    return o


# ---------- materials ----------

_mats = {}


def mat(colour, rough=0.6, emit=0.0, alpha=1.0, sss=0.0, sheen=0.0, coat=0.0, metal=0.0):
    key = (tuple(round(c, 3) for c in colour), rough, emit, alpha, sss, sheen, coat, metal)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new("M")
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*colour, 1)
        b.inputs["Emission Strength"].default_value = emit
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.3, 0.15, 0.1)
    if sheen:
        b.inputs["Sheen Weight"].default_value = sheen
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        m.surface_render_method = "BLENDED"
    _mats[key] = m
    return m


class Tree:
    """A small helper for building node materials."""

    def __init__(self, name):
        self.m = bpy.data.materials.new(name)
        self.m.use_nodes = True
        self.nt = self.m.node_tree
        self.bsdf = next(n for n in self.nt.nodes if n.type == "BSDF_PRINCIPLED")

    def n(self, kind, **inputs):
        node = self.nt.nodes.new(kind)
        for k, v in inputs.items():
            if k in node.inputs:
                node.inputs[k].default_value = v
            else:
                setattr(node, k, v)
        return node

    def link(self, a, b):
        self.nt.links.new(a, b)

    def math(self, op, a, b=None):
        node = self.n("ShaderNodeMath", operation=op)
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                node.inputs[i].default_value = v
            else:
                self.link(v, node.inputs[i])
        return node.outputs[0]

    def ramp(self, fac, stops):
        r = self.n("ShaderNodeValToRGB")
        els = r.color_ramp.elements
        els[0].position, els[0].color = stops[0][0], (*stops[0][1], 1)
        els[1].position, els[1].color = stops[-1][0], (*stops[-1][1], 1)
        for pos, col in stops[1:-1]:
            e = els.new(pos)
            e.color = (*col, 1)
        self.link(fac, r.inputs["Fac"])
        return r.outputs["Color"]

    def coords(self, space="Object"):
        tc = self.n("ShaderNodeTexCoord")
        return tc.outputs[space]

    def periodic(self, phase=None):
        """Object coordinates with y wrapped round a circle, so any texture
        through them repeats exactly every PERIOD along the path."""
        sep = self.n("ShaderNodeSeparateXYZ")
        self.link(self.coords(), sep.inputs[0])
        ang = self.math("MULTIPLY", sep.outputs["Y"], TAU / PERIOD)
        if phase is not None:
            ang = self.math("ADD", ang, phase)
        r = PERIOD / TAU
        u = self.math("MULTIPLY", self.math("COSINE", ang), r)
        v = self.math("MULTIPLY", self.math("SINE", ang), r)
        comb = self.n("ShaderNodeCombineXYZ")
        self.link(sep.outputs["X"], comb.inputs["X"])
        self.link(u, comb.inputs["Y"])
        self.link(v, comb.inputs["Z"])
        return comb.outputs[0]

    def bump(self, height, strength=0.4, distance=0.05):
        b = self.n("ShaderNodeBump", Strength=strength, Distance=distance)
        self.link(height, b.inputs["Height"])
        self.link(b.outputs["Normal"], self.bsdf.inputs["Normal"])

    def set(self, **inputs):
        for k, v in inputs.items():
            if isinstance(v, bpy.types.NodeSocket):
                self.link(v, self.bsdf.inputs[k])
            else:
                self.bsdf.inputs[k].default_value = v
        return self.m


def wood(colour=(0.42, 0.22, 0.09)):
    key = ("wood", colour)
    if key in _mats:
        return _mats[key]
    t = Tree("Wood")
    wave = t.n("ShaderNodeTexWave", wave_type="BANDS", bands_direction="Z", Scale=3.0, Distortion=6.0, Detail=3.0)
    t.link(t.coords("Object"), wave.inputs["Vector"])
    col = t.ramp(wave.outputs["Fac"], [(0.0, tuple(c * 0.7 for c in colour)), (1.0, tuple(min(1, c * 1.25) for c in colour))])
    t.bump(wave.outputs["Fac"], 0.15)
    _mats[key] = t.set(**{"Base Color": col, "Roughness": 0.75})
    return _mats[key]


def cloth(a, b, stripes=7.0, axis="Y"):
    """Striped awning cloth with a soft sheen."""
    key = ("cloth", a, b, stripes, axis)
    if key in _mats:
        return _mats[key]
    t = Tree("Cloth")
    wave = t.n("ShaderNodeTexWave", wave_type="BANDS", bands_direction=axis, Scale=stripes, Distortion=0.0)
    t.link(t.coords("Object"), wave.inputs["Vector"])
    sharp = t.ramp(wave.outputs["Fac"], [(0.48, (0, 0, 0)), (0.52, (1, 1, 1))])
    mix = t.n("ShaderNodeMix", data_type="RGBA")
    mix.inputs[6].default_value = (*a, 1)
    mix.inputs[7].default_value = (*b, 1)
    t.link(sharp, mix.inputs[0])
    _mats[key] = t.set(**{"Base Color": mix.outputs[2], "Roughness": 0.8, "Sheen Weight": 0.6})
    return _mats[key]


# ---------- shapes ----------

def finish(obj, material, smooth=True, bevel=0.0, subsurf=0):
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    if subsurf:
        mod = obj.modifiers.new("Sub", "SUBSURF")
        mod.levels = 1
        mod.render_levels = subsurf
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
    return finish(o, material, smooth=bool(bevel), bevel=bevel)


def ball(r, loc, material, scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=max(6, seg // 2))
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, material)


def cyl(r, depth, loc, material, rot=(0, 0, 0), verts=24, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot, vertices=verts)
    return finish(bpy.context.active_object, material)


def lumpy(r, loc, material, seed, rough=0.35, scale=(1, 1, 1), seg=20):
    """A rock-like ball: each vertex pushed in or out a little."""
    o = ball(r, loc, material, scale=scale, seg=seg)
    rnd = random.Random(seed)
    for v in o.data.vertices:
        v.co *= 1 + rnd.uniform(-rough, rough) * 0.5
    sub = o.modifiers.new("Sub", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return o


def ground(material, bump=0.0, seed=1, width=80):
    """A long floor whose bumps repeat every PERIOD along the path, the middle
    strip kept flat for the drawings to stand on."""
    reps = 25
    length = PERIOD * reps
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=81, y_subdivisions=reps * 8 + 1, size=1,
                                    location=(0, -20 + length / 2, 0))
    o = bpy.context.active_object
    o.scale = (width, length, 1)
    bpy.ops.object.transform_apply(scale=True)
    if bump:
        k = TAU / PERIOD
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            side = min(1.0, max(0.0, (abs(w.x) - 3.0) / 6.0))
            z = 0.5 * math.sin(w.x * 0.7 + seed) * math.cos(k * 2 * w.y) + 0.3 * math.sin(w.x * 1.9 + seed * 2) * math.sin(k * 3 * w.y + w.x)
            v.co.z += bump * z * (0.2 + side)
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


def animate_value(socket, fn):
    for f in range(1, FRAMES + 1):
        socket.default_value = fn((f - 1) / FRAMES)
        socket.keyframe_insert("default_value", frame=f)


def tri(points, material):
    mesh = bpy.data.meshes.new("Tri")
    mesh.from_pydata(points, [], [(0, 1, 2)])
    o = bpy.data.objects.new("Tri", mesh)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material)
    return o


def tile(build_one):
    """Build one stretch of path (build_one(0)), then fill the rest of TILES
    with copies of it that share its shapes and animation — quick to make
    and the same in every repeat, which is what keeps the loop seamless."""
    before = set(bpy.data.objects)
    build_one(0.0)
    new = [o for o in bpy.data.objects if o not in before]
    root = empty((0, 0, 0))
    for o in new:
        if o.parent is None:
            parent_to(o, root)
    for oy in TILES:
        if oy == 0:
            continue
        r2 = root.copy()
        bpy.context.scene.collection.objects.link(r2)
        r2.location = (0, oy, 0)
        copies = {root: r2}
        for o in new:
            c = o.copy()
            bpy.context.scene.collection.objects.link(c)
            copies[o] = c
        for o in new:
            copies[o].parent = copies[o.parent]
            copies[o].matrix_parent_inverse = o.matrix_parent_inverse.copy()


def follow(cam, *objs):
    """Things far away (or flying with us) that stay put as we walk."""
    for o in objs:
        parent_to(o, cam)


# ---------- the market ----------

FRUIT = [(1.0, 0.38, 0.02), (0.75, 0.03, 0.04), (1.0, 0.78, 0.04), (0.35, 0.7, 0.08), (0.45, 0.08, 0.4), (1.0, 0.55, 0.3)]
STRIPES = [((0.85, 0.06, 0.08), (1, 0.97, 0.9)), ((0.04, 0.35, 0.8), (1, 0.97, 0.9)), ((0.08, 0.5, 0.2), (1, 0.93, 0.65)),
           ((1.0, 0.5, 0.0), (1, 0.93, 0.65)), ((0.5, 0.15, 0.65), (1, 0.97, 0.9))]


def awning(x, y, side, a, b):
    """Cloth sloping down toward the street, gently rippled, with a scalloped edge."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=10, y_subdivisions=24, size=1, location=(x - side * 0.15, y, 3.0))
    o = bpy.context.active_object
    o.scale = (1.9, 2.9, 1)
    bpy.ops.object.transform_apply(scale=True)
    cx = x - side * 0.15  # (the grid's shape is in world coordinates)
    for v in o.data.vertices:
        v.co.z += 0.05 * math.sin(v.co.y * 9) + 0.28 * (v.co.x - cx) * side
    finish(o, cloth(a, b, stripes=4.5), subsurf=1)
    sol = o.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = 0.03
    edge_x = x - side * 1.1
    for i in range(7):
        ball(0.21, (edge_x, y - 1.45 + (i + 0.5) * 2.9 / 7, 2.7), mat(a if i % 2 == 0 else b, 0.8, sheen=0.5),
             scale=(0.2, 1, 0.75), seg=14)


def fruit_pile(x, y, z, w, d, rnd):
    """Fruit stacked in a little pyramid."""
    layer = 0
    r = 0.13
    while w > r * 2 and d > r * 2 and layer < 3:
        nx, ny = int(w / (r * 2)), int(d / (r * 2))
        m = mat(FRUIT[rnd.randrange(len(FRUIT))], 0.35, sss=0.15, coat=0.3)
        for i in range(nx):
            for j in range(ny):
                ball(r * rnd.uniform(0.9, 1.05), (x - w / 2 + r + i * 2 * r, y - d / 2 + r + j * 2 * r, z + r + layer * r * 1.6),
                     m, seg=12)
        w -= r * 2
        d -= r * 2
        layer += 1


def stall(x, y, side, seed):
    """A stall on the left (side=-1) or right (side=1) of the street, facing it."""
    rnd = random.Random(seed)
    front = x - side * 0.6
    box((1.2, 2.6, 0.95), (x, y, 0.47), wood((0.5, 0.27, 0.1)), bevel=0.03)
    box((1.4, 2.8, 0.1), (x, y, 0.99), wood((0.36, 0.18, 0.07)), bevel=0.02)
    for dx in (-0.6, 0.6):
        for dy in (-1.3, 1.3):
            h = 2.6 if dx * side < 0 else 3.3
            cyl(0.07, h, (x + dx, y + dy, h / 2), wood((0.3, 0.15, 0.06)), verts=12)
    a, b = STRIPES[seed % len(STRIPES)]
    awning(x, y, side, a, b)
    for dy in (-0.75, 0.0, 0.75):
        fruit_pile(x - side * 0.1, y + dy, 1.04, 0.62, 0.62, rnd)
    for dy in (-0.8, 0.8):
        bx = front - side * 0.45
        cyl(0.32, 0.4, (bx, y + dy, 0.2), wood((0.65, 0.42, 0.2)), verts=20, r2=0.38)
        fruit_pile(bx, y + dy, 0.28, 0.5, 0.5, rnd)
    # a paper lantern under the awning
    ball(0.2, (front - side * 0.15, y + rnd.uniform(-0.9, 0.9), 2.35), mat((1.0, 0.25, 0.08), 0.7, emit=2.0, sss=0.5),
         scale=(1, 1, 1.25), seg=16)


def string_lights(y, height):
    """Warm bulbs strung across the street between the stalls."""
    bulb = mat((1.0, 0.72, 0.35), 0.3, emit=12.0)
    wire = mat((0.08, 0.06, 0.05), 0.6)
    n = 17
    for i in range(n):
        t = i / (n - 1)
        x = -4.6 + 9.2 * t
        z = height - 0.7 * math.sin(math.pi * t)
        ball(0.06, (x, y, z - 0.08), bulb, seg=8)
        if i < n - 1:
            t2 = (i + 1) / (n - 1)
            x2, z2 = -4.6 + 9.2 * t2, height - 0.7 * math.sin(math.pi * t2)
            ang = math.atan2(z2 - z, x2 - x)
            cyl(0.01, math.hypot(x2 - x, z2 - z), ((x + x2) / 2, y, (z + z2) / 2), wire, rot=(0, math.pi / 2 - ang, 0), verts=6)


def bunting(y, height, colours, phase0):
    count = 15
    for i in range(count):
        t = (i + 0.5) / count
        x = -4.8 + 9.6 * t
        sag = -0.55 * math.sin(math.pi * t)
        flag = tri([(-0.22, 0, 0), (0.22, 0, 0), (0, 0, -0.5)], mat(colours[i % len(colours)], 0.7, sheen=0.4))
        flag.location = (x, y, height + sag)
        ph = phase0 + i * 0.35
        animate(flag, lambda p, ph=ph: (math.radians(14) * math.sin(TAU * p * 2 + ph), 0, 0), "rotation_euler")


def potted_plant(x, y, seed):
    rnd = random.Random(seed)
    cyl(0.28, 0.5, (x, y, 0.25), mat((0.7, 0.3, 0.15), 0.8), verts=16, r2=0.36)
    leaf = mat((0.12, 0.42, 0.08), 0.6, sss=0.2)
    for i in range(7):
        lumpy(rnd.uniform(0.2, 0.32), (x + rnd.uniform(-0.2, 0.2), y + rnd.uniform(-0.2, 0.2), 0.7 + rnd.uniform(0, 0.4)), leaf, seed + i)


def town(cam):
    """The town at the end of the street: shop houses, a clock tower, trees —
    it stays ahead of us as we walk."""
    rnd = random.Random(4)
    plaster = [(0.95, 0.72, 0.5), (0.9, 0.5, 0.42), (0.55, 0.75, 0.9), (0.98, 0.85, 0.5), (0.7, 0.85, 0.62), (0.95, 0.88, 0.78)]
    roof = mat((0.62, 0.18, 0.1), 0.7)
    win = mat((1.0, 0.75, 0.4), 0.3, emit=3.0)
    dark = mat((0.15, 0.25, 0.35), 0.15)
    sill = mat((0.95, 0.93, 0.88), 0.7)
    far = []
    x = -20.0
    while x < 20:
        w = rnd.uniform(2.6, 3.6)
        h = rnd.uniform(4.5, 8.0)
        if abs(x + w / 2) < 2.4:  # leave room for the clock tower
            x += w
            continue
        hy = 38
        far.append(box((w, 3, h), (x + w / 2, hy, h / 2), mat(plaster[rnd.randrange(len(plaster))], 0.85), bevel=0.05))
        far.append(cyl(w * 0.6, 3.2, (x + w / 2, hy, h + 0.55), roof, rot=(math.radians(90), 0, 0), verts=3))
        for wy in range(int((h - 1) // 1.6)):
            for wx in (-0.6, 0.6):
                far.append(box((0.55, 0.1, 0.75), (x + w / 2 + wx, hy - 1.52, 1.3 + wy * 1.6), win if rnd.random() < 0.5 else dark, bevel=0.02))
                far.append(box((0.7, 0.2, 0.08), (x + w / 2 + wx, hy - 1.55, 0.88 + wy * 1.6), sill, bevel=0.01))
        x += w + 0.05
    # clock tower in the middle
    far.append(box((2.6, 2.6, 12), (0, 42, 6), mat((0.92, 0.8, 0.62), 0.85), bevel=0.06))
    far.append(cyl(2.0, 3.0, (0, 42, 13.5), roof, verts=4, r2=0.0))
    far.append(cyl(0.85, 0.15, (0, 40.65, 9.5), mat((1.0, 0.95, 0.8), 0.4, emit=1.5), rot=(math.radians(90), 0, 0), verts=32))
    far.append(box((0.08, 0.05, 0.6), (0, 40.55, 9.75), mat((0.1, 0.08, 0.06), 0.5), bevel=0))
    far.append(box((0.45, 0.05, 0.08), (0.2, 40.55, 9.5), mat((0.1, 0.08, 0.06), 0.5), bevel=0))
    # trees between the street's end and the houses
    leaf = mat((0.15, 0.45, 0.1), 0.7, sss=0.2)
    for tx in (-7, -4.2, 4.2, 7, -11, 11):
        far.append(cyl(0.18, 2.5, (tx, 33, 1.25), wood((0.3, 0.17, 0.08)), verts=10))
        for i in range(5):
            far.append(lumpy(rnd.uniform(0.8, 1.2), (tx + rnd.uniform(-0.6, 0.6), 33 + rnd.uniform(-0.4, 0.4), 3 + rnd.uniform(0, 1.0)), leaf, int(tx * 10) + i))
    # a strip of ground under the town, hiding where the street ends
    far.append(box((60, 16, 0.04), (0, 39, 0.02), mat((0.5, 0.35, 0.22), 0.9), bevel=0))
    follow(cam, *far)


def build_market():
    scene = reset()
    cam = camera(scene, focus=10.0, fstop=3.5)
    world_gradient(scene, (0.55, 0.75, 1.0), (0.12, 0.38, 1.0), 1.1)
    sun(scene, 4.5, (1.0, 0.78, 0.5), rot=(62, 0, -38), angle=2)
    haze((1.0, 0.88, 0.7), 0.002, 0.5)
    glow(scene, threshold=1.2, strength=0.5)
    # cobbles: periodic stones with mortar between
    t = Tree("Cobbles")
    vor = t.n("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE", Scale=2.2)
    t.link(t.periodic(), vor.inputs["Vector"])
    vor2 = t.n("ShaderNodeTexVoronoi", Scale=2.2)
    t.link(t.periodic(), vor2.inputs["Vector"])
    mortar = t.ramp(vor.outputs["Distance"], [(0.0, (0, 0, 0)), (0.08, (1, 1, 1))])
    stone = t.ramp(vor2.outputs["Color"], [(0.0, (0.45, 0.3, 0.2)), (0.5, (0.62, 0.45, 0.3)), (1.0, (0.55, 0.42, 0.33))])
    mix = t.n("ShaderNodeMix", data_type="RGBA")
    mix.inputs[6].default_value = (0.22, 0.15, 0.1, 1)
    t.link(mortar, mix.inputs[0])
    t.link(stone, mix.inputs[7])
    sep = t.n("ShaderNodeSeparateColor")
    t.link(mortar, sep.inputs[0])
    t.bump(sep.outputs[0], 0.6, 0.08)
    ground(t.set(**{"Base Color": mix.outputs[2], "Roughness": 0.85}))

    bunting_cols = [(0.9, 0.08, 0.12), (1.0, 0.75, 0.0), (0.05, 0.45, 0.9), (0.15, 0.65, 0.25), (1.0, 0.4, 0.65)]
    balloon_cols = [(1, 0.12, 0.2), (0.12, 0.5, 1), (1, 0.8, 0.05)]

    def one(oy):
        for i, dy in enumerate((0.0, PERIOD / 2)):
            stall(-5.3, oy + dy, -1, i * 2)
            stall(5.3, oy + dy, 1, i * 2 + 1)
            potted_plant(-4.4, oy + dy + 2.1, i * 7)
            potted_plant(4.4, oy + dy + 2.1, i * 7 + 3)
        string_lights(oy + 2.75, 4.3)
        bunting(oy + 8.25, 4.6, bunting_cols, 0)
        for j, c in enumerate(balloon_cols):
            b = ball(0.36, (0, 0, 0), mat(c, 0.2, coat=0.8), scale=(1, 1, 1.18))
            base = Vector((-4.6 + (j - 1) * 0.42, oy + PERIOD / 2, 3.9 + j * 0.28))
            animate(b, lambda p, base=base, j=j: base + Vector((0.08 * math.sin(TAU * p + j), 0, 0.12 * math.sin(TAU * p + j * 2))))

    tile(one)
    town(cam)
    cloud_mat = mat((1, 0.95, 0.9), 0.9, sss=0.3)
    for k, (cy, cz) in enumerate(((70, 20), (80, 27), (65, 30))):
        c = empty((0, 0, 0))
        for dx, r in ((-1.6, 1.4), (0, 2.0), (1.7, 1.5), (0.6, 1.2)):
            parent_to(lumpy(r, (dx, 0, 0.4 if r > 1.8 else 0), cloud_mat, k * 9 + int(r * 10), scale=(1.4, 0.6, 0.9)), c)
        start = -45 + k * 30
        animate(c, lambda p, start=start, cy=cy, cz=cz: Vector(((start + 90 * p + 45) % 90 - 45, cy, cz)))
        follow(cam, c)
    walk(cam)
    return scene


# ---------- the ocean ----------

def kelp(x, y, h, ph):
    """A tall ribbon of kelp swaying in the current."""
    segs = 7
    prev = empty((x, y, 0))
    m = mat((0.3, 0.55, 0.1), 0.5, sss=0.4)
    for i in range(segs):
        joint = empty((x, y, i * h / segs))
        parent_to(joint, prev)
        blade = cyl(0.1 * (1 - i / (segs + 2)) + 0.03, h / segs * 1.25, (x, y, i * h / segs + h / segs / 2), m, verts=8)
        blade.scale = (1.3, 0.5, 1)
        parent_to(blade, joint)
        leafy = ball(0.24, (x + (0.2 if i % 2 else -0.2), y, i * h / segs + h / segs * 0.7), m, scale=(0.45, 0.12, 1.3), seg=12)
        leafy.rotation_euler = (0, 0.5 if i % 2 else -0.5, 0)
        parent_to(leafy, joint)
        animate(joint, lambda p, i=i: (math.radians(4 + i * 1.5) * math.sin(TAU * p * 2 + ph + i * 0.45), 0, 0), "rotation_euler")
        prev = joint


def brain_coral(x, y, r, colour, seed):
    t = Tree("Brain")
    vor = t.n("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE", Scale=6.0)
    t.link(t.coords("Object"), vor.inputs["Vector"])
    t.bump(vor.outputs["Distance"], 0.8, 0.1)
    m = t.set(**{"Base Color": (*colour, 1), "Roughness": 0.6, "Subsurface Weight": 0.3})
    return lumpy(r, (x, y, r * 0.3), m, seed, rough=0.15, scale=(1, 1, 0.7))


def branch_coral(x, y, colour, seed, scale=1.0):
    rnd = random.Random(seed)
    m = mat(colour, 0.55, sss=0.35)
    for i in range(8):
        h = rnd.uniform(0.6, 1.6) * scale
        ang = rnd.uniform(-0.6, 0.6)
        cx = x + rnd.uniform(-0.5, 0.5) * scale
        cy = y + rnd.uniform(-0.4, 0.4) * scale
        cyl(0.11 * scale, h, (cx, cy, h / 2), m, rot=(ang * 0.5, ang, 0), verts=10, r2=0.06 * scale)
        ball(0.15 * scale, (cx + math.sin(ang) * h / 2, cy, h * math.cos(ang * 0.5)), m, seg=12)


def tube_sponge(x, y, colour, seed):
    """A cluster of open tubes, like sponges on a reef."""
    rnd = random.Random(seed)
    m = mat(colour, 0.7, sss=0.3)
    inner = mat(tuple(c * 0.35 for c in colour), 0.9)
    for i in range(5):
        h = rnd.uniform(0.5, 1.4)
        r = rnd.uniform(0.14, 0.22)
        cx, cy = x + rnd.uniform(-0.45, 0.45), y + rnd.uniform(-0.35, 0.35)
        cyl(r, h, (cx, cy, h / 2), m, verts=16, r2=r * 1.25)
        cyl(r * 0.95, 0.05, (cx, cy, h + 0.005), inner, verts=16)


def fish(colour, size=1.0, stripe=(1, 1, 1)):
    """One fish, made at the origin facing +x; returns its holder."""
    holder = empty((0, 0, 0))
    m = mat(colour, 0.3, coat=0.5)
    eye = mat((0.02, 0.02, 0.04), 0.1, coat=1)
    parts = [
        ball(0.42 * size, (0, 0, 0), m, scale=(1.45, 0.5, 0.95)),
        cyl(0.38 * size, 0.55 * size, (-0.72 * size, 0, 0), m, rot=(0, math.radians(90), 0), verts=3, r2=0.0),
        ball(0.43 * size, (0.12 * size, 0, 0), mat(stripe, 0.3), scale=(0.2, 0.52, 0.97)),
        ball(0.08 * size, (0.38 * size, -0.19 * size, 0.1 * size), eye, seg=10),
        ball(0.08 * size, (0.38 * size, 0.19 * size, 0.1 * size), eye, seg=10),
    ]
    parts[1].scale = (1, 0.25, 1)
    for p in parts:
        parent_to(p, holder)
    return holder


def jelly(x, y, z, ph):
    """A glowing jellyfish bobbing gently."""
    j = empty((x, y, z))
    bell = mat((1.0, 0.45, 0.8), 0.2, emit=1.2, alpha=0.6)
    parent_to(ball(0.45, (x, y, z), bell, scale=(1, 1, 0.7), seg=20), j)
    tent = mat((1.0, 0.7, 0.9), 0.3, emit=0.8, alpha=0.5)
    for i in range(6):
        a = TAU * i / 6
        parent_to(cyl(0.025, 1.2, (x + 0.25 * math.cos(a), y + 0.25 * math.sin(a), z - 0.6), tent, verts=6), j)
    animate(j, lambda p: Vector((x, y, z + 0.35 * math.sin(TAU * p + ph))))
    return j


def build_ocean():
    scene = reset()
    cam = camera(scene, z=2.4, pitch=85, focus=9.0, fstop=3.0)
    world_gradient(scene, (0.02, 0.3, 0.42), (0.01, 0.12, 0.25), 0.8)
    sun(scene, 5.0, (0.85, 1.0, 0.95), rot=(18, -6, 8), angle=3)
    haze((0.25, 0.75, 0.85), 0.03, 0.7)
    glow(scene, threshold=1.0, strength=0.5)
    # rippled sand, periodic along the path
    t = Tree("Sand")
    wave = t.n("ShaderNodeTexWave", wave_type="BANDS", bands_direction="X", Scale=1.2, Distortion=3.0, Detail=2.0)
    t.link(t.periodic(), wave.inputs["Vector"])
    noise = t.n("ShaderNodeTexNoise", Scale=4.0, Detail=6.0)
    t.link(t.periodic(), noise.inputs["Vector"])
    col = t.ramp(noise.outputs["Fac"], [(0.3, (0.72, 0.55, 0.3)), (0.7, (0.9, 0.75, 0.48))])
    t.bump(wave.outputs["Fac"], 0.35, 0.06)
    # sunlight through the waves: bright wavy lines dancing on the sand
    phase = t.n("ShaderNodeValue")
    animate_value(phase.outputs[0], lambda p: TAU * p)
    pc = t.periodic(phase.outputs[0])
    wobble = t.n("ShaderNodeTexNoise", Scale=1.5, Detail=2.0)
    t.link(pc, wobble.inputs["Vector"])
    bend = t.n("ShaderNodeVectorMath", operation="MULTIPLY_ADD")
    t.link(wobble.outputs["Color"], bend.inputs[0])
    bend.inputs[1].default_value = (0.6, 0.6, 0.6)
    t.link(pc, bend.inputs[2])
    caustic = t.n("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE", Scale=2.4)
    t.link(bend.outputs[0], caustic.inputs["Vector"])
    lines = t.ramp(caustic.outputs["Distance"], [(0.0, (0.75, 1.0, 0.95)), (0.035, (0, 0, 0))])
    t.set(**{"Base Color": col, "Roughness": 0.95, "Emission Strength": 0.45})
    t.link(lines, t.bsdf.inputs["Emission Color"])
    ground(t.m, bump=0.5, seed=3)

    corals = [(1.0, 0.25, 0.4), (1.0, 0.45, 0.08), (0.55, 0.2, 0.9), (1.0, 0.8, 0.15), (0.1, 0.75, 0.7), (0.95, 0.35, 0.6)]
    bub = mat((0.85, 0.97, 1.0), 0.02, emit=0.8, alpha=0.5)
    rock = mat((0.36, 0.38, 0.42), 0.9)

    def one(oy):
        rnd = random.Random(8)  # the same reef in every repeat
        for side in (-1, 1):
            for i in range(3):
                y = oy + i * PERIOD / 3 + rnd.uniform(-0.8, 0.8)
                c = corals[rnd.randrange(len(corals))]
                kind = (i + (side > 0)) % 3
                cx = side * rnd.uniform(4.0, 6.8)
                if kind == 0:
                    branch_coral(cx, y, c, seed=i * 10 + side, scale=rnd.uniform(1.0, 1.6))
                elif kind == 1:
                    brain_coral(cx, y, rnd.uniform(0.6, 0.9), c, seed=i * 10 + side)
                else:
                    tube_sponge(cx, y, c, seed=i * 10 + side)
                kelp(side * rnd.uniform(3.6, 8), y + 1.6, rnd.uniform(3.5, 6.5), rnd.uniform(0, 6))
                lumpy(rnd.uniform(0.6, 1.3), (side * rnd.uniform(5.5, 9), y + 2.2, 0), rock, i * 3 + side, scale=(1.3, 1, 0.6))
        for i in range(2):
            star = cyl(0.3, 0.06, (rnd.uniform(-2.5, 2.5), oy + rnd.uniform(0, PERIOD), 0.08), mat((1.0, 0.4, 0.2), 0.6), verts=5)
            star.rotation_euler = (0, 0, rnd.uniform(0, 6))
        for i in range(5):
            bx = rnd.choice((-1, 1)) * rnd.uniform(2.5, 7)
            by = oy + rnd.uniform(0, PERIOD)
            off = rnd.random()
            b = ball(rnd.uniform(0.05, 0.12), (bx, by, 0), bub, seg=10)
            animate(b, lambda p, bx=bx, by=by, off=off: Vector((bx + 0.15 * math.sin(TAU * (p * 3 + off)), by, ((p + off) % 1.0) * 10)))
        jelly(4.5, oy + 6, 4.8, 0.0)

    tile(one)
    # fish swimming alongside us: a few bright ones and a silver school
    for (y, z, colour, d, off, size, stripe) in ((8, 3.0, (1.0, 0.4, 0.02), 1, 0.0, 1.0, (1, 1, 1)),
                                                 (12, 4.2, (0.1, 0.4, 1.0), -1, 0.35, 1.1, (1.0, 0.85, 0.1)),
                                                 (16, 2.4, (1.0, 0.8, 0.05), 1, 0.6, 0.9, (0.1, 0.1, 0.1)),
                                                 (6, 4.6, (1.0, 0.25, 0.5), -1, 0.8, 0.8, (1, 1, 1))):
        f = fish(colour, size, stripe)
        if d < 0:
            f.rotation_euler = (0, 0, math.pi)
        animate(f, lambda p, y=y, z=z, d=d, off=off: Vector((d * (((p + off) % 1.0) * 34 - 17), y, z + 0.25 * math.sin(TAU * p * 2 + off * 7))))
        follow(cam, f)
    school = empty((0, 0, 0))
    rnd = random.Random(21)
    for i in range(24):
        f = fish((0.7, 0.78, 0.85), 0.35, (0.2, 0.45, 0.8))
        f.location = (rnd.uniform(-1.5, 1.5), rnd.uniform(-1, 1), rnd.uniform(-0.6, 0.6))
        parent_to(f, school)
    school.rotation_euler = (0, 0, math.pi)
    animate(school, lambda p: Vector((-(p * 40 - 20), 14, 5.2 + 0.4 * math.sin(TAU * p))))
    follow(cam, school)
    follow(cam, box((160, 1, 60), (0, 55, 10), mat((0.02, 0.25, 0.38), 1.0, emit=0.4), bevel=0))
    walk(cam)
    return scene


# ---------- outer space ----------

def planet(r, loc, colour, colour2, ring=False, spin=1, glow_col=None):
    t = Tree("Planet")
    wave = t.n("ShaderNodeTexWave", wave_type="BANDS", bands_direction="Z", Scale=2.5, Distortion=4.0, Detail=3.0)
    t.link(t.coords("Generated"), wave.inputs["Vector"])
    col = t.ramp(wave.outputs["Fac"], [(0.0, colour), (1.0, colour2)])
    t.set(**{"Base Color": col, "Roughness": 0.7})
    if glow_col:
        lw = t.n("ShaderNodeLayerWeight", Blend=0.4)
        rim = t.ramp(lw.outputs["Facing"], [(0.5, (0, 0, 0)), (1.0, glow_col)])
        t.link(rim, t.bsdf.inputs["Emission Color"])
        t.bsdf.inputs["Emission Strength"].default_value = 2.0
    p = ball(r, loc, t.m, seg=64)
    parts = [p]
    if ring:
        bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.75, minor_radius=r * 0.3, location=loc, major_segments=96)
        tr = bpy.context.active_object
        tr.scale = (1, 1, 0.04)
        tr.rotation_euler = (math.radians(72), math.radians(14), 0)
        rt = Tree("Ring")
        rw = rt.n("ShaderNodeTexWave", wave_type="RINGS", Scale=6.0, Distortion=1.0)
        rt.link(rt.coords("Object"), rw.inputs["Vector"])
        rcol = rt.ramp(rw.outputs["Fac"], [(0.0, (0.75, 0.6, 0.45)), (1.0, (1.0, 0.92, 0.75))])
        finish(tr, rt.set(**{"Base Color": rcol, "Roughness": 0.6}))
        parts.append(tr)
    animate(p, lambda ph: (0, 0, TAU * ph * spin), "rotation_euler")
    return parts


def nebula_sky(scene):
    """Purple-blue clouds of gas and a field of stars, painted on the sky."""
    scene.world.use_nodes = True
    nt = scene.world.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.6
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.6
    nt.links.new(tc.outputs["Generated"], noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.35, (0.004, 0.003, 0.02, 1)
    els[1].position, els[1].color = 0.8, (0.6, 0.15, 0.55, 1)
    e = els.new(0.6)
    e.color = (0.08, 0.06, 0.35, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    stars = nt.nodes.new("ShaderNodeTexVoronoi")
    stars.inputs["Scale"].default_value = 220.0
    nt.links.new(tc.outputs["Generated"], stars.inputs["Vector"])
    sramp = nt.nodes.new("ShaderNodeValToRGB")
    se = sramp.color_ramp.elements
    se[0].position, se[0].color = 0.0, (6, 6, 6, 1)
    se[1].position, se[1].color = 0.035, (0, 0, 0, 1)
    nt.links.new(stars.outputs["Distance"], sramp.inputs["Fac"])
    add = nt.nodes.new("ShaderNodeMix")
    add.data_type = "RGBA"
    add.blend_type = "ADD"
    add.inputs[0].default_value = 1.0
    nt.links.new(ramp.outputs["Color"], add.inputs[6])
    nt.links.new(sramp.outputs["Color"], add.inputs[7])
    nt.links.new(add.outputs[2], bg.inputs[0])
    bg.inputs[1].default_value = 1.0


def build_space():
    scene = reset()
    cam = camera(scene, focus=10.0, fstop=3.5)
    nebula_sky(scene)
    sun(scene, 3.5, (0.85, 0.85, 1.0), rot=(58, 15, -35), angle=1)
    glow(scene, threshold=0.9, strength=0.8)
    # moon dust with craters, periodic along the path
    t = Tree("Moon")
    vor = t.n("ShaderNodeTexVoronoi", Scale=0.45)
    t.link(t.periodic(), vor.inputs["Vector"])
    crater = t.ramp(vor.outputs["Distance"], [(0.0, (0.2, 0.2, 0.2)), (0.3, (0.0, 0.0, 0.0)), (0.36, (1, 1, 1)), (0.5, (0.5, 0.5, 0.5))])
    noise = t.n("ShaderNodeTexNoise", Scale=6.0, Detail=8.0)
    t.link(t.periodic(), noise.inputs["Vector"])
    sep = t.n("ShaderNodeSeparateColor")
    t.link(crater, sep.inputs[0])
    hgt = t.math("ADD", sep.outputs[0], t.math("MULTIPLY", noise.outputs["Fac"], 0.4))
    t.bump(hgt, 0.45, 0.15)
    col = t.ramp(noise.outputs["Fac"], [(0.3, (0.32, 0.3, 0.42)), (0.7, (0.55, 0.52, 0.66))])
    ground(t.set(**{"Base Color": col, "Roughness": 0.95}), bump=0.6, seed=5)
    crystal_cols = [(0.2, 0.85, 1.0), (1.0, 0.3, 0.85), (0.55, 0.4, 1.0)]
    rockm = mat((0.35, 0.33, 0.45), 0.9)

    def one(oy):
        rnd = random.Random(12)  # the same moonscape in every repeat
        for i in range(6):
            side = 1 if i % 2 else -1
            cx, cy = side * rnd.uniform(4.0, 8.5), oy + rnd.uniform(0, PERIOD)
            col = crystal_cols[i % 3]
            cm = mat(col, 0.05, emit=3.0, alpha=0.85)
            for k in range(rnd.randint(3, 5)):
                h = rnd.uniform(0.6, 1.9)
                cyl(0.22, h, (cx + rnd.uniform(-0.4, 0.4), cy + rnd.uniform(-0.4, 0.4), h / 2), cm, verts=6, r2=0.0,
                    rot=(rnd.uniform(-0.4, 0.4), rnd.uniform(-0.4, 0.4), 0))
            point((cx, cy, 0.8), col, 60, 0.3)
        for i in range(4):
            side = 1 if i % 2 else -1
            lumpy(rnd.uniform(0.4, 1.1), (side * rnd.uniform(4, 11), oy + rnd.uniform(0, PERIOD), 0.1), rockm, i + 40, rough=0.5,
                  scale=(1.2, 1, 0.7))

    tile(one)
    far = []
    far += planet(6.0, (-17, 75, 14), (0.85, 0.5, 0.2), (1.0, 0.85, 0.6), ring=True, spin=1, glow_col=(1.0, 0.7, 0.4))
    far += planet(2.6, (13, 55, 10), (0.7, 0.15, 0.12), (1.0, 0.45, 0.3), spin=-1, glow_col=(1.0, 0.4, 0.3))
    far += planet(1.4, (4.5, 48, 12), (0.05, 0.3, 0.9), (0.2, 0.75, 0.5), spin=1, glow_col=(0.4, 0.7, 1.0))
    # our rocket, flying alongside on the left, flame flickering
    rocket = empty((-5.0, 6, 0))
    body_m = mat((0.92, 0.92, 0.96), 0.25, coat=0.6, metal=0.3)
    red = mat((0.85, 0.08, 0.1), 0.35, coat=0.5)
    parts = [
        cyl(0.55, 2.4, (-5.0, 6, 1.9), body_m, verts=32),
        cyl(0.55, 1.0, (-5.0, 6, 3.6), red, r2=0.0, verts=32),
        ball(0.25, (-5.0, 5.45, 2.3), mat((0.3, 0.7, 1.0), 0.05, emit=1.0, coat=1), seg=16),
        cyl(0.6, 0.15, (-5.0, 6, 0.75), red, verts=32),
    ]
    for ang in (0, 120, 240):
        a = math.radians(ang)
        parts.append(box((0.1, 0.6, 0.9), (-5.0 + math.sin(a) * 0.6, 6 + math.cos(a) * 0.6, 0.95), red, bevel=0.03, rot=(0, 0, -a)))
    flame = cyl(0.35, 1.1, (-5.0, 6, 0.15), mat((1.0, 0.55, 0.1), 0.2, emit=8), r2=0.0, rot=(math.pi, 0, 0))
    parts.append(flame)
    parts.append(point((-5.0, 6, 0.0), (1.0, 0.6, 0.2), 200, 0.3))
    for part in parts:
        parent_to(part, rocket)
    animate(rocket, lambda p: Vector((-5.0, 6, 1.6 + 0.25 * math.sin(TAU * p * 2))))
    animate(flame, lambda p: Vector((1, 1, 0.8 + 0.35 * abs(math.sin(TAU * p * 6)))), "scale")
    far.append(rocket)
    # a shooting star once per loop
    streak = cyl(0.04, 4.0, (0, 0, 0), mat((1, 0.95, 0.85), 0.1, emit=20), rot=(0, math.radians(75), 0), verts=8, r2=0.0)
    animate(streak, lambda p: Vector((30 - 160 * p, 90, 30 - 40 * p)))
    far.append(streak)
    follow(cam, *[o for o in far if o.parent is None])
    walk(cam)
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
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "slow",
                        "-movflags", "+faststart", "-an", mp4], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(folder, "0001.png"),
                        "-q:v", "4", os.path.join(VIDEO, f"{name}-poster.jpg")], check=True)
        print("made", mp4)


main()
