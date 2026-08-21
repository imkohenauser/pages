import type { HeaderIconName } from '../lib/icon';

export const site = {
  name: 'Kohei Saito, or 廣円 (Kohen)',
  shortName: 'Kohei Saito',
  title: 'Personal site of a Design Engineer, or Creative Technologist',
  bio: 'Lorem ipsum dolor sit amet consectetur adipiscing elit quisque faucibus ex sapien vitae pellentesque sem placerat in id cursus mi pretium tellus duis convallis tempus leo eu aenean sed diam urna tempor.',
  lang: 'ja',
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
