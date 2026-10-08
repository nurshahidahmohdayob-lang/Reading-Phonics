"""Turns the Blender render of the forest glade (blender/forest.py) into what
the app uses: one WebP per depth layer in public/images/forest/, and
src/app/forestScene.ts with their addresses, where the windmill's hub and the
fairy lights are on the picture (in %), and the colour round the picture.

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/forest.py
    python3 scripts/forest.py
"""

import hashlib
import json
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
src = os.path.join(ROOT, "blender", "out")
dst = os.path.join(ROOT, "public", "images", "forest")
os.makedirs(dst, exist_ok=True)
data = json.load(open(os.path.join(src, "forest.json")))
urls = {}
for name in ("back", "mid", "crowns", "front", "sails"):
    im = Image.open(os.path.join(src, f"forest-{name}.png"))
    im = im.convert("RGB") if name == "back" else im.convert("RGBA")
    path = os.path.join(dst, f"{name}.webp")
    im.save(path, "WEBP", quality=80, method=6)
    urls[name] = f"/images/forest/{name}.webp?v={hashlib.sha1(open(path, 'rb').read()).hexdigest()[:10]}"
    print(name, os.path.getsize(path) // 1024, "KB")
back = Image.open(os.path.join(src, "forest-back.png")).convert("RGB")
edge = sorted(back.crop((0, back.height - 6, back.width, back.height)).getdata(), key=sum)
ground = "#%02x%02x%02x" % edge[len(edge) // 2]
with open(os.path.join(ROOT, "src", "app", "forestScene.ts"), "w") as f:
    f.write("// Made by scripts/forest.py from the Blender render (blender/forest.py). Don't edit by hand.\n\n")
    f.write(f"export const FOREST_SIZE = {{ w: {data['w']}, h: {data['h']} }};\n\n")
    f.write("/** The depth layers, back to front; each has holes where nearer ones cover it. */\n")
    f.write(f"export const FOREST_LAYERS = {json.dumps(urls, indent=2)};\n\n")
    f.write("/** The colour along the bottom of the picture, to fill round it. */\n")
    f.write(f'export const FOREST_GROUND = "{ground}";\n\n')
    f.write("/** Where the windmill's sails turn round, in % across and down the picture. */\n")
    f.write(f"export const FOREST_HUB: [number, number] = {json.dumps(data['hub'])};\n\n")
    f.write("/** Where some of the fairy lights hang, in % across and down. */\n")
    f.write(f"export const FOREST_BULBS: [number, number][] = {json.dumps(data['bulbs'])};\n")
