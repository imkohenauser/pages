import { site } from '../data/site';
import { path } from './path';
import type { Writing } from './writing';

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

export function writingImageUrl(entry: Writing) {
  return entry.data.featuredImage
    ? toAbsoluteUrl(entry.data.featuredImage.src)
    : absoluteUrl(site.ogImage);
}

export function writingImageAlt(entry: Writing) {
  return entry.data.featuredImageAlt ?? site.ogImageAlt;
}

export function writingImageDimensions(entry: Writing) {
  if (entry.data.featuredImage) {
    return {
      width: entry.data.featuredImage.width,
      height: entry.data.featuredImage.height,
    };
  }

  return {
    width: site.ogImageWidth,
    height: site.ogImageHeight,
  };
}

export function writingListItemUrl(entry: Writing) {
  return entry.data.externalUrl ?? absoluteUrl(`/${entry.id}/`);
}

export function writingCanonicalUrl(entry: Writing) {
  return entry.data.canonicalUrl ?? absoluteUrl(`/${entry.id}/`);
}

export function writingModifiedAt(entry: Writing) {
  return entry.data.updatedAt ?? entry.data.publishedAt;
}

type BreadcrumbItem = {
  name: string;
  url?: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function writingBreadcrumbJsonLd(entry: Writing) {
  return breadcrumbJsonLd([
    { name: 'Home', url: absoluteUrl('/') },
    { name: entry.data.title, url: writingCanonicalUrl(entry) },
  ]);
}

export function writingJsonLd(entry: Writing) {
  const url = writingCanonicalUrl(entry);
  const home = absoluteUrl('/');

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: entry.data.title,
    description: entry.data.description,
    image: writingImageUrl(entry),
    datePublished: entry.data.publishedAt.toISOString(),
    dateModified: writingModifiedAt(entry).toISOString(),
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

export function writingCollectionJsonLd(
  writing: Writing[],
  title: string,
  description: string,
) {
  const url = absoluteUrl('/writing/');

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    inLanguage: site.lang,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: writing.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: writingListItemUrl(entry),
      })),
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
