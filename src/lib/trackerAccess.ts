/* Who may open the Class Tracker. Server-enforced access control — only these
   staff accounts can see and use the tracker; everyone else can't, on any
   device (checked against the signed-in session email, which can't be forged).

   Add or remove an email here to change who has access. */

export const TRACKER_OWNERS = ["shahidah.a@zera.edu.my"];

export function isTrackerOwner(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return TRACKER_OWNERS.some((owner) => owner.toLowerCase() === e);
}

/** How a teacher signs off the emails parents receive. The staff directory
    holds working names like "SHA"; parents should see a name they'd use.
    Add a line here for another teacher. */
const SIGN_OFF: Record<string, string> = {
  "shahidah.a@zera.edu.my": "Ms. Sha",
};

export function signOffName(email?: string | null, fallback = ""): string {
  const e = (email ?? "").trim().toLowerCase();
  return SIGN_OFF[e] ?? fallback;
}
