"""Turns the Blender render of the home island into what the app uses:
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
# Each landmark's animation loop: its frames cropped to the area they all
# fit in, scaled down to the size the island shows them at, and laid side by
# side in one strip (public/images/home-landmarks/<zone>.webp). Where each
# strip sits on the island goes to homeIsland.ts.
import glob
import re

SCALE = 0.6
lmdir = os.path.join(ROOT, "public", "images", "home-landmarks")
os.makedirs(lmdir, exist_ok=True)
zones = sorted({re.match(r"lm-(.+)-\d\d\.png", os.path.basename(f)).group(1) for f in glob.glob(os.path.join(src, "lm-*-??.png"))})
strips = {}
for zone in zones:
    frames = [Image.open(f).convert("RGBA") for f in sorted(glob.glob(os.path.join(src, f"lm-{zone}-??.png")))]
    boxes = [fr.getbbox() for fr in frames if fr.getbbox()]
    x0, y0 = min(b[0] for b in boxes) - 4, min(b[1] for b in boxes) - 4
    x1, y1 = max(b[2] for b in boxes) + 4, max(b[3] for b in boxes) + 4
    w, h = round((x1 - x0) * SCALE), round((y1 - y0) * SCALE)
    sheet = Image.new("RGBA", (w * len(frames), h))
    for i, fr in enumerate(frames):
        sheet.paste(fr.crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS), (i * w, 0))
    sheet.save(os.path.join(lmdir, f"{zone}.webp"), "WEBP", quality=82, method=6)
    W_, H_ = frames[0].size
    strips[zone] = {"x": round(x0 / W_ * 100, 3), "y": round(y0 / H_ * 100, 3), "w": round((x1 - x0) / W_ * 100, 3), "h": round((y1 - y0) / H_ * 100, 3), "frames": len(frames)}
with open(os.path.join(ROOT, "src", "app", "homeIsland.ts"), "a") as f:
    f.write("\n/** Each landmark's animation strip: where it sits on the island (in % of\n    the picture) and how many frames it has, side by side. */\n")
    f.write("export const ISLAND_LANDMARKS: Record<string, { x: number; y: number; w: number; h: number; frames: number }> = ")
    f.write(json.dumps(strips, indent=2))
    f.write(";\n")
total = sum(os.path.getsize(os.path.join(lmdir, f"{z}.webp")) for z in zones)
print("landmark strips", len(zones), total // 1024, "KB")

print("webp", os.path.getsize(os.path.join(ROOT, "public", "images", "home-island.webp")) // 1024, "KB")
