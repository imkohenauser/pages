import type { ImageMetadata } from 'astro';
import {
  cardLinkAriaLabel,
  listActionLink,
  type ActionLinkVariant,
} from './action-link';
import { path } from './path';
import type { Project } from './projects';
import { projectHref } from './projects';
import { writingHref, type Writing } from './writing';

export type ListItem = {
  title: string;
  description?: string;
  publishedAt?: Date;
  href?: string;
  external?: boolean;
  actionLinkVariant?: ActionLinkVariant;
  actionLinkIconSrc?: string;
  ariaLabel?: string;
  featuredImage?: ImageMetadata;
  featuredImageAlt?: string;
  lang?: string;
};

function mapListItem(input: {
  title: string;
  description?: string;
  publishedAt?: Date;
  href?: string;
  externalUrl?: string;
  externalIcon?: string | { src: string };
  lang?: string;
}) {
  const external = Boolean(input.externalUrl);
  const actionLink = listActionLink(input.externalUrl, input.externalIcon);

  return {
    title: input.title,
    description: input.description,
    publishedAt: input.publishedAt,
    href: input.href,
    external,
    actionLinkVariant: actionLink?.variant,
    actionLinkIconSrc: actionLink?.iconSrc,
    ariaLabel: cardLinkAriaLabel(
      input.title,
      input.externalUrl,
      actionLink?.variant,
      input.lang,
    ),
    lang: input.lang,
  } satisfies ListItem;
}

export function writingListItem(entry: Writing): ListItem {
  const externalUrl = entry.data.externalUrl;
  const href = externalUrl ? externalUrl : path(writingHref(entry));

  return mapListItem({
    title: entry.data.title,
    description: entry.data.description,
    publishedAt: entry.data.publishedAt,
    href,
    externalUrl,
    externalIcon: entry.data.externalIcon,
    lang: entry.data.lang,
  });
}

export function projectListItem(project: Project): ListItem {
  const externalUrl = project.data.externalUrl;
  const href = externalUrl ? externalUrl : path(projectHref(project));

  return {
    ...mapListItem({
      title: project.data.title,
      description: project.data.description,
      href,
      externalUrl,
      externalIcon: project.data.externalIcon,
      lang: project.data.lang,
    }),
    featuredImage: project.data.featuredImage,
    featuredImageAlt: project.data.featuredImageAlt,
  };
}
