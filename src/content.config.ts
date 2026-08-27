import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { contentEntryId } from './lib/content-id';
import { empty, writingSitemapSchema } from './lib/content-schema';
import {
  isExternalWritingLabel,
  isLocalWritingLabel,
  writingLabels,
  type WritingLabel,
} from './lib/writing-label';

const featuredImageAlt = (data: {
  featuredImage?: unknown;
  featuredImageAlt?: string;
}) => !data.featuredImage || Boolean(data.featuredImageAlt);

const externalFields = ({ image }: SchemaContext) => ({
  externalUrl: z.preprocess(empty, z.url().optional()),
  externalIcon: z.preprocess(
    empty,
    z.union([z.url(), image()]).optional(),
  ),
});

const externalIconRefine = {
  refine: (data: { externalUrl?: string; externalIcon?: unknown }) =>
    !data.externalIcon || Boolean(data.externalUrl),
  message: 'externalUrl is required when externalIcon is set',
  path: ['externalUrl'] as const,
};

const writingLabelSchema = z.enum(writingLabels);

const writingLabelExternalUrlRefine = {
  refine: (data: { label: WritingLabel; externalUrl?: string }) => {
    if (isExternalWritingLabel(data.label)) {
      return Boolean(data.externalUrl);
    }
    if (isLocalWritingLabel(data.label)) {
      return !data.externalUrl;
    }
    return true;
  },
  message:
    'zenn and medium require externalUrl; essay, journal, note, and blog must not set it',
  path: ['externalUrl'] as const,
};

const markdownLoader = (base: string) =>
  glob({
    pattern: '**/*.md',
    base,
    generateId: ({ entry }) => contentEntryId(entry),
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

const writing = defineCollection({
  loader: markdownLoader('./src/content/writing'),
  schema: (context) =>
    z
      .object({
        ...entryFields(context),
        ...externalFields(context),
        ...writingSitemapSchema.shape,
        label: writingLabelSchema,
      })
      .refine(featuredImageAlt, {
        message: 'featuredImageAlt is required when featuredImage is set',
        path: ['featuredImageAlt'],
      })
      .refine(externalIconRefine.refine, {
        message: externalIconRefine.message,
        path: ['externalUrl'],
      })
      .refine(writingLabelExternalUrlRefine.refine, {
        message: writingLabelExternalUrlRefine.message,
        path: writingLabelExternalUrlRefine.path,
      }),
});

const projects = defineCollection({
  loader: markdownLoader('./src/content/projects'),
  schema: (context) =>
    z
      .object({
        ...entryFields(context),
        ...externalFields(context),
      })
      .refine(featuredImageAlt, {
        message: 'featuredImageAlt is required when featuredImage is set',
        path: ['featuredImageAlt'],
      })
      .refine(externalIconRefine.refine, {
        message: externalIconRefine.message,
        path: ['externalUrl'],
      }),
});

export const collections = { writing, projects };
