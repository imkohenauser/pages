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
  lang?: string,
) {
  if (!externalUrl) {
    return undefined;
  }

  const ja = lang?.split(/[-_]/)[0]?.toLowerCase() === 'ja';
  let suffix: string;

  switch (variant) {
    case 'medium':
      suffix = ja
        ? 'Mediumで読む、新しいタブで開きます'
        : 'Read on Medium, opens in a new tab';
      break;
    case 'zenn':
      suffix = ja
        ? 'Zennで読む、新しいタブで開きます'
        : 'Read on Zenn, opens in a new tab';
      break;
    case 'github':
      suffix = ja
        ? 'GitHub、新しいタブで開きます'
        : 'GitHub, opens in a new tab';
      break;
    case 'official-site':
      suffix = ja
        ? '公式サイト、新しいタブで開きます'
        : 'Official site, opens in a new tab';
      break;
    default:
      suffix = ja
        ? '新しいタブで開きます'
        : 'opens in a new tab';
  }

  return ja ? `${title}（${suffix}）` : `${title} (${suffix})`;
}
