/**
 * Server-side calls to the school's guardian API — the parents' email
 * addresses, so the tracker can fill them in instead of the teacher typing
 * them. Uses the same key as the student list (STUDENTS_API_TOKEN), which
 * needs the `guardians.read` ability; without it the API answers 403 and we
 * report that rather than failing the whole sync.
 */

export type ApiGuardian = {
  id: string | number;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  email?: string | null;
  phone?: string | null;
  students?: {
    student_id: string | number;
    /** A lifecycle code from the school system (e.g. 0, 1), not a word. */
    relationship?: string | number | null;
  }[];
};

export type GuardianContact = {
  email: string;
  name: string;
  relationship: string;
};

/** "ok" with the addresses, or why there are none. */
export type GuardianLookup =
  | { state: "ok"; byStudent: Record<string, GuardianContact[]> }
  | { state: "denied" }
  | { state: "unavailable" };

function config(): { base: string; token: string } | null {
  const base = process.env.STAFF_API_BASE?.replace(/\/+$/, "");
  const token = process.env.STUDENTS_API_TOKEN || process.env.STAFF_API_TOKEN;
  if (!base || !token || base.includes("CHANGE-ME")) return null;
  return { base, token };
}

/** Every guardian, grouped by the child they belong to. */
export async function guardianEmails(): Promise<GuardianLookup> {
  const cfg = config();
  if (!cfg) return { state: "unavailable" };

  const byStudent: Record<string, GuardianContact[]> = {};
  let page = 1;
  let lastPage = 1;
  while (page <= lastPage && page <= 40) {
    const url = new URL(`${cfg.base}/api/v1/guardians`);
    url.searchParams.set("page", String(page));
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    // 403 = the key exists but has no guardians.read ability.
    if (res.status === 403) return { state: "denied" };
    if (!res.ok) return { state: "unavailable" };

    const json = (await res.json()) as {
      data?: ApiGuardian[];
      meta?: { last_page?: number };
    };
    for (const g of json.data ?? []) {
      const email = (g.email ?? "").trim();
      if (!email) continue;
      const name =
        (g.preferred_name || "").trim() ||
        [g.first_name, g.last_name].filter(Boolean).join(" ").trim();
      for (const link of g.students ?? []) {
        const key = String(link.student_id);
        const list = byStudent[key] ?? (byStudent[key] = []);
        // A parent can appear once per child; don't double up.
        if (!list.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
          list.push({
            email,
            name,
            relationship: String(link.relationship ?? "").trim(),
          });
        }
      }
    }
    lastPage = json.meta?.last_page ?? page;
    page++;
  }
  return { state: "ok", byStudent };
}
