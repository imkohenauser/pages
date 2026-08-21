export type IconName =
  | 'arrow-right'
  | 'arrow-top-right'
  | 'arrow-top'
  | 'github'
  | 'email'
  | 'x';

export type HeaderIconName = Extract<IconName, 'email' | 'github' | 'x'>;
