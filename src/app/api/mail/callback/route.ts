/* Where Microsoft sends the teacher back after they sign in. Swaps the code
   for tokens, remembers the mailbox, and returns them to the tracker. */

import { NextResponse } from "next/server";
import { completeSignIn, mailConfig } from "@/lib/msGraph";

function back(req: Request, params: Record<string, string>) {
  const url = new URL("/", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const error =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (error) return back(req, { mail: "error", why: error.slice(0, 200) });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cfg = mailConfig();
  if (!cfg || !code || !state) {
    return back(req, { mail: "error", why: "The sign-in didn’t complete." });
  }

  const result = await completeSignIn(cfg, code, state).catch(() => ({
    ok: false as const,
    error: "Microsoft didn’t answer. Try again.",
  }));
  return result.ok
    ? back(req, { mail: "connected", account: result.account })
    : back(req, { mail: "error", why: result.error.slice(0, 200) });
}
