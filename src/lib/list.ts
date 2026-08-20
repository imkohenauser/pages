import { externalSource, type ExternalSource } from './external-source';
import { path } from './path';
import { postHref, type Post } from './posts';
import type { Project } from './projects';

export type MarkImage = string | { src: string };

export type ListLink = {
  href: string;
  label: string;
  source: ExternalSource;
  icon?: MarkImage;
};

export function markSrc(icon: MarkImage) {
  return typeof icon === 'string' ? icon : icon.src;
}

export type ListItem = {
  title: string;
  description?: string;
  publishedAt?: Date;
  href?: string;
  external?: boolean;
  links?: ListLink[];
};

export function postListItem(post: Post): ListItem {
  const external = Boolean(post.data.externalUrl);
  const href = external ? postHref(post) : path(postHref(post));

  return {
    title: post.data.title,
    publishedAt: post.data.publishedAt,
    href,
    external,
  };
}

export function projectListItem(project: Project): ListItem {
  const links: ListLink[] = [];

  if (project.data.officialSiteUrl) {
    links.push({
      href: project.data.officialSiteUrl,
      label: 'Official site',
      source: 'site',
      icon: project.data.officialSiteIcon,
    });
  }

  if (project.data.githubUrl) {
    links.push({
      href: project.data.githubUrl,
      label: 'GitHub',
      source: 'github',
    });
  }

  return {
    title: project.data.title,
    description: project.data.description,
    links,
  };
}

export function itemSource(item: ListItem) {
  if (!item.href || !item.external) {
    return undefined;
  }

  return externalSource(item.href);
}
