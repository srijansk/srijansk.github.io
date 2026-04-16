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

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    publication: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
    teaser: z.string(),
    excerpt: z.string().optional(),
    thumbnail: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { talks, publications, writing };
