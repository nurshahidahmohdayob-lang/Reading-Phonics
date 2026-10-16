/**
 * One GET to the school system, patient with its rate limit.
 *
 * The school system allows 60 requests a minute per key, and other things
 * may share the key. When it says "too many" (429) it also says how many
 * seconds to wait, so we wait that long and ask again instead of failing —
 * up to WAIT_LIMIT seconds in all, to stay inside a server function's time.
 * The last "requests left this minute" it reported is kept, so callers can
 * size optional work (lookups) to what's left.
 */

const WAIT_LIMIT = 35;

let left: number | null = null;

/** Requests the school system said were left this minute, last we heard. */
export function requestsLeft(): number | null {
  return left;
}

export async function communGet(url: URL | string, token: string): Promise<Response> {
  let waited = 0;
  for (;;) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const n = Number(res.headers.get("x-ratelimit-remaining"));
    if (Number.isFinite(n) && res.headers.has("x-ratelimit-remaining")) left = n;
    if (res.status !== 429) return res;
    left = 0;
    const wait = Math.min(15, Math.max(1, Number(res.headers.get("retry-after")) || 3));
    if (waited + wait > WAIT_LIMIT) return res;
    waited += wait;
    await new Promise((r) => setTimeout(r, wait * 1000 + 300));
  }
}
