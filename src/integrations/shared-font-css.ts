import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

/**
 * Moves the `@font-face` CSS emitted by `<Font>` out of every page and into one
 * shared stylesheet.
 *
 * Astro's `<Font>` component inlines its `@font-face` rules as a `<style>` tag.
 * That is a good trade for Latin families — a handful of rules, no extra
 * request. For Japanese it is not: Google's CSS2 API splits the `japanese`
 * subset into ~120 `unicode-range` chunks per weight, and Astro faithfully
 * emits every one. Measured on this site, that is ~330 kB of markup (~100 kB
 * gzipped) repeated in every single HTML file, none of it cacheable.
 *
 * The chunking itself is exactly what we want — a browser downloads only the
 * ~11 kB chunks holding glyphs the page actually uses — so this keeps the rules
 * and only changes where they live: extracted once, written to
 * `_astro/fonts.css`, and referenced with a `<link>` that is cached across the
 * whole site.
 *
 * Trade-off: fonts are now discovered one hop later (HTML → CSS → woff2).
 * Astro's metric-adjusted fallbacks plus `font-display: swap` absorb that, and
 * it buys back ~100 kB on every navigation.
 *
 * If a future Astro release stops inlining these rules, or offers this natively,
 * the pass finds nothing to move and quietly does nothing — see the early
 * return below. Delete this file and the integration entry to opt out.
 */

const STYLE_BLOCK = /<style>((?:(?!<\/style>)[\s\S])*?@font-face[\s\S]*?)<\/style>/g;

async function htmlFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

export function sharedFontCss({ fileName = 'fonts.css' } = {}): AstroIntegration {
  return {
    name: 'shared-font-css',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const pages = await htmlFiles(outDir);

        // Insertion order is stable across pages, so a Set is enough to dedupe
        // the identical blocks that every page carries.
        const blocks = new Set<string>();
        const rewritten = new Map<string, string>();

        for (const page of pages) {
          const html = await readFile(page, 'utf8');
          let found = false;

          const stripped = html.replace(STYLE_BLOCK, (_match, css: string) => {
            blocks.add(css.trim());
            found = true;
            return '';
          });

          if (found) rewritten.set(page, stripped);
        }

        if (blocks.size === 0) {
          logger.info('no inlined @font-face rules found, nothing to extract');
          return;
        }

        const assetPath = path.posix.join('_astro', fileName);
        await writeFile(path.join(outDir, '_astro', fileName), [...blocks].join('\n'), 'utf8');

        // `base` is already baked into the emitted asset URLs, so deriving the
        // href from one of them keeps project-page deploys working.
        const base = [...blocks]
          .join('')
          .match(/url\("([^"]*)\/fonts\/[^"]*"\)/)?.[1]
          ?.replace(/\/_astro$/, '');
        const href = `${base ?? ''}/${assetPath}`;
        const link = `<link rel="stylesheet" href="${href}">`;

        let bytesSaved = 0;
        for (const [page, html] of rewritten) {
          const withLink = html.replace('</head>', `${link}</head>`);
          bytesSaved += (await readFile(page, 'utf8')).length - withLink.length;
          await writeFile(page, withLink, 'utf8');
        }

        logger.info(
          `extracted ${blocks.size} @font-face block(s) to ${assetPath}, ` +
            `removing ${Math.round(bytesSaved / 1024)} kB across ${rewritten.size} page(s)`,
        );
      },
    },
  };
}
