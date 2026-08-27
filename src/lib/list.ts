import type { ImageMetadata } from 'astro';
import {
  cardLinkAriaLabel,
  listActionLink,
  type ActionLinkVariant,
} from './action-link';
import { path } from './path';
import type { Project } from './projects';
import { projectHref } from './projects';
import {
  isLocalWritingLabel,
  readActionLabel,
  type WritingLabel,
} from './writing-label';
import { writingHref, type Writing } from './writing';

export type ListItem = {
  title: string;
  description?: string;
  publishedAt?: Date;
  href?: string;
  external?: boolean;
  actionLinkVariant?: ActionLinkVariant;
  actionLinkLabel?: string;
  actionLinkIconSrc?: string;
  ariaLabel?: string;
  featuredImage?: ImageMetadata;
  featuredImageAlt?: string;
  lang?: string;
  label?: WritingLabel;
};

function mapListItem(input: {
  title: string;
  description?: string;
  publishedAt?: Date;
  href?: string;
  externalUrl?: string;
  externalIcon?: string | { src: string };
  lang?: string;
  readLabel?: string;
  label?: WritingLabel;
}) {
  const external = Boolean(input.externalUrl);
  const actionLink = listActionLink(input.externalUrl, input.externalIcon, {
    readLabel: input.readLabel,
  });

  return {
    title: input.title,
    description: input.description,
    publishedAt: input.publishedAt,
    href: input.href,
    external,
    actionLinkVariant: actionLink?.variant,
    actionLinkLabel: actionLink?.label,
    actionLinkIconSrc: actionLink?.iconSrc,
    ariaLabel: cardLinkAriaLabel(
      input.title,
      input.externalUrl,
      actionLink?.variant,
      input.lang,
    ),
    lang: input.lang,
    label: input.label,
  } satisfies ListItem;
}

export function writingListItem(entry: Writing): ListItem {
  const externalUrl = entry.data.externalUrl;
  const href = externalUrl ? externalUrl : path(writingHref(entry));
  const label = entry.data.label;
  const readLabel = isLocalWritingLabel(label)
    ? readActionLabel(label)
    : undefined;

  return mapListItem({
    title: entry.data.title,
    description: entry.data.description,
    publishedAt: entry.data.publishedAt,
    href,
    externalUrl,
    externalIcon: entry.data.externalIcon,
    lang: entry.data.lang,
    readLabel,
    label,
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
