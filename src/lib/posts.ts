import { getCollection, type CollectionEntry } from 'astro:content';
import { assertContentSlug } from './content-id';

export type Post = CollectionEntry<'posts'>;

export { reservedSlugs } from './content-id';

export function assertPostSlug(id: string) {
  assertContentSlug(id, 'post');
}

export async function getPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  for (const post of posts) {
    assertPostSlug(post.id);
  }
  return posts.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export function postHref(post: Post) {
  return post.data.externalUrl ?? `/${post.id}/`;
}
