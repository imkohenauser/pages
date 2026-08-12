import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '@/consts';
import { postPath } from '@/lib/paths';
import { getPosts } from '@/lib/posts';

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    throw new Error('`site` must be set in astro.config.mjs to build the RSS feed.');
  }

  const posts = await getPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    trailingSlash: false,
    /**
     * External entries are included and point straight at their destination, so
     * the feed mirrors the archive rather than a subset of it. Subscribers see
     * the same stream as visitors, and no feed item resolves to a page that was
     * never built.
     */
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: post.data.externalLink ?? postPath(post.id),
    })),
    customData: `<language>${SITE.lang}</language><copyright>${SITE.copyright}</copyright>`,
  });
};
