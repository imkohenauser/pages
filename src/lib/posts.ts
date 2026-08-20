import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const reservedSlugs = ['writing', 'posts'] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertPostSlug(id: string) {
  if (!slugPattern.test(id)) {
    throw new Error(
      `Post slug "${id}" must be a single lowercase ASCII kebab-case segment.`,
    );
  }

  if ((reservedSlugs as readonly string[]).includes(id)) {
    throw new Error(`Post slug "${id}" conflicts with a reserved route.`);
  }
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
