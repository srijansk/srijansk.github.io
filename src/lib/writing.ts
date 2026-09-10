/**
 * Shared helpers for the writing collection.
 *
 * Three pages consume these (the landing page, /writing, and the post
 * route), so the "where does this entry point?" rule lives in exactly one
 * place. Getting it wrong in one consumer and right in another is how a
 * self-hosted post silently starts opening in a new tab to nowhere.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type WritingEntry = CollectionEntry<'writing'>;

/** True when this site is the destination, rather than a link out. */
export function isSelfHosted(entry: WritingEntry): boolean {
  return !entry.data.url;
}

/**
 * Filenames keep their `YYYY-MM-` prefix so the directory sorts by date,
 * matching the talks collection. URLs drop it: a date in a permalink adds
 * nothing a reader wants and makes the essay look expired the moment the
 * year turns.
 */
export function slugFor(entry: WritingEntry): string {
  return entry.id.replace(/^\d{4}-\d{2}-/, '');
}

/** Where a card should point: an internal route, or the off-site original. */
export function hrefFor(entry: WritingEntry): string {
  return entry.data.url ?? `/writing/${slugFor(entry)}/`;
}

/** Off-site links open in a new tab; our own pages do not. */
export function linkAttrs(entry: WritingEntry) {
  return isSelfHosted(entry)
    ? {}
    : { target: '_blank', rel: 'noopener' as const };
}

/**
 * Published entries, newest first. Drafts are excluded everywhere a reader
 * could stumble on them — the index, the landing page, the feed, the
 * sitemap — while still building to their own URL for review.
 *
 * `includeDrafts` exists so the dev server can show a draft exactly where
 * it will land, badged. Pass `import.meta.env.DEV` from pages a reviewer
 * looks at; never from the feed or sitemap. A production build always
 * evaluates it to false, so nothing draft can leak by this route.
 */
export async function getPublishedWriting(
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<WritingEntry[]> {
  const all = await getCollection('writing');
  return all
    .filter((entry) => includeDrafts || !entry.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Series shown as reading paths on the index, in this order. */
export const SERIES_ORDER = ['Evidence-carrying systems', 'Context as a ranking problem'];

/**
 * A series earns a block on the index once it has two visible posts. One
 * post is not a series, and a heading over a single item advertises
 * exactly the thinness the site audit warned against.
 */
export function seriesBlocks(entries: WritingEntry[]): { name: string; thesis: string; posts: WritingEntry[] }[] {
  return SERIES_ORDER.map((name) => ({
    name,
    thesis: SERIES_THESIS[name] ?? '',
    posts: entries
      .filter((e) => e.data.series === name)
      .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0)),
  })).filter((s) => s.posts.length >= 2);
}

/** Every entry including drafts — only for building routes. */
export async function getAllWriting(): Promise<WritingEntry[]> {
  const all = await getCollection('writing');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * Reading time from the raw Markdown body. 220 wpm is the usual estimate
 * for technical prose; the number is a courtesy, not a measurement, so it
 * rounds up and never reads "1 min".
 */
export function readingTime(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  if (words < 80) return undefined;
  return `${Math.max(2, Math.ceil(words / 220))} min read`;
}

/** Byline: the author, plus any co-authors named with their permission. */
export function byline(entry: WritingEntry): string {
  const co = entry.data.coauthors;
  if (!co.length) return 'Srijan Saket';
  if (co.length === 1) return `Srijan Saket with ${co[0]}`;
  return `Srijan Saket with ${co.slice(0, -1).join(', ')} and ${co[co.length - 1]}`;
}

/**
 * What each series argues, in one line. Rendered under the series nav so a
 * reader arriving at part two knows what the three parts add up to.
 */
export const SERIES_THESIS: Record<string, string> = {
  'Evidence-carrying systems':
    'You cannot improve what you cannot locate. Three posts on making evidence, completion, and measurement legible enough to fix.',
  'Context as a ranking problem':
    'Getting the right knowledge to the right agent at the right moment is a recommendation problem, and the field has two decades of answers.',
};

/** Sibling posts in the same series, in reading order. */
export async function seriesSiblings(entry: WritingEntry): Promise<WritingEntry[]> {
  const series = entry.data.series;
  if (!series) return [];
  const all = await getAllWriting();
  return all
    .filter((e) => e.data.series === series)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}
