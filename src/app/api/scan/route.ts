/* The pairing channel between a phone and the class screen.

   POST { action: "new" }                       signed in — start a pairing
   POST { action: "upload", code, dataUrl, … }  the phone — send a drawing
   GET  ?code=…                                 signed in — collect and clear

   Uploading needs no sign-in: the code from the QR is the permission, it
   only ever adds a drawing to that one screen, and it expires. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import {
  addScan,
  drainScans,
  isScanCode,
  newScanSession,
  scanReady,
  MAX_UPLOAD_CHARS,
  type ScanItem,
} from "@/lib/scanSession";

/** The signed-in teacher's address, or null. A pairing belongs to one
    teacher: they made it, and only they can collect from it. */
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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad request" },
      { status: 400 },
    );
  }

  // Starting a pairing is the teacher's own doing.
  if (body.action === "new") {
    const teacher = await signedInAs();
    if (!teacher) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true, code: await newScanSession(teacher) });
  }

  // Sending a drawing: the code is the permission.
  if (body.action === "upload") {
    const { code, dataUrl, width, height } = body;
    if (
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
      dataUrl,
      width,
      height,
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

  return NextResponse.json(
    { ok: false, error: "bad request" },
    { status: 400 },
  );
}

export async function GET(req: Request) {
  const teacher = await signedInAs();
  if (!teacher) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  if (!scanReady()) {
    return NextResponse.json({ ok: false, configured: false });
  }
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const items = await drainScans(code, teacher);
  if (items === null) {
    return NextResponse.json({ ok: false, expired: true });
  }
  return NextResponse.json({ ok: true, items });
}
