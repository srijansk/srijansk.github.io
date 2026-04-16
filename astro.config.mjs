// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://srijansk.github.io',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'ignore',
});
