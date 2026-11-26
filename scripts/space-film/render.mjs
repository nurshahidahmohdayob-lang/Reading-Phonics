// Renders scene.html frame by frame in headless Chrome (spoken to directly
// over the DevTools protocol, so nothing to install) and packs the frames
// into public/video/<name>.mp4 with a poster, ready for 3D Drawings.
//
//   node scripts/space-film/render.mjs            # the whole film
//   node scripts/space-film/render.mjs --preview 3   # one frame at 3 s → out/preview.png

import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const NAME = "space-walk";
const FPS = 24;
const SECONDS = 16; // must match T in scene.html
const OUT = join(HERE, "out");
const FRAMES = join(OUT, "frames");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9347;

const previewAt = process.argv.includes("--preview")
  ? Number(process.argv[process.argv.indexOf("--preview") + 1] ?? 0)
  : null;

const profile = join(tmpdir(), `space-film-${process.pid}`);
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--disable-gpu", "--window-size=1280,720", "about:blank",
], { stdio: "ignore" });

async function pageSocket() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Chrome didn't start");
}

const ws = new WebSocket(await pageSocket());
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let nextId = 1;
const waiting = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && waiting.has(msg.id)) {
    const { resolve, reject } = waiting.get(msg.id);
    waiting.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    waiting.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

async function frame(t) {
  const r = await send("Runtime.evaluate", {
    expression: `window.frameAt(${t})`,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return Buffer.from(r.result.value.split(",")[1], "base64");
}

try {
  await send("Page.enable");
  await send("Page.navigate", { url: pathToFileURL(join(HERE, "scene.html")).href });
  for (let i = 0; i < 50; i++) {
    const r = await send("Runtime.evaluate", { expression: "typeof window.frameAt", returnByValue: true });
    if (r.result.value === "function") break;
    await new Promise((r) => setTimeout(r, 100));
  }
  mkdirSync(OUT, { recursive: true });

  if (previewAt !== null) {
    writeFileSync(join(OUT, "preview.png"), await frame(previewAt));
    console.log("preview →", join(OUT, "preview.png"));
  } else {
    rmSync(FRAMES, { recursive: true, force: true });
    mkdirSync(FRAMES, { recursive: true });
    const total = FPS * SECONDS;
    for (let f = 0; f < total; f++) {
      writeFileSync(join(FRAMES, `f${String(f).padStart(4, "0")}.png`), await frame(f / FPS));
    }
    console.log(total, "frames");
    const video = join(ROOT, "public", "video");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(FRAMES, "f%04d.png"),
      "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", join(video, `${NAME}.mp4`),
    ]);
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", join(FRAMES, "f0000.png"), "-q:v", "4",
      join(video, `${NAME}-poster.jpg`),
    ]);
    console.log("→ public/video/" + NAME + ".mp4 and -poster.jpg");
  }
} finally {
  ws.close();
  const gone = new Promise((r) => chrome.once("exit", r));
  chrome.kill();
  await gone;
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
