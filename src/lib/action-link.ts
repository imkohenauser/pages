import { externalSource } from './external-source';

export type ActionLinkVariant =
  | 'read-article'
  | 'medium'
  | 'zenn'
  | 'github'
  | 'official-site'
  | 'page-top';

export type ExternalIcon = string | { src: string };

export function externalIconSrc(icon: ExternalIcon | undefined) {
  if (!icon) {
    return undefined;
  }

  return typeof icon === 'string' ? icon : icon.src;
}

export function actionLinkVariant(
  externalUrl: string | undefined,
  externalIcon: ExternalIcon | undefined,
): ActionLinkVariant | undefined {
  if (!externalUrl) {
    return 'read-article';
  }

  const { id } = externalSource(externalUrl);

  if (id === 'medium') {
    return 'medium';
  }

  if (id === 'zenn') {
    return 'zenn';
  }

  if (id === 'github') {
    return 'github';
  }

  if (externalIconSrc(externalIcon)) {
    return 'official-site';
  }

  return undefined;
}

export function listActionLink(
  externalUrl: string | undefined,
  externalIcon: ExternalIcon | undefined,
) {
  const variant = actionLinkVariant(externalUrl, externalIcon);

  if (!variant) {
    return undefined;
  }

  return {
    variant,
    iconSrc:
      variant === 'official-site' ? externalIconSrc(externalIcon) : undefined,
  };
}

export function cardLinkAriaLabel(
  title: string,
  externalUrl: string | undefined,
  variant: ActionLinkVariant | undefined,
) {
  if (!externalUrl) {
    return undefined;
  }

  switch (variant) {
    case 'medium':
      return `${title} (Read on Medium, opens in a new tab)`;
    case 'zenn':
      return `${title} (Read on Zenn, opens in a new tab)`;
    case 'github':
      return `${title} (GitHub, opens in a new tab)`;
    case 'official-site':
      return `${title} (Official site, opens in a new tab)`;
    default:
      return `${title} (opens in a new tab)`;
  }
}
