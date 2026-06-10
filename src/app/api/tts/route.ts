/**
 * Text-to-speech proxy. The browser's built-in speech voices aren't available
 * everywhere, so we fetch real spoken audio server-side (Google's translate_tts
 * endpoint) and stream the MP3 back from our own origin. Same-origin playback
 * avoids CORS/referrer issues and works without any local voices installed.
 */
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 200);
  const tl = searchParams.get("tl") ?? "en";
  if (!q.trim()) {
    return new Response("missing q", { status: 400 });
  }

  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob` +
    `&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(q)}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://translate.google.com/",
      },
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("tts upstream failed", { status: 502 });
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("tts error", { status: 502 });
  }
}
