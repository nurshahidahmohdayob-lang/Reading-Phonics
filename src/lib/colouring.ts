/* Children's finished colouring pages, sent to the teacher. Server-side only.

   Kept in the KV store, filed under the teacher signed in on the device the
   child coloured on:

     col:list:<email>   ids, newest first
     col:meta:<id>      who, which story, when
     col:img:<id>       the picture itself (kept apart, so the list stays light)
     col:code:<code>    a teacher's share code → their address
     col:mycode:<email> that teacher's code
     col:current        what /color opens: the share code and story of the
                        colouring page a teacher last made a link for

   The share code goes in colouring links sent to children
   (…/colour#<code>-<story id>). Like the class code, it is the permission:
   it lets a child send a picture to that teacher, and nothing else.

   The list is a Redis list, so two children pressing Submit at the same
   moment both land. */

import { randomBytes } from "crypto";
import { kvConfigured, kvDel, kvGetJson, kvLPush, kvLRange, kvLRem, kvMGetJson, kvSetJson } from "./kv";

/** A JPEG data URL of the 800px page is well under this. */
export const MAX_IMAGE_CHARS = 600_000;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID = /^[a-z0-9]{12}$/;

export type ColouringMeta = {
  id: string;
  name: string;
  storyId: string;
  title: string;
  at: string;
};

export const colouringReady = kvConfigured;
export const isColouringId = (id: string) => ID.test(id);

const listKey = (owner: string) => `col:list:${owner}`;

export async function submitColouring(
  owner: string,
  entry: Omit<ColouringMeta, "id" | "at">,
  image: string,
): Promise<ColouringMeta> {
  const id = Array.from(randomBytes(12), (b) => ALPHABET[b % ALPHABET.length]).join("");
  const meta: ColouringMeta = { ...entry, id, at: new Date().toISOString() };
  await kvSetJson(`col:img:${id}`, { owner, image });
  await kvSetJson(`col:meta:${id}`, { ...meta, owner });
  await kvLPush(listKey(owner), id);
  return meta;
}

export async function listColouring(owner: string): Promise<ColouringMeta[]> {
  const ids = await kvLRange(listKey(owner), 0, 499);
  const metas = await kvMGetJson<ColouringMeta & { owner: string }>(ids.map((id) => `col:meta:${id}`));
  return metas
    .filter((m): m is ColouringMeta & { owner: string } => !!m && m.owner === owner)
    .map(({ id, name, storyId, title, at }) => ({ id, name, storyId, title, at }));
}

export async function colouringImage(owner: string, id: string): Promise<string | null> {
  const got = await kvGetJson<{ owner: string; image: string }>(`col:img:${id}`);
  return got && got.owner === owner ? got.image : null;
}

export async function deleteColouring(owner: string, id: string): Promise<void> {
  const meta = await kvGetJson<{ owner: string }>(`col:meta:${id}`);
  if (!meta || meta.owner !== owner) return;
  await kvLRem(listKey(owner), id);
  await kvDel(`col:meta:${id}`, `col:img:${id}`);
}

const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE = /^[a-z2-9]{12}$/;
export const isShareCode = (code: string) => CODE.test(code);

/** The teacher's colouring share code, made the first time they ask. */
export async function shareCodeFor(owner: string): Promise<string> {
  const have = await kvGetJson<string>(`col:mycode:${owner}`);
  if (have) return have;
  const code = Array.from(randomBytes(12), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  await kvSetJson(`col:code:${code}`, owner);
  await kvSetJson(`col:mycode:${owner}`, code);
  return code;
}

export async function ownerForCode(code: string): Promise<string | null> {
  return isShareCode(code) ? kvGetJson<string>(`col:code:${code}`) : null;
}

/* The one easy link: reading-phonics.vercel.app/color opens the colouring
   page a teacher last tapped "Link for students" on, sending pictures to
   that teacher. One page at a time, for the whole site — making a new link
   moves it on. */
export async function setCurrentColouring(owner: string, storyId: string): Promise<void> {
  await kvSetJson("col:current", { code: await shareCodeFor(owner), storyId, at: new Date().toISOString() });
}

export async function currentColouring(): Promise<{ code: string; storyId: string } | null> {
  return kvGetJson<{ code: string; storyId: string }>("col:current");
}
