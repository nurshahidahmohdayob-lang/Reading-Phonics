/* A harmless public status check: is the app's cloud storage connected?

   Answers only yes/no — never an address, key or any data — so it's safe to
   leave open. Handy for checking a deploy picked up the storage settings
   (short report links and tracker sync depend on it). GET handlers run on
   every request in this Next.js version, so the answer is always current. */

import { kvConfigured } from "@/lib/kv";

export async function GET() {
  return Response.json({ ok: true, storage: kvConfigured() });
}
