"""
Renders the island's 2.5D art: grass and sand blocks and clouds, seen from the
same isometric camera, as transparent PNGs in blender/out/.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/island.py
    python3 scripts/island-art.py      # → src/island/art.ts (inlined WebP)

Or both at once: npm run island:art

The camera is orthographic, tipped 60° from straight down and turned 45°, which
gives the classic 2:1 isometric diamond. A block's top-face centre lands on the
centre of its image, so the app places a block by putting the image's centre
on the tile. SPRITE.diamond in the output says how wide the top face is in the
image, so the app can scale the image to whatever tile size it lays out.
"""

import json
import math
import os
import random

import bpy
from mathutils import Euler, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

SIZE = 256
ORTHO = 1.7  # scene units across the image
HEIGHT = 0.5  # how deep a block is below its top face


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.film_transparent = True
    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # Bright toy colours: the default view transform greys them out.
    try:
        scene.view_settings.view_transform = "Standard"
    except TypeError:
        pass
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.75, 0.88, 1.0, 1)
    bg.inputs[1].default_value = 0.9
    return scene


def camera(scene, size=SIZE, ortho=ORTHO, target=(0, 0, 0)):
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = ortho
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    rot = Euler((math.radians(60), 0, math.radians(45)))
    cam.rotation_euler = rot
    back = rot.to_matrix() @ Vector((0, 0, 1))
    cam.location = Vector(target) + back * 20
    cam.data.clip_end = 100
    scene.camera = cam


def sun(scene):
    data = bpy.data.lights.new("Sun", "SUN")
    data.energy = 3.2
    data.angle = math.radians(8)
    light = bpy.data.objects.new("Sun", data)
    light.rotation_euler = Euler((math.radians(40), math.radians(-18), math.radians(-25)))
    scene.collection.objects.link(light)


def material(name, colour, rough=0.8, noise=0.0, noise_scale=12.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = rough
    if noise:
        tex = nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = noise_scale
        ramp = nodes.new("ShaderNodeValToRGB")
        lo = tuple(max(0, c * (1 - noise)) for c in colour)
        hi = tuple(min(1, c * (1 + noise)) for c in colour)
        ramp.color_ramp.elements[0].color = (*lo, 1)
        ramp.color_ramp.elements[1].color = (*hi, 1)
        links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = (*colour, 1)
    return mat


def box(name, size, location, mat, bevel=0.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def blob(location, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=24, ring_count=12)
    obj = bpy.context.active_object
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def render(name):
    path = os.path.join(OUT, f"{name}.png")
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


# Linear-space colours.
GRASS = (0.16, 0.62, 0.08)
GRASS_ALT = (0.12, 0.52, 0.06)
DIRT = (0.42, 0.20, 0.07)
SAND = (0.96, 0.66, 0.25)
SAND_ALT = (0.92, 0.60, 0.21)
SAND_SIDE = (0.72, 0.40, 0.13)
FLOWERS = [(1.0, 0.25, 0.45), (1.0, 0.85, 0.15), (1.0, 1.0, 1.0), (0.7, 0.35, 1.0)]


def grass_block(name, top, seed):
    scene = reset()
    camera(scene)
    sun(scene)
    rnd = random.Random(seed)
    body = material("Dirt", DIRT, noise=0.25, noise_scale=8)
    cap = material("Grass", top, rough=0.9, noise=0.18, noise_scale=10)
    box("Body", (1.0, 1.0, HEIGHT - 0.1), (0, 0, -(HEIGHT + 0.1) / 2), body)
    box("Cap", (1.0, 1.0, 0.16), (0, 0, -0.08), cap, bevel=0.06)
    # A few tufts and flowers, so neighbouring tiles do not look stamped.
    tuft = material("Tuft", tuple(c * 1.15 for c in top), rough=0.9)
    for _ in range(rnd.randint(2, 4)):
        x, y = rnd.uniform(-0.36, 0.36), rnd.uniform(-0.36, 0.36)
        for k in range(3):
            bpy.ops.mesh.primitive_cone_add(
                radius1=0.03, depth=0.12 + rnd.uniform(0, 0.05), location=(x + k * 0.03 - 0.03, y, 0.06)
            )
            blade = bpy.context.active_object
            blade.rotation_euler = (rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), 0)
            blade.data.materials.append(tuft)
    if rnd.random() < 0.7:
        x, y = rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3)
        petal = material("Petal", rnd.choice(FLOWERS), rough=0.5)
        blob((x, y, 0.04), 0.045, petal)
    render(name)


