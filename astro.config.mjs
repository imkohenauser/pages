// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { sharedFontCss } from './src/integrations/shared-font-css';

/**
 * `site` and `base` are read from the environment so the same repository can be
 * deployed to a user page (`user.github.io`) or a project page
 * (`user.github.io/repo`) without editing this file. The deploy workflow fills
 * both in from `actions/configure-pages`, which already knows which one it is.
 */
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',

  integrations: [react(), mdx(), sitemap(), sharedFontCss()],

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    // Remote `featuredImage` URLs are only optimized for hosts listed here.
    // Anything else is passed through to the browser untouched.
    domains: [],
    remotePatterns: [{ protocol: 'https' }],
  },

  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },

  fonts: [
    {
      /**
       * `google` over `fontsource` specifically because of how each one packages
       * Japanese. Fontsource ships the `japanese` subset as one file per weight
       * (~880 kB, all-or-nothing). Google's CSS2 API splits it into ~120
       * `unicode-range` chunks of ~11 kB, so a browser fetches only the chunks
       * holding glyphs that appear on the page. Astro downloads and self-hosts
       * those chunks during the build either way — nothing is served by Google
       * at runtime.
       *
       * Two weights, not three: every extra weight multiplies the chunk count
       * and with it the size of the generated `@font-face` CSS. `font-weight:
       * 500`, used by a few shadcn variants, resolves to 400 under CSS font
       * matching, which is fine at UI sizes.
       */
      provider: fontProviders.google(),
      name: 'IBM Plex Sans JP',
      cssVariable: '--font-ibm-plex-sans-jp',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin', 'japanese'],
      /**
       * Astro derives a metric-adjusted fallback from the trailing generic
       * family, which is what keeps the swap from shifting layout. The Japanese
       * system fonts ahead of it cover text before any chunk arrives.
       */
      fallbacks: ['Hiragino Sans', 'Noto Sans JP', 'sans-serif'],
    },
    {
      // Code spans are Latin-only, so the single-file subset is the right call.
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
});
