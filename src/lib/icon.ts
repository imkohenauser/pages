export type IconName =
  | 'arrow-right'
  | 'arrow-top-right'
  | 'arrow-top'
  | 'circle-x-fill'
  | 'github'
  | 'email'
  | 'search'
  | 'x'
  | 'play'
  | 'pause'
  | 'rotate-clockwise';

export type HeaderIconName = Extract<IconName, 'email' | 'github' | 'x'>;
