/* readingpals.vercel.app/color — the easy link for children to type. It
   opens the colouring page a teacher last made a link for (lib/colouring.ts).
   A route handler, not a page, so the sign-in screen never gets in the way. */

import { currentColouring } from "@/lib/colouring";

export async function GET(req: Request) {
  const to = await currentColouring().catch(() => null);
  const url = new URL(to ? `/colour#${to.code}-${to.storyId}` : "/colour", req.url);
  return new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "no-store" } });
}
