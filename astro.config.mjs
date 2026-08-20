import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { includeInSitemap } from './src/lib/sitemap';

export default defineConfig({
  site: 'https://imkohenauser.github.io',
  base: '/pages',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: includeInSitemap,
    }),
  ],
});
