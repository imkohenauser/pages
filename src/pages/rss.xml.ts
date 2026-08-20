import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { site } from '../data/site';
import { getPosts, postHref } from '../lib/posts';
import { absoluteUrl } from '../lib/seo';

export const GET: APIRoute = async () => {
  const posts = (await getPosts()).filter((post) => !post.data.noindex);
  const feedUrl = absoluteUrl('/rss.xml');

  return rss({
    title: site.name,
    description: site.bio,
    site: absoluteUrl('/'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: post.data.externalUrl ?? absoluteUrl(postHref(post)),
    })),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
    },
    customData: [
      `<language>${site.lang}</language>`,
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
  });
};