def sand_block(name, top, seed):
    scene = reset()
    camera(scene)
    sun(scene)
    rnd = random.Random(seed)
    body = material("SandSide", SAND_SIDE, noise=0.2, noise_scale=14)
    cap = material("Sand", top, rough=0.95, noise=0.08, noise_scale=30)
    box("Body", (1.0, 1.0, HEIGHT - 0.1), (0, 0, -(HEIGHT + 0.1) / 2), body)
    box("Cap", (1.0, 1.0, 0.16), (0, 0, -0.08), cap, bevel=0.06)
    # A pebble or a little starfish-coloured shell now and then.
    if rnd.random() < 0.6:
        x, y = rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3)
        shell = material("Shell", rnd.choice([(1.0, 0.55, 0.45), (1.0, 0.95, 0.85), (0.55, 0.5, 0.45)]), rough=0.4)
        b = blob((x, y, 0.01), 0.05, shell)
        b.scale = (1, 0.8, 0.5)
    render(name)


def cloud(name, seed):
    scene = reset()
    scene.render.resolution_x = SIZE * 2
    scene.render.resolution_y = SIZE
    camera(scene, ortho=3.4)
    sun(scene)
    rnd = random.Random(seed)
    white = material("Cloud", (1, 1, 1), rough=1.0)
    for i in range(7):
        t = i / 6 - 0.5
        r = 0.32 + rnd.uniform(0, 0.18) - abs(t) * 0.25
        blob((t * 1.5 + rnd.uniform(-0.08, 0.08), t * 1.5, rnd.uniform(-0.05, 0.2)), r, white)
    render(name)


