import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import astroExpressiveCode from 'astro-expressive-code';
import { defineConfig, fontProviders } from 'astro/config';
import { includeInSitemap } from './src/lib/sitemap';

export default defineConfig({
  site: 'https://imkohenauser.com',
  base: '/',
  trailingSlash: 'always',
  devToolbar: {
    enabled: false,
  },
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
      provider: fontProviders.local(),
      name: 'LINE Seed JP',
      cssVariable: '--font-line-seed-jp',
      weights: [400],
      styles: ['normal'],
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['@fontsource/line-seed-jp/files/line-seed-jp-japanese-400-normal.woff2'],
          },
          {
            weight: 400,
            style: 'normal',
            src: ['@fontsource/line-seed-jp/files/line-seed-jp-latin-400-normal.woff2'],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'LINE Seed JP',
      cssVariable: '--font-line-seed-jp',
      weights: [700],
      styles: ['normal'],
      options: {
        variants: [
          {
            weight: 700,
            style: 'normal',
            src: ['@fontsource/line-seed-jp/files/line-seed-jp-japanese-700-normal.woff2'],
          },
          {
            weight: 700,
            style: 'normal',
            src: ['@fontsource/line-seed-jp/files/line-seed-jp-latin-700-normal.woff2'],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Michroma',
      cssVariable: '--font-michroma',
      weights: [400],
      styles: ['normal'],
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['@fontsource/michroma/files/michroma-latin-400-normal.woff2'],
          },
          {
            weight: 400,
            style: 'normal',
            src: ['@fontsource/michroma/files/michroma-latin-ext-400-normal.woff2'],
          },
        ],
      },
    },
  ],
  integrations: [
    astroExpressiveCode({
      themes: ['github-light'],
      frames: {
        showCopyToClipboardButton: true,
      },
      styleOverrides: {
        borderRadius: '0.5rem',
        borderWidth: '1px',
        codeFontFamily: 'var(--font-mono)',
        codeFontSize: '0.8125rem',
        codeLineHeight: '1.6',
        codePaddingBlock: '1rem',
        codePaddingInline: '1rem',
        frames: {
          frameBoxShadowCssValue: 'none',
          editorActiveTabIndicatorTopColor: 'transparent',
        },
      },
    }),
    mdx(),
    sitemap({
      filter: includeInSitemap,
    }),
  ],
});
