/* Tiny server-only client for a Redis-compatible REST KV store (Vercel KV /
   Upstash). Used to share the reading-assessment tracker across devices and
   between the live site and phonics.test.

   Configure by connecting a KV store to the Vercel project (Storage tab). That
   injects KV_REST_API_URL + KV_REST_API_TOKEN. For local dev (phonics.test),
   put the same two values in .env.local so it reads/writes the same store.
   If neither is set, kvConfigured() is false and the app falls back to
   browser-only storage — nothing breaks. */

function creds(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function kvConfigured(): boolean {
  return creds() !== null;
}

async function cmd(command: (string | number)[]): Promise<unknown> {
  const c = creds();
  if (!c) throw new Error("KV is not configured");
  const res = await fetch(c.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV request failed: ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`KV error: ${data.error}`);
  return data.result ?? null;
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  if (!kvConfigured()) return null;
  const result = await cmd(["GET", key]);
  if (result == null) return null;
  try {
    return JSON.parse(result as string) as T;
  } catch {
    return null;
  }
}

export async function kvSetJson(key: string, value: unknown): Promise<void> {
  if (!kvConfigured()) return;
  await cmd(["SET", key, JSON.stringify(value)]);
}
