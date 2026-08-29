export type IconName =
  | 'arrow-right'
  | 'arrow-top-right'
  | 'arrow-top'
  | 'circle-x-fill'
  | 'github'
  | 'email'
  | 'search'
  | 'x';

export type HeaderIconName = Extract<IconName, 'email' | 'github' | 'x'>;
