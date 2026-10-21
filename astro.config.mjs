// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Draft posts build to their real URL so they can be reviewed, but must stay
 * out of the sitemap. The frontmatter is read directly here because the
 * sitemap integration runs outside the content-collection runtime.
 */
const draftSlugs = readdirSync('./src/content/writing')
  .filter((file) => file.endsWith('.md'))
  .filter((file) => /^draft:\s*true\s*$/m.test(readFileSync(`./src/content/writing/${file}`, 'utf8')))
  .map((file) => file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-/, ''));

export default defineConfig({
  site: 'https://srijansaket.com',
  integrations: [
    sitemap({
      filter: (page) =>
        !draftSlugs.some((slug) => page.replace(/\/$/, '').endsWith(`/writing/${slug}`)),
    }),
  ],
  output: 'static',
  trailingSlash: 'ignore',
  // Design pieces retired on 2026-10-21 still have links pointing at them.
  redirects: {
    '/design/counts-are-doors': '/design/reviewing-what-an-agent-wrote/',
    '/design/explanations-you-can-scrub': '/writing/',
  },
});
