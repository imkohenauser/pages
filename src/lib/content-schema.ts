import { z } from 'astro/zod';

export const empty = (value: unknown) =>
  value === '' || value === null ? undefined : value;

export const writingSitemapSchema = z.object({
  canonicalUrl: z.preprocess(empty, z.url().optional()),
  noindex: z.boolean().default(false),
});
