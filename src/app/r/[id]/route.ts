/* A parent's short report link: /r/k7f2q9abcd shows that one child's report,
   exactly as the teacher's copy looks — print and download buttons included.

   Public by design, like /report: no sign-in, and the ten-character id is
   unguessable. A route handler, not a page, so the app's sign-in screen never
   gets in the way. */

import { loadReportLink } from "@/lib/shortLinks";
import { reportHtml } from "@/lib/reportPrint";

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "private, no-store",
  // A child's report should never turn up in a search engine.
  "X-Robots-Tag": "noindex, nofollow",
};

const NOT_FOUND = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Report not found</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f4f4f5; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; padding: 24px; }
  .card { max-width: 420px; background: #fff; border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { font-size: 18px; margin: 8px 0 0; color: #27272a; }
  p { font-size: 14px; font-weight: 600; color: #71717a; }
</style></head>
<body><div class="card"><div style="font-size:36px">📋</div>
<h1>This reading report link didn’t open</h1>
<p>Please check the whole link was copied, or ask your child’s teacher to send it again.</p>
</div></body></html>`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await loadReportLink(id).catch(() => null);
  if (!report)
    return new Response(NOT_FOUND, { status: 404, headers: HEADERS });
  return new Response(reportHtml(report), { headers: HEADERS });
}
