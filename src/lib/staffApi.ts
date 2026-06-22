/**
 * Server-side calls to the school's staff API. The API key (staff.read) lives
 * in STAFF_API_TOKEN and is only ever used here, on the server — it never
 * reaches the browser. Used to verify that a sign-in email belongs to an
 * active staff member.
 */

export type Staff = {
  id: string | number;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  nric_name?: string | null;
  email: string | null;
  phone?: string | null;
  job_title?: string | null;
  status: string; // "active" | "inactive"
};

export class StaffApiNotConfigured extends Error {}

function config(): { base: string; token: string } {
  const base = process.env.STAFF_API_BASE?.replace(/\/+$/, "");
  const token = process.env.STAFF_API_TOKEN;
  if (!base || !token || base.includes("CHANGE-ME")) {
    throw new StaffApiNotConfigured(
      "Set STAFF_API_BASE and STAFF_API_TOKEN in .env.local",
    );
  }
  return { base, token };
}

/** A friendly display name for a staff member. */
export function staffName(s: Staff): string {
  return (
    s.preferred_name?.trim() ||
    [s.first_name, s.last_name].filter(Boolean).join(" ").trim() ||
    s.email ||
    "there"
  );
}

/**
 * Find an ACTIVE staff member by exact email. Returns null if no active staff
 * has that email. Throws StaffApiNotConfigured if env isn't set up, or a
 * generic Error if the API call fails.
 */
export async function findActiveStaffByEmail(
  email: string,
): Promise<Staff | null> {
  const { base, token } = config();
  const wanted = email.trim().toLowerCase();

  const url = new URL(`${base}/api/v1/staff`);
  url.searchParams.set("search", wanted);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Staff API responded ${res.status}`);
  }

  const json = (await res.json()) as { data?: Staff[] };
  const list = Array.isArray(json.data) ? json.data : [];

  // The search may match names/phones too — require an exact email match,
  // and only allow staff the API reports as active.
  const match = list.find(
    (s) =>
      (s.email ?? "").trim().toLowerCase() === wanted &&
      String(s.status).toLowerCase() === "active",
  );
  return match ?? null;
}
