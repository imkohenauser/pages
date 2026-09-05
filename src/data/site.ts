import type { HeaderIconName } from '../lib/icon';

export const site = {
  name: 'Kohei Saito',
  kanaName: '(廣円 / Kohen)',
  shortName: 'Kohei Saito',
  title: 'Design Engineer / Creative Technologist',
  bio: 'Graphic design, print, web, and UI. I work with teams on the systems they already use. Projects, experiments, and notes on tools, AI, and making.',
  alternateNames: ['廣円', 'Kohen'],
  lang: 'ja',
  locale: 'ja_JP',
  ogImage: '/ogp.png',
  ogImageAlt: 'Kohei Saito (廣円 / Kohen)',
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
