import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    location: z.string().optional(),
    date: z.coerce.date(),
    type: z.enum(['keynote', 'talk', 'panel', 'tutorial', 'pc-service', 'webinar']),
    url: z.string().url().optional(),
    slides: z.string().optional(),
    video: z.string().url().optional(),
    abstract: z.string().optional(),
    thumbnail: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.string(),
    venue: z.string(),
    year: z.number(),
    url: z.string().url().optional(),
    arxiv: z.string().url().optional(),
    pdf: z.string().optional(),
    doi: z.string().optional(),
    type: z.enum(['paper', 'patent', 'book']).default('paper'),
    note: z.string().optional(),
  }),
});

/**
 * Writing entries come in two shapes, distinguished by one field:
 *
 *   url present  → an off-site piece. Renders as a link card, links out.
 *   url absent   → a self-hosted post. Renders from this file's body
 *                  at /writing/<slug>/.
 *
 * There is no separate `selfHosted` flag: the absence of a destination
 * IS the statement that this site is the destination.
 */
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    publication: z.string(),
    date: z.coerce.date(),
    url: z.string().url().optional(),
    teaser: z.string(),
    excerpt: z.string().optional(),
    thumbnail: z.string().optional(),
    featured: z.boolean().default(false),
    /** Standfirst under the H1 on self-hosted posts. */
    dek: z.string().optional(),
    /** Named with their explicit permission — see the lab publish checklist. */
    coauthors: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    /** Groups related posts; rendered as a kicker plus a footer nav. */
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    /** Drafts build to their real URL but stay out of the index,
        the sitemap and the feed, and emit noindex. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { talks, publications, writing };
