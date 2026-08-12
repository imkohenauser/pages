/**
 * Single source of truth for site-wide metadata.
 * Anything that appears in <head>, RSS, or OG tags should come from here.
 */
export const SITE = {
  title: 'Your Name',
  description: 'Markdown で書く個人サイト。制作物・記事・外部リンクのアーカイブ。',
  /** Used for `lang` / `og:locale` and for the optimized font fallbacks. */
  lang: 'ja',
  locale: 'ja_JP',
  author: 'Your Name',
  /** Shown in the footer and used as the RSS `copyright` field. */
  copyright: `© ${new Date().getFullYear()} Your Name`,
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Archive' },
  { href: '/tags', label: 'Tags' },
] as const;

/** Number of archive entries rendered per page. */
export const PAGE_SIZE = 24;
