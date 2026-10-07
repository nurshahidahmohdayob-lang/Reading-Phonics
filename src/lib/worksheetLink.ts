/* Links to an online worksheet, for children to open on their own device.

   The link carries only what's needed to build the worksheet — which story,
   which level of worksheet — and nothing about any child: anyone the link
   reaches could open it. A built-in story travels as its id. A story a teacher
   added lives only on the teacher's computer, so its title and text travel in
   the link itself.

   The worksheet is built on the child's device from the same code as the
   printed one (lib/worksheet.ts), so the two always match. */

import { findPassage, passageLevels, type Passage } from "@/app/passages";
import { publicSiteBase } from "@/lib/reportLink";
import type { Tier, WorksheetInput } from "@/lib/worksheet";

type Spec = {
  /** Story id. */
  s: string;
  /** Level id the story belongs to. */
  l: string;
  /** Worksheet level, 1–3. */
  t: Tier;
  /** A teacher's own story: its title, emoji and text. */
  c?: { title: string; emoji: string; text: string };
};

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** The link for a worksheet on this story, at this worksheet level. */
export function worksheetLink(passage: Passage, levelId: string, tier: Tier): string {
  const spec: Spec = { s: passage.id, l: levelId, t: tier };
  if (passage.id.startsWith("custom-")) {
    spec.c = { title: passage.title, emoji: passage.emoji, text: passage.text };
  }
  return `${publicSiteBase()}/worksheet#${toBase64Url(JSON.stringify(spec))}`;
}

/** Read a worksheet link back into what the worksheet needs. null if the
    link is broken or its story can't be found. */
export function readWorksheetLink(hash: string): WorksheetInput | null {
  try {
    const spec = JSON.parse(fromBase64Url(hash.replace(/^#/, ""))) as Spec;
    if (![1, 2, 3].includes(spec.t)) return null;
    const level = passageLevels.find((l) => l.id === spec.l);
    if (!level) return null;
    let passage: Passage | null = null;
    if (spec.c && typeof spec.c.text === "string" && spec.c.text.trim()) {
      passage = {
        id: spec.s,
        title: String(spec.c.title || "My story").slice(0, 120),
        emoji: String(spec.c.emoji || "📖").slice(0, 8),
        lexile: 0,
        text: spec.c.text.slice(0, 4000),
      };
    } else {
      passage = findPassage(spec.s, spec.l)?.passage ?? null;
    }
    if (!passage) return null;
    return {
      childName: "",
      year: "",
      lexile: null,
      passage,
      level,
      missedWords: [],
      tier: spec.t,
    };
  } catch {
    return null;
  }
}
