/* The pairing channel between a phone and the class screen.

   POST { action: "new" }                       start a pairing (signed in, or
                                                the parents' page: gets a key)
   POST { action: "upload", code, dataUrl, … }  the phone — send a drawing,
                                                with how it moves if chosen
   POST { action: "change", code, ref, … }      the phone — change how one it
                                                sent moves, turns or its size
   GET  ?code=…[&key=…]                         the screen — collect and clear

   Uploading needs no sign-in: the code from the QR is the permission, it
   only ever adds a drawing to that one screen, and it expires. */

import { NextResponse } from "next/server";
import { MAX_SCALE, MIN_SCALE, MOVE_IDS } from "@/lib/drawingMoves";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import {
  addScan,
  drainScans,
  isScanCode,
  mayOpenPairing,
  newScanSession,
  newScreenKey,
  scanReady,
  MAX_UPLOAD_CHARS,
  type ScanItem,
} from "@/lib/scanSession";

/** The signed-in teacher's address, or null. A pairing belongs to one
    teacher: they made it, and only they can collect from it. */
/** The settings a phone may send with a drawing, checked; null if any is
    malformed. */
function settings(body: {
  ref?: unknown;
  move?: unknown;
  flip?: unknown;
  scale?: unknown;
}): Pick<ScanItem, "ref" | "move" | "flip" | "scale"> | null {
  const { ref, move, flip, scale } = body;
  if (ref !== undefined && (typeof ref !== "string" || !/^[a-z0-9]{6,20}$/.test(ref))) return null;
  if (move !== undefined && (typeof move !== "string" || !MOVE_IDS.has(move))) return null;
  if (flip !== undefined && typeof flip !== "boolean") return null;
  if (
    scale !== undefined &&
    (typeof scale !== "number" || !(scale >= MIN_SCALE && scale <= MAX_SCALE))
  )
    return null;
  return { ref, move, flip, scale } as Pick<ScanItem, "ref" | "move" | "flip" | "scale">;
}

async function signedInAs(): Promise<string | null> {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  return session?.email ?? null;
}

export async function POST(req: Request) {
  if (!scanReady()) {
    return NextResponse.json({ ok: false, configured: false });
  }

  let body: {
    action?: string;
    code?: string;
    dataUrl?: string;
    width?: number;
    height?: number;
    ref?: unknown;
    move?: unknown;
    flip?: unknown;
    scale?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad request" },
      { status: 400 },
    );
  }

  // A signed-in teacher's pairing is theirs. Without a sign-in (the
  // parents' page) the screen gets a secret key that alone can collect.
  if (body.action === "new") {
    const teacher = await signedInAs();
    if (teacher) {
      return NextResponse.json({ ok: true, code: await newScanSession(teacher) });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await mayOpenPairing(ip))) {
      return NextResponse.json(
        { ok: false, error: "Too many phone links just now — try again later." },
        { status: 429 },
      );
    }
    const screenKey = newScreenKey();
    return NextResponse.json({
      ok: true,
      code: await newScanSession(`screen:${screenKey}`),
      key: screenKey,
    });
  }

  // Sending a drawing: the code is the permission.
  if (body.action === "upload") {
    const { code, dataUrl, width, height } = body;
    const chosen = settings(body);
    if (
      !chosen ||
      !code ||
      !isScanCode(code) ||
      typeof dataUrl !== "string" ||
      !/^data:image\/(png|webp|jpeg);base64,/.test(dataUrl) ||
      typeof width !== "number" ||
      typeof height !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "bad request" },
        { status: 400 },
      );
    }
    if (dataUrl.length > MAX_UPLOAD_CHARS) {
      return NextResponse.json(
        { ok: false, error: "That picture is too big to send." },
        { status: 413 },
      );
    }
    const item: ScanItem = {
      kind: "drawing",
      dataUrl,
      width,
      height,
      ...chosen,
      at: new Date().toISOString(),
    };
    const result = await addScan(code, item);
    if (result === "gone") {
      return NextResponse.json({
        ok: false,
        error: "That code has expired — show a fresh one on the screen.",
      });
    }
    if (result === "full") {
      return NextResponse.json({
        ok: false,
        error: "That's plenty for one go — collect these first.",
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Changing one already sent: how it moves, which way it faces, its size.
  if (body.action === "change") {
    const chosen = settings(body);
    if (!chosen?.ref || !body.code || !isScanCode(body.code)) {
      return NextResponse.json(
        { ok: false, error: "bad request" },
        { status: 400 },
      );
    }
    const result = await addScan(body.code, {
      kind: "change",
      ...chosen,
      at: new Date().toISOString(),
    });
    if (result === "gone") {
      return NextResponse.json({
        ok: false,
        error: "That code has expired — show a fresh one on the screen.",
      });
    }
    return NextResponse.json({ ok: result === "ok" });
  }

  return NextResponse.json(
    { ok: false, error: "bad request" },
    { status: 400 },
  );
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const screenKey = params.get("key");
  const owner = screenKey ? `screen:${screenKey}` : await signedInAs();
  if (!owner) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  if (!scanReady()) {
    return NextResponse.json({ ok: false, configured: false });
  }
  const code = params.get("code") ?? "";
  const items = await drainScans(code, owner);
  if (items === null) {
    return NextResponse.json({ ok: false, expired: true });
  }
  return NextResponse.json({ ok: true, items });
}
