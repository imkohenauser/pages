import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const empty = (value: unknown) =>
  value === '' || value === null ? undefined : value;

const featuredImageAlt = (data: {
  featuredImage?: unknown;
  featuredImageAlt?: string;
}) => !data.featuredImage || Boolean(data.featuredImageAlt);

function isGitHubUrl(value: string) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    return host === 'github.com';
  } catch {
    return false;
  }
}

const markdownLoader = (base: string) =>
  glob({
    pattern: '**/*.md',
    base,
    generateId: ({ entry }) => entry.replace(/(?:\/index)?\.md$/, ''),
  });

const entryFields = ({ image }: SchemaContext) => ({
  title: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  updatedAt: z.preprocess(empty, z.coerce.date().optional()),
  featuredImage: z.preprocess(empty, image().optional()),
  featuredImageAlt: z.preprocess(empty, z.string().optional()),
  lang: z.string().default('ja'),
  draft: z.boolean().default(false),
});

const posts = defineCollection({
  loader: markdownLoader('./src/content/posts'),
  schema: (context) =>
    z
      .object({
        ...entryFields(context),
        externalUrl: z.preprocess(empty, z.url().optional()),
        canonicalUrl: z.preprocess(empty, z.url().optional()),
        noindex: z.boolean().default(false),
      })
      .refine(featuredImageAlt, {
        message: 'featuredImageAlt is required when featuredImage is set',
        path: ['featuredImageAlt'],
      }),
});

const projects = defineCollection({
  loader: markdownLoader('./src/content/projects'),
  schema: (context) =>
    z
      .object({
        ...entryFields(context),
        githubUrl: z.preprocess(empty, z.url().optional()),
        officialSiteUrl: z.preprocess(empty, z.url().optional()),
        officialSiteIcon: z.preprocess(
          empty,
          z.union([z.url(), context.image()]).optional(),
        ),
      })
      .refine(featuredImageAlt, {
        message: 'featuredImageAlt is required when featuredImage is set',
        path: ['featuredImageAlt'],
      })
      .refine((data) => data.githubUrl || data.officialSiteUrl, {
        message: 'Set githubUrl or officialSiteUrl',
        path: ['githubUrl'],
      })
      .refine((data) => !data.githubUrl || isGitHubUrl(data.githubUrl), {
        message: 'githubUrl must be a github.com URL',
        path: ['githubUrl'],
      })
      .refine((data) => !data.officialSiteIcon || data.officialSiteUrl, {
        message: 'officialSiteUrl is required when officialSiteIcon is set',
        path: ['officialSiteUrl'],
      }),
});

export const collections = { posts, projects };
