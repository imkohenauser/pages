import { site } from '../data/site';
import { path } from './path';
import type { Post } from './posts';

const pagePattern = /\/$/;
const filePattern = /\.[a-z0-9]+$/i;

function siteOrigin() {
  const origin = import.meta.env.SITE;
  if (!origin) {
    throw new Error('Set `site` in astro.config.mjs to generate absolute URLs.');
  }
  return origin.replace(/\/$/, '');
}

function withTrailingSlash(pathname: string) {
  const last = pathname.split('/').filter(Boolean).at(-1) ?? '';
  if (filePattern.test(last) || pagePattern.test(pathname)) {
    return pathname;
  }
  return `${pathname}/`;
}

/** Absolute URL. `pathname` is root-relative and must not include `base`. */
export function absoluteUrl(pathname = '/') {
  const route = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path(withTrailingSlash(route)), `${siteOrigin()}/`).href;
}

/** Resolve a root-relative path, a `base`-prefixed asset src, or an absolute URL. */
export function toAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const origin = `${siteOrigin()}/`;
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (value.startsWith(normalizedBase) || value === base.replace(/\/$/, '')) {
    return new URL(value, origin).href;
  }

  return absoluteUrl(value.startsWith('/') ? value : `/${value}`);
}

export function documentTitle(title?: string) {
  return title ? `${title} — ${site.name}` : site.name;
}

export function ogLocale(lang = site.lang) {
  if (lang === 'ja') {
    return 'ja_JP';
  }
  if (lang === 'en') {
    return 'en_US';
  }

  let canonical: string;
  try {
    [canonical] = Intl.getCanonicalLocales(lang.replaceAll('_', '-'));
  } catch {
    return undefined;
  }

  const subtags = canonical.split('-');
  const language = subtags[0]?.toLowerCase();
  const region = subtags.find((tag) => /^[A-Z]{2}$/.test(tag) || /^\d{3}$/.test(tag));

  if (!language || !region) {
    return undefined;
  }

  return `${language}_${region}`;
}

export function postImageUrl(post: Post) {
  return post.data.featuredImage
    ? toAbsoluteUrl(post.data.featuredImage.src)
    : absoluteUrl(site.ogImage);
}

export function postImageAlt(post: Post) {
  return post.data.featuredImageAlt ?? site.ogImageAlt;
}

export function postCanonicalUrl(post: Post) {
  return post.data.canonicalUrl ?? absoluteUrl(`/${post.id}/`);
}

export function postModifiedAt(post: Post) {
  return post.data.updatedAt ?? post.data.publishedAt;
}

export function blogPostingJsonLd(post: Post) {
  const url = postCanonicalUrl(post);
  const home = absoluteUrl('/');

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    description: post.data.description,
    image: postImageUrl(post),
    datePublished: post.data.publishedAt.toISOString(),
    dateModified: postModifiedAt(post).toISOString(),
    author: {
      '@type': 'Person',
      name: site.name,
      url: home,
    },
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export function homeJsonLd() {
  const url = absoluteUrl('/');
  const personId = `${url}#person`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: site.name,
        url,
        description: site.bio,
        inLanguage: site.lang,
        publisher: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: site.name,
        url,
        description: site.title,
        ...(site.sameAs.length > 0 ? { sameAs: [...site.sameAs] } : {}),
      },
      {
        '@type': 'ProfilePage',
        '@id': url,
        url,
        name: site.name,
        description: site.bio,
        inLanguage: site.lang,
        mainEntity: { '@id': personId },
      },
    ],
  };
}
