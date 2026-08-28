import type { HeaderIconName } from '../lib/icon';

export const site = {
  name: 'Kohei Saito, or 廣円',
  kanaName: '(Kohen)',
  shortName: 'Kohei Saito',
  title: 'Personal site of a Design Engineer, or Creative Technologist',
  bio: 'Graphic design, web, and UI. I work with teams on the systems they already use. Projects, experiments, and notes on tools, AI, and everyday making.',  lang: 'ja',
  locale: 'ja_JP',
  ogImage: '/ogp.png',
  ogImageAlt: 'Kohei Saito, or Kohen',
  sameAs: ['https://imkohenauser.com/'],
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
