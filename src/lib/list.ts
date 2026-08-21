import {
  linkAriaLabel,
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
  actionLink?: ActionLinkVariant;
  actionLinkIconSrc?: string;
  linkAriaLabel?: string;
};

function mapListItem(input: {
  title: string;
  description?: string;
  publishedAt?: Date;
  href?: string;
  externalUrl?: string;
  externalIcon?: string | { src: string };
}) {
  const external = Boolean(input.externalUrl);
  const actionLink = listActionLink(input.externalUrl, input.externalIcon);

  return {
    title: input.title,
    description: input.description,
    publishedAt: input.publishedAt,
    href: input.href,
    external,
    actionLink: actionLink?.variant,
    actionLinkIconSrc: actionLink?.iconSrc,
    linkAriaLabel: linkAriaLabel(
      input.title,
      input.externalUrl,
      actionLink?.variant,
    ),
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
  });
}

export function projectListItem(project: Project): ListItem {
  const externalUrl = project.data.externalUrl;
  const href = externalUrl ? externalUrl : path(projectHref(project));

  return mapListItem({
    title: project.data.title,
    description: project.data.description,
    href,
    externalUrl,
    externalIcon: project.data.externalIcon,
  });
}
