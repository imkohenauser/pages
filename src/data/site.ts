import type { HeaderIconName } from '../lib/icon';

export const site = {
  name: 'Kohei Saito / 廣円',
  kanaName: '(Kohen)',
  shortName: 'Kohei Saito',
  title: 'Personal site of a Design Engineer',
  bio: 'I develop CX strategies, design and prototype interfaces, and write frontend code. I build harnesses for AI agents and keep them running. My background spans graphic design, print, and the web.',
  lang: 'ja',
  locale: 'ja_JP',
  ogImage: '/ogp.png',
  ogImageAlt: 'Kohei Saito / 廣円 (Kohen)',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterSite: '@imkohenauser',
  gaMeasurementId: 'G-0842RSM4YH',
  sameAs: [
    'https://github.com/imkohenauser',
    'https://x.com/imkohenauser',
  ],
  externalLinks: [
    {
      url: 'mailto:imkohenauser@gmail.com',
      label: 'E-mail',
      icon: 'email',
    },
    {
      url: 'https://github.com/imkohenauser',
      label: 'GitHub',
      icon: 'github',
    },
    {
      url: 'https://x.com/imkohenauser',
      label: '@imkohenauser',
      icon: 'x',
    },
  ] satisfies { url: string; label: string; icon: HeaderIconName }[],
};
