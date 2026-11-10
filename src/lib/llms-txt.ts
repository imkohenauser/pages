import { renderLlmsTxtDocument } from './llms-txt-document';
import { getProjects, projectHref } from './projects';
import { absoluteUrl, toAbsoluteUrl } from './seo';
import { getWriting, writingHref } from './writing';

function linkItem(title: string, url: string, description?: string) {
  const note = description ? `: ${description}` : '';
  return `- [${title}](${url})${note}`;
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

  return renderLlmsTxtDocument({
    pages: [
      linkItem('Home', absoluteUrl('/'), 'Profile, recent writing, and projects.'),
      linkItem('Writing', absoluteUrl('/writing/'), 'Index of published articles and notes.'),
    ],
    writing: selectedWriting.map((entry) =>
      linkItem(
        entry.data.title,
        toAbsoluteUrl(writingHref(entry)),
        entry.data.description,
      ),
    ),
    projects: selectedProjects.map((entry) =>
      linkItem(
        entry.data.title,
        toAbsoluteUrl(projectHref(entry)),
        entry.data.description,
      ),
    ),
    optional: [
      linkItem('RSS', absoluteUrl('/rss.xml'), 'Feed of published writing.'),
      linkItem('GitHub', 'https://github.com/imkohenauser', 'Source repository.'),
      linkItem('Sitemap', absoluteUrl('/sitemap-index.xml'), 'Machine-readable site index.'),
    ],
  });
}
