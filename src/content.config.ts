import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Frontmatter written by hand is messy: keys get left behind with no value
 * (`externalLink:`), or filled with an empty string. YAML turns both into
 * `null`/`''`, which a plain `.optional()` would reject. Normalizing to
 * `undefined` first means "present but blank" and "absent" behave identically,
 * which is what the archive branching below relies on.
 */
const blankToUndefined = (value: unknown) => {
  if (value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

/** Accepts `tags: [a, b]` as well as the shorthand `tags: a, b`. */
const tagList = z.preprocess(
  (value) => {
    const normalized = blankToUndefined(value);
    if (typeof normalized === 'string') return normalized.split(',');
    return normalized;
  },
  z
    .array(z.string())
    .default([])
    .transform((tags) => [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]),
);

const posts = defineCollection({
  /**
   * `glob()` derives the entry id from the file path, dropping the extension and
   * a trailing `/index`. That gives us the slug rule for free: `webgl-notes.md`
   * and `webgl-notes/index.md` both resolve to `webgl-notes`, so a post can be
   * promoted from a single file to a directory (to colocate its images) without
   * changing its URL.
   */
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1),
      description: optionalText,
      /**
       * Not in the original frontmatter sketch, but the archive needs a stable
       * sort key and feeds need a timestamp. Filesystem mtimes do not survive a
       * fresh CI clone, so this has to be authored.
       */
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: tagList,
      /**
       * Either a path relative to the Markdown file (optimized and hashed at
       * build time by `astro:assets`) or an absolute URL to a remote image.
       */
      featuredImage: z.preprocess(blankToUndefined, z.union([image(), z.url()]).optional()),
      /**
       * The switch that decides whether this entry owns a page. Filled in means
       * the archive links straight out and no route is generated; blank means
       * it is a regular post on this site.
       */
      externalLink: optionalUrl,
      /** Excluded from the archive, feeds, and routes unless running `astro dev`. */
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
