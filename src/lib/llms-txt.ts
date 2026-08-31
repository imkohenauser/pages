import { site } from '../data/site';
import { getProjects, projectHref } from './projects';
import { absoluteUrl, toAbsoluteUrl } from './seo';
import { getWriting, writingHref } from './writing';

function linkItem(title: string, url: string, description?: string) {
  const note = description ? `: ${description}` : '';
  return `- [${title}](${url})${note}`;
}

function section(title: string, items: string[]) {
  if (items.length === 0) {
    return '';
  }
  return [`## ${title}`, '', ...items, ''].join('\n');
}

export async function renderLlmsTxt() {
  const [writing, projects] = await Promise.all([getWriting(), getProjects()]);
  const selectedWriting = writing.filter(
    (entry) =>
      (!entry.data.externalUrl && !entry.data.noindex) ||
      entry.data.includeInLlmsTxt,
  );
  const selectedProjects = projects.filter(
    (entry) => !entry.data.externalUrl || entry.data.includeInLlmsTxt,
  );

  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.bio}`,
    '',
    'Articles and project notes published on this site are HTML pages. Most writing is in Japanese; some posts are in English. Original article text is licensed under CC BY 4.0 unless noted otherwise.',
    '',
    section('Pages', [
      linkItem('Home', absoluteUrl('/'), 'Profile, recent writing, and projects.'),
      linkItem('Writing', absoluteUrl('/writing/'), 'Index of published articles and notes.'),
    ]),
    section(
      'Writing',
      selectedWriting.map((entry) =>
        linkItem(
          entry.data.title,
          toAbsoluteUrl(writingHref(entry)),
          entry.data.description,
        ),
      ),
    ),
    section(
      'Projects',
      selectedProjects.map((entry) =>
        linkItem(
          entry.data.title,
          toAbsoluteUrl(projectHref(entry)),
          entry.data.description,
        ),
      ),
    ),
    section('Optional', [
      linkItem('RSS', absoluteUrl('/rss.xml'), 'Feed of published writing.'),
      linkItem('GitHub', 'https://github.com/imkohenauser', 'Source repository.'),
      linkItem('Sitemap', absoluteUrl('/sitemap-index.xml'), 'Machine-readable site index.'),
    ]),
  ];

  return `${lines.filter(Boolean).join('\n').trim()}\n`;
}
