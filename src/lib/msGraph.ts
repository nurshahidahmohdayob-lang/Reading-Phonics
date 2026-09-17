/* Sending reading reports from inside the app, as the teacher's own Zera
   mailbox, through Microsoft 365 (Microsoft Graph).

   The school's IT admin registers the app once in Microsoft Entra ID and
   gives us MS_CLIENT_ID (+ MS_TENANT_ID, and MS_CLIENT_SECRET if the
   registration is a "web" app). The teacher then signs in once with their
   Zera account and grants Mail.Send; after that the app sends on their
   behalf, so every email comes from their address and lands in their Sent
   Items — exactly as if they had sent it themselves.

   Their refresh token is the only thing stored, encrypted, in the app's own
   cloud storage. Server-side only. */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { kvConfigured, kvGetJson, kvSetJson } from "./kv";

const AUTH_HOST = "https://login.microsoftonline.com";
const GRAPH = "https://graph.microsoft.com/v1.0";

/** What we ask the teacher to allow: send mail as them, and read their name. */
export const MAIL_SCOPES = "offline_access User.Read Mail.Send";

export type MailConfig = {
  clientId: string;
  tenant: string;
  clientSecret?: string;
  redirectUri: string;
};

export function mailConfig(): MailConfig | null {
  const clientId = process.env.MS_CLIENT_ID;
  if (!clientId) return null;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://reading-phonics.vercel.app";
  return {
    clientId,
    // A single school tenant by default; "organizations" also works.
    tenant: process.env.MS_TENANT_ID || "organizations",
    clientSecret: process.env.MS_CLIENT_SECRET || undefined,
    redirectUri: `${site.replace(/\/+$/, "")}/api/mail/callback`,
  };
}

export function mailConfigured(): boolean {
  return mailConfig() !== null && kvConfigured();
}

/* ---------- storing the teacher's token, encrypted ---------- */

function secretKey(): Buffer {
  return createHash("sha256")
    .update(process.env.SESSION_SECRET ?? "")
    .digest();
}

function seal(text: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc]
    .map((b) => b.toString("base64url"))
    .join(".");
}

function unseal(sealed: string): string | null {
  try {
    const [iv, tag, enc] = sealed.split(".");
    const d = createDecipheriv(
      "aes-256-gcm",
      secretKey(),
      Buffer.from(iv, "base64url"),
    );
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      d.update(Buffer.from(enc, "base64url")),
      d.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

type Stored = { refresh: string; account: string; savedAt: string };

const tokenKey = (email: string) => `mail:token:${email.trim().toLowerCase()}`;
const pkceKey = (state: string) => `mail:pkce:${state}`;

/** The mailbox this teacher has connected, or null. */
export async function connectedAccount(email: string): Promise<string | null> {
  const rec = await kvGetJson<Stored>(tokenKey(email));
  return rec?.account ?? null;
}

export async function disconnectMailbox(email: string): Promise<void> {
  await kvSetJson(tokenKey(email), null);
}

/* ---------- the sign-in dance ---------- */

/** Start sign-in: returns the Microsoft URL to send the teacher to. */
export async function authorizeUrl(
  cfg: MailConfig,
  email: string,
): Promise<string> {
  const state = randomBytes(16).toString("hex");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  await kvSetJson(pkceKey(state), {
    verifier,
    email,
    at: Date.now(),
  });
  const q = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: "code",
    redirect_uri: cfg.redirectUri,
    response_mode: "query",
    scope: MAIL_SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTH_HOST}/${cfg.tenant}/oauth2/v2.0/authorize?${q}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  error_description?: string;
};

async function tokenRequest(
  cfg: MailConfig,
  body: Record<string, string>,
): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_HOST}/${cfg.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      ...(cfg.clientSecret ? { client_secret: cfg.clientSecret } : {}),
      ...body,
    }),
    cache: "no-store",
  });
  return (await res.json()) as TokenResponse;
}

/** Finish sign-in: swap the code for tokens and remember the refresh token. */
export async function completeSignIn(
  cfg: MailConfig,
  code: string,
  state: string,
): Promise<{ ok: true; account: string } | { ok: false; error: string }> {
  const pending = await kvGetJson<{
    verifier: string;
    email: string;
    at: number;
  }>(pkceKey(state));
  if (!pending) return { ok: false, error: "That sign-in link has expired." };
  await kvSetJson(pkceKey(state), null);
  // Fifteen minutes is plenty for a sign-in.
  if (Date.now() - pending.at > 15 * 60 * 1000) {
    return { ok: false, error: "That sign-in took too long. Try again." };
  }

  const tok = await tokenRequest(cfg, {
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    code_verifier: pending.verifier,
    scope: MAIL_SCOPES,
  });
  if (!tok.refresh_token || !tok.access_token) {
    return {
      ok: false,
      error: tok.error_description ?? "Microsoft refused the sign-in.",
    };
  }

  let account = pending.email;
  try {
    const me = await fetch(`${GRAPH}/me`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
      cache: "no-store",
    });
    const data = (await me.json()) as {
      mail?: string;
      userPrincipalName?: string;
    };
    account = data.mail || data.userPrincipalName || account;
  } catch {
    /* keep the signed-in address */
  }

  const rec: Stored = {
    refresh: seal(tok.refresh_token),
    account,
    savedAt: new Date().toISOString(),
  };
  await kvSetJson(tokenKey(pending.email), rec);
  return { ok: true, account };
}

/** A fresh access token for this teacher, or null if they haven't connected. */
async function accessToken(
  cfg: MailConfig,
  email: string,
): Promise<string | null> {
  const rec = await kvGetJson<Stored>(tokenKey(email));
  const refresh = rec ? unseal(rec.refresh) : null;
  if (!refresh) return null;
  const tok = await tokenRequest(cfg, {
    grant_type: "refresh_token",
    refresh_token: refresh,
    scope: MAIL_SCOPES,
  });
  if (!tok.access_token) return null;
  // Microsoft rotates refresh tokens — keep the newest one.
  if (tok.refresh_token) {
    await kvSetJson(tokenKey(email), {
      ...rec,
      refresh: seal(tok.refresh_token),
    } as Stored);
  }
  return tok.access_token;
}

export type Outgoing = {
  to: string[];
  subject: string;
  /** Plain text; newlines become line breaks in the email. */
  body: string;
};

export type SendResult = { ok: boolean; to: string; error?: string };

/** Send one message as the teacher. */
async function sendOne(
  token: string,
  msg: Outgoing,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${GRAPH}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: msg.subject,
        body: { contentType: "Text", content: msg.body },
        toRecipients: msg.to.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: true,
    }),
    cache: "no-store",
  });
  if (res.ok) return { ok: true };
  let error = `Microsoft replied ${res.status}`;
  try {
    const data = (await res.json()) as { error?: { message?: string } };
    if (data.error?.message) error = data.error.message;
  } catch {
    /* keep the status */
  }
  return { ok: false, error };
}

/** Send a batch, one at a time so a rejected address can't stop the rest. */
export async function sendAs(
  email: string,
  messages: Outgoing[],
): Promise<{ ok: true; results: SendResult[] } | { ok: false; error: string }> {
  const cfg = mailConfig();
  if (!cfg) return { ok: false, error: "not configured" };
  const token = await accessToken(cfg, email);
  if (!token) return { ok: false, error: "not connected" };

  const results: SendResult[] = [];
  for (const msg of messages) {
    const r = await sendOne(token, msg);
    results.push({ ok: r.ok, to: msg.to.join("; "), error: r.error });
  }
  return { ok: true, results };
}
