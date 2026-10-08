"""Turns the Blender render of the home house into what the app uses:
public/images/home-house.webp (the picture), home-garden.webp (the garden
alone, for the other pages) and src/app/homeHouse.ts (where
each room's sign goes on it, in % of the picture, and the lawn colour the
app fills the screen with round the picture).

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/home_house.py
    python3 scripts/home-house.py
"""

import hashlib
import json
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
src = os.path.join(ROOT, "blender", "out")
im = Image.open(os.path.join(src, "home-house.png")).convert("RGB")
webp = os.path.join(ROOT, "public", "images", "home-house.webp")
im.save(webp, "WEBP", quality=84, method=6)
data = json.load(open(os.path.join(src, "home-house.json")))
version = hashlib.sha1(open(webp, "rb").read()).hexdigest()[:10]
# The lawn: the middle colour of the picture's right-hand edge, which is all grass.
edge = sorted(im.crop((im.width - 8, im.height // 3, im.width, im.height // 2)).getdata(), key=sum)
lawn = "#%02x%02x%02x" % edge[len(edge) // 2]
with open(os.path.join(ROOT, "src", "app", "homeHouse.ts"), "w") as f:
    f.write("// Made by scripts/home-house.py from the Blender render (blender/home_house.py). Don't edit by hand.\n\n")
    f.write(f"export const HOUSE_SIZE = {{ w: {data['w']}, h: {data['h']} }};\n\n")
    f.write("/** The picture, with its version so browsers fetch a new render. */\n")
    f.write(f'export const HOUSE_IMAGE = "/images/home-house.webp?v={version}";\n\n')
    f.write("/** The grass colour, to fill the screen round the picture. */\n")
    f.write(f'export const HOUSE_LAWN = "{lawn}";\n\n')
    f.write("/** Where each room is on the picture, in % across and down: its sign\n    goes at `sign`, and `foot` is the middle of its floor. */\n")
    f.write("export const HOUSE_SPOTS: Record<string, { sign: [number, number]; foot: [number, number] }> = ")
    f.write(json.dumps(data["spots"], indent=2))
    f.write(";\n")
# The garden alone, behind every other page.
garden = os.path.join(ROOT, "public", "images", "home-garden.webp")
Image.open(os.path.join(src, "home-garden.png")).convert("RGB").save(garden, "WEBP", quality=80, method=6)
gversion = hashlib.sha1(open(garden, "rb").read()).hexdigest()[:10]
with open(os.path.join(ROOT, "src", "app", "homeHouse.ts"), "a") as f:
    f.write("\n/** The garden alone, the background behind every other page. */\n")
    f.write(f'export const GARDEN_IMAGE = "/images/home-garden.webp?v={gversion}";\n')
print("webp", os.path.getsize(webp) // 1024, "KB", "lawn", lawn)
