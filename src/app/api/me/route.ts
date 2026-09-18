import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { isTrackerOwner, signOffName } from "@/lib/trackerAccess";

export async function GET() {
  const store = await cookies();
  const session = verifyToken(store.get(SESSION_COOKIE)?.value);
  if (!session) {
    return Response.json({ signedIn: false }, { status: 401 });
  }
  return Response.json({
    signedIn: true,
    name: session.name,
    // Their own address — used as the "send from" when emailing parents.
    email: session.email,
    // How they sign off to parents, which isn't always their directory name.
    signOff: signOffName(session.email, session.name),
    trackerOwner: isTrackerOwner(session.email),
  });
}
