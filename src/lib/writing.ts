import { getCollection, type CollectionEntry } from 'astro:content';
import { assertContentSlug } from './content-id';
import type { WritingLabel } from './writing-label';

export type Writing = CollectionEntry<'writing'>;

export { reservedSlugs } from './content-id';

export function assertWritingSlug(id: string) {
  assertContentSlug(id, 'writing');
}

export async function getWriting() {
  const writing = await getCollection('writing', ({ data }) => !data.draft);
  for (const entry of writing) {
    assertWritingSlug(entry.id);
  }
  return writing.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export const homeWritingLabels = [
  'blog',
  'zenn',
  'medium',
] as const satisfies readonly WritingLabel[];

export function pickLatestWritingByLabels(
  writing: Writing[],
  labels: readonly WritingLabel[] = homeWritingLabels,
) {
  const selected = labels
    .map((label) => writing.find((entry) => entry.data.label === label))
    .filter((entry): entry is Writing => entry !== undefined);

  return selected.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export function writingHref(entry: Writing) {
  return entry.data.externalUrl ?? `/${entry.id}/`;
}
