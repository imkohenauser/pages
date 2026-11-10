import { site } from '../data/site.ts';

function section(title: string, items: readonly string[]) {
  if (items.length === 0) {
    return undefined;
  }
  return [`## ${title}`, '', ...items, ''].join('\n');
}

export const llmsTxtSummary =
  'Articles and project notes published on this site are HTML pages, and each local article also has a Markdown file. Most writing is in Japanese; some posts are in English. Original article text is licensed under CC BY 4.0 unless noted otherwise.';

export function llmsItemDescription(description?: string, markdownUrl?: string) {
  const markdown = markdownUrl ? `[Markdown](${markdownUrl})` : undefined;
  const note = [description, markdown].filter((part) => part).join(' ');
  return note || undefined;
}

export function renderLlmsTxtDocument(sections: {
  pages: readonly string[];
  writing: readonly string[];
  projects: readonly string[];
  optional: readonly string[];
}) {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.bio}`,
    '',
    llmsTxtSummary,
    '',
    section('Pages', sections.pages),
    section('Writing', sections.writing),
    section('Projects', sections.projects),
    section('Optional', sections.optional),
  ];

  // '' is a blank line between Markdown blocks. undefined is a missing optional section.
  return `${lines.filter((line) => line !== undefined).join('\n').trim()}\n`;
}
