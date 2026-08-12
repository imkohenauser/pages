import { getCollection, type CollectionEntry } from 'astro:content';
import { postPath, tagSlug } from '@/lib/paths';

export type Post = CollectionEntry<'posts'>;

/**
 * The two shapes an archive row can take. Keeping them in one discriminated
 * union means the archive template renders a single list, and the "does this
 * entry have a page of its own?" question is answered in exactly one place.
 */
export type ArchiveItem = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  updated?: Date;
  tags: string[];
  featuredImage?: ImageMetadata | string;
} & ({ external: false; href: string } | { external: true; href: string; host: string });

export const isExternal = (post: Post): boolean => Boolean(post.data.externalLink);

/** Drafts are visible while authoring and dropped from every production build. */
const isVisible = (post: Post): boolean => import.meta.env.DEV || !post.data.draft;

const byNewest = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf();

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', isVisible);
  return posts.sort(byNewest);
}

/**
 * Entries that own a route. `getStaticPaths()` and the RSS feed both build from
 * this, so an entry with an `externalLink` can never leak a broken local URL.
 */
export async function getRoutablePosts(): Promise<Post[]> {
  return (await getPosts()).filter((post) => !isExternal(post));
}

export function toArchiveItem(post: Post): ArchiveItem {
  const shared = {
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    updated: post.data.updated,
    tags: post.data.tags,
    featuredImage: post.data.featuredImage,
  };

  const { externalLink } = post.data;
  if (externalLink) {
    return {
      ...shared,
      external: true,
      href: externalLink,
      host: new URL(externalLink).hostname.replace(/^www\./, ''),
    };
  }

  return { ...shared, external: false, href: postPath(post.id) };
}

export type TagSummary = { tag: string; slug: string; count: number };

export async function getTags(): Promise<TagSummary[]> {
  const counts = new Map<string, TagSummary>();

  for (const post of await getPosts()) {
    for (const tag of post.data.tags) {
      const slug = tagSlug(tag);
      const existing = counts.get(slug);
      if (existing) existing.count += 1;
      else counts.set(slug, { tag, slug, count: 1 });
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export async function getPostsByTag(slug: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.data.tags.some((tag) => tagSlug(tag) === slug));
}

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

export const formatDate = (date: Date): string => dateFormatter.format(date);

/** `datetime` attribute value for <time>, kept independent of the display format. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
