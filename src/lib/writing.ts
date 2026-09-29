import { getCollection, type CollectionEntry } from 'astro:content';
import { assertContentSlug } from './content-id';

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

export function writingHref(entry: Writing) {
  return entry.data.externalUrl ?? `/${entry.id}/`;
}
