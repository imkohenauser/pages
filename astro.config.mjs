import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { includeInSitemap } from './src/lib/sitemap';

export default defineConfig({
  site: 'https://imkohenauser.github.io',
  base: '/pages',
  trailingSlash: 'always',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
        },
      },
    },
  },
  fonts: [
    {
      provider: fontProviders.npm({ remote: false }),
      name: 'LINE Seed JP',
      cssVariable: '--font-line-seed-jp',
      weights: [400],
      styles: ['normal'],
      options: { package: '@fontsource/line-seed-jp', file: '400.css' },
    },
    {
      provider: fontProviders.npm({ remote: false }),
      name: 'LINE Seed JP',
      cssVariable: '--font-line-seed-jp',
      weights: [700],
      styles: ['normal'],
      options: { package: '@fontsource/line-seed-jp', file: '700.css' },
    },
    {
      provider: fontProviders.npm({ remote: false }),
      name: 'Michroma',
      cssVariable: '--font-michroma',
      weights: [400],
      styles: ['normal'],
      options: { package: '@fontsource/michroma' },
    },
  ],
  integrations: [
    sitemap({
      filter: includeInSitemap,
    }),
  ],
});
