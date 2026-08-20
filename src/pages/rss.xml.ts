import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { site } from '../data/site';
import { getWriting, writingHref } from '../lib/writing';
import { absoluteUrl } from '../lib/seo';

export const GET: APIRoute = async () => {
  const writing = (await getWriting()).filter((entry) => !entry.data.noindex);
  const feedUrl = absoluteUrl('/rss.xml');

  return rss({
    title: site.name,
    description: site.bio,
    site: absoluteUrl('/'),
    items: writing.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedAt,
      link: entry.data.externalUrl ?? absoluteUrl(writingHref(entry)),
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
