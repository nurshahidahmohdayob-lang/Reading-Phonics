"use client";

/* How the tracker should open a parent email.

   The app has no mail server: it hands the written message to the teacher's
   own mail, and they press send. That means the message goes out from
   whichever mailbox they are signed in to — so this setting picks which one.

   Zera mail runs on Microsoft 365, so "Outlook on the web" is the default:
   it composes in the browser as the signed-in school account (not whatever
   personal account the computer's Mail app happens to be set to). */

import { useEffect, useState } from "react";

export type MailVia = "outlook" | "gmail" | "app";

export const MAIL_VIA_LABEL: Record<MailVia, string> = {
  outlook: "Outlook on the web",
  gmail: "Gmail on the web",
  app: "this computer’s mail app",
};

const KEY = "phonics.mail.v1";
const EVT = "phonics-mail-change";

export function readMailVia(): MailVia {
  if (typeof window === "undefined") return "outlook";
  const v = window.localStorage.getItem(KEY);
  return v === "gmail" || v === "app" || v === "outlook" ? v : "outlook";
}

export function setMailVia(via: MailVia) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, via);
  window.dispatchEvent(new Event(EVT));
}

export function useMailVia(): MailVia {
  const [via, setVia] = useState<MailVia>("outlook");
  useEffect(() => {
    const sync = () => setVia(readMailVia());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return via;
}

/** The URL that opens a compose window with everything filled in.
    `from` is the school address, used to pick the right signed-in account. */
export function composeUrl(
  via: MailVia,
  to: string,
  subject: string,
  body: string,
  from?: string,
): string {
  const t = encodeURIComponent(to);
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  if (via === "outlook") {
    // Office 365 web compose — uses the account already signed in there.
    return `https://outlook.office.com/mail/deeplink/compose?to=${t}&subject=${s}&body=${b}`;
  }
  if (via === "gmail") {
    // authuser picks the right Google account when several are signed in.
    const who = from ? `authuser=${encodeURIComponent(from)}&` : "";
    return `https://mail.google.com/mail/?${who}view=cm&fs=1&to=${t}&su=${s}&body=${b}`;
  }
  return `mailto:${t}?subject=${s}&body=${b}`;
}
