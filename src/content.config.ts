import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const empty = (value: unknown) =>
  value === '' || value === null ? undefined : value;

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/(?:\/index)?\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishedAt: z.coerce.date(),
      updatedAt: z.preprocess(empty, z.coerce.date().optional()),
      featuredImage: z.preprocess(empty, image().optional()),
      featuredImageAlt: z.preprocess(empty, z.string().optional()),
      externalUrl: z.preprocess(empty, z.url().optional()),
      lang: z.string().default('ja'),
      canonicalUrl: z.preprocess(empty, z.url().optional()),
      noindex: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine((data) => !data.featuredImage || data.featuredImageAlt, {
      message: 'featuredImageAlt is required when featuredImage is set',
      path: ['featuredImageAlt'],
    }),
});

export const collections = { posts };
