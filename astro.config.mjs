// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Draft posts build to their real URL so they can be reviewed, but must stay
 * out of the sitemap. The frontmatter is read directly here because the
 * sitemap integration runs outside the content-collection runtime.
 */
const draftsIn = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => /^draft:\s*true\s*$/m.test(readFileSync(`${dir}/${file}`, 'utf8')));
const draftSlugs = draftsIn('./src/content/writing').map((file) =>
  file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-/, ''),
);
const draftDesign = draftsIn('./src/content/design').map((file) => file.replace(/\.md$/, ''));

export default defineConfig({
  site: 'https://srijansaket.com',
  integrations: [
    sitemap({
      filter: (page) =>
        !draftSlugs.some((slug) => page.replace(/\/$/, '').endsWith(`/writing/${slug}`)) &&
        !draftDesign.some((slug) => page.replace(/\/$/, '').endsWith(`/design/${slug}`)),
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
