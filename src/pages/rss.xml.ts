import type { APIRoute } from 'astro';
import { getPublishedWriting, hrefFor, byline } from '../lib/writing';

/**
 * Hand-rolled so the site keeps its zero-dependency posture. @astrojs/rss
 * would add a package and a lockfile churn for roughly thirty lines of XML.
 *
 * The feed carries every published entry, self-hosted or not — a reader
 * subscribing to "Srijan's writing" wants the off-site pieces too. Drafts
 * are excluded by getPublishedWriting.
 */
const SITE = 'https://srijansaket.com';

/** XML text nodes cannot carry raw &, <, > or quotes. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absolute(href: string): string {
  return href.startsWith('http') ? href : `${SITE}${href}`;
}

export const GET: APIRoute = async () => {
  const entries = await getPublishedWriting();

  const items = entries
    .map((entry) => {
      const link = absolute(hrefFor(entry));
      const description = entry.data.excerpt ?? entry.data.teaser;
      return `    <item>
      <title>${esc(entry.data.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${entry.data.date.toUTCString()}</pubDate>
      <description>${esc(description)}</description>
      <author>${esc(byline(entry))}</author>
${entry.data.tags.map((tag) => `      <category>${esc(tag)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Srijan Saket — Writing</title>
    <link>${SITE}/writing/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Essays on retrieval, agent systems, and evaluation.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
