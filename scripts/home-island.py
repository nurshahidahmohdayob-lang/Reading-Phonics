"""Turns the Blender renders of the home island (and its background pieces)
into what the app uses:
public/images/home-island.webp (the picture) and src/app/homeIsland.ts
(where each landmark's sign goes on it, in % of the picture).

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/home_island.py
    python3 scripts/home-island.py
"""

import hashlib
import json
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
src = os.path.join(ROOT, "blender", "out")
im = Image.open(os.path.join(src, "home-island.png")).convert("RGBA")
im.save(os.path.join(ROOT, "public", "images", "home-island.webp"), "WEBP", quality=82, method=6)
data = json.load(open(os.path.join(src, "home-island.json")))
webp = os.path.join(ROOT, "public", "images", "home-island.webp")
version = hashlib.sha1(open(webp, "rb").read()).hexdigest()[:10]
with open(os.path.join(ROOT, "src", "app", "homeIsland.ts"), "w") as f:
    f.write("// Made by scripts/home-island.py from the Blender render (blender/home_island.py). Don't edit by hand.\n\n")
    f.write("/** Where each landmark is on the island picture, in % across and down. */\n")
    f.write(f"export const ISLAND_SIZE = {{ w: {data['w']}, h: {data['h']} }};\n\n")
    f.write("/** The picture, with its version so browsers fetch a new render. */\n")
    f.write(f'export const ISLAND_IMAGE = "/images/home-island.webp?v={version}";\n\n')
    f.write("export const ISLAND_SPOTS: Record<string, { sign: [number, number]; foot: [number, number] }> = ")
    f.write(json.dumps(data["spots"], indent=2))
    f.write(";\n")
# The background pieces (blender/home_backdrop.py), if they've been rendered.
bgdir = os.path.join(ROOT, "public", "images", "home-bg")
os.makedirs(bgdir, exist_ok=True)
for name in ("home-cloud-a", "home-cloud-b", "home-jungle"):
    png = os.path.join(src, f"{name}.png")
    if os.path.exists(png):
        Image.open(png).convert("RGBA").save(os.path.join(bgdir, f"{name}.webp"), "WEBP", quality=85, method=6)

print("webp", os.path.getsize(os.path.join(ROOT, "public", "images", "home-island.webp")) // 1024, "KB")
