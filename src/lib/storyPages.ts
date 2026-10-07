/* Cutting a story into the pages of a storybook (components/StoryBook). */

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?]”?)\s+(?=[“"A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Every story is a five-page book: sentences shared out over five pages
    as evenly as the words allow, never breaking a sentence. (A story with
    fewer than five sentences gets a page each.) */
const PAGES = 5;

export function paginate(text: string): string[] {
  const sentences = sentencesOf(text);
  const len = sentences.map((s) => s.split(/\s+/).length);
  const pages: string[] = [];
  let i = 0;
  for (let left = Math.min(PAGES, sentences.length); left > 0; left--) {
    const rest = len.slice(i).reduce((a, b) => a + b, 0);
    const target = rest / left;
    const page: string[] = [];
    let count = 0;
    // Keep adding while it brings the page closer to its fair share, and
    // leave at least one sentence for each page still to come.
    while (i < sentences.length - (left - 1)) {
      const next = len[i];
      if (page.length && Math.abs(count + next - target) > Math.abs(count - target)) break;
      page.push(sentences[i]);
      count += next;
      i++;
    }
    if (left === 1) while (i < sentences.length) page.push(sentences[i++]);
    pages.push(page.join(" "));
  }
  return pages;
}