def tilt(obj, rotation):
    """Rotates a part about its own centre. box() bakes the position into the
    mesh, so without this a rotation would swing the part round the origin."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.rotation_euler = rotation


def piano(name):
    """An upright piano, three-quarter view, for the Piano in the furniture
    shop: the emoji is only a keyboard, which children did not read as a piano."""
    scene = reset()
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 64
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (-2.9, -4.4, 2.5)
    direction = Vector((0.05, 0.1, 0.72)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    sun(scene)
    # A darker room than the blocks get, so the black lacquer stays black.
    bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[1].default_value = 0.35
    fill = bpy.data.lights.new("Fill", "AREA")
    fill.energy = 250
    fill.size = 3
    f = bpy.data.objects.new("Fill", fill)
    f.location = (-3, -3, 3.5)
    f.rotation_euler = Euler((math.radians(50), 0, math.radians(-40)))
    scene.collection.objects.link(f)

    lacquer = material("Lacquer", (0.012, 0.012, 0.016), rough=0.12)
    ivory = material("Ivory", (0.92, 0.9, 0.84), rough=0.35)
    ebony = material("Ebony", (0.01, 0.01, 0.01), rough=0.3)
    gold = material("Gold", (1.0, 0.62, 0.18), rough=0.25)
    bsdf = next(n for n in gold.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Metallic"].default_value = 1.0
    red = material("Felt", (0.5, 0.02, 0.04), rough=0.9)
    paper = material("Paper", (1.0, 0.98, 0.92), rough=0.8)

    # Cabinet: tall upper case, lower case, lid, cheeks either side of the keys.
    box("Upper", (1.5, 0.55, 0.62), (0, 0.27, 1.08), lacquer, bevel=0.03)
    box("Lid", (1.58, 0.62, 0.06), (0, 0.26, 1.42), lacquer, bevel=0.02)
    box("Lower", (1.42, 0.5, 0.56), (0, 0.3, 0.38), lacquer, bevel=0.02)
    box("Plinth", (1.5, 0.6, 0.08), (0, 0.27, 0.05), lacquer, bevel=0.02)
    for x in (-0.77, 0.77):
        box("Cheek", (0.07, 0.95, 0.2), (x, -0.04, 0.72), lacquer, bevel=0.02)
        box("Leg", (0.09, 0.09, 0.62), (x, -0.42, 0.35), lacquer, bevel=0.02)
        box("Toe", (0.12, 0.16, 0.06), (x, -0.44, 0.03), lacquer, bevel=0.02)
    # Key bed with a strip of red felt, and the fallboard behind the keys.
    box("KeyBed", (1.48, 0.46, 0.08), (0, -0.2, 0.64), lacquer, bevel=0.01)
    box("Felt", (1.44, 0.03, 0.03), (0, 0.0, 0.7), red, bevel=0)
    box("Fallboard", (1.48, 0.06, 0.14), (0, 0.03, 0.77), lacquer, bevel=0.01)
    # 15 white keys with the black ones in twos and threes.
    n = 15
    w = 1.42 / n
    for i in range(n):
        x = -0.71 + w * (i + 0.5)
        box("White", (w * 0.92, 0.36, 0.05), (x, -0.2, 0.705), ivory, bevel=0.006)
    for i in range(n - 1):
        if i % 7 in (2, 6):
            continue
        x = -0.71 + w * (i + 1)
        box("Black", (w * 0.55, 0.22, 0.06), (x, -0.13, 0.75), ebony, bevel=0.006)
    # Music stand with a page of music, and a little gold trim.
    stand = box("Stand", (0.9, 0.03, 0.3), (0, -0.04, 0.98), lacquer, bevel=0.01)
    tilt(stand, (math.radians(-12), 0, 0))
    sheet = box("Sheet", (0.42, 0.012, 0.26), (-0.18, -0.065, 1.0), paper, bevel=0)
    tilt(sheet, (math.radians(-12), 0, math.radians(-3)))
    sheet2 = box("Sheet2", (0.42, 0.012, 0.26), (0.22, -0.065, 1.0), paper, bevel=0)
    tilt(sheet2, (math.radians(-12), 0, math.radians(3)))
    ink = material("Ink", (0.05, 0.05, 0.08), rough=0.6)
    for side, turn in ((-0.18, -3), (0.22, 3)):
        for k in range(4):
            line = box("Staff", (0.34, 0.004, 0.008), (side, -0.085, 1.07 - k * 0.045), ink, bevel=0)
            tilt(line, (math.radians(-12), 0, math.radians(turn)))
    box("Trim", (1.2, 0.01, 0.02), (0, -0.005, 1.33), gold, bevel=0)
    # Pedals.
    for x in (-0.14, 0, 0.14):
        p = box("Pedal", (0.07, 0.2, 0.03), (x, -0.06, 0.1), gold, bevel=0.01)
        tilt(p, (math.radians(-8), 0, 0))
    # No floor: the app draws the shadow, so the picture sits on any surface.
    render(name)


# Run directly, this renders everything; imported (by worlds.py), only the
# helpers above are wanted.
if __name__ == "__main__":
    grass_block("grass-a", GRASS, 1)
    grass_block("grass-b", GRASS_ALT, 2)
    grass_block("grass-c", GRASS, 3)
    sand_block("sand-a", SAND, 4)
    sand_block("sand-b", SAND_ALT, 5)
    cloud("cloud-a", 6)
    cloud("cloud-b", 7)
    piano("piano")

    # Where the top face sits in a block image, for the app's layout.
    px_per_unit = SIZE / ORTHO
    with open(os.path.join(OUT, "sprite.json"), "w") as f:
        json.dump(
            {
                "size": SIZE,
                "diamond": round(math.sqrt(2) * px_per_unit, 2),
                "side": round(math.sin(math.radians(60)) * HEIGHT * px_per_unit, 2),
            },
            f,
        )
